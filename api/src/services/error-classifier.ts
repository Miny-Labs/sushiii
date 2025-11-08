/**
 * Error Classification for HGTP Client
 *
 * Determines whether errors are retriable, permanent, or indicate degraded service
 */

export enum ErrorType {
  RETRIABLE = 'retriable',
  PERMANENT = 'permanent',
  DEGRADED = 'degraded',
}

export interface RetryStrategy {
  shouldRetry: boolean;
  maxRetries: number;
  initialDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export class ErrorClassifier {
  /**
   * Classify error to determine retry strategy
   */
  classify(error: any): ErrorType {
    // RETRIABLE: Temporary network issues
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ENETUNREACH' ||
      error.code === 'EHOSTUNREACH' ||
      error.message?.includes('503') ||
      error.message?.includes('429') || // Rate limit
      error.message?.includes('Node not ready') ||
      error.message?.includes('Network error')
    ) {
      return ErrorType.RETRIABLE;
    }

    // PERMANENT: Business logic failures (don't retry)
    if (
      error.message?.includes('ValidationError') ||
      error.message?.includes('DuplicatePolicyVersion') ||
      error.message?.includes('PolicyVersionNotFound') ||
      error.message?.includes('InvalidData') ||
      error.message?.includes('InvalidContentHash') ||
      error.message?.includes('InvalidJurisdiction') ||
      error.status === 400 ||
      error.status === 404 ||
      error.status === 401 ||
      error.status === 403
    ) {
      return ErrorType.PERMANENT;
    }

    // DEGRADED: Service available but degraded (retry with longer delays)
    if (
      error.message?.includes('SnapshotStopped') ||
      error.message?.includes('ConsensusFailure') ||
      error.message?.includes('PartialFailure') ||
      error.status === 502 ||
      error.status === 504
    ) {
      return ErrorType.DEGRADED;
    }

    // Default: treat as retriable
    return ErrorType.RETRIABLE;
  }

  /**
   * Get retry strategy based on error type
   */
  getRetryStrategy(errorType: ErrorType): RetryStrategy {
    switch (errorType) {
      case ErrorType.RETRIABLE:
        return {
          shouldRetry: true,
          maxRetries: 3,
          initialDelay: 1000, // 1s
          backoffMultiplier: 2,
          maxDelay: 10000, // 10s
        };

      case ErrorType.DEGRADED:
        return {
          shouldRetry: true,
          maxRetries: 5,
          initialDelay: 5000, // 5s
          backoffMultiplier: 1.5,
          maxDelay: 30000, // 30s
        };

      case ErrorType.PERMANENT:
        return {
          shouldRetry: false,
          maxRetries: 0,
          initialDelay: 0,
          backoffMultiplier: 1,
          maxDelay: 0,
        };
    }
  }

  /**
   * Calculate delay for specific attempt with exponential backoff
   */
  calculateDelay(strategy: RetryStrategy, attempt: number): number {
    const delay = strategy.initialDelay * Math.pow(strategy.backoffMultiplier, attempt);
    return Math.min(delay, strategy.maxDelay);
  }
}

/**
 * Retry execution wrapper with exponential backoff
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  classifier: ErrorClassifier = new ErrorClassifier()
): Promise<T> {
  let lastError: any;
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorType = classifier.classify(error);
      const strategy = classifier.getRetryStrategy(errorType);

      console.log(`[${operationName}] Attempt ${attempt + 1} failed:`, {
        error: error.message,
        errorType,
        willRetry: strategy.shouldRetry && attempt < strategy.maxRetries,
      });

      if (!strategy.shouldRetry || attempt >= strategy.maxRetries) {
        console.error(`[${operationName}] Permanent failure after ${attempt + 1} attempts`);
        throw error;
      }

      const delay = classifier.calculateDelay(strategy, attempt);
      console.log(`[${operationName}] Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      attempt++;
    }
  }
}
