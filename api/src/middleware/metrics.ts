import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.js';

/**
 * Metrics middleware for tracking HTTP request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Track active connections
  metricsService.activeConnections.inc();

  // Record response metrics when request completes
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Record request duration
    metricsService.httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );

    // Record request count
    metricsService.httpRequestTotal.inc({ method, route, status_code: statusCode });

    // Record errors (4xx and 5xx)
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      metricsService.httpRequestErrors.inc({ method, route, error_type: errorType });
    }

    // Decrement active connections
    metricsService.activeConnections.dec();
  });

  next();
}
