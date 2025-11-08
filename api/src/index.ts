import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { checkDatabaseConnection, prisma } from './db/client.js';
import { redisClient } from './cache/redis-client.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { metricsMiddleware } from './middleware/metrics.js';
import { globalLimiter } from './middleware/rate-limiter.js';

// Legacy route imports (if still needed for compatibility)
import { metricsRouter } from './routes/metrics.js';
import { healthRouter } from './routes/health.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const apiVersion = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// Apply global rate limiter
app.use(globalLimiter);

// Metrics middleware
app.use(metricsMiddleware);

// Monitoring endpoints (no auth required)
app.use('/metrics', metricsRouter);
app.use('/health', healthRouter);

// API routes (v1)
app.use(`/api/${apiVersion}`, apiRoutes);

// Legacy API routes (for backward compatibility)
// These can be removed once clients migrate to new endpoints
// app.use('/api/policies', tenantAuth, submissionLimiter, writeLimiter, policiesRouter);
// app.use('/api/consents', tenantAuth, submissionLimiter, writeLimiter, consentsRouter);
// app.use('/api/proof-bundles', tenantAuth, proofBundlesRouter);

// Error handler (must be last)
app.use(errorHandler);

// Startup function
async function startServer() {
  try {
    // Check database connection
    console.log('[Server] Checking database connection...');
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    console.log('[Server] Database connected successfully');

    // Check Redis connection
    console.log('[Server] Checking Redis connection...');
    const redisConnected = await redisClient.isConnected();
    if (!redisConnected) {
      console.warn('[Server] Warning: Redis connection failed. Caching will be disabled.');
    } else {
      console.log('[Server] Redis connected successfully');
    }

    // Start server
    const server = app.listen(port, () => {
      console.log(`[Server] Sushiii API v${apiVersion} listening on port ${port}`);
      console.log(`[Server] Health check: http://localhost:${port}/health`);
      console.log(`[Server] API base URL: http://localhost:${port}/api/${apiVersion}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] ${signal} received, shutting down gracefully...`);

      server.close(async () => {
        console.log('[Server] HTTP server closed');

        // Close database connections
        try {
          await prisma.$disconnect();
          console.log('[Server] Database connection closed');
        } catch (error) {
          console.error('[Server] Error closing database connection:', error);
        }

        // Close Redis connection
        try {
          await redisClient.disconnect();
          console.log('[Server] Redis connection closed');
        } catch (error) {
          console.error('[Server] Error closing Redis connection:', error);
        }

        console.log('[Server] Shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
