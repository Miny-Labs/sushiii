import { Policy, Prisma } from '@prisma/client';
import { TenantScopedRepository } from './base.repository.js';
import { prisma } from '../db/client.js';
import { TransactionClient } from '../db/transaction.js';

export class PolicyRepository extends TenantScopedRepository<
  Policy,
  Prisma.PolicyCreateInput,
  Prisma.PolicyUpdateInput
> {
  constructor(tenantId: string) {
    super('Policy', tenantId);
  }

  protected getDelegate() {
    return prisma.policy;
  }

  protected getDelegateFromTx(tx: TransactionClient) {
    return tx.policy;
  }

  /**
   * Find policy by policy_id (not UUID)
   */
  async findByPolicyId(policyId: string, tx?: TransactionClient): Promise<Policy | null> {
    return await this.findOne({ policy_id: policyId }, tx);
  }

  /**
   * Find policies by jurisdiction
   */
  async findByJurisdiction(jurisdiction: string, tx?: TransactionClient): Promise<Policy[]> {
    return await this.findMany({
      where: { jurisdiction, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    }, tx);
  }

  /**
   * Find child policies (policies that inherit from a parent)
   */
  async findChildPolicies(parentPolicyId: string, tx?: TransactionClient): Promise<Policy[]> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.findMany({
      where: {
        tenantId: this.tenantId,
        parentPolicyId,
        deletedAt: null,
      },
      include: {
        versions: {
          where: { status: 'active' },
        },
      },
    });
  }

  /**
   * Find policies with active versions
   */
  async findActivePolicies(tx?: TransactionClient): Promise<Policy[]> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.findMany({
      where: {
        tenantId: this.tenantId,
        deletedAt: null,
        versions: {
          some: {
            status: 'active',
            effectiveFrom: { lte: new Date() },
            OR: [
              { effectiveUntil: null },
              { effectiveUntil: { gt: new Date() } },
            ],
          },
        },
      },
      include: {
        versions: {
          where: {
            status: 'active',
          },
        },
      },
    });
  }

  /**
   * Search policies by name or description
   */
  async search(query: string, tx?: TransactionClient): Promise<Policy[]> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.findMany({
      where: {
        tenantId: this.tenantId,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }
}
