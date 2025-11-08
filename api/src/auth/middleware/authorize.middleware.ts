import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate.middleware.js';
import { authService } from '../authentication.service.js';

/**
 * Authorization Middleware Factory
 *
 * Creates middleware that checks if user has required permission
 */
export function authorize(...requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { userId } = req.user;

      // Check if user has any of the required permissions
      for (const permission of requiredPermissions) {
        const hasPermission = await authService.hasPermission(userId, permission);
        if (hasPermission) {
          return next();
        }
      }

      res.status(403).json({ error: 'Insufficient permissions' });
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ error: `Required role: ${roles.join(' or ')}` });
      return;
    }

    next();
  };
}

/**
 * Require admin role
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Require manager or admin role
 */
export const requireManager = requireRole('ADMIN', 'MANAGER');
