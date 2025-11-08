import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/tenant-auth.js';
import { proofBundler } from '../services/proof-bundler.js';

const router = Router();

// List all bundles (optionally filtered by subject_id)
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { subject_id } = req.query;
    const subjectId = typeof subject_id === 'string' ? subject_id : undefined;

    const bundles = await proofBundler.listBundles(subjectId);

    res.json({
      success: true,
      count: bundles.length,
      data: bundles,
    });
  } catch (error) {
    next(error);
  }
});

// Generate a new proof bundle
router.post('/generate', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { subject_id } = req.body;

    if (!subject_id || typeof subject_id !== 'string') {
      res.status(400).json({ error: 'subject_id is required' });
      return;
    }

    const bundle = await proofBundler.generateBundle(subject_id);

    res.json({
      success: true,
      data: bundle,
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific bundle by ID
router.get('/:bundle_id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { bundle_id } = req.params;
    const bundle = await proofBundler.getBundle(bundle_id);

    if (!bundle) {
      res.status(404).json({ error: 'Bundle not found' });
      return;
    }

    res.json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
});

export { router as proofBundlesRouter };
