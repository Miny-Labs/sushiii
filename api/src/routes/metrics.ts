import { Router } from 'express';
import { metricsService } from '../services/metrics.js';

const router = Router();

/**
 * Prometheus metrics endpoint
 * Should be scraped by Prometheus for monitoring
 */
router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', metricsService.getRegistry().contentType);
    const metrics = await metricsService.getMetrics();
    res.send(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).send('Error generating metrics');
  }
});

export { router as metricsRouter };
