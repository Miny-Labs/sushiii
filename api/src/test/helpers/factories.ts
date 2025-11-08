/**
 * Test Data Factories
 *
 * Generate test data for use in tests
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const TestFactories = {
  /**
   * Create a test tenant
   */
  tenant(overrides: Partial<any> = {}) {
    return {
      id: uuidv4(),
      name: 'Test Tenant',
      slug: 'test-tenant',
      apiKey: `sk_test_${crypto.randomBytes(16).toString('hex')}`,
      status: 'active',
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create a test user
   */
  user(overrides: Partial<any> = {}) {
    return {
      id: uuidv4(),
      tenantId: overrides.tenantId || uuidv4(),
      email: overrides.email || `test${Date.now()}@example.com`,
      name: 'Test User',
      passwordHash: '$2b$12$dummyHashForTesting', // Dummy bcrypt hash
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      ...overrides,
    };
  },

  /**
   * Create a test role
   */
  role(overrides: Partial<any> = {}) {
    return {
      id: uuidv4(),
      tenantId: overrides.tenantId || null,
      name: overrides.name || 'TEST_ROLE',
      description: 'Test Role',
      permissions: ['policy:read', 'consent:read'],
      isSystemRole: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create a test policy
   */
  policy(overrides: Partial<any> = {}) {
    return {
      id: uuidv4(),
      tenantId: overrides.tenantId || uuidv4(),
      name: 'Test Policy',
      description: 'A test privacy policy',
      policyText: 'This is a test policy for data collection and usage...',
      jurisdiction: 'US',
      category: 'privacy',
      dataTypes: ['name', 'email'],
      purposes: ['service_delivery', 'analytics'],
      retentionPeriod: 365,
      status: 'draft',
      version: 1,
      parentPolicyId: null,
      templateId: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create a test consent
   */
  consent(overrides: Partial<any> = {}) {
    return {
      id: uuidv4(),
      tenantId: overrides.tenantId || uuidv4(),
      policyId: overrides.policyId || uuidv4(),
      subjectId: overrides.subjectId || 'user@example.com',
      subjectType: 'user',
      dataTypes: ['name', 'email'],
      consentMethod: 'explicit',
      status: 'granted',
      grantedAt: new Date(),
      expiresAt: null,
      revokedAt: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create a test proof bundle
   */
  proofBundle(overrides: Partial<any> = {}) {
    return {
      id: uuidv4(),
      bundleId: `proof_${uuidv4().replace(/-/g, '')}`,
      tenantId: overrides.tenantId || uuidv4(),
      policyId: overrides.policyId || uuidv4(),
      consentId: overrides.consentId || uuidv4(),
      subjectId: overrides.subjectId || 'user@example.com',
      proofType: 'consent',
      dataHash: crypto.createHash('sha256').update('test data').digest('hex'),
      signature: crypto.randomBytes(64).toString('hex'),
      publicKey: crypto.randomBytes(32).toString('hex'),
      verificationStatus: 'pending',
      bundleSize: 1024,
      expiresAt: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create a test event
   */
  event(overrides: Partial<any> = {}) {
    return {
      id: overrides.id || BigInt(Date.now()),
      tenantId: overrides.tenantId || uuidv4(),
      eventType: overrides.eventType || 'PolicyCreated',
      aggregateId: overrides.aggregateId || uuidv4(),
      aggregateType: overrides.aggregateType || 'Policy',
      eventData: overrides.eventData || { test: 'data' },
      version: overrides.version || 1,
      timestamp: new Date(),
      ...overrides,
    };
  },

  /**
   * Create a JWT payload for testing
   */
  jwtPayload(overrides: Partial<any> = {}) {
    return {
      userId: overrides.userId || uuidv4(),
      tenantId: overrides.tenantId || uuidv4(),
      email: overrides.email || 'test@example.com',
      roles: overrides.roles || ['VIEWER'],
      ...overrides,
    };
  },

  /**
   * Create tenant quota
   */
  tenantQuota(overrides: Partial<any> = {}) {
    return {
      id: uuidv4(),
      tenantId: overrides.tenantId || uuidv4(),
      maxPolicies: 1000,
      maxConsents: 10000,
      maxProofBundles: 5000,
      maxStorageMB: 1024,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create consent purpose
   */
  consentPurpose(overrides: Partial<any> = {}) {
    return {
      id: uuidv4(),
      tenantId: overrides.tenantId || uuidv4(),
      name: overrides.name || 'service_delivery',
      description: 'Purpose for service delivery',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create policy version
   */
  policyVersion(overrides: Partial<any> = {}) {
    return {
      id: uuidv4(),
      policyId: overrides.policyId || uuidv4(),
      version: overrides.version || 1,
      policyText: 'Version 1 of the policy...',
      dataTypes: ['name', 'email'],
      purposes: ['service_delivery'],
      retentionPeriod: 365,
      metadata: {},
      changeDescription: 'Initial version',
      createdBy: overrides.createdBy || uuidv4(),
      createdAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Generate random email
   */
  email() {
    return `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`;
  },

  /**
   * Generate random slug
   */
  slug() {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  },

  /**
   * Generate random hash
   */
  hash() {
    return crypto.randomBytes(32).toString('hex');
  },
};

export default TestFactories;
