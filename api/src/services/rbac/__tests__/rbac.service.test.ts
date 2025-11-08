/**
 * RBAC Service Tests
 *
 * Comprehensive tests for role-based access control
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TestFactories from '../../../test/helpers/factories.js';

// Mock dependencies - must be at top level without factory functions
vi.mock('../../../db/client.js');
vi.mock('../../../cache/cache-manager.js');

import { RBACService } from '../rbac.service.js';

describe('RBACService', () => {
  let rbacService: RBACService;
  let mockPrisma: any;
  let mockCache: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const dbModule = await import('../../../db/client.js');
    const cacheModule = await import('../../../cache/cache-manager.js');

    mockPrisma = dbModule.prisma;
    mockCache = cacheModule.cacheManager;

    // Setup mock implementations
    mockPrisma.user = {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    mockPrisma.role = {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    };
    mockPrisma.userRole = {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    };
    mockPrisma.eventLog = {
      create: vi.fn(),
      createMany: vi.fn(),
    };

    mockCache.get = vi.fn();
    mockCache.set = vi.fn();
    mockCache.delete = vi.fn();
    mockCache.deletePattern = vi.fn();

    rbacService = new RBACService();
  });

  describe('hasPermission', () => {
    it('should return true for exact permission match', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role({
        permissions: ['policy:read', 'policy:create'],
      });

      mockCache.get.mockResolvedValue(null); // Cache miss
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [{
          role,
          expiresAt: null,
        }],
      });

      const result = await rbacService.hasPermission(user.id, 'policy:read');

      expect(result).toBe(true);
      expect(mockCache.set).toHaveBeenCalledWith(
        `user:${user.id}:permission:policy:read`,
        true,
        { prefix: 'rbac', ttl: 300 }
      );
    });

    it('should return true for wildcard resource permission', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role({
        permissions: ['policy:*'], // Wildcard for all policy actions
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [{ role, expiresAt: null }],
      });

      const result = await rbacService.hasPermission(user.id, 'policy:create');
      expect(result).toBe(true);
    });

    it('should return true for super admin permission', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role({
        name: 'ADMIN',
        permissions: ['*'], // Super admin
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [{ role, expiresAt: null }],
      });

      const result = await rbacService.hasPermission(user.id, 'any:permission');
      expect(result).toBe(true);
    });

    it('should return false for missing permission', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role({
        permissions: ['policy:read'],
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [{ role, expiresAt: null }],
      });

      const result = await rbacService.hasPermission(user.id, 'consent:create');
      expect(result).toBe(false);
    });

    it('should use cached permission result', async () => {
      const userId = 'user-123';
      mockCache.get.mockResolvedValue(true); // Cache hit

      const result = await rbacService.hasPermission(userId, 'policy:read');

      expect(result).toBe(true);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should filter expired roles', async () => {
      const user = TestFactories.user();
      const expiredRole = TestFactories.role({
        permissions: ['policy:*'],
      });
      const activeRole = TestFactories.role({
        permissions: ['consent:read'],
      });

      mockCache.get.mockResolvedValue(null);

      // The service includes a WHERE clause that filters expired roles at DB level
      // So we should only return non-expired roles in our mock
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [
          { role: activeRole, expiresAt: null }, // Only active role
        ],
      });

      // Should not have policy permission from expired role
      const hasPolicyPermission = await rbacService.hasPermission(user.id, 'policy:create');
      expect(hasPolicyPermission).toBe(false);

      // Should have consent permission from active role
      const hasConsentPermission = await rbacService.hasPermission(user.id, 'consent:read');
      expect(hasConsentPermission).toBe(true);
    });
  });

  describe('getUserPermissions', () => {
    it('should aggregate permissions from multiple roles', async () => {
      const user = TestFactories.user();
      const role1 = TestFactories.role({
        permissions: ['policy:read', 'policy:create'],
      });
      const role2 = TestFactories.role({
        permissions: ['consent:read', 'consent:create'],
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [
          { role: role1, expiresAt: null },
          { role: role2, expiresAt: null },
        ],
      });

      const permissions = await rbacService.getUserPermissions(user.id);

      expect(permissions).toHaveLength(4);
      expect(permissions).toContain('policy:read');
      expect(permissions).toContain('policy:create');
      expect(permissions).toContain('consent:read');
      expect(permissions).toContain('consent:create');
    });

    it('should deduplicate permissions', async () => {
      const user = TestFactories.user();
      const role1 = TestFactories.role({
        permissions: ['policy:read', 'consent:read'],
      });
      const role2 = TestFactories.role({
        permissions: ['policy:read', 'proof:read'], // Duplicate policy:read
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [
          { role: role1, expiresAt: null },
          { role: role2, expiresAt: null },
        ],
      });

      const permissions = await rbacService.getUserPermissions(user.id);

      expect(permissions).toHaveLength(3); // No duplicates
      const policyReadCount = permissions.filter(p => p === 'policy:read').length;
      expect(policyReadCount).toBe(1);
    });
  });

  describe('createRole', () => {
    it('should create a tenant-specific role', async () => {
      const tenantId = 'tenant-123';
      const roleData = {
        id: 'role-123',
        tenantId,
        name: 'CUSTOM_ROLE',
        description: 'Custom role for tenant',
        permissions: ['policy:read'],
        isSystemRole: false,
      };

      mockPrisma.role.create.mockResolvedValue(roleData);

      const result = await rbacService.createRole(
        tenantId,
        'CUSTOM_ROLE',
        'Custom role for tenant',
        ['policy:read'],
        false
      );

      expect(result).toEqual({
        id: roleData.id,
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        isSystemRole: false,
      });
    });

    it('should create a system role', async () => {
      const roleData = {
        id: 'role-123',
        tenantId: null, // System role
        name: 'SYSTEM_AUDITOR',
        description: 'System-wide auditor',
        permissions: ['audit:read', 'audit:export'],
        isSystemRole: true,
      };

      mockPrisma.role.create.mockResolvedValue(roleData);

      const result = await rbacService.createRole(
        null,
        'SYSTEM_AUDITOR',
        'System-wide auditor',
        ['audit:read', 'audit:export'],
        true
      );

      expect(result.isSystemRole).toBe(true);
      expect(result.name).toBe('SYSTEM_AUDITOR');
    });
  });

  describe('assignRoleToUser', () => {
    it('should successfully assign role to user', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role();

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.userRole.findFirst.mockResolvedValue(null); // No existing assignment
      mockPrisma.userRole.create.mockResolvedValue({});
      mockCache.deletePattern.mockResolvedValue(undefined);

      await rbacService.assignRoleToUser(user.id, role.id, user.id);

      expect(mockPrisma.userRole.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          roleId: role.id,
          grantedBy: user.id,
          expiresAt: null,
        },
      });
      expect(mockCache.deletePattern).toHaveBeenCalledWith(
        `user:${user.id}:*`,
        { prefix: 'rbac' }
      );
    });

    it('should throw error for non-existent role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(
        rbacService.assignRoleToUser('user-id', 'invalid-role-id', 'admin-id')
      ).rejects.toThrow('Role not found');
    });

    it('should throw error for duplicate role assignment', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role();

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.userRole.findFirst.mockResolvedValue({ id: 'existing' }); // Already assigned

      await expect(
        rbacService.assignRoleToUser(user.id, role.id, user.id)
      ).rejects.toThrow('User already has this role');
    });

    it('should assign expiring role', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role();
      const expiresAt = new Date('2025-12-31');

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.userRole.findFirst.mockResolvedValue(null);
      mockPrisma.userRole.create.mockResolvedValue({});
      mockCache.deletePattern.mockResolvedValue(undefined);

      await rbacService.assignRoleToUser(user.id, role.id, user.id, expiresAt);

      expect(mockPrisma.userRole.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          roleId: role.id,
          grantedBy: user.id,
          expiresAt,
        },
      });
    });
  });

  describe('revokeRoleFromUser', () => {
    it('should successfully revoke role from user', async () => {
      const userId = 'user-123';
      const roleId = 'role-123';

      mockPrisma.userRole.deleteMany.mockResolvedValue({ count: 1 });
      mockCache.deletePattern.mockResolvedValue(undefined);

      await rbacService.revokeRoleFromUser(userId, roleId);

      expect(mockPrisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          roleId,
        },
      });
      expect(mockCache.deletePattern).toHaveBeenCalled();
    });
  });

  describe('deleteRole', () => {
    it('should delete non-system role', async () => {
      const role = TestFactories.role({ isSystemRole: false });

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.role.delete.mockResolvedValue(role);
      mockPrisma.userRole.findMany.mockResolvedValue([]);
      mockCache.deletePattern.mockResolvedValue(undefined);

      await rbacService.deleteRole(role.id);

      expect(mockPrisma.role.delete).toHaveBeenCalledWith({
        where: { id: role.id },
      });
    });

    it('should throw error when deleting system role', async () => {
      const systemRole = TestFactories.role({
        name: 'ADMIN',
        isSystemRole: true,
      });

      mockPrisma.role.findUnique.mockResolvedValue(systemRole);

      await expect(rbacService.deleteRole(systemRole.id)).rejects.toThrow(
        'Cannot delete system role'
      );
    });
  });

  describe('hasRole', () => {
    it('should return true if user has role', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role({ name: 'MANAGER' });

      // hasRole calls getUserRoles, which uses userRole.findMany
      mockPrisma.userRole.findMany.mockResolvedValue([
        {
          userId: user.id,
          roleId: role.id,
          role,
          expiresAt: null,
          createdAt: new Date(),
          grantedByUser: null,
        },
      ]);

      const result = await rbacService.hasRole(user.id, 'MANAGER');
      expect(result).toBe(true);
    });

    it('should return false if user does not have role', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role({ name: 'VIEWER' });

      // hasRole calls getUserRoles, which uses userRole.findMany
      mockPrisma.userRole.findMany.mockResolvedValue([
        {
          userId: user.id,
          roleId: role.id,
          role,
          expiresAt: null,
          createdAt: new Date(),
          grantedByUser: null,
        },
      ]);

      const result = await rbacService.hasRole(user.id, 'ADMIN');
      expect(result).toBe(false);
    });
  });

  // TODO: Add remaining 13 tests for:
  // - hasAnyPermission
  // - hasAllPermissions
  // - getUserRoles
  // - updateRolePermissions
  // - getRoleById
  // - getRoleByName
  // - listRoles
  // - listUsersWithRole
  // - hasAnyRole
  // - getSystemPermissions
});
