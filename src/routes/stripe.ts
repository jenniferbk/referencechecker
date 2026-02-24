import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createCheckoutSession, constructWebhookEvent } from '../services/stripe.js';
import { addCredits } from '../services/credits.js';

const router = Router();

// Create checkout session (authenticated)
router.post('/create-checkout', authMiddleware, async (req: Request, res: Response) => {
  const { tier } = req.body;

  if (!tier || typeof tier !== 'string') {
    res.status(400).json({ error: 'Missing tier parameter.' });
    return;
  }

  try {
    const url = await createCheckoutSession(
      req.userId!,
      tier,
      `${req.headers.origin || 'https://jenkleiman.com'}/reference-checker?payment=success`,
      `${req.headers.origin || 'https://jenkleiman.com'}/reference-checker?payment=cancelled`
    );

    res.json({ url });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    res.status(400).json({ error: error.message || 'Failed to create checkout session.' });
  }
});

// Stripe webhook (no auth — uses Stripe signature verification)
// NOTE: This route must receive raw body. It's registered in app.ts before the JSON parser.
router.post('/stripe-webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header.' });
    return;
  }

  try {
    const event = constructWebhookEvent(req.body, signature);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.metadata?.user_id;
      const creditsAmount = parseInt(session.metadata?.credits_amount || '0', 10);

      if (!userId || !creditsAmount) {
        console.error('Webhook missing metadata:', session.metadata);
        res.status(400).json({ error: 'Missing metadata in checkout session.' });
        return;
      }

      await addCredits(userId, creditsAmount, session.id);
      console.log(`Added ${creditsAmount} credits to user ${userId} (session: ${session.id})`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: `Webhook error: ${error.message}` });
  }
});

export default router;
