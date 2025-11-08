import { ProofBundle, Prisma } from '@prisma/client';
import { TenantScopedRepository } from './base.repository.js';
import { prisma } from '../db/client.js';
import { TransactionClient } from '../db/transaction.js';

export class ProofBundleRepository extends TenantScopedRepository<
  ProofBundle,
  Prisma.ProofBundleCreateInput,
  Prisma.ProofBundleUpdateInput
> {
  constructor(tenantId: string) {
    super('ProofBundle', tenantId);
  }

  protected getDelegate() {
    return prisma.proofBundle;
  }

  protected getDelegateFromTx(tx: TransactionClient) {
    return tx.proofBundle;
  }

  /**
   * Find proof bundle by bundle_id
   */
  async findByBundleId(bundleId: string, tx?: TransactionClient): Promise<ProofBundle | null> {
    return await this.findOne({ bundleId }, tx);
  }

  /**
   * Find proof bundles by subject ID
   */
  async findBySubjectId(subjectId: string, tx?: TransactionClient): Promise<ProofBundle[]> {
    return await this.findMany({
      where: { subjectId },
      orderBy: { generatedAt: 'desc' },
      include: {
        timeLockPuzzle: true,
        delegations: {
          where: {
            revokedAt: null,
          },
        },
      },
    }, tx);
  }

  /**
   * Find recent proof bundles
   */
  async findRecent(limit: number = 20, tx?: TransactionClient): Promise<ProofBundle[]> {
    return await this.findMany({
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { generatedAt: 'desc' },
      take: limit,
    }, tx);
  }

  /**
   * Find encrypted proof bundles
   */
  async findEncrypted(tx?: TransactionClient): Promise<ProofBundle[]> {
    return await this.findMany({
      where: { encrypted: true },
      orderBy: { generatedAt: 'desc' },
    }, tx);
  }

  /**
   * Find expired proof bundles
   */
  async findExpired(tx?: TransactionClient): Promise<ProofBundle[]> {
    return await this.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    }, tx);
  }

  /**
   * Cleanup expired bundles
   */
  async cleanupExpired(tx?: TransactionClient): Promise<number> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    const result = await delegate.deleteMany({
      where: {
        tenantId: this.tenantId,
        expiresAt: {
          lte: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * Get proof bundle with full relations
   */
  async findByIdWithRelations(id: string, tx?: TransactionClient): Promise<ProofBundle | null> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.findUnique({
      where: { id },
      include: {
        timeLockPuzzle: true,
        delegations: {
          where: {
            revokedAt: null,
            validFrom: { lte: new Date() },
            OR: [
              { validUntil: null },
              { validUntil: { gte: new Date() } },
            ],
          },
        },
        zkProof: true,
      },
    });
  }
}
