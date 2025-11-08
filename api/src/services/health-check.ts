import { promises as fs } from 'fs';

/**
 * Health Check Service
 *
 * Provides comprehensive health checks for:
 * - API server
 * - Metagraph L0 connectivity
 * - Metagraph L1 connectivity
 * - Proof bundle storage
 * - Overall system status
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    api: ComponentHealth;
    metagraphL0: ComponentHealth;
    metagraphL1: ComponentHealth;
    storage: ComponentHealth;
  };
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number; // in milliseconds
  message?: string;
  lastChecked: string;
}

class HealthCheckService {
  private readonly l0Url: string;
  private readonly l1Url: string;
  private readonly storageDir: string;
  private readonly startTime: number;

  constructor() {
    this.l0Url = process.env.METAGRAPH_L0_URL || 'http://localhost:9200';
    this.l1Url = process.env.METAGRAPH_L1_URL || 'http://localhost:9400';
    this.storageDir = process.env.BUNDLE_STORAGE_DIR || './data/bundles';
    this.startTime = Date.now();
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthStatus> {
    const [api, metagraphL0, metagraphL1, storage] = await Promise.all([
      this.checkAPI(),
      this.checkMetagraphL0(),
      this.checkMetagraphL1(),
      this.checkStorage(),
    ]);

    // Determine overall status
    const checks = { api, metagraphL0, metagraphL1, storage };
    const statuses = [api.status, metagraphL0.status, metagraphL1.status, storage.status];

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (statuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks,
    };
  }

  /**
   * Quick liveness probe
   */
  async liveness(): Promise<boolean> {
    return true; // API is running if this is reached
  }

  /**
   * Readiness probe - checks if API is ready to serve traffic
   */
  async readiness(): Promise<boolean> {
    try {
      const health = await this.checkHealth();
      return health.status !== 'unhealthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check API health
   */
  private async checkAPI(): Promise<ComponentHealth> {
    return {
      status: 'healthy',
      latency: 0,
      message: 'API server is running',
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Check Metagraph L0 connectivity
   */
  private async checkMetagraphL0(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${this.l0Url}/cluster/info`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latency = Date.now() - start;

      if (response.ok) {
        return {
          status: latency < 1000 ? 'healthy' : 'degraded',
          latency,
          message: latency < 1000 ? 'L0 responding normally' : 'L0 responding slowly',
          lastChecked: new Date().toISOString(),
        };
      } else {
        return {
          status: 'degraded',
          latency,
          message: `L0 returned status ${response.status}`,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error: any) {
      const latency = Date.now() - start;
      return {
        status: 'unhealthy',
        latency,
        message: `L0 unreachable: ${error.message}`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Metagraph L1 connectivity
   */
  private async checkMetagraphL1(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${this.l1Url}/data-application/info`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latency = Date.now() - start;

      if (response.ok) {
        return {
          status: latency < 1000 ? 'healthy' : 'degraded',
          latency,
          message: latency < 1000 ? 'L1 responding normally' : 'L1 responding slowly',
          lastChecked: new Date().toISOString(),
        };
      } else {
        return {
          status: 'degraded',
          latency,
          message: `L1 returned status ${response.status}`,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error: any) {
      const latency = Date.now() - start;
      return {
        status: 'unhealthy',
        latency,
        message: `L1 unreachable: ${error.message}`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check storage health
   */
  private async checkStorage(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      // Check if storage directory exists and is writable
      await fs.access(this.storageDir);

      // Try to write a test file
      const testFile = `${this.storageDir}/.health-check`;
      await fs.writeFile(testFile, 'ok', 'utf-8');
      await fs.unlink(testFile);

      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
        message: 'Storage is accessible and writable',
        lastChecked: new Date().toISOString(),
      };
    } catch (error: any) {
      const latency = Date.now() - start;
      return {
        status: 'unhealthy',
        latency,
        message: `Storage error: ${error.message}`,
        lastChecked: new Date().toISOString(),
      };
    }
  }
}

export const healthCheckService = new HealthCheckService();
