import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

/**
 * Prometheus Metrics Service
 *
 * Tracks key metrics for monitoring and observability:
 * - HTTP request metrics (duration, status codes)
 * - HGTP submission metrics (success/failure rates)
 * - Validation metrics (policy/consent validation failures)
 * - Proof bundle generation metrics
 * - System health metrics
 */
class MetricsService {
  private registry: Registry;

  // HTTP Metrics
  public httpRequestDuration: Histogram<string>;
  public httpRequestTotal: Counter<string>;
  public httpRequestErrors: Counter<string>;

  // HGTP Metrics
  public hgtpSubmissionTotal: Counter<string>;
  public hgtpSubmissionDuration: Histogram<string>;
  public hgtpRetries: Counter<string>;
  public hgtpErrors: Counter<string>;

  // Validation Metrics
  public validationErrors: Counter<string>;
  public policyVersionsSubmitted: Counter<string>;
  public consentEventsSubmitted: Counter<string>;

  // Proof Bundle Metrics
  public proofBundlesGenerated: Counter<string>;
  public proofBundleGenerationDuration: Histogram<string>;
  public proofBundlesVerified: Counter<string>;
  public proofBundleVerificationDuration: Histogram<string>;

  // System Metrics
  public activeConnections: Gauge<string>;
  public cacheHits: Counter<string>;
  public cacheMisses: Counter<string>;

  constructor() {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // HTTP Metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry],
    });

    // HGTP Metrics
    this.hgtpSubmissionTotal = new Counter({
      name: 'hgtp_submissions_total',
      help: 'Total number of HGTP submissions',
      labelNames: ['type', 'status'],
      registers: [this.registry],
    });

    this.hgtpSubmissionDuration = new Histogram({
      name: 'hgtp_submission_duration_seconds',
      help: 'Duration of HGTP submissions in seconds',
      labelNames: ['type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.registry],
    });

    this.hgtpRetries = new Counter({
      name: 'hgtp_retries_total',
      help: 'Total number of HGTP retry attempts',
      labelNames: ['type', 'error_type'],
      registers: [this.registry],
    });

    this.hgtpErrors = new Counter({
      name: 'hgtp_errors_total',
      help: 'Total number of HGTP errors',
      labelNames: ['type', 'error_type'],
      registers: [this.registry],
    });

    // Validation Metrics
    this.validationErrors = new Counter({
      name: 'validation_errors_total',
      help: 'Total number of validation errors',
      labelNames: ['type', 'error_code'],
      registers: [this.registry],
    });

    this.policyVersionsSubmitted = new Counter({
      name: 'policy_versions_submitted_total',
      help: 'Total number of policy versions submitted',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.consentEventsSubmitted = new Counter({
      name: 'consent_events_submitted_total',
      help: 'Total number of consent events submitted',
      labelNames: ['status', 'event_type'],
      registers: [this.registry],
    });

    // Proof Bundle Metrics
    this.proofBundlesGenerated = new Counter({
      name: 'proof_bundles_generated_total',
      help: 'Total number of proof bundles generated',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.proofBundleGenerationDuration = new Histogram({
      name: 'proof_bundle_generation_duration_seconds',
      help: 'Duration of proof bundle generation in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.proofBundlesVerified = new Counter({
      name: 'proof_bundles_verified_total',
      help: 'Total number of proof bundles verified',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.proofBundleVerificationDuration = new Histogram({
      name: 'proof_bundle_verification_duration_seconds',
      help: 'Duration of proof bundle verification in seconds',
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
      registers: [this.registry],
    });

    // System Metrics
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [this.registry],
    });

    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    console.log('[Metrics] Prometheus metrics initialized');
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  /**
   * Get metrics registry
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.registry.resetMetrics();
  }
}

export const metricsService = new MetricsService();
