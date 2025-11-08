import { Consent, Prisma } from '@prisma/client';
import { TenantScopedRepository } from './base.repository.js';
import { prisma } from '../db/client.js';
import { TransactionClient } from '../db/transaction.js';

export class ConsentRepository extends TenantScopedRepository<
  Consent,
  Prisma.ConsentCreateInput,
  Prisma.ConsentUpdateInput
> {
  constructor(tenantId: string) {
    super('Consent', tenantId);
  }

  protected getDelegate() {
    return prisma.consent;
  }

  protected getDelegateFromTx(tx: TransactionClient) {
    return tx.consent;
  }

  /**
   * Find consents by subject ID
   */
  async findBySubjectId(subjectId: string, tx?: TransactionClient): Promise<Consent[]> {
    return await this.findMany({
      where: { subjectId },
      orderBy: { timestamp: 'desc' },
      include: {
        policyVersion: {
          include: {
            policy: true,
          },
        },
        purposeMappings: {
          include: {
            purpose: true,
          },
        },
        consentConditions: true,
      },
    }, tx);
  }

  /**
   * Find active consents for a subject
   */
  async findActiveConsentsBySubject(subjectId: string, tx?: TransactionClient): Promise<Consent[]> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.findMany({
      where: {
        tenantId: this.tenantId,
        subjectId,
        eventType: 'granted',
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } },
        ],
      },
      include: {
        policyVersion: {
          include: {
            policy: true,
          },
        },
        purposeMappings: {
          where: {
            revokedAt: null,
          },
          include: {
            purpose: true,
          },
        },
      },
    });
  }

  /**
   * Find consents by policy version
   */
  async findByPolicyVersion(policyVersionId: string, tx?: TransactionClient): Promise<Consent[]> {
    return await this.findMany({
      where: { policyVersionId },
      orderBy: { timestamp: 'desc' },
    }, tx);
  }

  /**
   * Find expiring consents (within next N days)
   */
  async findExpiringConsents(daysAhead: number = 30, tx?: TransactionClient): Promise<Consent[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.findMany({
      where: {
        tenantId: this.tenantId,
        eventType: 'granted',
        expiryDate: {
          gte: new Date(),
          lte: futureDate,
        },
      },
      include: {
        policyVersion: {
          include: {
            policy: true,
          },
        },
      },
    });
  }

  /**
   * Check if subject has active consent for a policy
   */
  async hasActiveConsent(
    subjectId: string,
    policyVersionId: string,
    tx?: TransactionClient
  ): Promise<boolean> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    const count = await delegate.count({
      where: {
        tenantId: this.tenantId,
        subjectId,
        policyVersionId,
        eventType: 'granted',
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } },
        ],
      },
    });
    return count > 0;
  }

  /**
   * Get consent history for a subject and policy
   */
  async getConsentHistory(
    subjectId: string,
    policyId: string,
    tx?: TransactionClient
  ): Promise<Consent[]> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.findMany({
      where: {
        tenantId: this.tenantId,
        subjectId,
        policyVersion: {
          policy: {
            policyId,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
      include: {
        policyVersion: {
          include: {
            policy: true,
          },
        },
      },
    });
  }
}
