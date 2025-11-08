import { prisma } from '../../db/client.js';
import { cacheManager } from '../../cache/cache-manager.js';
import { Prisma } from '@prisma/client';

/**
 * RBAC Service
 *
 * Handles role-based access control including:
 * - Permission resolution with wildcard support
 * - Role management and assignment
 * - Permission checking with caching
 * - Role hierarchy
 */

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystemRole: boolean;
}

export interface UserRoleAssignment {
  roleId: string;
  roleName: string;
  grantedAt: Date;
  expiresAt: Date | null;
  grantedBy: string | null;
}

export class RBACService {
  /**
   * Check if user has a specific permission
   * Supports wildcard matching: "policy:*" matches "policy:create", "policy:read", etc.
   */
  async hasPermission(
    userId: string,
    permission: string,
    options: { skipCache?: boolean } = {}
  ): Promise<boolean> {
    // Check cache first
    if (!options.skipCache) {
      const cached = await cacheManager.get<boolean>(
        `user:${userId}:permission:${permission}`,
        { prefix: 'rbac', ttl: 300 } // 5 minutes
      );
      if (cached !== null) {
        return cached;
      }
    }

    // Get user's active roles with permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: new Date() } },
            ],
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Check each role's permissions
    let hasPermission = false;
    for (const userRole of user.userRoles) {
      const permissions = userRole.role.permissions as string[];

      // Check for exact match
      if (permissions.includes(permission)) {
        hasPermission = true;
        break;
      }

      // Check for wildcard permission (*)
      if (permissions.includes('*')) {
        hasPermission = true;
        break;
      }

      // Check for resource wildcard (e.g., "policy:*" matches "policy:create")
      const [resource] = permission.split(':');
      if (permissions.includes(`${resource}:*`)) {
        hasPermission = true;
        break;
      }
    }

    // Cache the result
    await cacheManager.set(
      `user:${userId}:permission:${permission}`,
      hasPermission,
      { prefix: 'rbac', ttl: 300 }
    );

    return hasPermission;
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all permissions for a user (aggregated from all roles)
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    // Check cache first
    const cached = await cacheManager.get<string[]>(
      `user:${userId}:all-permissions`,
      { prefix: 'rbac', ttl: 300 }
    );
    if (cached) {
      return cached;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: new Date() } },
            ],
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    // Aggregate permissions from all roles
    const permissionsSet = new Set<string>();
    for (const userRole of user.userRoles) {
      const permissions = userRole.role.permissions as string[];
      permissions.forEach(p => permissionsSet.add(p));
    }

    const allPermissions = Array.from(permissionsSet);

    // Cache the result
    await cacheManager.set(
      `user:${userId}:all-permissions`,
      allPermissions,
      { prefix: 'rbac', ttl: 300 }
    );

    return allPermissions;
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string): Promise<UserRoleAssignment[]> {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      include: {
        role: true,
        grantedByUser: true,
      },
    });

    return userRoles.map(ur => ({
      roleId: ur.role.id,
      roleName: ur.role.name,
      grantedAt: ur.createdAt,
      expiresAt: ur.expiresAt,
      grantedBy: ur.grantedByUser?.name || null,
    }));
  }

  /**
   * Create a new role
   */
  async createRole(
    tenantId: string | null,
    name: string,
    description: string,
    permissions: string[],
    isSystemRole: boolean = false
  ): Promise<RoleWithPermissions> {
    const role = await prisma.role.create({
      data: {
        tenantId,
        name,
        description,
        permissions,
        isSystemRole,
      },
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions as string[],
      isSystemRole: role.isSystemRole,
    };
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(
    roleId: string,
    permissions: string[]
  ): Promise<RoleWithPermissions> {
    const role = await prisma.role.update({
      where: { id: roleId },
      data: { permissions },
    });

    // Invalidate cache for all users with this role
    await this.invalidateRoleCache(roleId);

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions as string[],
      isSystemRole: role.isSystemRole,
    };
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<void> {
    // Check if it's a system role
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (role?.isSystemRole) {
      throw new Error('Cannot delete system role');
    }

    // Delete role and cascade to userRoles
    await prisma.role.delete({
      where: { id: roleId },
    });

    // Invalidate cache
    await this.invalidateRoleCache(roleId);
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<void> {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if user already has this role
    const existing = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
    });

    if (existing) {
      throw new Error('User already has this role');
    }

    // Assign role
    await prisma.userRole.create({
      data: {
        userId,
        roleId,
        grantedBy,
        expiresAt: expiresAt || null,
      },
    });

    // Invalidate user's permission cache
    await this.invalidateUserCache(userId);
  }

  /**
   * Revoke role from user
   */
  async revokeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    });

    // Invalidate user's permission cache
    await this.invalidateUserCache(userId);
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return null;
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions as string[],
      isSystemRole: role.isSystemRole,
    };
  }

  /**
   * Get role by name
   */
  async getRoleByName(tenantId: string | null, name: string): Promise<RoleWithPermissions | null> {
    const role = await prisma.role.findFirst({
      where: {
        OR: [
          { tenantId, name },
          { tenantId: null, name, isSystemRole: true },
        ],
      },
    });

    if (!role) {
      return null;
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions as string[],
      isSystemRole: role.isSystemRole,
    };
  }

  /**
   * List all roles for a tenant
   */
  async listRoles(tenantId: string | null, includeSystemRoles: boolean = true): Promise<RoleWithPermissions[]> {
    const where: Prisma.RoleWhereInput = includeSystemRoles
      ? {
          OR: [
            { tenantId },
            { tenantId: null, isSystemRole: true },
          ],
        }
      : { tenantId };

    const roles = await prisma.role.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions as string[],
      isSystemRole: role.isSystemRole,
    }));
  }

  /**
   * List all users with a specific role
   */
  async listUsersWithRole(roleId: string): Promise<Array<{
    userId: string;
    userName: string;
    userEmail: string;
    grantedAt: Date;
    expiresAt: Date | null;
  }>> {
    const userRoles = await prisma.userRole.findMany({
      where: {
        roleId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      include: {
        user: true,
      },
    });

    return userRoles.map(ur => ({
      userId: ur.user.id,
      userName: ur.user.name,
      userEmail: ur.user.email,
      grantedAt: ur.createdAt,
      expiresAt: ur.expiresAt,
    }));
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.some(ur => ur.roleName === roleName);
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    const userRoleNames = userRoles.map(ur => ur.roleName);
    return roleNames.some(rn => userRoleNames.includes(rn));
  }

  /**
   * Invalidate permission cache for a user
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    await cacheManager.deletePattern(`user:${userId}:*`, { prefix: 'rbac' });
  }

  /**
   * Invalidate permission cache for all users with a specific role
   */
  private async invalidateRoleCache(roleId: string): Promise<void> {
    const userRoles = await prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
    });

    for (const ur of userRoles) {
      await this.invalidateUserCache(ur.userId);
    }
  }

  /**
   * Get all available permissions in the system
   */
  getSystemPermissions(): string[] {
    return [
      // Policy permissions
      'policy:create',
      'policy:read',
      'policy:update',
      'policy:delete',
      'policy:version',
      'policy:*',

      // Consent permissions
      'consent:create',
      'consent:read',
      'consent:update',
      'consent:revoke',
      'consent:*',

      // Proof bundle permissions
      'proof:create',
      'proof:read',
      'proof:verify',
      'proof:delete',
      'proof:*',

      // User management permissions
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'user:*',

      // Role management permissions
      'role:create',
      'role:read',
      'role:update',
      'role:delete',
      'role:assign',
      'role:*',

      // Tenant management permissions
      'tenant:create',
      'tenant:read',
      'tenant:update',
      'tenant:delete',
      'tenant:settings',
      'tenant:*',

      // Audit log permissions
      'audit:read',
      'audit:export',
      'audit:*',

      // System permissions
      'system:admin',
      'system:metrics',
      'system:*',

      // Wildcard
      '*',
    ];
  }
}

export const rbacService = new RBACService();
