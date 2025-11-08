import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client.js';
import { cacheManager } from '../cache/cache-manager.js';

/**
 * Authentication Service
 *
 * Handles user authentication, JWT token generation/verification, and session management.
 */

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthenticationService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenExpiry: string = '15m'; // 15 minutes
  private readonly refreshTokenExpiry: string = '7d'; // 7 days
  private readonly saltRounds: number = 12;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';

    if (process.env.NODE_ENV === 'production' && (this.jwtSecret.includes('change') || this.jwtRefreshSecret.includes('change'))) {
      throw new Error('JWT secrets must be changed in production!');
    }
  }

  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'sushiii',
      audience: 'sushiii-api',
    });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(payload: Omit<JWTPayload, 'roles'>): string {
    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'sushiii',
      audience: 'sushiii-api',
    });
  }

  /**
   * Verify JWT access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'sushiii',
        audience: 'sushiii-api',
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify JWT refresh token
   */
  verifyRefreshToken(token: string): Omit<JWTPayload, 'roles'> {
    try {
      return jwt.verify(token, this.jwtRefreshSecret, {
        issuer: 'sushiii',
        audience: 'sushiii-api',
      }) as Omit<JWTPayload, 'roles'>;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Login user with email and password
   */
  async login(tenantId: string, email: string, password: string): Promise<AuthTokens> {
    // Find user
    const user = await prisma.user.findFirst({
      where: {
        tenantId,
        email,
        status: 'active',
      },
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
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Get roles
    const roles = user.userRoles.map(ur => ur.role.name);

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles,
    });

    const refreshToken = this.generateRefreshToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
    });

    // Store refresh token in cache (for potential blacklisting)
    await cacheManager.set(
      `refresh_token:${user.id}`,
      refreshToken,
      { ttl: 7 * 24 * 60 * 60, prefix: 'auth' } // 7 days
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Check if refresh token is still valid in cache
    const cachedToken = await cacheManager.get<string>(
      `refresh_token:${payload.userId}`,
      { prefix: 'auth' }
    );

    if (!cachedToken || cachedToken !== refreshToken) {
      throw new Error('Refresh token has been revoked');
    }

    // Get user with current roles
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    if (!user || user.status !== 'active') {
      throw new Error('User not found or inactive');
    }

    const roles = user.userRoles.map(ur => ur.role.name);

    // Generate new access token
    const accessToken = this.generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles,
    });

    return {
      accessToken,
      refreshToken, // Return same refresh token
      expiresIn: 15 * 60,
    };
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(userId: string): Promise<void> {
    await cacheManager.delete(`refresh_token:${userId}`, { prefix: 'auth' });
  }

  /**
   * Register new user
   */
  async register(
    tenantId: string,
    email: string,
    password: string,
    name: string
  ): Promise<{ userId: string }> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { tenantId, email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId,
        email,
        name,
        passwordHash,
        status: 'active',
      },
    });

    // Assign default VIEWER role
    const viewerRole = await prisma.role.findFirst({
      where: {
        OR: [
          { tenantId, name: 'VIEWER' },
          { tenantId: null, name: 'VIEWER', isSystemRole: true },
        ],
      },
    });

    if (viewerRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: viewerRole.id,
        },
      });
    }

    return { userId: user.id };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValid = await this.verifyPassword(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid current password');
    }

    // Hash new password
    const newHash = await this.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens (force re-login)
    await this.logout(userId);
  }

  /**
   * Verify user has permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return false;

    // Check if any role has the permission
    for (const userRole of user.userRoles) {
      const permissions = userRole.role.permissions as string[];
      if (permissions.includes(permission) || permissions.includes('*')) {
        return true;
      }

      // Check wildcard permissions (e.g., "policy:*" matches "policy:create")
      const [resource] = permission.split(':');
      if (permissions.includes(`${resource}:*`)) {
        return true;
      }
    }

    return false;
  }
}

export const authService = new AuthenticationService();
