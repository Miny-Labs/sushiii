import { prisma } from './client.js';
import { Prisma } from '@prisma/client';

/**
 * Transaction Helpers
 *
 * Provides utilities for managing database transactions with proper error handling
 * and tenant context preservation.
 */

export type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

/**
 * Execute a function within a transaction
 */
export async function executeInTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await fn(tx);
  });
}

/**
 * Execute a function within a transaction with tenant context
 */
export async function executeInTransactionWithTenant<T>(
  tenantId: string,
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Set tenant context
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`
    );

    // Execute function
    return await fn(tx);
  });
}

/**
 * Retry logic for transactions (handles deadlocks)
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if it's a retryable error (deadlock, serialization failure)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2034' || // Transaction conflict
         error.code === 'P2028')    // Transaction timeout
      ) {
        // Wait with exponential backoff
        const delay = Math.min(100 * Math.pow(2, attempt), 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Not a retryable error, throw immediately
      throw error;
    }
  }

  // Max retries exceeded
  throw lastError;
}

/**
 * Batch operation helper
 */
export async function executeBatch<T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 10
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(op => op()));
    results.push(...batchResults);
  }

  return results;
}
