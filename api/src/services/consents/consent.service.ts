import { prisma } from '../../db/client.js';
import { cacheManager } from '../../cache/cache-manager.js';
import { eventStore } from '../../event-sourcing/event-store.js';
import { ConsentGranted, ConsentRevoked, ConsentExpired, ConsentRenewed } from '../../event-sourcing/domain-event.js';
import { ConsentRepository } from '../../repositories/consent.repository.js';
import { tenantService } from '../tenants/tenant.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Granular Consent Management Service
 *
 * Features:
 * - Purpose-based consent
 * - Conditional consent (context-aware)
 * - Time-limited consent
 * - Geographic restrictions
 * - Consent history and audit trail
 * - Consent withdrawal and renewal
 */

export interface CreateConsentRequest {
  tenantId: string;
  policyId: string;
  subjectId: string;
  subjectType: 'user' | 'device' | 'organization';
  purposes: string[];
  dataTypes: string[];
  consentMethod: 'explicit' | 'implicit' | 'opt-in' | 'opt-out';
  expiresAt?: Date;
  conditions?: ConsentCondition[];
  geographicRestrictions?: {
    allowedCountries?: string[];
    blockedCountries?: string[];
  };
  metadata?: Record<string, any>;
}

export interface ConsentCondition {
  type: 'time' | 'location' | 'device' | 'context';
  operator: 'equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  field: string;
  value: any;
}

export interface ConsentWithDetails {
  id: string;
  tenantId: string;
  policyId: string;
  policyName: string;
  subjectId: string;
  subjectType: string;
  purposes: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  dataTypes: string[];
  consentMethod: string;
  status: string;
  grantedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  conditions: ConsentCondition[];
  geographicRestrictions: {
    allowedCountries: string[];
    blockedCountries: string[];
  } | null;
  metadata: Record<string, any>;
  isActive: boolean;
  canBeUsed: boolean;
}

export interface ConsentCheckContext {
  timestamp?: Date;
  location?: {
    country?: string;
    region?: string;
    coordinates?: { lat: number; lon: number };
  };
  device?: {
    type?: string;
    id?: string;
  };
  additionalContext?: Record<string, any>;
}

export class ConsentService {
  private consentRepository: ConsentRepository;

  constructor() {
    this.consentRepository = new ConsentRepository('');
  }

  /**
   * Grant consent
   */
  async grantConsent(request: CreateConsentRequest, userId: string): Promise<ConsentWithDetails> {
    // Check tenant quota
    const quota = await tenantService.checkQuota(request.tenantId, 'consents');
    if (!quota.allowed) {
      throw new Error(`Consent quota exceeded. Maximum: ${quota.max}, Current: ${quota.current}`);
    }

    // Verify policy exists
    const policy = await prisma.policy.findUnique({
      where: { id: request.policyId },
    });

    if (!policy) {
      throw new Error('Policy not found');
    }

    // Check if there's an existing active consent
    const existing = await prisma.consent.findFirst({
      where: {
        tenantId: request.tenantId,
        policyId: request.policyId,
        subjectId: request.subjectId,
        status: 'granted',
      },
    });

    if (existing) {
      throw new Error('Active consent already exists for this subject and policy');
    }

    // Create consent
    const consentId = uuidv4();
    const consent = await prisma.consent.create({
      data: {
        id: consentId,
        tenantId: request.tenantId,
        policyId: request.policyId,
        subjectId: request.subjectId,
        subjectType: request.subjectType,
        dataTypes: request.dataTypes,
        consentMethod: request.consentMethod,
        status: 'granted',
        grantedAt: new Date(),
        expiresAt: request.expiresAt || null,
        metadata: request.metadata || {},
      },
    });

    // Create purpose mappings
    for (const purposeName of request.purposes) {
      // Get or create purpose
      let purpose = await prisma.consentPurpose.findFirst({
        where: {
          tenantId: request.tenantId,
          name: purposeName,
        },
      });

      if (!purpose) {
        purpose = await prisma.consentPurpose.create({
          data: {
            tenantId: request.tenantId,
            name: purposeName,
            description: purposeName,
          },
        });
      }

      // Map purpose to consent
      await prisma.consentPurposeMapping.create({
        data: {
          consentId: consent.id,
          purposeId: purpose.id,
        },
      });
    }

    // Create conditions if provided
    if (request.conditions && request.conditions.length > 0) {
      for (const condition of request.conditions) {
        await prisma.consentCondition.create({
          data: {
            consentId: consent.id,
            conditionType: condition.type,
            operator: condition.operator,
            field: condition.field,
            value: condition.value,
          },
        });
      }
    }

    // Store geographic restrictions in metadata if provided
    if (request.geographicRestrictions) {
      await prisma.consent.update({
        where: { id: consent.id },
        data: {
          metadata: {
            ...consent.metadata as object,
            geographicRestrictions: request.geographicRestrictions,
          },
        },
      });
    }

    // Create domain event
    const event = new ConsentGranted({
      aggregateId: consent.id,
      tenantId: consent.tenantId,
      version: 1,
      data: {
        consentId: consent.id,
        policyId: consent.policyId,
        subjectId: consent.subjectId,
        purposes: request.purposes,
        userId,
      },
    });

    await eventStore.appendEvents([event]);

    // Increment tenant usage
    await tenantService.incrementUsage(request.tenantId, 'consents');

    return await this.getConsentById(consent.id);
  }

  /**
   * Get consent by ID
   */
  async getConsentById(consentId: string): Promise<ConsentWithDetails> {
    // Check cache first
    const cached = await cacheManager.get<ConsentWithDetails>(
      `consent:${consentId}`,
      { prefix: 'consents', ttl: 3600 }
    );
    if (cached) {
      return cached;
    }

    const consent = await prisma.consent.findUnique({
      where: { id: consentId },
      include: {
        policy: true,
        purposes: {
          include: {
            purpose: true,
          },
        },
        conditions: true,
      },
    });

    if (!consent) {
      throw new Error('Consent not found');
    }

    const metadata = consent.metadata as any;
    const geographicRestrictions = metadata?.geographicRestrictions || null;

    const isExpired = consent.expiresAt ? new Date() > consent.expiresAt : false;
    const isActive = consent.status === 'granted' && !isExpired;

    const consentWithDetails: ConsentWithDetails = {
      id: consent.id,
      tenantId: consent.tenantId,
      policyId: consent.policyId,
      policyName: consent.policy.name,
      subjectId: consent.subjectId,
      subjectType: consent.subjectType,
      purposes: consent.purposes.map(p => ({
        id: p.purpose.id,
        name: p.purpose.name,
        description: p.purpose.description || '',
      })),
      dataTypes: consent.dataTypes as string[],
      consentMethod: consent.consentMethod,
      status: consent.status,
      grantedAt: consent.grantedAt,
      expiresAt: consent.expiresAt,
      revokedAt: consent.revokedAt,
      conditions: consent.conditions.map(c => ({
        type: c.conditionType as any,
        operator: c.operator as any,
        field: c.field,
        value: c.value,
      })),
      geographicRestrictions,
      metadata: metadata || {},
      isActive,
      canBeUsed: isActive,
    };

    // Cache the consent
    await cacheManager.set(
      `consent:${consentId}`,
      consentWithDetails,
      { prefix: 'consents', ttl: 3600 }
    );

    return consentWithDetails;
  }

  /**
   * Revoke consent
   */
  async revokeConsent(consentId: string, userId: string, reason?: string): Promise<void> {
    const consent = await prisma.consent.findUnique({
      where: { id: consentId },
    });

    if (!consent) {
      throw new Error('Consent not found');
    }

    if (consent.status !== 'granted') {
      throw new Error('Consent is not active');
    }

    // Update consent status
    await prisma.consent.update({
      where: { id: consentId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        metadata: {
          ...consent.metadata as object,
          revocationReason: reason || 'User requested',
          revokedBy: userId,
        },
      },
    });

    // Create domain event
    const event = new ConsentRevoked({
      aggregateId: consent.id,
      tenantId: consent.tenantId,
      version: 2,
      data: {
        consentId: consent.id,
        reason,
        userId,
      },
    });

    await eventStore.appendEvents([event]);

    // Invalidate cache
    await cacheManager.delete(`consent:${consentId}`, { prefix: 'consents' });
    await cacheManager.deletePattern(`subject:${consent.subjectId}:*`, { prefix: 'consents' });
  }

  /**
   * Renew consent
   */
  async renewConsent(consentId: string, newExpiresAt: Date, userId: string): Promise<ConsentWithDetails> {
    const consent = await prisma.consent.findUnique({
      where: { id: consentId },
    });

    if (!consent) {
      throw new Error('Consent not found');
    }

    // Update expiry date
    await prisma.consent.update({
      where: { id: consentId },
      data: {
        expiresAt: newExpiresAt,
        status: 'granted',
        metadata: {
          ...consent.metadata as object,
          renewedAt: new Date(),
          renewedBy: userId,
        },
      },
    });

    // Create domain event
    const event = new ConsentRenewed({
      aggregateId: consent.id,
      tenantId: consent.tenantId,
      version: consent.status === 'expired' ? 3 : 2,
      data: {
        consentId: consent.id,
        newExpiresAt,
        userId,
      },
    });

    await eventStore.appendEvents([event]);

    // Invalidate cache
    await cacheManager.delete(`consent:${consentId}`, { prefix: 'consents' });

    return await this.getConsentById(consentId);
  }

  /**
   * Check if consent is valid for a specific purpose and context
   */
  async checkConsent(
    tenantId: string,
    subjectId: string,
    policyId: string,
    purpose: string,
    context?: ConsentCheckContext
  ): Promise<{ allowed: boolean; reason?: string; consentId?: string }> {
    // Get active consents for subject and policy
    const consents = await prisma.consent.findMany({
      where: {
        tenantId,
        subjectId,
        policyId,
        status: 'granted',
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      include: {
        purposes: {
          include: {
            purpose: true,
          },
        },
        conditions: true,
      },
    });

    if (consents.length === 0) {
      return {
        allowed: false,
        reason: 'No active consent found',
      };
    }

    // Check each consent
    for (const consent of consents) {
      // Check if consent covers the requested purpose
      const hasPurpose = consent.purposes.some(p => p.purpose.name === purpose);
      if (!hasPurpose) {
        continue;
      }

      // Check geographic restrictions
      if (context?.location?.country) {
        const metadata = consent.metadata as any;
        const geoRestrictions = metadata?.geographicRestrictions;

        if (geoRestrictions) {
          if (geoRestrictions.allowedCountries && geoRestrictions.allowedCountries.length > 0) {
            if (!geoRestrictions.allowedCountries.includes(context.location.country)) {
              continue; // Country not allowed
            }
          }

          if (geoRestrictions.blockedCountries && geoRestrictions.blockedCountries.length > 0) {
            if (geoRestrictions.blockedCountries.includes(context.location.country)) {
              continue; // Country is blocked
            }
          }
        }
      }

      // Check conditions
      if (consent.conditions.length > 0) {
        const conditionsMet = this.evaluateConditions(consent.conditions, context);
        if (!conditionsMet) {
          continue;
        }
      }

      // All checks passed
      return {
        allowed: true,
        consentId: consent.id,
      };
    }

    return {
      allowed: false,
      reason: 'No consent matches the requested purpose and context',
    };
  }

  /**
   * Evaluate consent conditions against context
   */
  private evaluateConditions(conditions: any[], context?: ConsentCheckContext): boolean {
    if (!context) {
      return false; // Cannot evaluate conditions without context
    }

    for (const condition of conditions) {
      let actualValue: any;

      // Extract actual value from context based on condition type
      switch (condition.conditionType) {
        case 'time':
          actualValue = context.timestamp || new Date();
          break;
        case 'location':
          actualValue = context.location?.[condition.field];
          break;
        case 'device':
          actualValue = context.device?.[condition.field];
          break;
        case 'context':
          actualValue = context.additionalContext?.[condition.field];
          break;
        default:
          return false;
      }

      // Evaluate based on operator
      const conditionMet = this.evaluateOperator(
        condition.operator,
        actualValue,
        condition.value
      );

      if (!conditionMet) {
        return false;
      }
    }

    return true; // All conditions met
  }

  /**
   * Evaluate a single condition operator
   */
  private evaluateOperator(operator: string, actualValue: any, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'contains':
        return String(actualValue).includes(String(expectedValue));
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
      case 'greater_than':
        return actualValue > expectedValue;
      case 'less_than':
        return actualValue < expectedValue;
      default:
        return false;
    }
  }

  /**
   * Get all active consents for a subject
   */
  async getSubjectConsents(
    tenantId: string,
    subjectId: string,
    options: {
      includeExpired?: boolean;
      includeRevoked?: boolean;
    } = {}
  ): Promise<ConsentWithDetails[]> {
    // Check cache first
    const cacheKey = `subject:${subjectId}:consents:${options.includeExpired}:${options.includeRevoked}`;
    const cached = await cacheManager.get<ConsentWithDetails[]>(
      cacheKey,
      { prefix: 'consents', ttl: 1800 }
    );
    if (cached) {
      return cached;
    }

    const where: any = {
      tenantId,
      subjectId,
    };

    if (!options.includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ];
    }

    if (!options.includeRevoked) {
      where.status = { not: 'revoked' };
    }

    const consents = await prisma.consent.findMany({
      where,
      orderBy: { grantedAt: 'desc' },
    });

    const consentsWithDetails = await Promise.all(
      consents.map(c => this.getConsentById(c.id))
    );

    // Cache the results
    await cacheManager.set(
      cacheKey,
      consentsWithDetails,
      { prefix: 'consents', ttl: 1800 }
    );

    return consentsWithDetails;
  }

  /**
   * Get consent history for a subject
   */
  async getConsentHistory(
    tenantId: string,
    subjectId: string
  ): Promise<Array<{
    consentId: string;
    policyName: string;
    action: 'granted' | 'revoked' | 'renewed' | 'expired';
    timestamp: Date;
    purposes: string[];
  }>> {
    // Get all events for this subject
    const events = await prisma.eventLog.findMany({
      where: {
        tenantId,
        eventType: { in: ['ConsentGranted', 'ConsentRevoked', 'ConsentRenewed', 'ConsentExpired'] },
        eventData: { path: ['subjectId'], equals: subjectId },
      },
      orderBy: { timestamp: 'desc' },
    });

    const history = await Promise.all(
      events.map(async (event) => {
        const eventData = event.eventData as any;
        const consent = await prisma.consent.findUnique({
          where: { id: eventData.consentId },
          include: { policy: true },
        });

        let action: 'granted' | 'revoked' | 'renewed' | 'expired';
        switch (event.eventType) {
          case 'ConsentGranted':
            action = 'granted';
            break;
          case 'ConsentRevoked':
            action = 'revoked';
            break;
          case 'ConsentRenewed':
            action = 'renewed';
            break;
          case 'ConsentExpired':
            action = 'expired';
            break;
          default:
            action = 'granted';
        }

        return {
          consentId: eventData.consentId,
          policyName: consent?.policy.name || 'Unknown',
          action,
          timestamp: event.timestamp,
          purposes: eventData.purposes || [],
        };
      })
    );

    return history;
  }

  /**
   * Expire old consents (background job)
   */
  async expireOldConsents(): Promise<number> {
    const expiredConsents = await prisma.consent.findMany({
      where: {
        status: 'granted',
        expiresAt: { lt: new Date() },
      },
    });

    for (const consent of expiredConsents) {
      await prisma.consent.update({
        where: { id: consent.id },
        data: { status: 'expired' },
      });

      // Create domain event
      const event = new ConsentExpired({
        aggregateId: consent.id,
        tenantId: consent.tenantId,
        version: 3,
        data: {
          consentId: consent.id,
          expiredAt: new Date(),
        },
      });

      await eventStore.appendEvents([event]);

      // Invalidate cache
      await cacheManager.delete(`consent:${consent.id}`, { prefix: 'consents' });
    }

    return expiredConsents.length;
  }

  /**
   * Get consents expiring soon
   */
  async getExpiringConsents(tenantId: string, daysAhead: number = 30): Promise<ConsentWithDetails[]> {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysAhead);

    const consents = await prisma.consent.findMany({
      where: {
        tenantId,
        status: 'granted',
        expiresAt: {
          gte: new Date(),
          lte: expiryThreshold,
        },
      },
      orderBy: { expiresAt: 'asc' },
    });

    return await Promise.all(
      consents.map(c => this.getConsentById(c.id))
    );
  }
}

export const consentService = new ConsentService();
