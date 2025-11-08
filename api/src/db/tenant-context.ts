import { prisma } from './client.js';

/**
 * Tenant Context Manager
 *
 * Sets the PostgreSQL session variable `app.current_tenant_id` for Row-Level Security (RLS).
 * This ensures all database queries are automatically filtered by tenant_id.
 */

export class TenantContext {
  /**
   * Execute a function within a tenant context
   * All database queries within the function will be scoped to the specified tenant
   */
  static async execute<T>(
    tenantId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Set the tenant context for this session
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`
    );

    try {
      // Execute the function
      return await fn();
    } finally {
      // Reset the tenant context
      await prisma.$executeRawUnsafe(
        `RESET app.current_tenant_id`
      );
    }
  }

  /**
   * Execute a raw transaction with tenant context
   */
  static async executeInTransaction<T>(
    tenantId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return await prisma.$transaction(async (tx) => {
      // Set tenant context
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`
      );

      // Execute function
      return await fn();
    });
  }

  /**
   * Verify tenant exists and return tenant data
   */
  static async getTenant(tenantId: string) {
    return await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        quota: true,
      },
    });
  }

  /**
   * Verify tenant by API key
   */
  static async getTenantByApiKey(apiKey: string) {
    return await prisma.tenant.findUnique({
      where: { apiKey },
      include: {
        quota: true,
      },
    });
  }
}

/**
 * Middleware helper to extract tenant from request
 */
export interface TenantRequest {
  tenantId?: string;
  tenant?: any;
}

export function setTenantContext(req: TenantRequest, tenantId: string, tenantData?: any) {
  req.tenantId = tenantId;
  req.tenant = tenantData;
}
