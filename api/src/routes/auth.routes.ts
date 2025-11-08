import { Router, Response } from 'express';
import { authService } from '../auth/authentication.service.js';
import { AuthenticatedRequest, authenticate } from '../auth/middleware/authenticate.middleware.js';
import { z } from 'zod';

/**
 * Authentication Routes
 *
 * Endpoints:
 * - POST /auth/register - Register new user
 * - POST /auth/login - Login user
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout user
 * - POST /auth/change-password - Change password
 */

const router = Router();

// Validation schemas
const registerSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8),
});

/**
 * Register new user
 */
router.post('/register', async (req, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const result = await authService.register(
      data.tenantId,
      data.email,
      data.password,
      data.name
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Login user
 */
router.post('/login', async (req, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const tokens = await authService.login(
      data.tenantId,
      data.email,
      data.password
    );

    res.status(200).json({
      success: true,
      data: tokens,
      message: 'Login successful',
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Refresh access token
 */
router.post('/refresh', async (req, res: Response) => {
  try {
    const data = refreshSchema.parse(req.body);

    const tokens = await authService.refreshAccessToken(data.refreshToken);

    res.status(200).json({
      success: true,
      data: tokens,
      message: 'Token refreshed successfully',
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Logout user
 */
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    await authService.logout(req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Change password
 */
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const data = changePasswordSchema.parse(req.body);

    await authService.changePassword(
      req.user.userId,
      data.oldPassword,
      data.newPassword
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get current user info
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
