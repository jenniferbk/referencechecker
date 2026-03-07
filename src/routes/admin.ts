import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

// All admin routes require auth + admin check
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats — Dashboard overview
router.get('/admin/stats', async (_req: Request, res: Response) => {
  try {
    const [users, jobs, transactions, errors] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('credits_change')
        .eq('type', 'purchase'),
      supabase.from('error_logs').select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const totalRevenue = (transactions.data || [])
      .reduce((sum: number, t: any) => sum + t.credits_change, 0);

    res.json({
      total_users: users.count || 0,
      total_jobs: jobs.count || 0,
      total_credits_purchased: totalRevenue,
      errors_last_24h: errors.count || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// GET /api/admin/users — List users with balances
router.get('/admin/users', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;

    let query = supabase
      .from('profiles')
      .select('id, email, credits, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ users: data || [] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// GET /api/admin/errors — View recent error logs
router.get('/admin/errors', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const errorType = req.query.type as string;

    let query = supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (errorType) {
      query = query.eq('error_type', errorType);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ errors: data || [] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch error logs.' });
  }
});

// POST /api/admin/refund — Refund credits to a user
router.post('/admin/refund', async (req: Request, res: Response) => {
  const { user_id, amount, reason } = req.body;

  if (!user_id || typeof amount !== 'number' || amount < 1) {
    res.status(400).json({ error: 'user_id and positive amount are required.' });
    return;
  }

  if (amount > 10000) {
    res.status(400).json({ error: 'Refund amount cannot exceed 10,000 credits.' });
    return;
  }

  try {
    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, credits')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const newCredits = profile.credits + amount;

    // Update credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq('id', user_id);

    if (updateError) throw updateError;

    // Log the refund transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        type: 'signup_bonus', // reuse existing type for admin credits
        credits_change: amount,
        credits_after: newCredits,
        reference_text: `Admin refund: ${reason || 'No reason provided'}`,
      });

    if (txError) throw txError;

    res.json({
      success: true,
      email: profile.email,
      credits_before: profile.credits,
      credits_after: newCredits,
      amount_refunded: amount,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to process refund.' });
  }
});

// GET /api/admin/failed-checks — View quota/error failures
router.get('/admin/failed-checks', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .in('error_type', ['gemini_quota', 'gemini_error'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ failed_checks: data || [] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch failed checks.' });
  }
});

export default router;
