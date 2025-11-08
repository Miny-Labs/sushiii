import { prisma } from '../../db/client.js';
import { cacheManager } from '../../cache/cache-manager.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Tenant Management Service
 *
 * Handles multi-tenant operations including:
 * - Tenant CRUD
 * - Quota management and enforcement
 * - Usage tracking
 * - Tenant settings
 */

export interface CreateTenantRequest {
  name: string;
  slug: string;
  settings?: Record<string, any>;
  quotas?: {
    maxPolicies?: number;
    maxConsents?: number;
    maxProofBundles?: number;
    maxStorageMB?: number;
  };
}

export interface UpdateTenantRequest {
  name?: string;
  slug?: string;
  status?: 'active' | 'suspended' | 'trial';
  settings?: Record<string, any>;
}

export interface TenantProfile {
  id: string;
  name: string;
  slug: string;
  apiKey: string;
  status: string;
  settings: Record<string, any>;
  createdAt: Date;
  quotas: {
    maxPolicies: number;
    maxConsents: number;
    maxProofBundles: number;
    maxStorageMB: number;
  };
  usage: {
    currentPolicies: number;
    currentConsents: number;
    currentProofBundles: number;
    currentStorageMB: number;
  };
}

export interface UsageStats {
  policies: {
    total: number;
    active: number;
    archived: number;
    byJurisdiction: Record<string, number>;
  };
  consents: {
    total: number;
    active: number;
    revoked: number;
    expired: number;
    byPurpose: Record<string, number>;
  };
  proofBundles: {
    total: number;
    verified: number;
    encrypted: number;
    averageSizeKB: number;
  };
  storage: {
    totalMB: number;
    breakdown: {
      policies: number;
      consents: number;
      proofBundles: number;
      events: number;
    };
  };
}

export class TenantService {
  /**
   * Create a new tenant
   */
  async createTenant(request: CreateTenantRequest): Promise<TenantProfile> {
    // Check if slug is unique
    const existing = await prisma.tenant.findFirst({
      where: { slug: request.slug },
    });

    if (existing) {
      throw new Error('Tenant with this slug already exists');
    }

    // Generate API key
    const apiKey = this.generateApiKey();

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: request.name,
        slug: request.slug,
        apiKey,
        status: 'trial',
        settings: request.settings || {},
      },
    });

    // Create quota record
    const quotas = await prisma.tenantQuota.create({
      data: {
        tenantId: tenant.id,
        maxPolicies: request.quotas?.maxPolicies ||
          parseInt(process.env.DEFAULT_TENANT_QUOTA_POLICIES || '1000'),
        maxConsents: request.quotas?.maxConsents ||
          parseInt(process.env.DEFAULT_TENANT_QUOTA_CONSENTS || '10000'),
        maxProofBundles: request.quotas?.maxProofBundles ||
          parseInt(process.env.DEFAULT_TENANT_QUOTA_PROOFS || '5000'),
        maxStorageMB: request.quotas?.maxStorageMB ||
          parseInt(process.env.DEFAULT_TENANT_QUOTA_STORAGE_MB || '1024'),
      },
    });

    // Initialize usage metrics
    await prisma.usageMetric.create({
      data: {
        tenantId: tenant.id,
        metricType: 'policies',
        metricValue: 0,
        period: new Date(),
      },
    });

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      apiKey: tenant.apiKey,
      status: tenant.status,
      settings: tenant.settings as Record<string, any>,
      createdAt: tenant.createdAt,
      quotas: {
        maxPolicies: quotas.maxPolicies,
        maxConsents: quotas.maxConsents,
        maxProofBundles: quotas.maxProofBundles,
        maxStorageMB: quotas.maxStorageMB,
      },
      usage: {
        currentPolicies: 0,
        currentConsents: 0,
        currentProofBundles: 0,
        currentStorageMB: 0,
      },
    };
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<TenantProfile> {
    // Check cache first
    const cached = await cacheManager.get<TenantProfile>(
      `tenant:${tenantId}:profile`,
      { prefix: 'tenants', ttl: 600 }
    );
    if (cached) {
      return cached;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        quota: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get current usage
    const usage = await this.getCurrentUsage(tenantId);

    const profile: TenantProfile = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      apiKey: tenant.apiKey,
      status: tenant.status,
      settings: tenant.settings as Record<string, any>,
      createdAt: tenant.createdAt,
      quotas: {
        maxPolicies: tenant.quota?.maxPolicies || 0,
        maxConsents: tenant.quota?.maxConsents || 0,
        maxProofBundles: tenant.quota?.maxProofBundles || 0,
        maxStorageMB: tenant.quota?.maxStorageMB || 0,
      },
      usage,
    };

    // Cache the profile
    await cacheManager.set(
      `tenant:${tenantId}:profile`,
      profile,
      { prefix: 'tenants', ttl: 600 }
    );

    return profile;
  }

  /**
   * Get tenant by API key
   */
  async getTenantByApiKey(apiKey: string): Promise<TenantProfile | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { apiKey },
      include: {
        quota: true,
      },
    });

    if (!tenant) {
      return null;
    }

    return await this.getTenant(tenant.id);
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<TenantProfile | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return null;
    }

    return await this.getTenant(tenant.id);
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, request: UpdateTenantRequest): Promise<TenantProfile> {
    // If slug is being changed, check for conflicts
    if (request.slug) {
      const existing = await prisma.tenant.findFirst({
        where: {
          slug: request.slug,
          id: { not: tenantId },
        },
      });

      if (existing) {
        throw new Error('Slug already in use');
      }
    }

    // Update tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(request.name && { name: request.name }),
        ...(request.slug && { slug: request.slug }),
        ...(request.status && { status: request.status }),
        ...(request.settings && { settings: request.settings }),
      },
    });

    // Invalidate cache
    await cacheManager.delete(`tenant:${tenantId}:profile`, { prefix: 'tenants' });

    return await this.getTenant(tenantId);
  }

  /**
   * Delete tenant (soft delete by suspending)
   */
  async deleteTenant(tenantId: string): Promise<void> {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'suspended' },
    });

    // Invalidate cache
    await cacheManager.delete(`tenant:${tenantId}:profile`, { prefix: 'tenants' });
    await cacheManager.deletePattern(`tenant:${tenantId}:*`, { prefix: 'tenants' });
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(tenantId: string): Promise<string> {
    const newApiKey = this.generateApiKey();

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { apiKey: newApiKey },
    });

    // Invalidate cache
    await cacheManager.delete(`tenant:${tenantId}:profile`, { prefix: 'tenants' });

    return newApiKey;
  }

  /**
   * Update tenant quotas
   */
  async updateQuotas(
    tenantId: string,
    quotas: {
      maxPolicies?: number;
      maxConsents?: number;
      maxProofBundles?: number;
      maxStorageMB?: number;
    }
  ): Promise<void> {
    await prisma.tenantQuota.update({
      where: { tenantId },
      data: quotas,
    });

    // Invalidate cache
    await cacheManager.delete(`tenant:${tenantId}:profile`, { prefix: 'tenants' });
  }

  /**
   * Check if tenant has reached quota limit
   */
  async checkQuota(
    tenantId: string,
    resource: 'policies' | 'consents' | 'proofBundles' | 'storage'
  ): Promise<{ allowed: boolean; current: number; max: number }> {
    const tenant = await this.getTenant(tenantId);
    const usage = tenant.usage;
    const quotas = tenant.quotas;

    const quotaMap = {
      policies: { current: usage.currentPolicies, max: quotas.maxPolicies },
      consents: { current: usage.currentConsents, max: quotas.maxConsents },
      proofBundles: { current: usage.currentProofBundles, max: quotas.maxProofBundles },
      storage: { current: usage.currentStorageMB, max: quotas.maxStorageMB },
    };

    const { current, max } = quotaMap[resource];
    return {
      allowed: current < max,
      current,
      max,
    };
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(
    tenantId: string,
    resource: 'policies' | 'consents' | 'proofBundles',
    amount: number = 1
  ): Promise<void> {
    // Check quota first
    const quota = await this.checkQuota(tenantId, resource);
    if (!quota.allowed) {
      throw new Error(`Quota exceeded for ${resource}. Maximum: ${quota.max}, Current: ${quota.current}`);
    }

    // Record usage metric
    await prisma.usageMetric.create({
      data: {
        tenantId,
        metricType: resource,
        metricValue: amount,
        period: new Date(),
      },
    });

    // Invalidate cache
    await cacheManager.delete(`tenant:${tenantId}:profile`, { prefix: 'tenants' });
    await cacheManager.delete(`tenant:${tenantId}:usage`, { prefix: 'tenants' });
  }

  /**
   * Get current usage for tenant
   */
  private async getCurrentUsage(tenantId: string): Promise<{
    currentPolicies: number;
    currentConsents: number;
    currentProofBundles: number;
    currentStorageMB: number;
  }> {
    // Check cache first
    const cached = await cacheManager.get<any>(
      `tenant:${tenantId}:usage`,
      { prefix: 'tenants', ttl: 300 }
    );
    if (cached) {
      return cached;
    }

    const [policiesCount, consentsCount, proofBundlesCount] = await Promise.all([
      prisma.policy.count({ where: { tenantId, status: { not: 'deleted' } } }),
      prisma.consent.count({ where: { tenantId, status: { not: 'deleted' } } }),
      prisma.proofBundle.count({ where: { tenantId } }),
    ]);

    // Calculate storage (rough estimate)
    const storageMB = Math.ceil(
      (policiesCount * 10 + consentsCount * 5 + proofBundlesCount * 50) / 1024
    );

    const usage = {
      currentPolicies: policiesCount,
      currentConsents: consentsCount,
      currentProofBundles: proofBundlesCount,
      currentStorageMB: storageMB,
    };

    // Cache the usage
    await cacheManager.set(
      `tenant:${tenantId}:usage`,
      usage,
      { prefix: 'tenants', ttl: 300 }
    );

    return usage;
  }

  /**
   * Get detailed usage statistics
   */
  async getUsageStats(tenantId: string): Promise<UsageStats> {
    // Get policy statistics
    const policies = await prisma.policy.groupBy({
      by: ['jurisdiction'],
      where: { tenantId, status: { not: 'deleted' } },
      _count: true,
    });

    const policyStats = await prisma.policy.aggregate({
      where: { tenantId },
      _count: true,
    });

    const activePolicies = await prisma.policy.count({
      where: { tenantId, status: 'active' },
    });

    const archivedPolicies = await prisma.policy.count({
      where: { tenantId, status: 'archived' },
    });

    // Get consent statistics
    const consents = await prisma.consent.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    });

    const activeConsents = consents.find(c => c.status === 'granted')?._count || 0;
    const revokedConsents = consents.find(c => c.status === 'revoked')?._count || 0;
    const expiredConsents = consents.find(c => c.status === 'expired')?._count || 0;

    // Get proof bundle statistics
    const proofStats = await prisma.proofBundle.aggregate({
      where: { tenantId },
      _count: true,
      _avg: { bundleSize: true },
    });

    const verifiedProofs = await prisma.proofBundle.count({
      where: { tenantId, verificationStatus: 'verified' },
    });

    const encryptedProofs = await prisma.proofBundle.count({
      where: { tenantId, encryptionKeys: { some: {} } },
    });

    return {
      policies: {
        total: policyStats._count || 0,
        active: activePolicies,
        archived: archivedPolicies,
        byJurisdiction: policies.reduce((acc, p) => {
          acc[p.jurisdiction] = p._count;
          return acc;
        }, {} as Record<string, number>),
      },
      consents: {
        total: consents.reduce((sum, c) => sum + c._count, 0),
        active: activeConsents,
        revoked: revokedConsents,
        expired: expiredConsents,
        byPurpose: {}, // Would need to join with consent purposes
      },
      proofBundles: {
        total: proofStats._count || 0,
        verified: verifiedProofs,
        encrypted: encryptedProofs,
        averageSizeKB: Math.round((proofStats._avg.bundleSize || 0) / 1024),
      },
      storage: await this.getStorageBreakdown(tenantId),
    };
  }

  /**
   * Get storage breakdown by resource type
   */
  private async getStorageBreakdown(tenantId: string): Promise<{
    totalMB: number;
    breakdown: {
      policies: number;
      consents: number;
      proofBundles: number;
      events: number;
    };
  }> {
    const [policiesCount, consentsCount, proofsSum, eventsCount] = await Promise.all([
      prisma.policy.count({ where: { tenantId } }),
      prisma.consent.count({ where: { tenantId } }),
      prisma.proofBundle.aggregate({
        where: { tenantId },
        _sum: { bundleSize: true },
      }),
      prisma.eventLog.count({ where: { tenantId } }),
    ]);

    // Rough estimates in KB
    const policiesKB = policiesCount * 10;
    const consentsKB = consentsCount * 5;
    const proofBundlesKB = (proofsSum._sum.bundleSize || 0) / 1024;
    const eventsKB = eventsCount * 2;

    const totalKB = policiesKB + consentsKB + proofBundlesKB + eventsKB;

    return {
      totalMB: Math.ceil(totalKB / 1024),
      breakdown: {
        policies: Math.ceil(policiesKB / 1024),
        consents: Math.ceil(consentsKB / 1024),
        proofBundles: Math.ceil(proofBundlesKB / 1024),
        events: Math.ceil(eventsKB / 1024),
      },
    };
  }

  /**
   * List all tenants
   */
  async listTenants(options: {
    status?: string;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<{ tenants: TenantProfile[]; total: number }> {
    const where: any = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { slug: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        take: options.limit || 50,
        skip: options.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count({ where }),
    ]);

    const profiles = await Promise.all(
      tenants.map(tenant => this.getTenant(tenant.id))
    );

    return { tenants: profiles, total };
  }

  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    return `sk_${crypto.randomBytes(32).toString('hex')}`;
  }
}

export const tenantService = new TenantService();
