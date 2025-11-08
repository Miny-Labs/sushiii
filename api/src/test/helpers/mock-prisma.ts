/**
 * Mock Prisma Client
 *
 * Provides a mock Prisma client for unit tests
 */

import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

export const createMockPrismaClient = () => {
  const mockPrisma = {
    // Tenant operations
    tenant: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },

    // Tenant Quota operations
    tenantQuota: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },

    // User operations
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },

    // Role operations
    role: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },

    // UserRole operations
    userRole: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },

    // Policy operations
    policy: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },

    // PolicyVersion operations
    policyVersion: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },

    // PolicyTemplate operations
    policyTemplate: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },

    // Consent operations
    consent: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },

    // ConsentPurpose operations
    consentPurpose: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },

    // ConsentPurposeMapping operations
    consentPurposeMapping: {
      create: vi.fn(),
      findMany: vi.fn(),
    },

    // ConsentCondition operations
    consentCondition: {
      create: vi.fn(),
      findMany: vi.fn(),
    },

    // ProofBundle operations
    proofBundle: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },

    // EncryptionKey operations
    encryptionKey: {
      create: vi.fn(),
      findMany: vi.fn(),
    },

    // TimeLockPuzzle operations
    timeLockPuzzle: {
      create: vi.fn(),
      findMany: vi.fn(),
    },

    // ProofDelegation operations
    proofDelegation: {
      create: vi.fn(),
      findMany: vi.fn(),
    },

    // AggregatedProof operations
    aggregatedProof: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },

    // ProofBundleAggregation operations
    proofBundleAggregation: {
      create: vi.fn(),
    },

    // EventLog operations
    eventLog: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
    },

    // Snapshot operations
    snapshot: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },

    // UsageMetric operations
    usageMetric: {
      create: vi.fn(),
      findMany: vi.fn(),
    },

    // Raw queries
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),

    // Transaction
    $transaction: vi.fn((callback) => callback(mockPrisma)),

    // Connection
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };

  return mockPrisma as unknown as PrismaClient;
};

/**
 * Reset all mocks
 */
export const resetMockPrisma = (mockPrisma: any) => {
  Object.keys(mockPrisma).forEach((key) => {
    if (typeof mockPrisma[key] === 'object' && mockPrisma[key] !== null) {
      Object.keys(mockPrisma[key]).forEach((method) => {
        if (typeof mockPrisma[key][method]?.mockReset === 'function') {
          mockPrisma[key][method].mockReset();
        }
      });
    }
  });
};

export default createMockPrismaClient;
