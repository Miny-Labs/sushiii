import { Request, Response, NextFunction } from 'express';
import { authService } from '../authentication.service.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    email: string;
    roles: string[];
  };
}

/**
 * Authentication Middleware
 *
 * Verifies JWT token and attaches user info to request
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Demo mode bypass - uses real backend but skips auth for development
    if (process.env.DEMO_MODE === 'true') {
      req.user = {
        userId: 'demo-user-id',
        tenantId: 'demo-tenant-id',
        email: 'demo@sushiii.com',
        roles: ['admin', 'user']
      };
      return next();
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = authService.verifyAccessToken(token);

    // Attach user to request
    req.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
      roles: payload.roles,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
      roles: payload.roles,
    };

    next();
  } catch (error) {
    // Invalid token, but we don't fail the request
    next();
  }
}
