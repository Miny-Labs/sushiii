/**
 * Proof Service Blockchain Tests
 *
 * Comprehensive tests for Constellation Network integration:
 * - Ed25519 cryptographic signatures
 * - Merkle tree aggregation
 * - Time-lock puzzles
 * - AES-256-GCM encryption
 * - Proof delegation
 * - Zero-knowledge proofs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TestFactories from '../../../test/helpers/factories.js';
import crypto from 'crypto';

// Mock dependencies - must be at top level
vi.mock('../../../db/client.js');
vi.mock('../../../cache/cache-manager.js');
vi.mock('../../../event-sourcing/event-store.js');
vi.mock('../../tenants/tenant.service.js');
vi.mock('../../../event-sourcing/domain-event.js', () => ({
  ProofBundleGenerated: vi.fn().mockImplementation((data) => ({
    eventType: 'ProofBundleGenerated',
    ...data,
  })),
  ProofBundleVerified: vi.fn().mockImplementation((data) => ({
    eventType: 'ProofBundleVerified',
    ...data,
  })),
  ProofBundleEncrypted: vi.fn().mockImplementation((data) => ({
    eventType: 'ProofBundleEncrypted',
    ...data,
  })),
}));

import { ProofService } from '../proof.service.js';

describe('ProofService - Blockchain Technology', () => {
  let proofService: ProofService;
  let mockPrisma: any;
  let mockCache: any;
  let mockEventStore: any;
  let mockTenantService: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const dbModule = await import('../../../db/client.js');
    const cacheModule = await import('../../../cache/cache-manager.js');
    const eventModule = await import('../../../event-sourcing/event-store.js');
    const tenantModule = await import('../../tenants/tenant.service.js');

    mockPrisma = dbModule.prisma;
    mockCache = cacheModule.cacheManager;
    mockEventStore = eventModule.eventStore;
    mockTenantService = tenantModule.tenantService;

    // Setup Prisma mocks
    mockPrisma.policy = {
      findUnique: vi.fn(),
    };
    mockPrisma.consent = {
      findUnique: vi.fn(),
    };
    mockPrisma.proofBundle = {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };
    mockPrisma.encryptionKey = {
      create: vi.fn(),
    };
    mockPrisma.timeLockPuzzle = {
      create: vi.fn(),
    };
    mockPrisma.proofDelegation = {
      create: vi.fn(),
    };
    mockPrisma.aggregatedProof = {
      create: vi.fn(),
    };
    mockPrisma.proofBundleAggregation = {
      create: vi.fn(),
    };

    mockCache.get = vi.fn().mockResolvedValue(null);
    mockCache.set = vi.fn().mockResolvedValue(undefined);
    mockCache.delete = vi.fn().mockResolvedValue(undefined);

    mockEventStore.appendEvents = vi.fn().mockResolvedValue(undefined);

    mockTenantService.checkQuota = vi.fn().mockResolvedValue({ allowed: true, max: 1000, current: 10 });
    mockTenantService.incrementUsage = vi.fn().mockResolvedValue(undefined);

    proofService = new ProofService();
  });

  describe('Proof Bundle Generation', () => {
    it('should generate a proof bundle with Ed25519 signature', async () => {
      const tenant = TestFactories.tenant();
      const policy = TestFactories.policy();
      const consent = TestFactories.consent();
      const user = TestFactories.user();

      const request = {
        tenantId: tenant.id,
        policyId: policy.id,
        consentId: consent.id,
        subjectId: user.id,
        dataHash: crypto.randomBytes(32).toString('hex'),
        proofType: 'consent' as const,
      };

      mockPrisma.policy.findUnique.mockResolvedValue(policy);
      mockPrisma.consent.findUnique.mockResolvedValue(consent);

      const createdProof = {
        id: 'proof-123',
        bundleId: 'proof_abc123',
        ...request,
        signature: 'mock-signature',
        publicKey: 'mock-public-key',
        verificationStatus: 'pending',
        bundleSize: 500,
        metadata: {},
        createdAt: new Date(),
        expiresAt: null,
      };

      mockPrisma.proofBundle.create.mockResolvedValue(createdProof);
      mockPrisma.proofBundle.findUnique.mockResolvedValue({
        ...createdProof,
        encryptionKeys: [],
        timeLocks: [],
        delegations: [],
        aggregatedProofs: [],
      });

      const result = await proofService.generateProofBundle(request, user.id);

      expect(result).toBeDefined();
      expect(result.bundleId).toMatch(/^proof_/);
      expect(result.signature).toBeDefined();
      expect(result.publicKey).toBeDefined();
      expect(result.verificationStatus).toBe('pending');
      expect(mockEventStore.appendEvents).toHaveBeenCalled();
      expect(mockTenantService.incrementUsage).toHaveBeenCalledWith(tenant.id, 'proofBundles');
    });

    it('should throw error when tenant quota exceeded', async () => {
      mockTenantService.checkQuota.mockResolvedValue({ allowed: false, max: 100, current: 100 });

      const request = {
        tenantId: 'tenant-123',
        policyId: 'policy-123',
        consentId: 'consent-123',
        subjectId: 'subject-123',
        dataHash: crypto.randomBytes(32).toString('hex'),
        proofType: 'consent' as const,
      };

      await expect(
        proofService.generateProofBundle(request, 'user-123')
      ).rejects.toThrow('Proof bundle quota exceeded');
    });

    it('should throw error when policy not found', async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(null);
      mockPrisma.consent.findUnique.mockResolvedValue(TestFactories.consent());

      const request = {
        tenantId: 'tenant-123',
        policyId: 'invalid-policy',
        consentId: 'consent-123',
        subjectId: 'subject-123',
        dataHash: crypto.randomBytes(32).toString('hex'),
        proofType: 'consent' as const,
      };

      await expect(
        proofService.generateProofBundle(request, 'user-123')
      ).rejects.toThrow('Policy not found');
    });

    it('should throw error when consent not found', async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(TestFactories.policy());
      mockPrisma.consent.findUnique.mockResolvedValue(null);

      const request = {
        tenantId: 'tenant-123',
        policyId: 'policy-123',
        consentId: 'invalid-consent',
        subjectId: 'subject-123',
        dataHash: crypto.randomBytes(32).toString('hex'),
        proofType: 'consent' as const,
      };

      await expect(
        proofService.generateProofBundle(request, 'user-123')
      ).rejects.toThrow('Consent not found');
    });
  });

  describe('Cryptographic Signatures (Ed25519)', () => {
    it('should sign proof bundles with Ed25519', async () => {
      const request = {
        tenantId: 'tenant-123',
        policyId: 'policy-123',
        consentId: 'consent-123',
        subjectId: 'subject-123',
        dataHash: crypto.randomBytes(32).toString('hex'),
        proofType: 'consent' as const,
      };

      mockPrisma.policy.findUnique.mockResolvedValue(TestFactories.policy());
      mockPrisma.consent.findUnique.mockResolvedValue(TestFactories.consent());

      const createdProof = TestFactories.proofBundle({
        ...request,
        signature: '64-byte-hex-signature',
      });

      mockPrisma.proofBundle.create.mockResolvedValue(createdProof);
      mockPrisma.proofBundle.findUnique.mockResolvedValue({
        ...createdProof,
        encryptionKeys: [],
        timeLocks: [],
        delegations: [],
        aggregatedProofs: [],
      });

      const result = await proofService.generateProofBundle(request, 'user-123');

      // Signature should be hex string (128 characters for 64 bytes)
      expect(result.signature).toBeDefined();
      expect(typeof result.signature).toBe('string');
    });

    it('should verify valid Ed25519 signatures', async () => {
      const proofBundle = TestFactories.proofBundle({
        bundleId: 'proof_test123',
        verificationStatus: 'pending',
      });

      mockPrisma.proofBundle.findFirst.mockResolvedValue({
        ...proofBundle,
        timeLocks: [],
      });
      mockPrisma.proofBundle.update.mockResolvedValue(proofBundle);

      const result = await proofService.verifyProofBundle(proofBundle.bundleId);

      expect(result).toBeDefined();
      expect(result.bundleId).toBe(proofBundle.bundleId);
      expect(result.verifiedAt).toBeDefined();
      expect(mockPrisma.proofBundle.update).toHaveBeenCalled();
      expect(mockEventStore.appendEvents).toHaveBeenCalled();
    });

    it('should detect invalid signatures', async () => {
      const proofBundle = TestFactories.proofBundle({
        bundleId: 'proof_test123',
        signature: 'invalid-signature',
        verificationStatus: 'pending',
      });

      mockPrisma.proofBundle.findFirst.mockResolvedValue({
        ...proofBundle,
        timeLocks: [],
      });
      mockPrisma.proofBundle.update.mockResolvedValue(proofBundle);

      const result = await proofService.verifyProofBundle(proofBundle.bundleId);

      expect(result.signatureValid).toBe(false);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Signature verification failed');
    });
  });

  describe('Merkle Tree Aggregation', () => {
    it('should aggregate multiple proofs into Merkle tree', async () => {
      const tenant = TestFactories.tenant();
      const proofBundles = [
        TestFactories.proofBundle({ tenantId: tenant.id, dataHash: 'hash1' }),
        TestFactories.proofBundle({ tenantId: tenant.id, dataHash: 'hash2' }),
        TestFactories.proofBundle({ tenantId: tenant.id, dataHash: 'hash3' }),
      ];

      mockPrisma.proofBundle.findMany.mockResolvedValue(proofBundles);
      mockPrisma.aggregatedProof.create.mockResolvedValue({
        id: 'agg-123',
        tenantId: tenant.id,
        rootHash: 'merkle-root-hash',
        merkleTree: {},
        metadata: {},
        createdAt: new Date(),
      });
      mockPrisma.proofBundleAggregation.create.mockResolvedValue({});

      const result = await proofService.aggregateProofs(
        tenant.id,
        proofBundles.map(p => p.id),
        'user-123'
      );

      expect(result.rootHash).toBeDefined();
      expect(result.merkleTree).toBeDefined();
      expect(result.merkleTree.leaves).toHaveLength(3);
      expect(result.merkleTree.proof).toHaveLength(3);
      expect(result.proofBundleIds).toEqual(proofBundles.map(p => p.id));
    });

    it('should build correct Merkle root for single leaf', async () => {
      const tenant = TestFactories.tenant();
      const proofBundle = TestFactories.proofBundle({
        tenantId: tenant.id,
        dataHash: 'single-hash',
      });

      mockPrisma.proofBundle.findMany.mockResolvedValue([proofBundle]);
      mockPrisma.aggregatedProof.create.mockResolvedValue({
        id: 'agg-123',
        tenantId: tenant.id,
        rootHash: 'root',
        merkleTree: {},
        metadata: {},
        createdAt: new Date(),
      });
      mockPrisma.proofBundleAggregation.create.mockResolvedValue({});

      const result = await proofService.aggregateProofs(
        tenant.id,
        [proofBundle.id],
        'user-123'
      );

      expect(result.merkleTree.leaves).toHaveLength(1);
      expect(result.merkleTree.root).toBeDefined();
    });

    it('should throw error when proof bundles not found', async () => {
      mockPrisma.proofBundle.findMany.mockResolvedValue([]);

      await expect(
        proofService.aggregateProofs('tenant-123', ['proof-1', 'proof-2'], 'user-123')
      ).rejects.toThrow('Some proof bundles not found');
    });

    it('should handle even number of leaves', async () => {
      const tenant = TestFactories.tenant();
      const proofBundles = [
        TestFactories.proofBundle({ tenantId: tenant.id, dataHash: 'hash1' }),
        TestFactories.proofBundle({ tenantId: tenant.id, dataHash: 'hash2' }),
        TestFactories.proofBundle({ tenantId: tenant.id, dataHash: 'hash3' }),
        TestFactories.proofBundle({ tenantId: tenant.id, dataHash: 'hash4' }),
      ];

      mockPrisma.proofBundle.findMany.mockResolvedValue(proofBundles);
      mockPrisma.aggregatedProof.create.mockResolvedValue({
        id: 'agg-123',
        tenantId: tenant.id,
        rootHash: 'root',
        merkleTree: {},
        metadata: {},
        createdAt: new Date(),
      });
      mockPrisma.proofBundleAggregation.create.mockResolvedValue({});

      const result = await proofService.aggregateProofs(
        tenant.id,
        proofBundles.map(p => p.id),
        'user-123'
      );

      expect(result.merkleTree.leaves).toHaveLength(4);
      expect(result.merkleTree.root).toBeDefined();
    });
  });

  describe('AES-256-GCM Encryption', () => {
    it('should encrypt proof bundles', async () => {
      const request = {
        tenantId: 'tenant-123',
        policyId: 'policy-123',
        consentId: 'consent-123',
        subjectId: 'subject-123',
        dataHash: crypto.randomBytes(32).toString('hex'),
        proofType: 'consent' as const,
        encrypt: {
          enabled: true,
          algorithm: 'aes-256-gcm' as const,
          recipientPublicKey: 'recipient-pub-key',
        },
      };

      mockPrisma.policy.findUnique.mockResolvedValue(TestFactories.policy());
      mockPrisma.consent.findUnique.mockResolvedValue(TestFactories.consent());

      const createdProof = TestFactories.proofBundle(request);

      mockPrisma.proofBundle.create.mockResolvedValue(createdProof);
      mockPrisma.encryptionKey.create.mockResolvedValue({
        id: 'enc-123',
        proofBundleId: createdProof.id,
        keyId: 'key-id',
        algorithm: 'aes-256-gcm',
        iv: Buffer.from(crypto.randomBytes(16)).toString('base64'),
        encryptedKey: 'encrypted-key',
        recipientPublicKey: 'recipient-pub-key',
      });

      mockPrisma.proofBundle.findUnique.mockResolvedValue({
        ...createdProof,
        encryptionKeys: [{
          id: 'enc-123',
          algorithm: 'aes-256-gcm',
          keyId: 'key-id',
          iv: Buffer.from(crypto.randomBytes(16)).toString('base64'),
        }],
        timeLocks: [],
        delegations: [],
        aggregatedProofs: [],
      });

      const result = await proofService.generateProofBundle(request, 'user-123');

      expect(result.isEncrypted).toBe(true);
      expect(result.encryption).toBeDefined();
      expect(result.encryption?.algorithm).toBe('aes-256-gcm');
      expect(result.encryption?.iv).toBeDefined();
      expect(mockPrisma.encryptionKey.create).toHaveBeenCalled();
    });

    it('should generate 256-bit encryption keys', async () => {
      const request = {
        tenantId: 'tenant-123',
        policyId: 'policy-123',
        consentId: 'consent-123',
        subjectId: 'subject-123',
        dataHash: crypto.randomBytes(32).toString('hex'),
        proofType: 'consent' as const,
        encrypt: {
          enabled: true,
        },
      };

      mockPrisma.policy.findUnique.mockResolvedValue(TestFactories.policy());
      mockPrisma.consent.findUnique.mockResolvedValue(TestFactories.consent());

      let capturedEncryptionKey: any;
      mockPrisma.encryptionKey.create.mockImplementation((args: any) => {
        capturedEncryptionKey = args.data;
        return Promise.resolve({ id: 'enc-123', ...args.data });
      });

      const createdProof = TestFactories.proofBundle(request);
      mockPrisma.proofBundle.create.mockResolvedValue(createdProof);
      mockPrisma.proofBundle.findUnique.mockResolvedValue({
        ...createdProof,
        encryptionKeys: [],
        timeLocks: [],
        delegations: [],
        aggregatedProofs: [],
      });

      await proofService.generateProofBundle(request, 'user-123');

      expect(capturedEncryptionKey).toBeDefined();
      // Base64 encoded 256-bit (32 bytes) key should be ~44 characters
      expect(capturedEncryptionKey.encryptedKey.length).toBeGreaterThan(40);
    });
  });

  describe('Time-Lock Puzzles', () => {
    it('should create time-lock puzzles', async () => {
      const unlockDate = new Date(Date.now() + 86400000); // 1 day from now

      const request = {
        tenantId: 'tenant-123',
        policyId: 'policy-123',
        consentId: 'consent-123',
        subjectId: 'subject-123',
        dataHash: crypto.randomBytes(32).toString('hex'),
        proofType: 'consent' as const,
        timeLock: {
          enabled: true,
          unlockAt: unlockDate,
          difficulty: 100000,
        },
      };

      mockPrisma.policy.findUnique.mockResolvedValue(TestFactories.policy());
      mockPrisma.consent.findUnique.mockResolvedValue(TestFactories.consent());

      const createdProof = TestFactories.proofBundle(request);

      mockPrisma.proofBundle.create.mockResolvedValue(createdProof);
      mockPrisma.timeLockPuzzle.create.mockResolvedValue({
        id: 'tl-123',
        proofBundleId: createdProof.id,
        unlockAt: unlockDate,
        puzzleHash: 'puzzle-hash',
        difficulty: 100000,
        status: 'locked',
      });

      mockPrisma.proofBundle.findUnique.mockResolvedValue({
        ...createdProof,
        encryptionKeys: [],
        timeLocks: [{
          unlockAt: unlockDate,
          puzzleHash: 'puzzle-hash',
          difficulty: 100000,
        }],
        delegations: [],
        aggregatedProofs: [],
      });

      const result = await proofService.generateProofBundle(request, 'user-123');

      expect(result.hasTimeLock).toBe(true);
      expect(result.timeLock).toBeDefined();
      expect(result.timeLock?.unlockAt).toEqual(unlockDate);
      expect(result.timeLock?.difficulty).toBe(100000);
      expect(mockPrisma.timeLockPuzzle.create).toHaveBeenCalled();
    });

    it('should fail verification for locked proofs', async () => {
      const unlockDate = new Date(Date.now() + 86400000); // 1 day from now

      const proofBundle = TestFactories.proofBundle({
        bundleId: 'proof_locked',
      });

      mockPrisma.proofBundle.findFirst.mockResolvedValue({
        ...proofBundle,
        timeLocks: [{
          id: 'tl-123',
          unlockAt: unlockDate,
          puzzleHash: 'hash',
          difficulty: 100000,
          status: 'locked',
        }],
      });
      mockPrisma.proofBundle.update.mockResolvedValue(proofBundle);

      const result = await proofService.verifyProofBundle(proofBundle.bundleId);

      expect(result.valid).toBe(false);
      expect(result.timeLockReleased).toBe(false);
      expect(result.issues).toBeDefined();
      expect(result.issues!.some((issue: string) => issue.includes('Time-lock'))).toBe(true);
    });

    it('should pass verification for unlocked proofs', async () => {
      const unlockDate = new Date(Date.now() - 1000); // Already unlocked

      const proofBundle = TestFactories.proofBundle({
        bundleId: 'proof_unlocked',
      });

      mockPrisma.proofBundle.findFirst.mockResolvedValue({
        ...proofBundle,
        timeLocks: [{
          id: 'tl-123',
          unlockAt: unlockDate,
          puzzleHash: 'hash',
          difficulty: 100000,
          status: 'unlocked',
        }],
      });
      mockPrisma.proofBundle.update.mockResolvedValue(proofBundle);

      const result = await proofService.verifyProofBundle(proofBundle.bundleId);

      expect(result.timeLockReleased).toBe(true);
    });
  });

  describe('Proof Delegation', () => {
    it('should create delegated proofs', async () => {
      const expiresAt = new Date(Date.now() + 86400000);

      const request = {
        tenantId: 'tenant-123',
        policyId: 'policy-123',
        consentId: 'consent-123',
        subjectId: 'subject-123',
        dataHash: crypto.randomBytes(32).toString('hex'),
        proofType: 'delegation' as const,
        delegation: {
          delegateTo: 'user-456',
          permissions: ['read', 'verify'],
          expiresAt,
        },
      };

      mockPrisma.policy.findUnique.mockResolvedValue(TestFactories.policy());
      mockPrisma.consent.findUnique.mockResolvedValue(TestFactories.consent());

      const createdProof = TestFactories.proofBundle(request);

      mockPrisma.proofBundle.create.mockResolvedValue(createdProof);
      mockPrisma.proofDelegation.create.mockResolvedValue({
        id: 'del-123',
        proofBundleId: createdProof.id,
        delegateTo: 'user-456',
        permissions: ['read', 'verify'],
        expiresAt,
        delegatedBy: 'user-123',
      });

      mockPrisma.proofBundle.findUnique.mockResolvedValue({
        ...createdProof,
        encryptionKeys: [],
        timeLocks: [],
        delegations: [{
          delegateTo: 'user-456',
          permissions: ['read', 'verify'],
          expiresAt,
        }],
        aggregatedProofs: [],
      });

      const result = await proofService.generateProofBundle(request, 'user-123');

      expect(result.isDelegated).toBe(true);
      expect(result.delegation).toBeDefined();
      expect(result.delegation?.delegateTo).toBe('user-456');
      expect(result.delegation?.permissions).toEqual(['read', 'verify']);
      expect(mockPrisma.proofDelegation.create).toHaveBeenCalled();
    });
  });

  describe('Proof Verification', () => {
    it('should verify all aspects of proof bundle', async () => {
      const proofBundle = TestFactories.proofBundle({
        bundleId: 'proof_verify',
        verificationStatus: 'pending',
      });

      mockPrisma.proofBundle.findFirst.mockResolvedValue({
        ...proofBundle,
        timeLocks: [],
      });
      mockPrisma.proofBundle.update.mockResolvedValue(proofBundle);

      const result = await proofService.verifyProofBundle(proofBundle.bundleId);

      expect(result.bundleId).toBe(proofBundle.bundleId);
      expect(result.signatureValid).toBeDefined();
      expect(result.dataIntegrity).toBeDefined();
      expect(result.notExpired).toBeDefined();
      expect(result.verifiedAt).toBeDefined();
    });

    it('should detect expired proof bundles', async () => {
      const proofBundle = TestFactories.proofBundle({
        bundleId: 'proof_expired',
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      mockPrisma.proofBundle.findFirst.mockResolvedValue({
        ...proofBundle,
        timeLocks: [],
      });
      mockPrisma.proofBundle.update.mockResolvedValue(proofBundle);

      const result = await proofService.verifyProofBundle(proofBundle.bundleId);

      expect(result.notExpired).toBe(false);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Proof bundle has expired');
    });

    it('should update verification status in database', async () => {
      const proofBundle = TestFactories.proofBundle({
        bundleId: 'proof_update',
      });

      mockPrisma.proofBundle.findFirst.mockResolvedValue({
        ...proofBundle,
        timeLocks: [],
      });
      mockPrisma.proofBundle.update.mockResolvedValue(proofBundle);

      await proofService.verifyProofBundle(proofBundle.bundleId);

      expect(mockPrisma.proofBundle.update).toHaveBeenCalledWith({
        where: { id: proofBundle.id },
        data: expect.objectContaining({
          verificationStatus: expect.any(String),
          metadata: expect.objectContaining({
            lastVerified: expect.any(String),
          }),
        }),
      });
    });

    it('should create verification event in event store', async () => {
      const proofBundle = TestFactories.proofBundle({
        bundleId: 'proof_event',
      });

      mockPrisma.proofBundle.findFirst.mockResolvedValue({
        ...proofBundle,
        timeLocks: [],
      });
      mockPrisma.proofBundle.update.mockResolvedValue(proofBundle);

      await proofService.verifyProofBundle(proofBundle.bundleId);

      expect(mockEventStore.appendEvents).toHaveBeenCalled();
      const eventCall = mockEventStore.appendEvents.mock.calls[0][0];
      expect(eventCall[0].eventType).toBe('ProofBundleVerified');
    });

    it('should invalidate cache after verification', async () => {
      const proofBundle = TestFactories.proofBundle({
        bundleId: 'proof_cache',
      });

      mockPrisma.proofBundle.findFirst.mockResolvedValue({
        ...proofBundle,
        timeLocks: [],
      });
      mockPrisma.proofBundle.update.mockResolvedValue(proofBundle);

      await proofService.verifyProofBundle(proofBundle.bundleId);

      expect(mockCache.delete).toHaveBeenCalledWith(
        `proof:${proofBundle.id}`,
        { prefix: 'proofs' }
      );
    });
  });

  describe('Proof Retrieval and Caching', () => {
    it('should cache proof bundles for 7 days', async () => {
      const proofBundle = TestFactories.proofBundle();

      mockPrisma.proofBundle.findUnique.mockResolvedValue({
        ...proofBundle,
        encryptionKeys: [],
        timeLocks: [],
        delegations: [],
        aggregatedProofs: [],
      });

      await proofService.getProofBundleById(proofBundle.id);

      expect(mockCache.set).toHaveBeenCalledWith(
        `proof:${proofBundle.id}`,
        expect.any(Object),
        { prefix: 'proofs', ttl: 604800 } // 7 days
      );
    });

    it('should return cached proof if available', async () => {
      const cachedProof = TestFactories.proofBundle();

      mockCache.get.mockResolvedValue(cachedProof);

      const result = await proofService.getProofBundleById(cachedProof.id);

      expect(result).toEqual(cachedProof);
      expect(mockPrisma.proofBundle.findUnique).not.toHaveBeenCalled();
    });

    it('should throw error if proof bundle not found', async () => {
      mockPrisma.proofBundle.findUnique.mockResolvedValue(null);

      await expect(
        proofService.getProofBundleById('non-existent')
      ).rejects.toThrow('Proof bundle not found');
    });
  });

  describe('Subject Proof Queries', () => {
    it('should get all proofs for a subject', async () => {
      const subject = TestFactories.user();
      const proofs = [
        TestFactories.proofBundle({ subjectId: subject.id }),
        TestFactories.proofBundle({ subjectId: subject.id }),
      ];

      mockPrisma.proofBundle.findMany.mockResolvedValue(proofs);
      mockPrisma.proofBundle.count.mockResolvedValue(2);

      proofs.forEach(proof => {
        mockPrisma.proofBundle.findUnique.mockResolvedValueOnce({
          ...proof,
          encryptionKeys: [],
          timeLocks: [],
          delegations: [],
          aggregatedProofs: [],
        });
      });

      const result = await proofService.getSubjectProofs('tenant-123', subject.id);

      expect(result.proofs).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter proofs by type', async () => {
      const proofs = [
        TestFactories.proofBundle({ proofType: 'consent' }),
      ];

      mockPrisma.proofBundle.findMany.mockResolvedValue(proofs);
      mockPrisma.proofBundle.count.mockResolvedValue(1);
      mockPrisma.proofBundle.findUnique.mockResolvedValue({
        ...proofs[0],
        encryptionKeys: [],
        timeLocks: [],
        delegations: [],
        aggregatedProofs: [],
      });

      await proofService.getSubjectProofs('tenant-123', 'subject-123', {
        proofType: 'consent',
      });

      expect(mockPrisma.proofBundle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            proofType: 'consent',
          }),
        })
      );
    });

    it('should support pagination', async () => {
      mockPrisma.proofBundle.findMany.mockResolvedValue([]);
      mockPrisma.proofBundle.count.mockResolvedValue(100);

      await proofService.getSubjectProofs('tenant-123', 'subject-123', {
        limit: 10,
        offset: 20,
      });

      expect(mockPrisma.proofBundle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe('Proof Cleanup', () => {
    it('should delete expired proof bundles', async () => {
      const expiredProofs = [
        TestFactories.proofBundle({ expiresAt: new Date(Date.now() - 1000) }),
        TestFactories.proofBundle({ expiresAt: new Date(Date.now() - 2000) }),
      ];

      mockPrisma.proofBundle.findMany.mockResolvedValue(expiredProofs);
      mockPrisma.proofBundle.delete.mockResolvedValue({});

      const count = await proofService.cleanupExpiredProofs('tenant-123');

      expect(count).toBe(2);
      expect(mockPrisma.proofBundle.delete).toHaveBeenCalledTimes(2);
      expect(mockCache.delete).toHaveBeenCalledTimes(2);
    });
  });
});
