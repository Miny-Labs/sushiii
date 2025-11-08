import { Router } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/tenant-auth.js';
import { hgtpClient } from '../services/hgtp-client.js';

const router = Router();

const PolicyVersionSchema = z.object({
  policy_id: z.string(),
  version: z.string(),
  text: z.string().min(10),
  content_hash: z.string().length(64),
  uri: z.string().url(),
  jurisdiction: z.string().length(2),
  effective_from: z.string().datetime(),
});

router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = PolicyVersionSchema.parse(req.body);

    const policyVersion = {
      ...data,
      created_at: new Date().toISOString(),
    };

    const result = await hgtpClient.submitPolicyVersion(policyVersion);

    res.status(201).json({
      success: true,
      data: policyVersion,
      transaction_hash: result.hash,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const policies = await hgtpClient.getPolicies();
    res.json({ success: true, data: policies });
  } catch (error) {
    next(error);
  }
});

router.get('/:policy_id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { policy_id } = req.params;
    const policy = await hgtpClient.getPolicy(policy_id);

    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }

    res.json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
});

export { router as policiesRouter };
