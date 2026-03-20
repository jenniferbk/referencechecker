import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { stripe, createCheckoutSession, constructWebhookEvent, CREDIT_TIERS } from '../services/stripe.js';
import { addCredits } from '../services/credits.js';
import { logError } from '../services/logger.js';

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
    logError({
      userId: req.userId,
      endpoint: 'POST /api/create-checkout',
      errorType: 'stripe_error',
      message: error.message || 'Checkout session failed',
    });
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
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let userId = session.metadata?.user_id || session.client_reference_id;
      let creditsAmount = parseInt(session.metadata?.credits_amount || '0', 10);

      // Fallback: resolve credits from pack_id if credits_amount wasn't set
      if (!creditsAmount && session.metadata?.pack_id) {
        const tier = CREDIT_TIERS[session.metadata.pack_id];
        if (tier) creditsAmount = tier.credits;
      }

      // Skip events that aren't from this app (e.g. a11y site sharing the same Stripe account)
      if (!userId || !UUID_REGEX.test(userId)) {
        console.log(`Ignoring checkout session ${session.id} — not a refcheck event (user_id: ${userId || 'missing'})`);
        res.json({ received: true });
        return;
      }

      if (!creditsAmount) {
        logError({
          endpoint: 'POST /api/stripe-webhook',
          errorType: 'stripe_error',
          message: 'Checkout session missing credits amount',
          details: { metadata: session.metadata, sessionId: session.id },
        });
        res.status(400).json({ error: 'Missing credits amount in checkout session.' });
        return;
      }

      await addCredits(userId, creditsAmount, session.id);
      console.log(`Added ${creditsAmount} credits to user ${userId} (session: ${session.id})`);
    }

    res.json({ received: true });
  } catch (error: any) {
    logError({
      endpoint: 'POST /api/stripe-webhook',
      errorType: 'stripe_error',
      message: error.message || 'Webhook processing failed',
    });
    res.status(400).json({ error: `Webhook error: ${error.message}` });
  }
});

export default router;
