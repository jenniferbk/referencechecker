-- =============================================================
-- Migration: Add jobs & job_results tables for persistence
-- =============================================================
-- Run this in the Supabase SQL Editor.

-- ── Jobs table ────────────────────────────────────────────────

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'paused', 'completed', 'cancelled')),
  total_references INTEGER NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  "references" JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);

-- ── Job results table ─────────────────────────────────────────

CREATE TABLE job_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reference_index INTEGER NOT NULL,
  original TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('verified', 'corrected', 'hallucinated', 'unknown')),
  corrected TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enables upsert for retries — one result per reference per job
CREATE UNIQUE INDEX idx_job_results_job_ref ON job_results(job_id, reference_index);
CREATE INDEX idx_job_results_job_id ON job_results(job_id);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_results ENABLE ROW LEVEL SECURITY;

-- Users can read their own jobs
CREATE POLICY "Users can read own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read results for their own jobs
CREATE POLICY "Users can read own job results"
  ON job_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = job_results.job_id AND jobs.user_id = auth.uid()
    )
  );

-- All writes go through the backend (service role bypasses RLS)
