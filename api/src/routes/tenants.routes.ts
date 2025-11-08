import { Router, Response } from 'express';
import { tenantService } from '../services/tenants/tenant.service.js';
import { AuthenticatedRequest, authenticate } from '../auth/middleware/authenticate.middleware.js';
import { authorize } from '../auth/middleware/authorize.middleware.js';
import { z } from 'zod';

/**
 * Tenant Management Routes
 *
 * Endpoints:
 * - POST /tenants - Create tenant
 * - GET /tenants - List tenants
 * - GET /tenants/:id - Get tenant
 * - PUT /tenants/:id - Update tenant
 * - DELETE /tenants/:id - Delete tenant
 * - POST /tenants/:id/regenerate-api-key - Regenerate API key
 * - PUT /tenants/:id/quotas - Update quotas
 * - GET /tenants/:id/usage - Get usage stats
 */

const router = Router();

// Validation schemas
const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  settings: z.record(z.any()).optional(),
  quotas: z.object({
    maxPolicies: z.number().optional(),
    maxConsents: z.number().optional(),
    maxProofBundles: z.number().optional(),
    maxStorageMB: z.number().optional(),
  }).optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  status: z.enum(['active', 'suspended', 'trial']).optional(),
  settings: z.record(z.any()).optional(),
});

const updateQuotasSchema = z.object({
  maxPolicies: z.number().optional(),
  maxConsents: z.number().optional(),
  maxProofBundles: z.number().optional(),
  maxStorageMB: z.number().optional(),
});

/**
 * Create tenant (admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('tenant:create', 'system:admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = createTenantSchema.parse(req.body);

      const tenant = await tenantService.createTenant(data);

      res.status(201).json({
        success: true,
        data: tenant,
        message: 'Tenant created successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * List tenants (admin only)
 */
router.get(
  '/',
  authenticate,
  authorize('tenant:read', 'system:admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, limit, offset, search } = req.query;

      const result = await tenantService.listTenants({
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        search: search as string,
      });

      res.status(200).json({
        success: true,
        data: result.tenants,
        pagination: {
          total: result.total,
          limit: limit ? parseInt(limit as string) : 50,
          offset: offset ? parseInt(offset as string) : 0,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Get tenant by ID
 */
router.get(
  '/:id',
  authenticate,
  authorize('tenant:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const tenant = await tenantService.getTenant(id);

      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Update tenant
 */
router.put(
  '/:id',
  authenticate,
  authorize('tenant:update'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateTenantSchema.parse(req.body);

      const tenant = await tenantService.updateTenant(id, data);

      res.status(200).json({
        success: true,
        data: tenant,
        message: 'Tenant updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Delete tenant
 */
router.delete(
  '/:id',
  authenticate,
  authorize('tenant:delete', 'system:admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      await tenantService.deleteTenant(id);

      res.status(200).json({
        success: true,
        message: 'Tenant deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Regenerate API key
 */
router.post(
  '/:id/regenerate-api-key',
  authenticate,
  authorize('tenant:update'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const newApiKey = await tenantService.regenerateApiKey(id);

      res.status(200).json({
        success: true,
        data: { apiKey: newApiKey },
        message: 'API key regenerated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Update quotas
 */
router.put(
  '/:id/quotas',
  authenticate,
  authorize('tenant:settings', 'system:admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateQuotasSchema.parse(req.body);

      await tenantService.updateQuotas(id, data);

      res.status(200).json({
        success: true,
        message: 'Quotas updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Get usage statistics
 */
router.get(
  '/:id/usage',
  authenticate,
  authorize('tenant:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const stats = await tenantService.getUsageStats(id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
