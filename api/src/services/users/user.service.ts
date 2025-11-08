import { prisma } from '../../db/client.js';
import { authService } from '../../auth/authentication.service.js';
import { rbacService } from '../rbac/rbac.service.js';
import { cacheManager } from '../../cache/cache-manager.js';

/**
 * User Management Service
 *
 * Handles user CRUD operations, profile management, and user-related queries
 */

export interface CreateUserRequest {
  tenantId: string;
  email: string;
  name: string;
  password: string;
  roles?: string[]; // Role IDs to assign
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UserProfile {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  status: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  roles: Array<{
    id: string;
    name: string;
    expiresAt: Date | null;
  }>;
  permissions: string[];
}

export class UserService {
  /**
   * Create a new user
   */
  async createUser(request: CreateUserRequest, createdBy: string): Promise<UserProfile> {
    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        tenantId: request.tenantId,
        email: request.email,
      },
    });

    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await authService.hashPassword(request.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId: request.tenantId,
        email: request.email,
        name: request.name,
        passwordHash,
        status: 'active',
      },
    });

    // Assign roles if provided
    if (request.roles && request.roles.length > 0) {
      for (const roleId of request.roles) {
        await rbacService.assignRoleToUser(user.id, roleId, createdBy);
      }
    } else {
      // Assign default VIEWER role
      const viewerRole = await rbacService.getRoleByName(request.tenantId, 'VIEWER');
      if (viewerRole) {
        await rbacService.assignRoleToUser(user.id, viewerRole.id, createdBy);
      }
    }

    return await this.getUserProfile(user.id);
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    // Check cache first
    const cached = await cacheManager.get<UserProfile>(
      `user:${userId}:profile`,
      { prefix: 'users', ttl: 300 }
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
      throw new Error('User not found');
    }

    // Get user permissions
    const permissions = await rbacService.getUserPermissions(userId);

    const profile: UserProfile = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        expiresAt: ur.expiresAt,
      })),
      permissions,
    };

    // Cache the profile
    await cacheManager.set(
      `user:${userId}:profile`,
      profile,
      { prefix: 'users', ttl: 300 }
    );

    return profile;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, request: UpdateUserRequest): Promise<UserProfile> {
    // If email is being changed, check for conflicts
    if (request.email) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const existing = await prisma.user.findFirst({
        where: {
          tenantId: user.tenantId,
          email: request.email,
          id: { not: userId },
        },
      });

      if (existing) {
        throw new Error('Email already in use by another user');
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(request.name && { name: request.name }),
        ...(request.email && { email: request.email }),
        ...(request.status && { status: request.status }),
      },
    });

    // Invalidate cache
    await cacheManager.delete(`user:${userId}:profile`, { prefix: 'users' });

    return await this.getUserProfile(userId);
  }

  /**
   * Delete user (soft delete by setting status to inactive)
   */
  async deleteUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'inactive' },
    });

    // Revoke all sessions
    await authService.logout(userId);

    // Invalidate cache
    await cacheManager.delete(`user:${userId}:profile`, { prefix: 'users' });
    await cacheManager.deletePattern(`user:${userId}:*`, { prefix: 'rbac' });
  }

  /**
   * List users in a tenant
   */
  async listUsers(
    tenantId: string,
    options: {
      status?: string;
      role?: string;
      limit?: number;
      offset?: number;
      search?: string;
    } = {}
  ): Promise<{ users: UserProfile[]; total: number }> {
    const where: any = { tenantId };

    if (options.status) {
      where.status = options.status;
    }

    if (options.search) {
      where.OR = [
        { email: { contains: options.search, mode: 'insensitive' } },
        { name: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.role) {
      where.userRoles = {
        some: {
          role: { name: options.role },
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        take: options.limit || 50,
        skip: options.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const profiles = await Promise.all(
      users.map(async (user) => {
        const permissions = await rbacService.getUserPermissions(user.id);
        return {
          id: user.id,
          tenantId: user.tenantId,
          email: user.email,
          name: user.name,
          status: user.status,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          roles: user.userRoles.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            expiresAt: ur.expiresAt,
          })),
          permissions,
        };
      })
    );

    return { users: profiles, total };
  }

  /**
   * Get user by email
   */
  async getUserByEmail(tenantId: string, email: string): Promise<UserProfile | null> {
    const user = await prisma.user.findFirst({
      where: { tenantId, email },
    });

    if (!user) {
      return null;
    }

    return await this.getUserProfile(user.id);
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string, reason?: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'suspended' },
    });

    // Revoke all sessions
    await authService.logout(userId);

    // Invalidate cache
    await cacheManager.delete(`user:${userId}:profile`, { prefix: 'users' });
    await cacheManager.deletePattern(`user:${userId}:*`, { prefix: 'rbac' });

    // TODO: Log suspension in audit log with reason
  }

  /**
   * Reactivate suspended user
   */
  async reactivateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'active' },
    });

    // Invalidate cache
    await cacheManager.delete(`user:${userId}:profile`, { prefix: 'users' });
  }

  /**
   * Change user password (admin operation)
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await authService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all sessions (force re-login)
    await authService.logout(userId);
  }

  /**
   * Get user activity statistics
   */
  async getUserStats(userId: string): Promise<{
    totalPoliciesCreated: number;
    totalConsentsManaged: number;
    totalProofBundlesGenerated: number;
    lastActivity: Date | null;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginAt: true },
    });

    // Get counts from event log
    const [policiesCreated, consentsManaged, proofsGenerated] = await Promise.all([
      prisma.eventLog.count({
        where: {
          eventType: 'PolicyCreated',
          eventData: { path: ['userId'], equals: userId },
        },
      }),
      prisma.eventLog.count({
        where: {
          eventType: { in: ['ConsentGranted', 'ConsentRevoked'] },
          eventData: { path: ['userId'], equals: userId },
        },
      }),
      prisma.eventLog.count({
        where: {
          eventType: 'ProofBundleGenerated',
          eventData: { path: ['userId'], equals: userId },
        },
      }),
    ]);

    return {
      totalPoliciesCreated: policiesCreated,
      totalConsentsManaged: consentsManaged,
      totalProofBundlesGenerated: proofsGenerated,
      lastActivity: user?.lastLoginAt || null,
    };
  }
}

export const userService = new UserService();
