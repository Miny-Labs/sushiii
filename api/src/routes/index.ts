import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tenantsRoutes from './tenants.routes.js';
import policiesRoutes from './policies.routes.js';
import consentsRoutes from './consents.routes.js';
import proofsRoutes from './proofs.routes.js';
import demoRoutes from './demo.routes.js';

/**
 * Main API Router
 *
 * Combines all route modules and provides a single entry point
 */

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sushiii API is running',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString(),
  });
});

// Demo routes (no auth required - for development/testing)
// Mount these FIRST so they override authenticated routes
if (process.env.DEMO_MODE === 'true') {
  console.log('[Routes] Demo mode enabled - mounting demo routes');
  router.use('/', demoRoutes);
}

// Mount route modules
router.use('/auth', authRoutes);
router.use('/tenants', tenantsRoutes);
router.use('/policies', policiesRoutes);
router.use('/consents', consentsRoutes);
router.use('/proofs', proofsRoutes);

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

export default router;
