import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Configuration
 *
 * Implements rate limiting to prevent abuse and ensure fair usage:
 * - Global rate limit for all API endpoints
 * - Stricter limits for write operations (POST/PUT/DELETE)
 * - More lenient limits for read operations (GET)
 */

/**
 * Global rate limiter - applies to all requests
 * Development: 1000 requests per 15 minutes
 * Production: 100 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks and metrics
  skip: (req) => {
    return req.path === '/health' || req.path === '/metrics' || req.path.startsWith('/health/');
  },
});

/**
 * Write operation rate limiter - applies to POST, PUT, DELETE requests
 * Development: 300 requests per 15 minutes
 * Production: 30 requests per 15 minutes per IP
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 300, // Higher limit for development
  message: {
    error: 'Too many write requests from this IP, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only apply to write operations
  skip: (req) => {
    return !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  },
});

/**
 * Proof bundle generation rate limiter - very strict
 * 5 requests per hour per IP (proof generation is expensive)
 */
export const proofBundleLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 proof bundle generations per hour
  message: {
    error: 'Too many proof bundle generation requests, please try again later',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * HGTP submission rate limiter - moderate limits
 * Development: 500 submissions per 15 minutes
 * Production: 50 submissions per 15 minutes per IP
 */
export const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 50 : 500, // Higher limit for development
  message: {
    error: 'Too many policy/consent submissions, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
