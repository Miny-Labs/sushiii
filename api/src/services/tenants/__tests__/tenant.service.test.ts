/**
 * Tenant Service Tests
 *
 * Comprehensive tests for tenant management and quota enforcement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TestFactories from '../../../test/helpers/factories.js';

// Mock dependencies at top level
vi.mock('../../../db/client.js');
vi.mock('../../../cache/cache-manager.js');

import { TenantService } from '../tenant.service.js';

describe('TenantService', () => {
  let tenantService: TenantService;
  let mockPrisma: any;
  let mockCache: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const dbModule = await import('../../../db/client.js');
    const cacheModule = await import('../../../cache/cache-manager.js');

    mockPrisma = dbModule.prisma;
    mockCache = cacheModule.cacheManager;

    // Setup Prisma mocks
    mockPrisma.tenant = {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    };
    mockPrisma.tenantQuota = {
      create: vi.fn(),
      update: vi.fn(),
    };
    mockPrisma.usageMetric = {
      create: vi.fn(),
    };
    mockPrisma.policy = {
      count: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    };
    mockPrisma.consent = {
      count: vi.fn(),
      groupBy: vi.fn(),
    };
    mockPrisma.proofBundle = {
      count: vi.fn(),
      aggregate: vi.fn(),
    };
    mockPrisma.eventLog = {
      count: vi.fn(),
    };

    // Setup cache mocks
    mockCache.get = vi.fn().mockResolvedValue(null);
    mockCache.set = vi.fn();
    mockCache.delete = vi.fn();
    mockCache.deletePattern = vi.fn();

    tenantService = new TenantService();
  });

  describe('createTenant', () => {
    it('should create tenant with default quotas', async () => {
      const tenant = TestFactories.tenant({
        name: 'Test Tenant',
        slug: 'test-tenant',
        status: 'trial',
      });
      const quota = {
        tenantId: tenant.id,
        maxPolicies: 1000,
        maxConsents: 10000,
        maxProofBundles: 5000,
        maxStorageMB: 1024,
      };

      mockPrisma.tenant.findFirst.mockResolvedValue(null); // No existing slug
      mockPrisma.tenant.create.mockResolvedValue(tenant);
      mockPrisma.tenantQuota.create.mockResolvedValue(quota);
      mockPrisma.usageMetric.create.mockResolvedValue({});

      const result = await tenantService.createTenant({
        name: 'Test Tenant',
        slug: 'test-tenant',
      });

      expect(result.id).toBe(tenant.id);
      expect(result.name).toBe('Test Tenant');
      expect(result.slug).toBe('test-tenant');
      expect(result.status).toBe('trial');
      expect(result.quotas.maxPolicies).toBe(1000);
      expect(mockPrisma.tenant.create).toHaveBeenCalled();
    });

    it('should create tenant with custom quotas', async () => {
      const tenant = TestFactories.tenant();
      const quota = {
        tenantId: tenant.id,
        maxPolicies: 500,
        maxConsents: 5000,
        maxProofBundles: 2500,
        maxStorageMB: 512,
      };

      mockPrisma.tenant.findFirst.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(tenant);
      mockPrisma.tenantQuota.create.mockResolvedValue(quota);
      mockPrisma.usageMetric.create.mockResolvedValue({});

      const result = await tenantService.createTenant({
        name: 'Test Tenant',
        slug: 'test-tenant',
        quotas: {
          maxPolicies: 500,
          maxConsents: 5000,
          maxProofBundles: 2500,
          maxStorageMB: 512,
        },
      });

      expect(result.quotas.maxPolicies).toBe(500);
      expect(result.quotas.maxConsents).toBe(5000);
    });

    it('should throw error for duplicate slug', async () => {
      const existingTenant = TestFactories.tenant({ slug: 'test-tenant' });
      mockPrisma.tenant.findFirst.mockResolvedValue(existingTenant);

      await expect(
        tenantService.createTenant({
          name: 'Test Tenant',
          slug: 'test-tenant',
        })
      ).rejects.toThrow('Tenant with this slug already exists');
    });

    it('should generate API key', async () => {
      const tenant = TestFactories.tenant();
      const quota = TestFactories.tenantQuota({ tenantId: tenant.id });

      mockPrisma.tenant.findFirst.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(tenant);
      mockPrisma.tenantQuota.create.mockResolvedValue(quota);
      mockPrisma.usageMetric.create.mockResolvedValue({});

      const result = await tenantService.createTenant({
        name: 'Test Tenant',
        slug: 'test-tenant',
      });

      expect(result.apiKey).toBeDefined();
      expect(result.apiKey).toMatch(/^sk_/);
    });
  });

  describe('getTenant', () => {
    it('should retrieve tenant with usage', async () => {
      const tenant = TestFactories.tenant();
      const quota = TestFactories.tenantQuota({ tenantId: tenant.id });

      mockCache.get.mockResolvedValue(null); // Cache miss
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...tenant,
        quota,
      });
      mockPrisma.policy.count.mockResolvedValue(10);
      mockPrisma.consent.count.mockResolvedValue(50);
      mockPrisma.proofBundle.count.mockResolvedValue(5);

      const result = await tenantService.getTenant(tenant.id);

      expect(result.id).toBe(tenant.id);
      expect(result.usage.currentPolicies).toBe(10);
      expect(result.usage.currentConsents).toBe(50);
      expect(result.usage.currentProofBundles).toBe(5);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return cached tenant profile', async () => {
      const cachedProfile = {
        id: 'tenant-123',
        name: 'Cached Tenant',
        slug: 'cached-tenant',
        apiKey: 'sk_test',
        status: 'active',
        settings: {},
        createdAt: new Date(),
        quotas: {
          maxPolicies: 1000,
          maxConsents: 10000,
          maxProofBundles: 5000,
          maxStorageMB: 1024,
        },
        usage: {
          currentPolicies: 10,
          currentConsents: 50,
          currentProofBundles: 5,
          currentStorageMB: 1,
        },
      };

      mockCache.get.mockResolvedValue(cachedProfile); // Cache hit

      const result = await tenantService.getTenant('tenant-123');

      expect(result.name).toBe('Cached Tenant');
      expect(mockPrisma.tenant.findUnique).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent tenant', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(tenantService.getTenant('invalid-id')).rejects.toThrow('Tenant not found');
    });
  });

  describe('getTenantByApiKey', () => {
    it('should retrieve tenant by API key', async () => {
      const tenant = TestFactories.tenant({ apiKey: 'sk_test_123' });
      const quota = TestFactories.tenantQuota({ tenantId: tenant.id });

      mockPrisma.tenant.findUnique.mockResolvedValue({ ...tenant, quota });
      mockCache.get.mockResolvedValue(null);
      mockPrisma.policy.count.mockResolvedValue(0);
      mockPrisma.consent.count.mockResolvedValue(0);
      mockPrisma.proofBundle.count.mockResolvedValue(0);

      const result = await tenantService.getTenantByApiKey('sk_test_123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(tenant.id);
    });

    it('should return null for invalid API key', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const result = await tenantService.getTenantByApiKey('invalid-key');

      expect(result).toBeNull();
    });
  });

  describe('getTenantBySlug', () => {
    it('should retrieve tenant by slug', async () => {
      const tenant = TestFactories.tenant({ slug: 'test-tenant' });
      const quota = TestFactories.tenantQuota({ tenantId: tenant.id });

      mockPrisma.tenant.findUnique.mockResolvedValue(tenant);
      mockCache.get.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue({ ...tenant, quota });
      mockPrisma.policy.count.mockResolvedValue(0);
      mockPrisma.consent.count.mockResolvedValue(0);
      mockPrisma.proofBundle.count.mockResolvedValue(0);

      const result = await tenantService.getTenantBySlug('test-tenant');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('test-tenant');
    });

    it('should return null for non-existent slug', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const result = await tenantService.getTenantBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateTenant', () => {
    it('should update tenant successfully', async () => {
      const tenant = TestFactories.tenant({ name: 'Old Name', slug: 'old-slug' });
      const quota = TestFactories.tenantQuota({ tenantId: tenant.id });

      mockPrisma.tenant.findFirst.mockResolvedValue(null); // No slug conflict
      mockPrisma.tenant.update.mockResolvedValue({
        ...tenant,
        name: 'New Name',
      });
      mockCache.get.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...tenant,
        name: 'New Name',
        quota,
      });
      mockPrisma.policy.count.mockResolvedValue(0);
      mockPrisma.consent.count.mockResolvedValue(0);
      mockPrisma.proofBundle.count.mockResolvedValue(0);

      const result = await tenantService.updateTenant(tenant.id, {
        name: 'New Name',
      });

      expect(result.name).toBe('New Name');
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should throw error for duplicate slug', async () => {
      const existingTenant = TestFactories.tenant({ id: 'other-id', slug: 'taken-slug' });
      mockPrisma.tenant.findFirst.mockResolvedValue(existingTenant);

      await expect(
        tenantService.updateTenant('tenant-123', { slug: 'taken-slug' })
      ).rejects.toThrow('Slug already in use');
    });
  });

  describe('deleteTenant', () => {
    it('should soft delete tenant by suspending', async () => {
      const tenant = TestFactories.tenant();
      mockPrisma.tenant.update.mockResolvedValue({ ...tenant, status: 'suspended' });

      await tenantService.deleteTenant(tenant.id);

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: tenant.id },
        data: { status: 'suspended' },
      });
      expect(mockCache.delete).toHaveBeenCalled();
      expect(mockCache.deletePattern).toHaveBeenCalled();
    });
  });

  describe('regenerateApiKey', () => {
    it('should generate new API key', async () => {
      const tenant = TestFactories.tenant();
      const newApiKey = 'sk_new_key_123';

      mockPrisma.tenant.update.mockResolvedValue({ ...tenant, apiKey: newApiKey });

      const result = await tenantService.regenerateApiKey(tenant.id);

      expect(result).toBeDefined();
      expect(result).toMatch(/^sk_/);
      expect(mockCache.delete).toHaveBeenCalled();
    });
  });

  describe('updateQuotas', () => {
    it('should update tenant quotas', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.tenantQuota.update.mockResolvedValue({});

      await tenantService.updateQuotas(tenantId, {
        maxPolicies: 2000,
        maxConsents: 20000,
      });

      expect(mockPrisma.tenantQuota.update).toHaveBeenCalledWith({
        where: { tenantId },
        data: {
          maxPolicies: 2000,
          maxConsents: 20000,
        },
      });
      expect(mockCache.delete).toHaveBeenCalled();
    });
  });

  describe('checkQuota', () => {
    it('should return allowed when under quota', async () => {
      const tenant = TestFactories.tenant();
      const quota = TestFactories.tenantQuota({
        tenantId: tenant.id,
        maxPolicies: 1000,
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue({ ...tenant, quota });
      mockPrisma.policy.count.mockResolvedValue(10);
      mockPrisma.consent.count.mockResolvedValue(0);
      mockPrisma.proofBundle.count.mockResolvedValue(0);

      const result = await tenantService.checkQuota(tenant.id, 'policies');

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(10);
      expect(result.max).toBe(1000);
    });

    it('should return not allowed when at quota', async () => {
      const tenant = TestFactories.tenant();
      const quota = TestFactories.tenantQuota({
        tenantId: tenant.id,
        maxPolicies: 1000,
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue({ ...tenant, quota });
      mockPrisma.policy.count.mockResolvedValue(1000);
      mockPrisma.consent.count.mockResolvedValue(0);
      mockPrisma.proofBundle.count.mockResolvedValue(0);

      const result = await tenantService.checkQuota(tenant.id, 'policies');

      expect(result.allowed).toBe(false);
      expect(result.current).toBe(1000);
      expect(result.max).toBe(1000);
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage when under quota', async () => {
      const tenant = TestFactories.tenant();
      const quota = TestFactories.tenantQuota({
        tenantId: tenant.id,
        maxPolicies: 1000,
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue({ ...tenant, quota });
      mockPrisma.policy.count.mockResolvedValue(10);
      mockPrisma.consent.count.mockResolvedValue(0);
      mockPrisma.proofBundle.count.mockResolvedValue(0);
      mockPrisma.usageMetric.create.mockResolvedValue({});

      await tenantService.incrementUsage(tenant.id, 'policies');

      expect(mockPrisma.usageMetric.create).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalledTimes(2); // profile and usage
    });

    it('should throw error when quota exceeded', async () => {
      const tenant = TestFactories.tenant();
      const quota = TestFactories.tenantQuota({
        tenantId: tenant.id,
        maxPolicies: 1000,
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue({ ...tenant, quota });
      mockPrisma.policy.count.mockResolvedValue(1000);
      mockPrisma.consent.count.mockResolvedValue(0);
      mockPrisma.proofBundle.count.mockResolvedValue(0);

      await expect(
        tenantService.incrementUsage(tenant.id, 'policies')
      ).rejects.toThrow('Quota exceeded for policies');
    });
  });

  describe('getUsageStats', () => {
    it('should return detailed usage statistics', async () => {
      const tenantId = 'tenant-123';

      mockPrisma.policy.groupBy.mockResolvedValue([
        { jurisdiction: 'GDPR', _count: 10 },
        { jurisdiction: 'CCPA', _count: 5 },
      ]);
      mockPrisma.policy.aggregate.mockResolvedValue({ _count: 15 });
      mockPrisma.policy.count
        .mockResolvedValueOnce(12) // active
        .mockResolvedValueOnce(3) // archived
        .mockResolvedValueOnce(15); // total for storage
      mockPrisma.consent.groupBy.mockResolvedValue([
        { status: 'granted', _count: 50 },
        { status: 'revoked', _count: 10 },
        { status: 'expired', _count: 5 },
      ]);
      mockPrisma.consent.count.mockResolvedValue(65); // for storage
      mockPrisma.proofBundle.aggregate
        .mockResolvedValueOnce({ _count: 20, _avg: { bundleSize: 51200 } }) // for stats
        .mockResolvedValueOnce({ _sum: { bundleSize: 1024000 } }); // for storage
      mockPrisma.proofBundle.count
        .mockResolvedValueOnce(15) // verified
        .mockResolvedValueOnce(10) // encrypted
        .mockResolvedValueOnce(20); // total for storage
      mockPrisma.eventLog.count.mockResolvedValue(100);

      const result = await tenantService.getUsageStats(tenantId);

      expect(result.policies.total).toBe(15);
      expect(result.policies.active).toBe(12);
      expect(result.policies.archived).toBe(3);
      expect(result.policies.byJurisdiction.GDPR).toBe(10);
      expect(result.policies.byJurisdiction.CCPA).toBe(5);
      expect(result.consents.total).toBe(65);
      expect(result.consents.active).toBe(50);
      expect(result.consents.revoked).toBe(10);
      expect(result.consents.expired).toBe(5);
      expect(result.proofBundles.total).toBe(20);
      expect(result.proofBundles.verified).toBe(15);
      expect(result.proofBundles.encrypted).toBe(10);
    });
  });

  describe('listTenants', () => {
    it('should list all tenants with pagination', async () => {
      const tenants = [
        TestFactories.tenant({ id: 'tenant-1' }),
        TestFactories.tenant({ id: 'tenant-2' }),
      ];
      const quota = TestFactories.tenantQuota();

      mockPrisma.tenant.findMany.mockResolvedValue(tenants);
      mockPrisma.tenant.count.mockResolvedValue(2);
      mockCache.get.mockResolvedValue(null);
      mockPrisma.tenant.findUnique
        .mockResolvedValueOnce({ ...tenants[0], quota })
        .mockResolvedValueOnce({ ...tenants[1], quota });
      mockPrisma.policy.count.mockResolvedValue(0);
      mockPrisma.consent.count.mockResolvedValue(0);
      mockPrisma.proofBundle.count.mockResolvedValue(0);

      const result = await tenantService.listTenants({ limit: 10, offset: 0 });

      expect(result.tenants).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter tenants by status', async () => {
      const activeTenant = TestFactories.tenant({ status: 'active' });
      const quota = TestFactories.tenantQuota();

      mockPrisma.tenant.findMany.mockResolvedValue([activeTenant]);
      mockPrisma.tenant.count.mockResolvedValue(1);
      mockCache.get.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue({ ...activeTenant, quota });
      mockPrisma.policy.count.mockResolvedValue(0);
      mockPrisma.consent.count.mockResolvedValue(0);
      mockPrisma.proofBundle.count.mockResolvedValue(0);

      const result = await tenantService.listTenants({ status: 'active' });

      expect(result.tenants).toHaveLength(1);
      expect(result.tenants[0].status).toBe('active');
    });

    it('should search tenants by name or slug', async () => {
      const tenant = TestFactories.tenant({ name: 'Test Tenant', slug: 'test-tenant' });
      const quota = TestFactories.tenantQuota();

      mockPrisma.tenant.findMany.mockResolvedValue([tenant]);
      mockPrisma.tenant.count.mockResolvedValue(1);
      mockCache.get.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue({ ...tenant, quota });
      mockPrisma.policy.count.mockResolvedValue(0);
      mockPrisma.consent.count.mockResolvedValue(0);
      mockPrisma.proofBundle.count.mockResolvedValue(0);

      const result = await tenantService.listTenants({ search: 'test' });

      expect(result.tenants).toHaveLength(1);
    });
  });
});
