-- =============================================================
-- Migration: 30-day retention for reference text
-- =============================================================
-- Run this in the Supabase SQL Editor.
--
-- Reference text lives in three places. After p_days days:
--   jobs (+ job_results via ON DELETE CASCADE)  -> deleted
--   transactions.reference_text                 -> cleared (the billing row itself stays)
--   error_logs (details hold a 100-char snippet) -> deleted
-- The API server calls this once a day (src/services/retention.ts).

CREATE OR REPLACE FUNCTION purge_old_reference_data(p_days INTEGER DEFAULT 30)
RETURNS TABLE (jobs_deleted INTEGER, transactions_scrubbed INTEGER, error_logs_deleted INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := now() - make_interval(days => p_days);
BEGIN
  DELETE FROM jobs WHERE created_at < v_cutoff;
  GET DIAGNOSTICS jobs_deleted = ROW_COUNT;

  UPDATE transactions SET reference_text = NULL
  WHERE created_at < v_cutoff AND reference_text IS NOT NULL;
  GET DIAGNOSTICS transactions_scrubbed = ROW_COUNT;

  DELETE FROM error_logs WHERE created_at < v_cutoff;
  GET DIAGNOSTICS error_logs_deleted = ROW_COUNT;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION purge_old_reference_data(INTEGER) FROM PUBLIC, anon, authenticated;
