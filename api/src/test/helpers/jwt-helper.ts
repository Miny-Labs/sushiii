/**
 * JWT Test Helper
 *
 * Generate JWT tokens for testing
 */

import jwt from 'jsonwebtoken';
import { JWTPayload } from '../../auth/authentication.service.js';

export class JWTTestHelper {
  private static jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only';
  private static jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-for-testing-only';

  /**
   * Generate a valid access token for testing
   */
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '15m',
      issuer: 'sushiii',
      audience: 'sushiii-api',
    });
  }

  /**
   * Generate a valid refresh token for testing
   */
  static generateRefreshToken(payload: Omit<JWTPayload, 'roles'>): string {
    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: '7d',
      issuer: 'sushiii',
      audience: 'sushiii-api',
    });
  }

  /**
   * Generate an expired access token for testing
   */
  static generateExpiredAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '-1h', // Already expired
      issuer: 'sushiii',
      audience: 'sushiii-api',
    });
  }

  /**
   * Generate an invalid token (wrong secret)
   */
  static generateInvalidToken(payload: JWTPayload): string {
    return jwt.sign(payload, 'wrong-secret', {
      expiresIn: '15m',
      issuer: 'sushiii',
      audience: 'sushiii-api',
    });
  }

  /**
   * Generate a token with custom claims
   */
  static generateCustomToken(payload: any, options: any = {}): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '15m',
      issuer: 'sushiii',
      audience: 'sushiii-api',
      ...options,
    });
  }

  /**
   * Verify a token (for testing verification logic)
   */
  static verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.jwtSecret, {
      issuer: 'sushiii',
      audience: 'sushiii-api',
    }) as JWTPayload;
  }

  /**
   * Verify a refresh token
   */
  static verifyRefreshToken(token: string): Omit<JWTPayload, 'roles'> {
    return jwt.verify(token, this.jwtRefreshSecret, {
      issuer: 'sushiii',
      audience: 'sushiii-api',
    }) as Omit<JWTPayload, 'roles'>;
  }

  /**
   * Create a Bearer token header value
   */
  static bearerToken(token: string): string {
    return `Bearer ${token}`;
  }

  /**
   * Generate a complete auth headers object
   */
  static authHeaders(payload: JWTPayload): { Authorization: string } {
    const token = this.generateAccessToken(payload);
    return {
      Authorization: this.bearerToken(token),
    };
  }
}

export default JWTTestHelper;
