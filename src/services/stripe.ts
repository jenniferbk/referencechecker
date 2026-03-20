import Stripe from 'stripe';
import { config } from '../config.js';
import { supabase } from '../lib/supabase.js';

export const stripe = new Stripe(config.stripeSecretKey);

// Credit tiers: price_id will be set from Stripe Dashboard
// These are looked up by tier name from the frontend
export const CREDIT_TIERS: Record<string, { credits: number; priceId: string }> = {
  starter: { credits: 1000, priceId: process.env.STRIPE_PRICE_STARTER || '' },
  standard: { credits: 5000, priceId: process.env.STRIPE_PRICE_STANDARD || '' },
  bulk: { credits: 30000, priceId: process.env.STRIPE_PRICE_BULK || '' },
};

export async function createCheckoutSession(
  userId: string,
  tier: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const tierConfig = CREDIT_TIERS[tier];
  if (!tierConfig || !tierConfig.priceId) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, stripe_customer_id')
    .eq('id', userId)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email || undefined,
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: userId,
    mode: 'payment',
    line_items: [{ price: tierConfig.priceId, quantity: 1 }],
    metadata: {
      user_id: userId,
      credits_amount: tierConfig.credits.toString(),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session.url!;
}

export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    config.stripeWebhookSecret
  );
}
