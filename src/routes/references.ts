import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { verifyRateLimit } from '../middleware/rateLimit.js';
import { verifyReference } from '../services/gemini.js';
import { deductCredit, getCredits } from '../services/credits.js';
import { supabase } from '../lib/supabase.js';
import { logError } from '../services/logger.js';

const router = Router();

router.post(
  '/verify-reference',
  authMiddleware,
  verifyRateLimit,
  async (req: Request, res: Response) => {
    const { reference, job_id, reference_index } = req.body;

    if (!reference || typeof reference !== 'string' || reference.trim().length < 10) {
      res.status(400).json({ error: 'Invalid reference. Must be at least 10 characters.' });
      return;
    }

    try {
      // Check credits before calling Gemini (don't deduct yet)
      const currentCredits = await getCredits(req.userId!);
      if (currentCredits < 1) {
        res.status(402).json({
          error: 'Insufficient credits. Please purchase more credits to continue.',
          credits_remaining: 0,
        });
        return;
      }

      // Call Gemini to verify
      const result = await verifyReference(reference.trim());

      // If Gemini failed (quota exhausted, API error, etc.), don't charge the user
      if (result.status === 'unknown') {
        const isQuotaError = result.notes?.includes('quota exhausted');
        res.status(isQuotaError ? 429 : 502).json({
          ...result,
          credits_remaining: currentCredits,
        });
        return;
      }

      // Deduct credit AFTER successful Gemini call
      const creditsAfter = await deductCredit(req.userId!, reference);

      // If job_id provided, persist the result
      if (job_id && typeof reference_index === 'number') {
        try {
          // Check if this reference_index already has a result (retry detection)
          const { data: existing } = await supabase
            .from('job_results')
            .select('id')
            .eq('job_id', job_id)
            .eq('reference_index', reference_index)
            .maybeSingle();

          const isNewResult = !existing;

          // Upsert the result (supports retries via unique constraint)
          await supabase
            .from('job_results')
            .upsert({
              job_id,
              reference_index,
              original: result.original,
              status: result.status,
              corrected: result.corrected || null,
              notes: result.notes || null,
            }, { onConflict: 'job_id,reference_index' });

          // Only increment completed_count for genuinely new results
          if (isNewResult) {
            const { data: job } = await supabase
              .from('jobs')
              .select('total_references, completed_count')
              .eq('id', job_id)
              .single();

            if (job) {
              const newCount = job.completed_count + 1;
              const updates: Record<string, any> = {
                completed_count: newCount,
                updated_at: new Date().toISOString(),
              };
              if (newCount >= job.total_references) {
                updates.status = 'completed';
              }
              await supabase
                .from('jobs')
                .update(updates)
                .eq('id', job_id);
            }
          }
        } catch (persistError) {
          // Log but don't fail the request — the verification itself succeeded
          console.error('Failed to persist job result:', persistError);
        }
      }

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

      logError({
        userId: req.userId,
        endpoint: 'POST /api/verify-reference',
        errorType: error.message === 'INSUFFICIENT_CREDITS' ? 'credit_error' : 'unknown_error',
        message: error.message || 'Unknown error',
        details: { reference: reference?.substring(0, 100) },
      });
      res.status(500).json({ error: 'Failed to verify reference. Please try again.' });
    }
  }
);

export default router;
