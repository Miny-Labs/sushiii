import { prisma } from '../db/client.js';
import { TransactionClient } from '../db/transaction.js';

/**
 * Base Repository
 *
 * Provides common CRUD operations with tenant isolation.
 * All concrete repositories should extend this class.
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected readonly prisma: typeof prisma;
  protected readonly modelName: string;

  constructor(modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  /**
   * Get the Prisma delegate for this model
   */
  protected abstract getDelegate(): any;

  /**
   * Get the Prisma delegate from a transaction client
   */
  protected abstract getDelegateFromTx(tx: TransactionClient): any;

  /**
   * Find by ID
   */
  async findById(id: string, tx?: TransactionClient): Promise<T | null> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.findUnique({
      where: { id },
    });
  }

  /**
   * Find all with optional filtering
   */
  async findMany(params?: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
  }, tx?: TransactionClient): Promise<T[]> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.findMany(params);
  }

  /**
   * Find one matching criteria
   */
  async findOne(where: any, tx?: TransactionClient): Promise<T | null> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.findFirst({ where });
  }

  /**
   * Count records
   */
  async count(where?: any, tx?: TransactionClient): Promise<number> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.count({ where });
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput, tx?: TransactionClient): Promise<T> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.create({ data });
  }

  /**
   * Create many records
   */
  async createMany(data: CreateInput[], tx?: TransactionClient): Promise<{ count: number }> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.createMany({ data });
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: UpdateInput, tx?: TransactionClient): Promise<T> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.update({
      where: { id },
      data,
    });
  }

  /**
   * Update many records
   */
  async updateMany(where: any, data: UpdateInput, tx?: TransactionClient): Promise<{ count: number }> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.updateMany({
      where,
      data,
    });
  }

  /**
   * Delete a record by ID (soft delete if deletedAt field exists)
   */
  async delete(id: string, tx?: TransactionClient): Promise<T> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();

    // Check if model has deletedAt field
    const model = await this.findById(id, tx);
    if (model && 'deletedAt' in model) {
      // Soft delete
      return await delegate.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } else {
      // Hard delete
      return await delegate.delete({
        where: { id },
      });
    }
  }

  /**
   * Hard delete a record
   */
  async hardDelete(id: string, tx?: TransactionClient): Promise<T> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.delete({
      where: { id },
    });
  }

  /**
   * Upsert (update or create)
   */
  async upsert(
    where: any,
    create: CreateInput,
    update: UpdateInput,
    tx?: TransactionClient
  ): Promise<T> {
    const delegate = tx ? this.getDelegateFromTx(tx) : this.getDelegate();
    return await delegate.upsert({
      where,
      create,
      update,
    });
  }

  /**
   * Check if record exists
   */
  async exists(where: any, tx?: TransactionClient): Promise<boolean> {
    const count = await this.count(where, tx);
    return count > 0;
  }
}

/**
 * Tenant-scoped base repository
 * Automatically adds tenant filtering to all queries
 */
export abstract class TenantScopedRepository<T, CreateInput, UpdateInput> extends BaseRepository<T, CreateInput, UpdateInput> {
  protected tenantId: string;

  constructor(modelName: string, tenantId: string) {
    super(modelName);
    this.tenantId = tenantId;
  }

  /**
   * Add tenant filter to where clause
   */
  protected withTenantFilter(where?: any): any {
    return {
      ...where,
      tenantId: this.tenantId,
    };
  }

  /**
   * Override findMany to include tenant filter
   */
  async findMany(params?: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
  }, tx?: TransactionClient): Promise<T[]> {
    return super.findMany(
      params ? { ...params, where: this.withTenantFilter(params.where) } : { where: this.withTenantFilter() },
      tx
    );
  }

  /**
   * Override findOne to include tenant filter
   */
  async findOne(where: any, tx?: TransactionClient): Promise<T | null> {
    return super.findOne(this.withTenantFilter(where), tx);
  }

  /**
   * Override count to include tenant filter
   */
  async count(where?: any, tx?: TransactionClient): Promise<number> {
    return super.count(this.withTenantFilter(where), tx);
  }

  /**
   * Override create to include tenant ID
   */
  async create(data: CreateInput, tx?: TransactionClient): Promise<T> {
    return super.create({ ...data, tenantId: this.tenantId } as CreateInput, tx);
  }

  /**
   * Override exists to include tenant filter
   */
  async exists(where: any, tx?: TransactionClient): Promise<boolean> {
    return super.exists(this.withTenantFilter(where), tx);
  }
}
