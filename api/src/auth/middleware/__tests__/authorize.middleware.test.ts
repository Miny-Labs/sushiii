/**
 * Authorization Middleware Tests
 *
 * Tests for permission and role-based authorization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../authenticate.middleware.js';
import { authorize, requireRole, requireAdmin, requireManager } from '../authorize.middleware.js';

// Mock auth service
vi.mock('../../authentication.service.js', () => ({
  authService: {
    hasPermission: vi.fn(),
  },
}));

import { authService } from '../../authentication.service.js';

describe('Authorization Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      user: {
        userId: 'user-123',
        tenantId: 'tenant-123',
        email: 'user@example.com',
        roles: ['USER'],
      },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('authorize', () => {
    it('should allow access with valid permission', async () => {
      vi.mocked(authService.hasPermission).mockResolvedValue(true);

      const middleware = authorize('policy:read');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(authService.hasPermission).toHaveBeenCalledWith('user-123', 'policy:read');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access without required permission', async () => {
      vi.mocked(authService.hasPermission).mockResolvedValue(false);

      const middleware = authorize('policy:create');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', async () => {
      mockReq.user = undefined;

      const middleware = authorize('policy:read');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
      expect(authService.hasPermission).not.toHaveBeenCalled();
    });

    it('should allow access with any of multiple permissions', async () => {
      vi.mocked(authService.hasPermission)
        .mockResolvedValueOnce(false) // First permission denied
        .mockResolvedValueOnce(true); // Second permission allowed

      const middleware = authorize('policy:create', 'policy:read');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(authService.hasPermission).toHaveBeenCalledWith('user-123', 'policy:create');
      expect(authService.hasPermission).toHaveBeenCalledWith('user-123', 'policy:read');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle authorization check errors', async () => {
      vi.mocked(authService.hasPermission).mockRejectedValue(new Error('Database error'));

      const middleware = authorize('policy:read');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authorization check failed' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access with required role', () => {
      mockReq.user = {
        userId: 'admin-123',
        tenantId: 'tenant-123',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      };

      const middleware = requireRole('ADMIN');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access without required role', () => {
      mockReq.user = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        email: 'user@example.com',
        roles: ['USER'],
      };

      const middleware = requireRole('ADMIN');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Required role: ADMIN' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      mockReq.user = undefined;

      const middleware = requireRole('ADMIN');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access with any of multiple roles', () => {
      mockReq.user = {
        userId: 'manager-123',
        tenantId: 'tenant-123',
        email: 'manager@example.com',
        roles: ['MANAGER'],
      };

      const middleware = requireRole('ADMIN', 'MANAGER');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle users with multiple roles', () => {
      mockReq.user = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        email: 'user@example.com',
        roles: ['USER', 'MANAGER'],
      };

      const middleware = requireRole('MANAGER');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin users', () => {
      mockReq.user = {
        userId: 'admin-123',
        tenantId: 'tenant-123',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-admin users', () => {
      mockReq.user = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        email: 'user@example.com',
        roles: ['USER'],
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Required role: ADMIN' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireManager', () => {
    it('should allow access for admin users', () => {
      mockReq.user = {
        userId: 'admin-123',
        tenantId: 'tenant-123',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      };

      requireManager(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow access for manager users', () => {
      mockReq.user = {
        userId: 'manager-123',
        tenantId: 'tenant-123',
        email: 'manager@example.com',
        roles: ['MANAGER'],
      };

      requireManager(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access for regular users', () => {
      mockReq.user = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        email: 'user@example.com',
        roles: ['USER'],
      };

      requireManager(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Required role: ADMIN or MANAGER' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
