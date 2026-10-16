-- =============================================================
-- Migration: Atomic job result recording
-- =============================================================
-- Run this in the Supabase SQL Editor.
--
-- The client now checks several references in parallel. The old route read
-- completed_count and wrote back +1, which loses updates when two results land
-- at once. This function does the upsert and the increment in one statement each,
-- and only counts a result the first time its index is saved (retries don't double-count).

CREATE OR REPLACE FUNCTION record_job_result(
  p_user_id UUID,
  p_job_id UUID,
  p_reference_index INTEGER,
  p_original TEXT,
  p_status TEXT,
  p_corrected TEXT,
  p_notes TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted BOOLEAN;
BEGIN
  -- Only the job's owner can write results into it
  IF NOT EXISTS (SELECT 1 FROM jobs WHERE id = p_job_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  INSERT INTO job_results (job_id, reference_index, original, status, corrected, notes)
  VALUES (p_job_id, p_reference_index, p_original, p_status, p_corrected, p_notes)
  ON CONFLICT (job_id, reference_index) DO UPDATE
    SET original = EXCLUDED.original,
        status = EXCLUDED.status,
        corrected = EXCLUDED.corrected,
        notes = EXCLUDED.notes
  RETURNING (xmax = 0) INTO v_inserted;

  IF v_inserted THEN
    UPDATE jobs
    SET completed_count = completed_count + 1,
        updated_at = now(),
        status = CASE WHEN completed_count + 1 >= total_references THEN 'completed' ELSE status END
    WHERE id = p_job_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION record_job_result(UUID, UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
