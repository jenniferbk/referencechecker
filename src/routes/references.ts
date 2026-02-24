import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { verifyRateLimit } from '../middleware/rateLimit.js';
import { verifyReference } from '../services/gemini.js';
import { deductCredit, getCredits } from '../services/credits.js';

const router = Router();

router.post(
  '/verify-reference',
  authMiddleware,
  verifyRateLimit,
  async (req: Request, res: Response) => {
    const { reference } = req.body;

    if (!reference || typeof reference !== 'string' || reference.trim().length < 10) {
      res.status(400).json({ error: 'Invalid reference. Must be at least 10 characters.' });
      return;
    }

    try {
      // Deduct credit BEFORE calling Gemini
      const creditsAfter = await deductCredit(req.userId!, reference);

      // Call Gemini to verify
      const result = await verifyReference(reference.trim());

      res.json({
        ...result,
        credits_remaining: creditsAfter,
      });
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_CREDITS') {
        res.status(402).json({
          error: 'Insufficient credits. Please purchase more credits to continue.',
          credits_remaining: 0,
        });
        return;
      }

      console.error('Reference verification error:', error);
      res.status(500).json({ error: 'Failed to verify reference. Please try again.' });
    }
  }
);

export default router;
