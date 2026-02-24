import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getCredits } from '../services/credits.js';

const router = Router();

router.get('/credits', authMiddleware, async (req: Request, res: Response) => {
  try {
    const credits = await getCredits(req.userId!);
    res.json({ credits });
  } catch (error: any) {
    console.error('Credits fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch credit balance.' });
  }
});

export default router;
