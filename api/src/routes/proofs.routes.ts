import { Router, Response } from 'express';
import { proofService } from '../services/proofs/proof.service.js';
import { AuthenticatedRequest, authenticate } from '../auth/middleware/authenticate.middleware.js';
import { authorize } from '../auth/middleware/authorize.middleware.js';
import { z } from 'zod';

/**
 * Proof Bundle Routes
 *
 * Endpoints:
 * - POST /proofs - Generate proof bundle
 * - GET /proofs/:id - Get proof bundle
 * - POST /proofs/:bundleId/verify - Verify proof bundle
 * - GET /proofs/subject/:subjectId - Get subject proofs
 * - POST /proofs/aggregate - Aggregate multiple proofs
 */

const router = Router();

// Validation schemas
const generateProofSchema = z.object({
  policyId: z.string().uuid(),
  consentId: z.string().uuid(),
  subjectId: z.string(),
  dataHash: z.string(),
  proofType: z.enum(['consent', 'policy', 'composite', 'delegation', 'zk']),
  metadata: z.record(z.any()).optional(),
  encrypt: z.object({
    enabled: z.boolean(),
    recipientPublicKey: z.string().optional(),
    algorithm: z.enum(['aes-256-gcm', 'rsa-oaep']).optional(),
  }).optional(),
  timeLock: z.object({
    enabled: z.boolean(),
    unlockAt: z.string().datetime(),
    difficulty: z.number().optional(),
  }).optional(),
  delegation: z.object({
    delegateTo: z.string(),
    permissions: z.array(z.string()),
    expiresAt: z.string().datetime().optional(),
  }).optional(),
});

const aggregateProofsSchema = z.object({
  proofBundleIds: z.array(z.string().uuid()).min(2),
});

/**
 * Generate proof bundle
 */
router.post(
  '/',
  authenticate,
  authorize('proof:create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const data = generateProofSchema.parse(req.body);

      const proofBundle = await proofService.generateProofBundle(
        {
          ...data,
          tenantId: req.user.tenantId,
          timeLock: data.timeLock ? {
            ...data.timeLock,
            unlockAt: new Date(data.timeLock.unlockAt),
          } : undefined,
          delegation: data.delegation ? {
            ...data.delegation,
            expiresAt: data.delegation.expiresAt ? new Date(data.delegation.expiresAt) : undefined,
          } : undefined,
        },
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: proofBundle,
        message: 'Proof bundle generated successfully',
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
 * Get proof bundle by ID
 */
router.get(
  '/:id',
  authenticate,
  authorize('proof:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const proofBundle = await proofService.getProofBundleById(id);

      res.status(200).json({
        success: true,
        data: proofBundle,
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
 * Verify proof bundle
 */
router.post(
  '/:bundleId/verify',
  authenticate,
  authorize('proof:verify'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bundleId } = req.params;

      const result = await proofService.verifyProofBundle(bundleId);

      res.status(200).json({
        success: true,
        data: result,
        message: result.valid ? 'Proof bundle verified successfully' : 'Proof bundle verification failed',
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
 * Get subject proofs
 */
router.get(
  '/subject/:subjectId',
  authenticate,
  authorize('proof:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { subjectId } = req.params;
      const { proofType, limit, offset } = req.query;

      const result = await proofService.getSubjectProofs(
        req.user.tenantId,
        subjectId,
        {
          proofType: proofType as string,
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined,
        }
      );

      res.status(200).json({
        success: true,
        data: result.proofs,
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
 * Aggregate multiple proofs
 */
router.post(
  '/aggregate',
  authenticate,
  authorize('proof:create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const data = aggregateProofsSchema.parse(req.body);

      const aggregatedProof = await proofService.aggregateProofs(
        req.user.tenantId,
        data.proofBundleIds,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: aggregatedProof,
        message: 'Proofs aggregated successfully',
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
