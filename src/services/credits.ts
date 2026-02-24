import { supabase } from '../lib/supabase.js';

export async function getCredits(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`Failed to fetch credits: ${error.message}`);
  return data.credits;
}

export async function deductCredit(userId: string, referenceText: string): Promise<number> {
  const { data, error } = await supabase.rpc('deduct_credit', {
    p_user_id: userId,
    p_reference_text: referenceText,
  });

  if (error) {
    if (error.message.includes('Insufficient credits')) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    throw new Error(`Failed to deduct credit: ${error.message}`);
  }

  return data; // credits_after
}

export async function addCredits(
  userId: string,
  amount: number,
  stripeSessionId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_stripe_session_id: stripeSessionId,
  });

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      // Idempotent: this session was already processed
      console.log(`Duplicate webhook for session ${stripeSessionId}, skipping`);
      const credits = await getCredits(userId);
      return credits;
    }
    throw new Error(`Failed to add credits: ${error.message}`);
  }

  return data; // credits_after
}
