import { Router, Response } from 'express';
import { policyService } from '../services/policies/policy.service.js';
import { AuthenticatedRequest, authenticate } from '../auth/middleware/authenticate.middleware.js';
import { authorize } from '../auth/middleware/authorize.middleware.js';
import { z } from 'zod';

/**
 * Policy Management Routes
 *
 * Endpoints:
 * - POST /policies - Create policy
 * - GET /policies - Search policies
 * - GET /policies/:id - Get policy
 * - PUT /policies/:id - Update policy
 * - DELETE /policies/:id - Archive policy
 * - POST /policies/:id/activate - Activate policy
 * - GET /policies/:id/versions - Get version history
 * - GET /policies/:id/diff - Get version diff
 * - POST /policies/from-template - Create from template
 */

const router = Router();

// Validation schemas
const createPolicySchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  policyText: z.string().min(10),
  jurisdiction: z.string(),
  category: z.string(),
  dataTypes: z.array(z.string()),
  purposes: z.array(z.string()),
  retentionPeriod: z.number().optional(),
  parentPolicyId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

const updatePolicySchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  policyText: z.string().min(10).optional(),
  dataTypes: z.array(z.string()).optional(),
  purposes: z.array(z.string()).optional(),
  retentionPeriod: z.number().optional(),
  metadata: z.record(z.any()).optional(),
  changeDescription: z.string().default('Policy updated'),
});

const createFromTemplateSchema = z.object({
  templateId: z.string().uuid(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  retentionPeriod: z.number().optional(),
});

/**
 * Create policy
 */
router.post(
  '/',
  authenticate,
  authorize('policy:create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const data = createPolicySchema.parse(req.body);

      const policy = await policyService.createPolicy(
        {
          ...data,
          tenantId: req.user.tenantId,
        },
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: policy,
        message: 'Policy created successfully',
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
 * Search policies
 */
router.get(
  '/',
  authenticate,
  authorize('policy:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { query, jurisdiction, category, status, limit, offset } = req.query;

      const result = await policyService.searchPolicies(req.user.tenantId, {
        query: query as string,
        jurisdiction: jurisdiction as string,
        category: category as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.policies,
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
 * Get policy by ID
 */
router.get(
  '/:id',
  authenticate,
  authorize('policy:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const policy = await policyService.getPolicyById(id);

      res.status(200).json({
        success: true,
        data: policy,
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
 * Update policy
 */
router.put(
  '/:id',
  authenticate,
  authorize('policy:update'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const data = updatePolicySchema.parse(req.body);
      const { changeDescription, ...updateData } = data;

      const policy = await policyService.updatePolicy(
        id,
        updateData,
        req.user.userId,
        changeDescription
      );

      res.status(200).json({
        success: true,
        data: policy,
        message: 'Policy updated successfully',
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
 * Archive policy
 */
router.delete(
  '/:id',
  authenticate,
  authorize('policy:delete'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      await policyService.archivePolicy(id, req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Policy archived successfully',
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
 * Activate policy
 */
router.post(
  '/:id/activate',
  authenticate,
  authorize('policy:update'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      const policy = await policyService.activatePolicy(id, req.user.userId);

      res.status(200).json({
        success: true,
        data: policy,
        message: 'Policy activated successfully',
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
 * Get version history
 */
router.get(
  '/:id/versions',
  authenticate,
  authorize('policy:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const versions = await policyService.getVersionHistory(id);

      res.status(200).json({
        success: true,
        data: versions,
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
 * Get version diff
 */
router.get(
  '/:id/diff',
  authenticate,
  authorize('policy:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { from, to } = req.query;

      if (!from || !to) {
        res.status(400).json({
          success: false,
          error: 'Version parameters (from, to) are required',
        });
        return;
      }

      const diff = await policyService.getPolicyDiff(
        id,
        parseInt(from as string),
        parseInt(to as string)
      );

      res.status(200).json({
        success: true,
        data: diff,
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
 * Create policy from template
 */
router.post(
  '/from-template',
  authenticate,
  authorize('policy:create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const data = createFromTemplateSchema.parse(req.body);

      const policy = await policyService.createFromTemplate(
        req.user.tenantId,
        data.templateId,
        req.user.userId,
        {
          name: data.name,
          description: data.description,
          retentionPeriod: data.retentionPeriod,
        }
      );

      res.status(201).json({
        success: true,
        data: policy,
        message: 'Policy created from template successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
