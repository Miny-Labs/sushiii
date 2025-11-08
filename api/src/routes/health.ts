import { Router } from 'express';
import { healthCheckService } from '../services/health-check.js';

const router = Router();

/**
 * Comprehensive health check endpoint
 * Returns detailed health status of all components
 */
router.get('/', async (req, res) => {
  try {
    const health = await healthCheckService.checkHealth();

    // In demo mode or development, always return 200 with status in body
    // In production, return 503 only for critical failures
    const isDemoMode = process.env.DEMO_MODE === 'true';

    // In demo mode, system is healthy if API and L0 are working (L1 not required)
    let overallStatus = health.status;
    if (isDemoMode && health.checks.api.status === 'healthy' && health.checks.metagraphL0.status === 'healthy') {
      overallStatus = 'healthy';
    }

    const statusCode = isDemoMode ? 200 : (overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503);

    res.status(statusCode).json({
      ...health,
      status: overallStatus,
      demo_mode: isDemoMode
    });
  } catch (error) {
    console.error('Health check failed:', error);
    const isDemoMode = process.env.DEMO_MODE === 'true';
    res.status(isDemoMode ? 200 : 503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      demo_mode: isDemoMode
    });
  }
});

/**
 * Liveness probe - checks if the application is alive
 * Used by Kubernetes to know if the container should be restarted
 */
router.get('/liveness', async (req, res) => {
  try {
    const isAlive = await healthCheckService.liveness();
    if (isAlive) {
      res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'dead', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    res.status(503).json({ status: 'dead', timestamp: new Date().toISOString() });
  }
});

/**
 * Readiness probe - checks if the application is ready to serve traffic
 * Used by Kubernetes to know if the container should receive traffic
 */
router.get('/readiness', async (req, res) => {
  try {
    const isReady = await healthCheckService.readiness();
    if (isReady) {
      res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'not_ready', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    res.status(503).json({ status: 'not_ready', timestamp: new Date().toISOString() });
  }
});

export { router as healthRouter };
