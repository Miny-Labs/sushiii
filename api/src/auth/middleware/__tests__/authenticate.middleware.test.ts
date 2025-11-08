/**
 * Authentication Middleware Tests
 *
 * Tests for JWT authentication middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../authenticate.middleware.js';

// Mock auth service
vi.mock('../../authentication.service.js', () => ({
  authService: {
    verifyAccessToken: vi.fn(),
  },
}));

import { authService } from '../../authentication.service.js';

describe('Authentication Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      headers: {},
      user: undefined,
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('authenticate', () => {
    it('should authenticate with valid token', () => {
      const validPayload = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        email: 'user@example.com',
        roles: ['USER'],
      };

      mockReq.headers = {
        authorization: 'Bearer valid-token-123',
      };

      vi.mocked(authService.verifyAccessToken).mockReturnValue(validPayload);

      authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(authService.verifyAccessToken).toHaveBeenCalledWith('valid-token-123');
      expect(mockReq.user).toEqual(validPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject request with no authorization header', () => {
      mockReq.headers = {};

      authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', () => {
      mockReq.headers = {
        authorization: 'InvalidFormat token123',
      };

      authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', () => {
      mockReq.headers = {
        authorization: 'Bearer expired-token',
      };

      vi.mocked(authService.verifyAccessToken).mockImplementation(() => {
        throw new Error('Token expired');
      });

      authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      };

      vi.mocked(authService.verifyAccessToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach user with multiple roles', () => {
      const adminPayload = {
        userId: 'admin-123',
        tenantId: 'tenant-123',
        email: 'admin@example.com',
        roles: ['ADMIN', 'USER'],
      };

      mockReq.headers = {
        authorization: 'Bearer admin-token',
      };

      vi.mocked(authService.verifyAccessToken).mockReturnValue(adminPayload);

      authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user?.roles).toEqual(['ADMIN', 'USER']);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate', () => {
    it('should attach user with valid token', () => {
      const validPayload = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        email: 'user@example.com',
        roles: ['USER'],
      };

      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      vi.mocked(authService.verifyAccessToken).mockReturnValue(validPayload);

      optionalAuthenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual(validPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should continue without user when no token provided', () => {
      mockReq.headers = {};

      optionalAuthenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should continue without user when token is invalid', () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      };

      vi.mocked(authService.verifyAccessToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      optionalAuthenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should continue without user when authorization format is invalid', () => {
      mockReq.headers = {
        authorization: 'InvalidFormat token',
      };

      optionalAuthenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(authService.verifyAccessToken).not.toHaveBeenCalled();
    });
  });
});
