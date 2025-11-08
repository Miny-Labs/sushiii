import { Router, Response } from 'express';
import { consentService } from '../services/consents/consent.service.js';
import { AuthenticatedRequest, authenticate } from '../auth/middleware/authenticate.middleware.js';
import { authorize } from '../auth/middleware/authorize.middleware.js';
import { z } from 'zod';

/**
 * Consent Management Routes
 *
 * Endpoints:
 * - POST /consents - Grant consent
 * - GET /consents/:id - Get consent
 * - DELETE /consents/:id - Revoke consent
 * - POST /consents/:id/renew - Renew consent
 * - POST /consents/check - Check consent validity
 * - GET /consents/subject/:subjectId - Get subject consents
 * - GET /consents/subject/:subjectId/history - Get consent history
 * - GET /consents/expiring - Get expiring consents
 */

const router = Router();

// Validation schemas
const grantConsentSchema = z.object({
  policyId: z.string().uuid(),
  subjectId: z.string(),
  subjectType: z.enum(['user', 'device', 'organization']),
  purposes: z.array(z.string()),
  dataTypes: z.array(z.string()),
  consentMethod: z.enum(['explicit', 'implicit', 'opt-in', 'opt-out']),
  expiresAt: z.string().datetime().optional(),
  conditions: z.array(z.object({
    type: z.enum(['time', 'location', 'device', 'context']),
    operator: z.enum(['equals', 'contains', 'in', 'not_in', 'greater_than', 'less_than']),
    field: z.string(),
    value: z.any(),
  })).optional(),
  geographicRestrictions: z.object({
    allowedCountries: z.array(z.string()).optional(),
    blockedCountries: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

const renewConsentSchema = z.object({
  newExpiresAt: z.string().datetime(),
});

const checkConsentSchema = z.object({
  subjectId: z.string(),
  policyId: z.string().uuid(),
  purpose: z.string(),
  context: z.object({
    timestamp: z.string().datetime().optional(),
    location: z.object({
      country: z.string().optional(),
      region: z.string().optional(),
      coordinates: z.object({
        lat: z.number(),
        lon: z.number(),
      }).optional(),
    }).optional(),
    device: z.object({
      type: z.string().optional(),
      id: z.string().optional(),
    }).optional(),
    additionalContext: z.record(z.any()).optional(),
  }).optional(),
});

/**
 * Grant consent
 */
router.post(
  '/',
  authenticate,
  authorize('consent:create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const data = grantConsentSchema.parse(req.body);

      const consent = await consentService.grantConsent(
        {
          ...data,
          tenantId: req.user.tenantId,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        },
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: consent,
        message: 'Consent granted successfully',
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
 * Get consent by ID
 */
router.get(
  '/:id',
  authenticate,
  authorize('consent:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const consent = await consentService.getConsentById(id);

      res.status(200).json({
        success: true,
        data: consent,
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
 * Revoke consent
 */
router.delete(
  '/:id',
  authenticate,
  authorize('consent:revoke'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { reason } = req.body;

      await consentService.revokeConsent(id, req.user.userId, reason);

      res.status(200).json({
        success: true,
        message: 'Consent revoked successfully',
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
 * Renew consent
 */
router.post(
  '/:id/renew',
  authenticate,
  authorize('consent:update'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const data = renewConsentSchema.parse(req.body);

      const consent = await consentService.renewConsent(
        id,
        new Date(data.newExpiresAt),
        req.user.userId
      );

      res.status(200).json({
        success: true,
        data: consent,
        message: 'Consent renewed successfully',
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
 * Check consent validity
 */
router.post(
  '/check',
  authenticate,
  authorize('consent:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const data = checkConsentSchema.parse(req.body);

      const result = await consentService.checkConsent(
        req.user.tenantId,
        data.subjectId,
        data.policyId,
        data.purpose,
        data.context ? {
          ...data.context,
          timestamp: data.context.timestamp ? new Date(data.context.timestamp) : undefined,
        } : undefined
      );

      res.status(200).json({
        success: true,
        data: result,
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
 * Get subject consents
 */
router.get(
  '/subject/:subjectId',
  authenticate,
  authorize('consent:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { subjectId } = req.params;
      const { includeExpired, includeRevoked } = req.query;

      const consents = await consentService.getSubjectConsents(
        req.user.tenantId,
        subjectId,
        {
          includeExpired: includeExpired === 'true',
          includeRevoked: includeRevoked === 'true',
        }
      );

      res.status(200).json({
        success: true,
        data: consents,
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
 * Get consent history
 */
router.get(
  '/subject/:subjectId/history',
  authenticate,
  authorize('consent:read', 'audit:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { subjectId } = req.params;

      const history = await consentService.getConsentHistory(
        req.user.tenantId,
        subjectId
      );

      res.status(200).json({
        success: true,
        data: history,
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
 * Get expiring consents
 */
router.get(
  '/expiring',
  authenticate,
  authorize('consent:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { daysAhead } = req.query;

      const consents = await consentService.getExpiringConsents(
        req.user.tenantId,
        daysAhead ? parseInt(daysAhead as string) : 30
      );

      res.status(200).json({
        success: true,
        data: consents,
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
