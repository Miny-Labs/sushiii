/**
 * Consent Service Tests
 *
 * Comprehensive tests for consent management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TestFactories from '../../../test/helpers/factories.js';

// Mock dependencies at top level
vi.mock('../../../db/client.js');
vi.mock('../../../cache/cache-manager.js');
vi.mock('../../../event-sourcing/event-store.js');
vi.mock('../../tenants/tenant.service.js');
vi.mock('../../../event-sourcing/domain-event.js', () => ({
  ConsentGranted: vi.fn().mockImplementation((data) => ({
    eventType: 'ConsentGranted',
    ...data,
  })),
  ConsentRevoked: vi.fn().mockImplementation((data) => ({
    eventType: 'ConsentRevoked',
    ...data,
  })),
  ConsentRenewed: vi.fn().mockImplementation((data) => ({
    eventType: 'ConsentRenewed',
    ...data,
  })),
  ConsentExpired: vi.fn().mockImplementation((data) => ({
    eventType: 'ConsentExpired',
    ...data,
  })),
}));

import { ConsentService } from '../consent.service.js';

describe('ConsentService', () => {
  let consentService: ConsentService;
  let mockPrisma: any;
  let mockCache: any;
  let mockEventStore: any;
  let mockTenantService: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const dbModule = await import('../../../db/client.js');
    const cacheModule = await import('../../../cache/cache-manager.js');
    const eventStoreModule = await import('../../../event-sourcing/event-store.js');
    const tenantModule = await import('../../tenants/tenant.service.js');

    mockPrisma = dbModule.prisma;
    mockCache = cacheModule.cacheManager;
    mockEventStore = eventStoreModule.eventStore;
    mockTenantService = tenantModule.tenantService;

    // Setup Prisma mocks
    mockPrisma.consent = {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    };
    mockPrisma.policy = {
      findUnique: vi.fn(),
    };
    mockPrisma.purpose = {
      findMany: vi.fn(),
    };
    mockPrisma.consentPurpose = {
      create: vi.fn(),
      findFirst: vi.fn(),
      createMany: vi.fn(),
    };
    mockPrisma.consentPurposeMapping = {
      create: vi.fn(),
      createMany: vi.fn(),
    };
    mockPrisma.consentCondition = {
      create: vi.fn(),
      createMany: vi.fn(),
    };
    mockPrisma.eventLog = {
      create: vi.fn(),
      findMany: vi.fn(),
    };

    // Setup cache mocks
    mockCache.get = vi.fn().mockResolvedValue(null);
    mockCache.set = vi.fn();
    mockCache.delete = vi.fn();
    mockCache.deletePattern = vi.fn();

    // Setup event store mocks
    mockEventStore.appendEvents = vi.fn();

    // Setup tenant service mocks
    mockTenantService.checkQuota = vi.fn().mockResolvedValue({
      allowed: true,
      max: 1000,
      current: 10,
    });

    consentService = new ConsentService();
  });

  describe('grantConsent', () => {
    it('should successfully grant consent with purposes', async () => {
      const tenant = TestFactories.tenant();
      const policy = TestFactories.policy();
      const purposes = [
        { id: 'purpose-1', name: 'marketing', tenantId: tenant.id, description: 'Marketing' },
        { id: 'purpose-2', name: 'analytics', tenantId: tenant.id, description: 'Analytics' },
      ];

      const createdConsent = {
        id: 'consent-123',
        tenantId: tenant.id,
        policyId: policy.id,
        subjectId: 'user-123',
        subjectType: 'user',
        status: 'granted',
        consentMethod: 'explicit',
        grantedAt: new Date(),
        expiresAt: null,
        metadata: {},
        policy,
        purposes: [],
        conditions: [],
      };

      mockPrisma.policy.findUnique.mockResolvedValue(policy);
      mockPrisma.consent.findFirst.mockResolvedValue(null); // No existing consent
      mockPrisma.consentPurpose.findFirst
        .mockResolvedValueOnce(purposes[0])
        .mockResolvedValueOnce(purposes[1]);
      mockPrisma.consentPurposeMapping.create.mockResolvedValue({});
      mockPrisma.consent.create.mockResolvedValue(createdConsent);
      // Mock getConsentById call at the end
      mockPrisma.consent.findUnique.mockResolvedValue(createdConsent);

      const result = await consentService.grantConsent({
        tenantId: tenant.id,
        policyId: policy.id,
        subjectId: 'user-123',
        subjectType: 'user',
        purposes: ['marketing', 'analytics'],
        dataTypes: ['email', 'name'],
        consentMethod: 'explicit',
      });

      expect(result.id).toBe('consent-123');
      expect(mockPrisma.consent.create).toHaveBeenCalled();
      expect(mockEventStore.appendEvents).toHaveBeenCalled();
    });

    it('should enforce quota limits', async () => {
      mockTenantService.checkQuota.mockResolvedValue({
        allowed: false,
        max: 1000,
        current: 1000,
      });

      await expect(
        consentService.grantConsent({
          tenantId: 'tenant-123',
          policyId: 'policy-123',
          subjectId: 'user-123',
          subjectType: 'user',
          purposes: ['marketing'],
          dataTypes: ['email'],
          consentMethod: 'explicit',
        })
      ).rejects.toThrow('Consent quota exceeded');
    });

    it('should create consent with expiration date', async () => {
      const tenant = TestFactories.tenant();
      const policy = TestFactories.policy();
      const expiresAt = new Date('2026-12-31');
      const purposes = [{ id: 'purpose-1', name: 'marketing', tenantId: tenant.id, description: 'Marketing' }];

      const createdConsent = {
        id: 'consent-123',
        tenantId: tenant.id,
        policyId: policy.id,
        subjectId: 'user-123',
        subjectType: 'user',
        status: 'granted',
        consentMethod: 'explicit',
        grantedAt: new Date(),
        expiresAt,
        metadata: {},
        policy,
        purposes: [],
        conditions: [],
      };

      mockPrisma.policy.findUnique.mockResolvedValue(policy);
      mockPrisma.consent.findFirst.mockResolvedValue(null);
      mockPrisma.consentPurpose.findFirst.mockResolvedValue(purposes[0]);
      mockPrisma.consentPurposeMapping.create.mockResolvedValue({});
      mockPrisma.consent.create.mockResolvedValue(createdConsent);
      mockPrisma.consent.findUnique.mockResolvedValue(createdConsent);

      const result = await consentService.grantConsent({
        tenantId: tenant.id,
        policyId: policy.id,
        subjectId: 'user-123',
        subjectType: 'user',
        purposes: ['marketing'],
        dataTypes: ['email'],
        consentMethod: 'explicit',
        expiresAt,
      });

      expect(result.expiresAt).toEqual(expiresAt);
    });

    it('should create consent with conditions', async () => {
      const tenant = TestFactories.tenant();
      const policy = TestFactories.policy();
      const purposes = [{ id: 'purpose-1', name: 'marketing', tenantId: tenant.id, description: 'Marketing' }];

      const createdConsent = {
        id: 'consent-123',
        tenantId: tenant.id,
        policyId: policy.id,
        subjectId: 'user-123',
        subjectType: 'user',
        status: 'granted',
        consentMethod: 'explicit',
        grantedAt: new Date(),
        expiresAt: null,
        metadata: {},
        policy,
        purposes: [],
        conditions: [],
      };

      mockPrisma.policy.findUnique.mockResolvedValue(policy);
      mockPrisma.consent.findFirst.mockResolvedValue(null);
      mockPrisma.consentPurpose.findFirst.mockResolvedValue(purposes[0]);
      mockPrisma.consentPurposeMapping.create.mockResolvedValue({});
      mockPrisma.consent.create.mockResolvedValue(createdConsent);
      mockPrisma.consentCondition.create.mockResolvedValue({});
      mockPrisma.consent.findUnique.mockResolvedValue(createdConsent);

      const result = await consentService.grantConsent({
        tenantId: tenant.id,
        policyId: policy.id,
        subjectId: 'user-123',
        subjectType: 'user',
        purposes: ['marketing'],
        dataTypes: ['email'],
        consentMethod: 'explicit',
        conditions: [
          {
            type: 'time',
            operator: 'less_than',
            field: 'timestamp',
            value: '2026-12-31T00:00:00Z',
          },
        ],
      });

      expect(result.id).toBe('consent-123');
      expect(mockPrisma.consentCondition.create).toHaveBeenCalled();
    });

    it('should create consent with geographic restrictions', async () => {
      const tenant = TestFactories.tenant();
      const policy = TestFactories.policy();
      const purposes = [{ id: 'purpose-1', name: 'marketing', tenantId: tenant.id, description: 'Marketing' }];

      const createdConsent = {
        id: 'consent-123',
        tenantId: tenant.id,
        policyId: policy.id,
        subjectId: 'user-123',
        subjectType: 'user',
        status: 'granted',
        consentMethod: 'explicit',
        grantedAt: new Date(),
        expiresAt: null,
        metadata: {},
        policy,
        purposes: [],
        conditions: [],
      };

      const updatedConsent = {
        ...createdConsent,
        metadata: {
          geographicRestrictions: {
            allowedCountries: ['US', 'CA', 'GB'],
          },
        },
      };

      mockPrisma.policy.findUnique.mockResolvedValue(policy);
      mockPrisma.consent.findFirst.mockResolvedValue(null);
      mockPrisma.consentPurpose.findFirst.mockResolvedValue(purposes[0]);
      mockPrisma.consentPurposeMapping.create.mockResolvedValue({});
      mockPrisma.consent.create.mockResolvedValue(createdConsent);
      mockPrisma.consent.update.mockResolvedValue(updatedConsent);
      mockPrisma.consent.findUnique.mockResolvedValue(updatedConsent);

      const result = await consentService.grantConsent({
        tenantId: tenant.id,
        policyId: policy.id,
        subjectId: 'user-123',
        subjectType: 'user',
        purposes: ['marketing'],
        dataTypes: ['email'],
        consentMethod: 'explicit',
        geographicRestrictions: {
          allowedCountries: ['US', 'CA', 'GB'],
        },
      });

      expect(result.id).toBe('consent-123');
      expect(mockPrisma.consent.update).toHaveBeenCalled();
    });
  });

  describe('getConsentById', () => {
    it('should retrieve consent with caching', async () => {
      const consent = TestFactories.consent();
      const policy = TestFactories.policy();

      mockCache.get.mockResolvedValue(null); // Cache miss
      mockPrisma.consent.findUnique.mockResolvedValue({
        ...consent,
        policy,
        purposes: [],
        conditions: [],
      });

      const result = await consentService.getConsentById(consent.id);

      expect(result.id).toBe(consent.id);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return cached consent', async () => {
      const consent = TestFactories.consent();
      mockCache.get.mockResolvedValue(consent); // Cache hit

      const result = await consentService.getConsentById(consent.id);

      expect(result.id).toBe(consent.id);
      expect(mockPrisma.consent.findUnique).not.toHaveBeenCalled();
    });

    it('should determine consent as inactive when expired', async () => {
      const expiredDate = new Date('2020-01-01');
      const policy = TestFactories.policy();
      const consent = {
        id: 'consent-123',
        tenantId: 'tenant-123',
        policyId: 'policy-123',
        subjectId: 'user-123',
        subjectType: 'user',
        status: 'granted',
        consentMethod: 'explicit',
        grantedAt: new Date('2019-01-01'),
        expiresAt: expiredDate,
        revokedAt: null,
        metadata: {},
        policy,
        purposes: [],
        conditions: [],
      };

      mockCache.get.mockResolvedValue(null);
      mockPrisma.consent.findUnique.mockResolvedValue(consent);

      const result = await consentService.getConsentById(consent.id);

      expect(result.isActive).toBe(false);
    });

    it('should determine consent as active when not expired', async () => {
      const futureDate = new Date('2030-01-01');
      const policy = TestFactories.policy();
      const consent = {
        id: 'consent-123',
        tenantId: 'tenant-123',
        policyId: 'policy-123',
        subjectId: 'user-123',
        subjectType: 'user',
        status: 'granted',
        consentMethod: 'explicit',
        grantedAt: new Date(),
        expiresAt: futureDate,
        revokedAt: null,
        metadata: {},
        policy,
        purposes: [],
        conditions: [],
      };

      mockCache.get.mockResolvedValue(null);
      mockPrisma.consent.findUnique.mockResolvedValue(consent);

      const result = await consentService.getConsentById(consent.id);

      expect(result.isActive).toBe(true);
    });
  });

  describe('revokeConsent', () => {
    it('should successfully revoke consent', async () => {
      const consent = TestFactories.consent({ status: 'granted', metadata: {} });

      mockPrisma.consent.findUnique.mockResolvedValue(consent);
      mockPrisma.consent.update.mockResolvedValue({
        ...consent,
        status: 'revoked',
        revokedAt: new Date(),
      });

      await consentService.revokeConsent(consent.id, 'user-123', 'User request');

      expect(mockPrisma.consent.update).toHaveBeenCalledWith({
        where: { id: consent.id },
        data: {
          status: 'revoked',
          revokedAt: expect.any(Date),
          metadata: expect.objectContaining({
            revocationReason: 'User request',
            revokedBy: 'user-123',
          }),
        },
      });
      expect(mockEventStore.appendEvents).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should throw error when revoking non-existent consent', async () => {
      mockPrisma.consent.findUnique.mockResolvedValue(null);

      await expect(
        consentService.revokeConsent('invalid-id', 'user-123', 'User request')
      ).rejects.toThrow('Consent not found');
    });

    it('should throw error when revoking already revoked consent', async () => {
      const consent = TestFactories.consent({ status: 'revoked' });
      mockPrisma.consent.findUnique.mockResolvedValue(consent);

      await expect(
        consentService.revokeConsent(consent.id, 'user-123', 'User request')
      ).rejects.toThrow('Consent is not active');
    });
  });

  describe('renewConsent', () => {
    it('should successfully renew consent', async () => {
      const policy = TestFactories.policy();
      const consent = TestFactories.consent({
        status: 'granted',
        expiresAt: new Date('2025-12-31'),
        metadata: {},
      });
      const newExpiresAt = new Date('2026-12-31');

      mockPrisma.consent.findUnique
        .mockResolvedValueOnce(consent)
        .mockResolvedValueOnce({
          ...consent,
          policy,
          purposes: [],
          conditions: [],
          expiresAt: newExpiresAt,
        });
      mockPrisma.consent.update.mockResolvedValue({
        ...consent,
        expiresAt: newExpiresAt,
      });
      mockCache.get.mockResolvedValue(null);

      const result = await consentService.renewConsent(consent.id, newExpiresAt, 'user-123');

      expect(result.expiresAt).toEqual(newExpiresAt);
      expect(mockEventStore.appendEvents).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should throw error when renewing non-existent consent', async () => {
      mockPrisma.consent.findUnique.mockResolvedValue(null);

      await expect(
        consentService.renewConsent('invalid-id', new Date('2026-12-31'), 'user-123')
      ).rejects.toThrow('Consent not found');
    });
  });

  describe('checkConsent', () => {
    it('should allow consent for valid purpose', async () => {
      const consent = TestFactories.consent({
        status: 'granted',
        expiresAt: new Date('2030-01-01'),
      });

      mockPrisma.consent.findMany.mockResolvedValue([
        {
          ...consent,
          purposes: [
            {
              purpose: { name: 'marketing' },
            },
          ],
          conditions: [],
        },
      ]);

      const result = await consentService.checkConsent(
        'tenant-123',
        'user-123',
        'policy-123',
        'marketing'
      );

      expect(result.allowed).toBe(true);
      expect(result.consentId).toBe(consent.id);
    });

    it('should deny consent for missing purpose', async () => {
      const consent = TestFactories.consent({
        status: 'granted',
        expiresAt: new Date('2030-01-01'),
      });

      mockPrisma.consent.findMany.mockResolvedValue([
        {
          ...consent,
          purposes: [
            {
              purpose: { name: 'analytics' },
            },
          ],
          conditions: [],
        },
      ]);

      const result = await consentService.checkConsent(
        'tenant-123',
        'user-123',
        'policy-123',
        'marketing'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('No consent matches');
    });

    it('should deny consent when no active consents found', async () => {
      mockPrisma.consent.findMany.mockResolvedValue([]);

      const result = await consentService.checkConsent(
        'tenant-123',
        'user-123',
        'policy-123',
        'marketing'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('No active consent found');
    });

    it('should enforce geographic allowlist', async () => {
      const consent = TestFactories.consent({
        status: 'granted',
        expiresAt: new Date('2030-01-01'),
        metadata: {
          geographicRestrictions: {
            allowedCountries: ['US', 'CA'],
          },
        },
      });

      mockPrisma.consent.findMany.mockResolvedValue([
        {
          ...consent,
          purposes: [{ purpose: { name: 'marketing' } }],
          conditions: [],
        },
      ]);

      // Test allowed country
      const allowedResult = await consentService.checkConsent(
        'tenant-123',
        'user-123',
        'policy-123',
        'marketing',
        { location: { country: 'US' } }
      );
      expect(allowedResult.allowed).toBe(true);

      // Test blocked country
      const blockedResult = await consentService.checkConsent(
        'tenant-123',
        'user-123',
        'policy-123',
        'marketing',
        { location: { country: 'FR' } }
      );
      expect(blockedResult.allowed).toBe(false);
    });

    it('should enforce geographic blocklist', async () => {
      const consent = TestFactories.consent({
        status: 'granted',
        expiresAt: new Date('2030-01-01'),
        metadata: {
          geographicRestrictions: {
            blockedCountries: ['CN', 'RU'],
          },
        },
      });

      mockPrisma.consent.findMany.mockResolvedValue([
        {
          ...consent,
          purposes: [{ purpose: { name: 'marketing' } }],
          conditions: [],
        },
      ]);

      // Test allowed country
      const allowedResult = await consentService.checkConsent(
        'tenant-123',
        'user-123',
        'policy-123',
        'marketing',
        { location: { country: 'US' } }
      );
      expect(allowedResult.allowed).toBe(true);

      // Test blocked country
      const blockedResult = await consentService.checkConsent(
        'tenant-123',
        'user-123',
        'policy-123',
        'marketing',
        { location: { country: 'CN' } }
      );
      expect(blockedResult.allowed).toBe(false);
    });

    it('should evaluate time-based conditions', async () => {
      const futureDate = new Date('2030-01-01');
      const testDate = new Date('2029-01-01');
      const consent = TestFactories.consent({
        status: 'granted',
        expiresAt: new Date('2030-12-31'),
      });

      mockPrisma.consent.findMany.mockResolvedValue([
        {
          ...consent,
          purposes: [{ purpose: { name: 'marketing' } }],
          conditions: [
            {
              conditionType: 'time',
              operator: 'less_than',
              field: 'timestamp',
              value: futureDate,
            },
          ],
        },
      ]);

      const result = await consentService.checkConsent(
        'tenant-123',
        'user-123',
        'policy-123',
        'marketing',
        { timestamp: testDate }
      );

      expect(result.allowed).toBe(true);
    });

    it('should deny when conditions not met', async () => {
      const consent = TestFactories.consent({
        status: 'granted',
        expiresAt: new Date('2030-01-01'),
      });

      mockPrisma.consent.findMany.mockResolvedValue([
        {
          ...consent,
          purposes: [{ purpose: { name: 'marketing' } }],
          conditions: [
            {
              conditionType: 'device',
              operator: 'equals',
              field: 'type',
              value: 'mobile',
            },
          ],
        },
      ]);

      const result = await consentService.checkConsent(
        'tenant-123',
        'user-123',
        'policy-123',
        'marketing',
        { device: { type: 'desktop' } }
      );

      expect(result.allowed).toBe(false);
    });
  });

  describe('getSubjectConsents', () => {
    it('should return active consents only by default', async () => {
      const policy = TestFactories.policy();
      const consent1 = TestFactories.consent({
        id: 'consent-1',
        status: 'granted',
        expiresAt: new Date('2030-01-01'),
      });
      const consent2 = TestFactories.consent({
        id: 'consent-2',
        status: 'granted',
        expiresAt: null,
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.consent.findMany.mockResolvedValue([consent1, consent2]);
      mockPrisma.consent.findUnique
        .mockResolvedValueOnce({ ...consent1, policy, purposes: [], conditions: [] })
        .mockResolvedValueOnce({ ...consent2, policy, purposes: [], conditions: [] });

      const result = await consentService.getSubjectConsents('tenant-123', 'user-123');

      expect(result).toHaveLength(2);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should include expired consents when requested', async () => {
      const policy = TestFactories.policy();
      const activeConsent = TestFactories.consent({
        id: 'consent-1',
        status: 'granted',
        expiresAt: new Date('2030-01-01'),
      });
      const expiredConsent = TestFactories.consent({
        id: 'consent-2',
        status: 'granted',
        expiresAt: new Date('2020-01-01'),
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.consent.findMany.mockResolvedValue([activeConsent, expiredConsent]);
      mockPrisma.consent.findUnique
        .mockResolvedValueOnce({ ...activeConsent, policy, purposes: [], conditions: [] })
        .mockResolvedValueOnce({ ...expiredConsent, policy, purposes: [], conditions: [] });

      const result = await consentService.getSubjectConsents('tenant-123', 'user-123', {
        includeExpired: true,
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('getConsentHistory', () => {
    it('should return consent history events', async () => {
      const events = [
        {
          id: 'event-1',
          tenantId: 'tenant-123',
          eventType: 'ConsentGranted',
          eventData: {
            consentId: 'consent-123',
            subjectId: 'user-123',
            purposes: ['marketing'],
          },
          timestamp: new Date('2025-01-01'),
        },
        {
          id: 'event-2',
          tenantId: 'tenant-123',
          eventType: 'ConsentRevoked',
          eventData: {
            consentId: 'consent-123',
            subjectId: 'user-123',
          },
          timestamp: new Date('2025-06-01'),
        },
      ];

      const consent = TestFactories.consent({
        id: 'consent-123',
        policy: TestFactories.policy({ name: 'Privacy Policy' }),
      });

      mockPrisma.eventLog.findMany.mockResolvedValue(events);
      mockPrisma.consent.findUnique.mockResolvedValue(consent);

      const result = await consentService.getConsentHistory('tenant-123', 'user-123');

      expect(result).toHaveLength(2);
      expect(result[0].action).toBe('granted');
      expect(result[1].action).toBe('revoked');
      expect(result[0].policyName).toBe('Privacy Policy');
    });
  });

  describe('expireOldConsents', () => {
    it('should expire old consents', async () => {
      const expiredConsent = TestFactories.consent({
        status: 'granted',
        expiresAt: new Date('2020-01-01'),
      });

      mockPrisma.consent.findMany.mockResolvedValue([expiredConsent]);
      mockPrisma.consent.update.mockResolvedValue({
        ...expiredConsent,
        status: 'expired',
      });

      const count = await consentService.expireOldConsents();

      expect(count).toBe(1);
      expect(mockPrisma.consent.update).toHaveBeenCalledWith({
        where: { id: expiredConsent.id },
        data: { status: 'expired' },
      });
      expect(mockEventStore.appendEvents).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalled();
    });
  });

  describe('getExpiringConsents', () => {
    it('should return consents expiring within specified days', async () => {
      const policy = TestFactories.policy();
      const expiringConsent = TestFactories.consent({
        id: 'consent-1',
        status: 'granted',
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.consent.findMany.mockResolvedValue([expiringConsent]);
      mockPrisma.consent.findUnique.mockResolvedValue({
        ...expiringConsent,
        policy,
        purposes: [],
        conditions: [],
      });

      const result = await consentService.getExpiringConsents('tenant-123', 30);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('consent-1');
    });
  });
});
