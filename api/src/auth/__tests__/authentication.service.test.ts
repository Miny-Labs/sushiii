/**
 * Authentication Service Tests
 *
 * Comprehensive tests for JWT authentication, password hashing, login/logout
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies - must be at top level
vi.mock('../../db/client.js');
vi.mock('../../cache/cache-manager.js');

import { AuthenticationService } from '../authentication.service.js';
import TestFactories from '../../test/helpers/factories.js';

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockPrisma: any;
  let mockCache: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get mocked instances
    const dbModule = await import('../../db/client.js');
    const cacheModule = await import('../../cache/cache-manager.js');

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
      findFirst: vi.fn(),
    };

    mockPrisma.userRole = {
      create: vi.fn(),
    };

    mockCache.get = vi.fn();
    mockCache.set = vi.fn();
    mockCache.delete = vi.fn();

    // Create service instance
    authService = new AuthenticationService();
  });

  describe('Password Hashing', () => {
    it('should hash a password using bcrypt', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$')).toBe(true); // bcrypt hash format
    });

    it('should verify a correct password', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Salt makes each hash unique

      // But both should verify correctly
      expect(await authService.verifyPassword(password, hash1)).toBe(true);
      expect(await authService.verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate a valid access token', () => {
      const payload = TestFactories.jwtPayload();
      const token = authService.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token structure
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.tenantId).toBe(payload.tenantId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.roles).toEqual(payload.roles);
      expect(decoded.iss).toBe('sushiii');
      expect(decoded.aud).toBe('sushiii-api');
    });

    it('should generate a valid refresh token', () => {
      const payload = TestFactories.jwtPayload();
      const { roles, ...refreshPayload } = payload;
      const token = authService.generateRefreshToken(refreshPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.tenantId).toBe(payload.tenantId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.roles).toBeUndefined(); // Refresh tokens don't include roles
    });

    it('should set correct expiration for access token', () => {
      const payload = TestFactories.jwtPayload();
      const token = authService.generateAccessToken(payload);
      const decoded = jwt.decode(token) as any;

      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + 15 * 60; // 15 minutes

      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5); // Allow 5 second tolerance
    });
  });

  describe('JWT Token Verification', () => {
    it('should verify a valid access token', () => {
      const payload = TestFactories.jwtPayload();
      const token = authService.generateAccessToken(payload);
      const verified = authService.verifyAccessToken(token);

      expect(verified.userId).toBe(payload.userId);
      expect(verified.tenantId).toBe(payload.tenantId);
      expect(verified.email).toBe(payload.email);
      expect(verified.roles).toEqual(payload.roles);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        authService.verifyAccessToken('invalid-token');
      }).toThrow('Invalid or expired access token');
    });

    it('should throw error for expired token', () => {
      const payload = TestFactories.jwtPayload();
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret', {
        expiresIn: '-1h', // Already expired
        issuer: 'sushiii',
        audience: 'sushiii-api',
      });

      expect(() => {
        authService.verifyAccessToken(expiredToken);
      }).toThrow('Invalid or expired access token');
    });

    it('should throw error for token with wrong issuer', () => {
      const payload = TestFactories.jwtPayload();
      const tokenWrongIssuer = jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret', {
        expiresIn: '15m',
        issuer: 'wrong-issuer',
        audience: 'sushiii-api',
      });

      expect(() => {
        authService.verifyAccessToken(tokenWrongIssuer);
      }).toThrow();
    });
  });

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const tenant = TestFactories.tenant();
      const viewerRole = TestFactories.role({ name: 'VIEWER', isSystemRole: true });
      const userData = {
        tenantId: tenant.id,
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
      };

      // Mock database responses
      mockPrisma.user.findFirst.mockResolvedValue(null); // User doesn't exist
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id',
        ...userData,
        passwordHash: 'hashed',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.role.findFirst.mockResolvedValue(viewerRole);
      mockPrisma.userRole.create.mockResolvedValue({});

      const result = await authService.register(
        userData.tenantId,
        userData.email,
        userData.password,
        userData.name
      );

      expect(result).toEqual({ userId: 'user-id' });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: userData.tenantId,
          email: userData.email,
          name: userData.name,
          status: 'active',
        }),
      });
    });

    it('should throw error if user already exists', async () => {
      const existingUser = TestFactories.user();

      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      await expect(
        authService.register(
          existingUser.tenantId,
          existingUser.email,
          'password123',
          'New User'
        )
      ).rejects.toThrow('User with this email already exists');
    });

    it('should assign VIEWER role by default', async () => {
      const tenant = TestFactories.tenant();
      const viewerRole = TestFactories.role({ name: 'VIEWER', isSystemRole: true });

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-id' });
      mockPrisma.role.findFirst.mockResolvedValue(viewerRole);
      mockPrisma.userRole.create.mockResolvedValue({});

      await authService.register(tenant.id, 'test@test.com', 'pass123', 'Test');

      expect(mockPrisma.role.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { tenantId: tenant.id, name: 'VIEWER' },
            { tenantId: null, name: 'VIEWER', isSystemRole: true },
          ],
        },
      });
      expect(mockPrisma.userRole.create).toHaveBeenCalled();
    });
  });

  describe('User Login', () => {
    it('should successfully login with valid credentials', async () => {
      const tenant = TestFactories.tenant();
      const password = 'password123';
      const passwordHash = await bcrypt.hash(password, 12);
      const user = TestFactories.user({
        tenantId: tenant.id,
        email: 'test@test.com',
        passwordHash,
      });
      const role = TestFactories.role({ name: 'VIEWER' });

      mockPrisma.user.findFirst.mockResolvedValue({
        ...user,
        userRoles: [{ role }],
      });
      mockPrisma.user.update.mockResolvedValue(user);
      mockCache.set.mockResolvedValue(undefined);

      const result = await authService.login(tenant.id, user.email, password);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result.expiresIn).toBe(15 * 60); // 15 minutes
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw error for invalid email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.login('tenant-id', 'wrong@test.com', 'password')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      const user = TestFactories.user({
        passwordHash: await bcrypt.hash('correct-password', 12),
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        ...user,
        userRoles: [],
      });

      await expect(
        authService.login(user.tenantId, user.email, 'wrong-password')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for inactive user', async () => {
      const user = TestFactories.user({ status: 'inactive' });

      mockPrisma.user.findFirst.mockResolvedValue(null); // Filtered out by status

      await expect(
        authService.login(user.tenantId, user.email, 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should store refresh token in cache', async () => {
      const password = 'password123';
      const user = TestFactories.user({
        passwordHash: await bcrypt.hash(password, 12),
      });
      const role = TestFactories.role();

      mockPrisma.user.findFirst.mockResolvedValue({
        ...user,
        userRoles: [{ role }],
      });
      mockPrisma.user.update.mockResolvedValue(user);
      mockCache.set.mockResolvedValue(undefined);

      await authService.login(user.tenantId, user.email, password);

      expect(mockCache.set).toHaveBeenCalledWith(
        `refresh_token:${user.id}`,
        expect.any(String),
        { ttl: 7 * 24 * 60 * 60, prefix: 'auth' }
      );
    });
  });

  describe('Refresh Token', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role();
      const payload = { userId: user.id, tenantId: user.tenantId, email: user.email };
      const refreshToken = authService.generateRefreshToken(payload);

      mockCache.get.mockResolvedValue(refreshToken);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [{ role }],
      });

      const result = await authService.refreshAccessToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).toBe(refreshToken); // Same refresh token returned
    });

    it('should throw error if refresh token is revoked', async () => {
      const user = TestFactories.user();
      const payload = { userId: user.id, tenantId: user.tenantId, email: user.email };
      const refreshToken = authService.generateRefreshToken(payload);

      mockCache.get.mockResolvedValue(null); // Token not in cache = revoked

      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow('Refresh token has been revoked');
    });

    it('should throw error if user is inactive', async () => {
      const user = TestFactories.user({ status: 'inactive' });
      const payload = { userId: user.id, tenantId: user.tenantId, email: user.email };
      const refreshToken = authService.generateRefreshToken(payload);

      mockCache.get.mockResolvedValue(refreshToken);
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow('User not found or inactive');
    });
  });

  describe('Logout', () => {
    it('should delete refresh token from cache', async () => {
      const userId = 'user-123';
      mockCache.delete.mockResolvedValue(undefined);

      await authService.logout(userId);

      expect(mockCache.delete).toHaveBeenCalledWith(
        `refresh_token:${userId}`,
        { prefix: 'auth' }
      );
    });
  });

  describe('Change Password', () => {
    it('should successfully change password', async () => {
      const oldPassword = 'oldPassword123';
      const newPassword = 'newPassword456';
      const user = TestFactories.user({
        passwordHash: await bcrypt.hash(oldPassword, 12),
      });

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(user);
      mockCache.delete.mockResolvedValue(undefined);

      await authService.changePassword(user.id, oldPassword, newPassword);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { passwordHash: expect.any(String) },
      });
      expect(mockCache.delete).toHaveBeenCalled(); // Revoke sessions
    });

    it('should throw error for incorrect old password', async () => {
      const user = TestFactories.user({
        passwordHash: await bcrypt.hash('correct-old-password', 12),
      });

      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(
        authService.changePassword(user.id, 'wrong-old-password', 'new-password')
      ).rejects.toThrow('Invalid current password');
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.changePassword('non-existent-id', 'old', 'new')
      ).rejects.toThrow('User not found');
    });
  });

  describe('Permission Checking', () => {
    it('should return true for user with exact permission', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role({
        permissions: ['policy:read', 'policy:create'],
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [{ role }],
      });

      const hasPermission = await authService.hasPermission(user.id, 'policy:read');
      expect(hasPermission).toBe(true);
    });

    it('should return true for user with wildcard permission', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role({
        permissions: ['policy:*'],
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [{ role }],
      });

      const hasPermission = await authService.hasPermission(user.id, 'policy:create');
      expect(hasPermission).toBe(true);
    });

    it('should return true for user with super admin permission', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role({
        permissions: ['*'],
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [{ role }],
      });

      const hasPermission = await authService.hasPermission(user.id, 'any:permission');
      expect(hasPermission).toBe(true);
    });

    it('should return false for user without permission', async () => {
      const user = TestFactories.user();
      const role = TestFactories.role({
        permissions: ['policy:read'],
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        userRoles: [{ role }],
      });

      const hasPermission = await authService.hasPermission(user.id, 'consent:create');
      expect(hasPermission).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const hasPermission = await authService.hasPermission('non-existent-id', 'any:permission');
      expect(hasPermission).toBe(false);
    });
  });
});
