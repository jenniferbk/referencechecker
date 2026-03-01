import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

// POST /api/jobs — Create a new job
router.post(
  '/jobs',
  authMiddleware,
  async (req: Request, res: Response) => {
    const { references } = req.body;

    if (!Array.isArray(references) || references.length === 0) {
      res.status(400).json({ error: 'References must be a non-empty array.' });
      return;
    }

    if (references.length > 200) {
      res.status(400).json({ error: 'Maximum 200 references per job.' });
      return;
    }

    for (const ref of references) {
      if (typeof ref !== 'string' || ref.trim().length < 10) {
        res.status(400).json({ error: 'Each reference must be a string of at least 10 characters.' });
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          user_id: req.userId,
          total_references: references.length,
          completed_count: 0,
          references: references,
          status: 'in_progress',
        })
        .select('id, total_references')
        .single();

      if (error) throw error;

      res.json({ job_id: data.id, total: data.total_references });
    } catch (error: any) {
      console.error('Create job error:', error);
      res.status(500).json({ error: 'Failed to create job.' });
    }
  }
);

// GET /api/jobs — List user's jobs (history)
router.get(
  '/jobs',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, status, total_references, completed_count, references, created_at, updated_at')
        .eq('user_id', req.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const jobs = (data || []).map((job: any) => ({
        id: job.id,
        status: job.status,
        total_references: job.total_references,
        completed_count: job.completed_count,
        first_reference: Array.isArray(job.references) && job.references.length > 0
          ? job.references[0].substring(0, 80)
          : '',
        created_at: job.created_at,
        updated_at: job.updated_at,
      }));

      res.json({ jobs });
    } catch (error: any) {
      console.error('List jobs error:', error);
      res.status(500).json({ error: 'Failed to list jobs.' });
    }
  }
);

// GET /api/jobs/:jobId — Get full job + results
router.get(
  '/jobs/:jobId',
  authMiddleware,
  async (req: Request, res: Response) => {
    const { jobId } = req.params;

    try {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', req.userId)
        .single();

      if (jobError || !job) {
        res.status(404).json({ error: 'Job not found.' });
        return;
      }

      const { data: results, error: resultsError } = await supabase
        .from('job_results')
        .select('*')
        .eq('job_id', jobId)
        .order('reference_index', { ascending: true });

      if (resultsError) throw resultsError;

      res.json({ job, results: results || [] });
    } catch (error: any) {
      console.error('Get job error:', error);
      res.status(500).json({ error: 'Failed to get job.' });
    }
  }
);

// POST /api/jobs/:jobId/status — Update job status
router.post(
  '/jobs/:jobId/status',
  authMiddleware,
  async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { status } = req.body;

    const validStatuses = ['in_progress', 'paused', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    try {
      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('id', jobId)
        .eq('user_id', req.userId)
        .single();

      if (fetchError || !existing) {
        res.status(404).json({ error: 'Job not found.' });
        return;
      }

      // Validate transitions
      const validTransitions: Record<string, string[]> = {
        'in_progress': ['paused', 'completed', 'cancelled'],
        'paused': ['in_progress', 'completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
      };

      if (!validTransitions[existing.status]?.includes(status)) {
        res.status(400).json({ error: `Cannot transition from '${existing.status}' to '${status}'.` });
        return;
      }

      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (updateError) throw updateError;

      res.json({ status });
    } catch (error: any) {
      console.error('Update job status error:', error);
      res.status(500).json({ error: 'Failed to update job status.' });
    }
  }
);

export default router;
