/**
 * Policy Service Tests
 *
 * Comprehensive tests for policy management including:
 * - CRUD operations with quota enforcement
 * - Version management and diffing
 * - Compliance checking (GDPR, CCPA, PIPEDA)
 * - Template-based policy creation
 * - Search and filtering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TestFactories from '../../../test/helpers/factories.js';

// Mock dependencies - must be at top level
vi.mock('../../../db/client.js');
vi.mock('../../../cache/cache-manager.js');
vi.mock('../../../event-sourcing/event-store.js');
vi.mock('../../tenants/tenant.service.js');
vi.mock('../../../event-sourcing/domain-event.js', () => ({
  PolicyCreated: vi.fn().mockImplementation((data) => ({
    eventType: 'PolicyCreated',
    ...data,
  })),
  PolicyUpdated: vi.fn().mockImplementation((data) => ({
    eventType: 'PolicyUpdated',
    ...data,
  })),
  PolicyVersioned: vi.fn().mockImplementation((data) => ({
    eventType: 'PolicyVersioned',
    ...data,
  })),
  PolicyArchived: vi.fn().mockImplementation((data) => ({
    eventType: 'PolicyArchived',
    ...data,
  })),
}));

import { PolicyService } from '../policy.service.js';

describe('PolicyService', () => {
  let policyService: PolicyService;
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
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    };
    mockPrisma.policyVersion = {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    };
    mockPrisma.policyTemplate = {
      findUnique: vi.fn(),
    };

    mockCache.get = vi.fn().mockResolvedValue(null);
    mockCache.set = vi.fn().mockResolvedValue(undefined);
    mockCache.delete = vi.fn().mockResolvedValue(undefined);

    mockEventStore.appendEvents = vi.fn().mockResolvedValue(undefined);

    mockTenantService.checkQuota = vi.fn().mockResolvedValue({ allowed: true, max: 1000, current: 10 });
    mockTenantService.incrementUsage = vi.fn().mockResolvedValue(undefined);

    policyService = new PolicyService();
  });

  describe('createPolicy', () => {
    it('should create a policy successfully', async () => {
      const request = {
        tenantId: 'tenant-123',
        name: 'Privacy Policy',
        description: 'Our privacy policy',
        policyText: 'We collect data with consent. You have the right to access, right to erasure, right to portability. Lawful basis: consent.',
        jurisdiction: 'EU',
        category: 'privacy',
        dataTypes: ['name', 'email'],
        purposes: ['marketing', 'analytics'],
        retentionPeriod: 365,
      };

      const createdPolicy = TestFactories.policy({
        ...request,
        id: 'policy-123',
        status: 'draft',
        version: 1,
      });

      mockPrisma.policy.create.mockResolvedValue(createdPolicy);
      mockPrisma.policyVersion.create.mockResolvedValue({});
      mockPrisma.policy.findUnique.mockResolvedValue({
        ...createdPolicy,
        children: [],
      });

      const result = await policyService.createPolicy(request, 'user-123');

      expect(result).toBeDefined();
      expect(result.name).toBe('Privacy Policy');
      expect(result.version).toBe(1);
      expect(result.status).toBe('draft');
      expect(mockPrisma.policyVersion.create).toHaveBeenCalled();
      expect(mockEventStore.appendEvents).toHaveBeenCalled();
      expect(mockTenantService.incrementUsage).toHaveBeenCalledWith('tenant-123', 'policies');
    });

    it('should throw error when quota exceeded', async () => {
      mockTenantService.checkQuota.mockResolvedValue({ allowed: false, max: 100, current: 100 });

      const request = {
        tenantId: 'tenant-123',
        name: 'Policy',
        description: 'Desc',
        policyText: 'Text',
        jurisdiction: 'US',
        category: 'privacy',
        dataTypes: ['email'],
        purposes: ['marketing'],
      };

      await expect(
        policyService.createPolicy(request, 'user-123')
      ).rejects.toThrow('Policy quota exceeded');
    });

    it('should create policy with template data', async () => {
      const templateData = {
        policyText: 'Template policy text',
        dataTypes: ['name', 'email', 'phone'],
        purposes: ['service_delivery'],
        metadata: { source: 'template' },
      };

      mockPrisma.policyTemplate.findUnique.mockResolvedValue({
        id: 'template-123',
        name: 'GDPR Template',
        templateData,
      });

      const request = {
        tenantId: 'tenant-123',
        name: 'My Policy',
        description: 'Based on template',
        policyText: 'Custom text',
        jurisdiction: 'EU',
        category: 'privacy',
        dataTypes: ['email'],
        purposes: ['marketing'],
        templateId: 'template-123',
      };

      const createdPolicy = TestFactories.policy({ ...request, id: 'policy-123' });
      mockPrisma.policy.create.mockResolvedValue(createdPolicy);
      mockPrisma.policyVersion.create.mockResolvedValue({});
      mockPrisma.policy.findUnique.mockResolvedValue({ ...createdPolicy, children: [] });

      const result = await policyService.createPolicy(request, 'user-123');

      expect(result).toBeDefined();
      // Verify template was used - metadata will have nested template data
      const createCall = mockPrisma.policy.create.mock.calls[0][0];
      expect(createCall.data.templateId).toBe('template-123');
      expect(createCall.data.metadata).toBeDefined();
    });

    it('should create policy with parent policy', async () => {
      const request = {
        tenantId: 'tenant-123',
        name: 'Child Policy',
        description: 'Inherits from parent',
        policyText: 'Text',
        jurisdiction: 'US',
        category: 'privacy',
        dataTypes: ['email'],
        purposes: ['marketing'],
        parentPolicyId: 'parent-policy-123',
      };

      const createdPolicy = TestFactories.policy({ ...request, id: 'policy-123' });
      mockPrisma.policy.create.mockResolvedValue(createdPolicy);
      mockPrisma.policyVersion.create.mockResolvedValue({});
      mockPrisma.policy.findUnique.mockResolvedValue({ ...createdPolicy, children: [] });

      const result = await policyService.createPolicy(request, 'user-123');

      expect(result.parentPolicyId).toBe('parent-policy-123');
    });
  });

  describe('getPolicyById', () => {
    it('should get policy with compliance check', async () => {
      const policy = TestFactories.policy({
        id: 'policy-123',
        policyText: 'We collect data with consent. You have the right to access, right to erasure, right to portability. Lawful basis: consent. Categories of personal information. Do not sell. Right to know. Right to delete. Non-discrimination. Security safeguards. Accurate data.',
        retentionPeriod: 365,
        purposes: ['marketing'],
      });

      mockPrisma.policy.findUnique.mockResolvedValue({ ...policy, children: [] });

      const result = await policyService.getPolicyById('policy-123');

      expect(result).toBeDefined();
      expect(result.compliance).toBeDefined();
      expect(result.compliance.gdprCompliant).toBeDefined();
      expect(result.compliance.ccpaCompliant).toBeDefined();
      expect(result.compliance.pipedaCompliant).toBeDefined();
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return cached policy if available', async () => {
      const cachedPolicy = TestFactories.policy({ id: 'policy-123' });

      mockCache.get.mockResolvedValue(cachedPolicy);

      const result = await policyService.getPolicyById('policy-123');

      expect(result).toEqual(cachedPolicy);
      expect(mockPrisma.policy.findUnique).not.toHaveBeenCalled();
    });

    it('should throw error if policy not found', async () => {
      mockPrisma.policy.findUnique.mockResolvedValue(null);

      await expect(policyService.getPolicyById('non-existent')).rejects.toThrow('Policy not found');
    });
  });

  describe('updatePolicy', () => {
    it('should update policy and create new version', async () => {
      const currentPolicy = TestFactories.policy({
        id: 'policy-123',
        version: 1,
        status: 'draft',
      });

      mockPrisma.policy.findUnique.mockResolvedValue(currentPolicy);
      mockPrisma.policy.update.mockResolvedValue({ ...currentPolicy, version: 2, name: 'Updated Policy' });
      mockPrisma.policyVersion.create.mockResolvedValue({});
      mockPrisma.policy.findUnique.mockResolvedValueOnce(currentPolicy).mockResolvedValueOnce({
        ...currentPolicy,
        version: 2,
        name: 'Updated Policy',
        children: [],
      });

      const result = await policyService.updatePolicy(
        'policy-123',
        { name: 'Updated Policy' },
        'user-123',
        'Updated policy name'
      );

      expect(result.version).toBe(2);
      expect(mockPrisma.policyVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 2,
            changeDescription: 'Updated policy name',
          }),
        })
      );
      expect(mockEventStore.appendEvents).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalledWith('policy:policy-123', { prefix: 'policies' });
    });

    it('should throw error when updating archived policy', async () => {
      const archivedPolicy = TestFactories.policy({
        id: 'policy-123',
        status: 'archived',
      });

      mockPrisma.policy.findUnique.mockResolvedValue(archivedPolicy);

      await expect(
        policyService.updatePolicy('policy-123', { name: 'New Name' }, 'user-123', 'Change')
      ).rejects.toThrow('Cannot update archived policy');
    });

    it('should update multiple fields', async () => {
      const currentPolicy = TestFactories.policy({ id: 'policy-123', version: 1 });

      mockPrisma.policy.findUnique.mockResolvedValue(currentPolicy);
      mockPrisma.policy.update.mockResolvedValue({ ...currentPolicy, version: 2 });
      mockPrisma.policyVersion.create.mockResolvedValue({});
      mockPrisma.policy.findUnique.mockResolvedValueOnce(currentPolicy).mockResolvedValueOnce({
        ...currentPolicy,
        children: [],
      });

      await policyService.updatePolicy(
        'policy-123',
        {
          name: 'New Name',
          description: 'New Description',
          policyText: 'New Text',
          dataTypes: ['phone', 'address'],
          purposes: ['analytics'],
          retentionPeriod: 730,
        },
        'user-123',
        'Major update'
      );

      expect(mockPrisma.policy.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Name',
            description: 'New Description',
            policyText: 'New Text',
            dataTypes: ['phone', 'address'],
            purposes: ['analytics'],
            retentionPeriod: 730,
            version: 2,
          }),
        })
      );
    });
  });

  describe('archivePolicy', () => {
    it('should archive policy successfully', async () => {
      const policy = TestFactories.policy({ id: 'policy-123' });

      mockPrisma.policy.update.mockResolvedValue({ ...policy, status: 'archived' });

      await policyService.archivePolicy('policy-123', 'user-123');

      expect(mockPrisma.policy.update).toHaveBeenCalledWith({
        where: { id: 'policy-123' },
        data: { status: 'archived' },
      });
      expect(mockEventStore.appendEvents).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalled();
    });
  });

  describe('activatePolicy', () => {
    it('should activate policy when compliant', async () => {
      const policy = TestFactories.policy({
        id: 'policy-123',
        policyText: 'Right to access. Right to erasure. Right to portability. Lawful basis: consent. Do not sell. Categories of personal information. Right to know. Right to delete. Non-discrimination. Consent mechanism. Necessary data. Accurate. Security safeguards. Access to information.',
        retentionPeriod: 365,
        purposes: ['marketing'],
      });

      mockPrisma.policy.findUnique.mockResolvedValue(policy);
      mockPrisma.policy.update.mockResolvedValue({ ...policy, status: 'active' });
      mockPrisma.policy.findUnique.mockResolvedValueOnce(policy).mockResolvedValueOnce({
        ...policy,
        status: 'active',
        children: [],
      });

      const result = await policyService.activatePolicy('policy-123', 'user-123');

      expect(result.status).toBe('active');
      expect(mockPrisma.policy.update).toHaveBeenCalledWith({
        where: { id: 'policy-123' },
        data: { status: 'active' },
      });
    });

    it('should throw error when policy has compliance issues', async () => {
      const policy = TestFactories.policy({
        id: 'policy-123',
        policyText: 'Incomplete policy text',
        retentionPeriod: null, // Missing required field for GDPR
        purposes: [],
      });

      mockPrisma.policy.findUnique.mockResolvedValue(policy);

      await expect(
        policyService.activatePolicy('policy-123', 'user-123')
      ).rejects.toThrow('Policy has compliance issues');
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history', async () => {
      const versions = [
        {
          version: 3,
          changeDescription: 'Updated retention period',
          createdAt: new Date('2024-01-03'),
          createdByUser: { name: 'John Doe' },
        },
        {
          version: 2,
          changeDescription: 'Updated data types',
          createdAt: new Date('2024-01-02'),
          createdByUser: { name: 'Jane Smith' },
        },
        {
          version: 1,
          changeDescription: 'Initial version',
          createdAt: new Date('2024-01-01'),
          createdByUser: null,
        },
      ];

      mockPrisma.policyVersion.findMany.mockResolvedValue(versions);

      const result = await policyService.getVersionHistory('policy-123');

      expect(result).toHaveLength(3);
      expect(result[0].version).toBe(3);
      expect(result[0].createdBy).toBe('John Doe');
      expect(result[2].createdBy).toBe('System'); // null user defaults to 'System'
    });

    it('should return empty array for no versions', async () => {
      mockPrisma.policyVersion.findMany.mockResolvedValue([]);

      const result = await policyService.getVersionHistory('policy-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('getPolicyDiff', () => {
    it('should calculate diff between versions', async () => {
      const version1 = {
        policyText: 'Old text',
        dataTypes: ['email'],
        purposes: ['marketing'],
        retentionPeriod: 365,
      };

      const version2 = {
        policyText: 'New text',
        dataTypes: ['email', 'phone'],
        purposes: ['marketing', 'analytics'],
        retentionPeriod: 730,
      };

      mockPrisma.policyVersion.findFirst.mockResolvedValueOnce(version1).mockResolvedValueOnce(version2);

      const result = await policyService.getPolicyDiff('policy-123', 1, 2);

      expect(result.versionFrom).toBe(1);
      expect(result.versionTo).toBe(2);
      expect(result.changes).toHaveLength(4);
      expect(result.changes.some(c => c.field === 'policyText')).toBe(true);
      expect(result.changes.some(c => c.field === 'dataTypes')).toBe(true);
      expect(result.changes.some(c => c.field === 'purposes')).toBe(true);
      expect(result.changes.some(c => c.field === 'retentionPeriod')).toBe(true);
    });

    it('should throw error for non-existent version', async () => {
      mockPrisma.policyVersion.findFirst.mockResolvedValue(null);

      await expect(
        policyService.getPolicyDiff('policy-123', 1, 2)
      ).rejects.toThrow('Version not found');
    });

    it('should return empty changes for identical versions', async () => {
      const versionData = {
        policyText: 'Same text',
        dataTypes: ['email'],
        purposes: ['marketing'],
        retentionPeriod: 365,
      };

      mockPrisma.policyVersion.findFirst.mockResolvedValue(versionData);

      const result = await policyService.getPolicyDiff('policy-123', 1, 2);

      expect(result.changes).toHaveLength(0);
    });
  });

  describe('GDPR Compliance Checking', () => {
    it('should pass GDPR compliance for compliant policy', async () => {
      const policy = TestFactories.policy({
        policyText: 'This policy includes right to access, right to erasure and right to be forgotten, right to portability. Our lawful basis for processing is consent. Contact our data protection officer (DPO).',
        retentionPeriod: 365,
      });

      mockPrisma.policy.findUnique.mockResolvedValue({ ...policy, children: [] });

      const result = await policyService.getPolicyById(policy.id);

      expect(result.compliance.gdprCompliant).toBe(true);
      // Compliance issues array may include recommendations from other frameworks
      // Just verify GDPR is marked as compliant
      expect(result.compliance).toBeDefined();
    });

    it('should fail GDPR compliance for missing rights', async () => {
      const policy = TestFactories.policy({
        policyText: 'Basic policy without required GDPR rights.',
        retentionPeriod: null,
      });

      mockPrisma.policy.findUnique.mockResolvedValue({ ...policy, children: [] });

      const result = await policyService.getPolicyById(policy.id);

      expect(result.compliance.gdprCompliant).toBe(false);
      expect(result.compliance.issues.length).toBeGreaterThan(0);
    });
  });

  describe('CCPA Compliance Checking', () => {
    it('should pass CCPA compliance for compliant policy', async () => {
      const policy = TestFactories.policy({
        policyText: 'Do not sell your personal information. Categories of personal information we collect. Right to know what data we collect. Right to delete your data. Non-discrimination policy.',
        retentionPeriod: 365,
      });

      mockPrisma.policy.findUnique.mockResolvedValue({ ...policy, children: [] });

      const result = await policyService.getPolicyById(policy.id);

      expect(result.compliance.ccpaCompliant).toBe(true);
    });

    it('should fail CCPA compliance for missing disclosures', async () => {
      const policy = TestFactories.policy({
        policyText: 'Basic California privacy policy.',
        retentionPeriod: 365,
      });

      mockPrisma.policy.findUnique.mockResolvedValue({ ...policy, children: [] });

      const result = await policyService.getPolicyById(policy.id);

      expect(result.compliance.ccpaCompliant).toBe(false);
      expect(result.compliance.issues.some(i => i.includes('Do Not Sell'))).toBe(true);
    });
  });

  describe('PIPEDA Compliance Checking', () => {
    it('should pass PIPEDA compliance for compliant policy', async () => {
      const policy = TestFactories.policy({
        policyText: 'We obtain your consent for data collection. We collect only necessary information that is limited to our purposes. We maintain accurate records with security safeguards. You have access to your information.',
        purposes: ['service_delivery', 'customer_support'],
        retentionPeriod: 365,
      });

      mockPrisma.policy.findUnique.mockResolvedValue({ ...policy, children: [] });

      const result = await policyService.getPolicyById(policy.id);

      expect(result.compliance.pipedaCompliant).toBe(true);
    });

    it('should fail PIPEDA compliance for missing consent mechanism', async () => {
      const policy = TestFactories.policy({
        policyText: 'We collect your data for various purposes.',
        purposes: [],
        retentionPeriod: 365,
      });

      mockPrisma.policy.findUnique.mockResolvedValue({ ...policy, children: [] });

      const result = await policyService.getPolicyById(policy.id);

      expect(result.compliance.pipedaCompliant).toBe(false);
      expect(result.compliance.issues.some(i => i.includes('consent'))).toBe(true);
    });
  });

  describe('createFromTemplate', () => {
    it('should create policy from template', async () => {
      const template = {
        id: 'template-123',
        name: 'GDPR Privacy Policy Template',
        description: 'Standard GDPR template',
        jurisdiction: 'EU',
        category: 'privacy',
        templateData: {
          policyText: 'Template: We process data with consent...',
          dataTypes: ['name', 'email'],
          purposes: ['service_delivery'],
          retentionPeriod: 365,
          metadata: { source: 'template' },
        },
      };

      mockPrisma.policyTemplate.findUnique.mockResolvedValue(template);

      const createdPolicy = TestFactories.policy({
        id: 'policy-123',
        name: 'My Custom Policy',
        templateId: 'template-123',
        retentionPeriod: 730,
      });
      mockPrisma.policy.create.mockResolvedValue(createdPolicy);
      mockPrisma.policyVersion.create.mockResolvedValue({});
      mockPrisma.policy.findUnique.mockResolvedValue({ ...createdPolicy, children: [] });

      const result = await policyService.createFromTemplate(
        'tenant-123',
        'template-123',
        'user-123',
        {
          name: 'My Custom Policy',
          retentionPeriod: 730,
        }
      );

      expect(result.name).toBe('My Custom Policy');
      expect(result.templateId).toBe('template-123');
      expect(result.retentionPeriod).toBe(730);
    });

    it('should throw error for non-existent template', async () => {
      mockPrisma.policyTemplate.findUnique.mockResolvedValue(null);

      await expect(
        policyService.createFromTemplate('tenant-123', 'invalid-template', 'user-123')
      ).rejects.toThrow('Template not found');
    });
  });

  describe('searchPolicies', () => {
    it('should search policies by text query', async () => {
      const policies = [
        TestFactories.policy({ id: 'policy-1', name: 'Privacy Policy' }),
        TestFactories.policy({ id: 'policy-2', name: 'Cookie Policy' }),
      ];

      mockPrisma.policy.findMany.mockResolvedValue(policies);
      mockPrisma.policy.count.mockResolvedValue(2);
      mockPrisma.policy.findUnique.mockImplementation((args: any) => {
        const policy = policies.find(p => p.id === args.where.id);
        return Promise.resolve(policy ? { ...policy, children: [] } : null);
      });

      const result = await policyService.searchPolicies('tenant-123', {
        query: 'privacy',
      });

      expect(result.total).toBe(2);
      expect(result.policies.length).toBeGreaterThan(0);
    });

    it('should filter policies by jurisdiction', async () => {
      const policies = [TestFactories.policy({ jurisdiction: 'EU' })];

      mockPrisma.policy.findMany.mockResolvedValue(policies);
      mockPrisma.policy.count.mockResolvedValue(1);
      mockPrisma.policy.findUnique.mockResolvedValue({ ...policies[0], children: [] });

      await policyService.searchPolicies('tenant-123', {
        jurisdiction: 'EU',
      });

      expect(mockPrisma.policy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jurisdiction: 'EU',
          }),
        })
      );
    });

    it('should filter policies by category', async () => {
      mockPrisma.policy.findMany.mockResolvedValue([]);
      mockPrisma.policy.count.mockResolvedValue(0);

      await policyService.searchPolicies('tenant-123', {
        category: 'privacy',
      });

      expect(mockPrisma.policy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'privacy',
          }),
        })
      );
    });

    it('should filter policies by status', async () => {
      mockPrisma.policy.findMany.mockResolvedValue([]);
      mockPrisma.policy.count.mockResolvedValue(0);

      await policyService.searchPolicies('tenant-123', {
        status: 'active',
      });

      expect(mockPrisma.policy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
          }),
        })
      );
    });

    it('should support pagination', async () => {
      mockPrisma.policy.findMany.mockResolvedValue([]);
      mockPrisma.policy.count.mockResolvedValue(100);

      const result = await policyService.searchPolicies('tenant-123', {
        limit: 10,
        offset: 20,
      });

      expect(mockPrisma.policy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
      expect(result.total).toBe(100);
    });
  });
});
