-- =============================================================
-- Reference Checker — Supabase Database Schema
-- =============================================================
-- Run this in the Supabase SQL Editor after creating your project.

-- ── Profiles table (auto-created on signup via trigger) ──────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  credits INTEGER NOT NULL DEFAULT 25,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Transaction history ──────────────────────────────────────

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('signup_bonus', 'purchase', 'usage')),
  credits_change INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  stripe_session_id TEXT,
  reference_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate webhook processing
CREATE UNIQUE INDEX idx_transactions_stripe_session
  ON transactions(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- ── Auto-create profile on signup trigger ────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 25);

  INSERT INTO public.transactions (user_id, type, credits_change, credits_after)
  VALUES (NEW.id, 'signup_bonus', 25, 25);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── RPC: Deduct 1 credit (atomic) ───────────────────────────

CREATE OR REPLACE FUNCTION deduct_credit(p_user_id UUID, p_reference_text TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT credits INTO v_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_credits < 1 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct
  UPDATE profiles
  SET credits = credits - 1, updated_at = now()
  WHERE id = p_user_id;

  v_credits := v_credits - 1;

  -- Log transaction
  INSERT INTO transactions (user_id, type, credits_change, credits_after, reference_text)
  VALUES (p_user_id, 'usage', -1, v_credits, LEFT(p_reference_text, 500));

  RETURN v_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: Add credits (atomic, idempotent via stripe_session_id) ─

CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INTEGER, p_stripe_session_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  -- Lock the row
  SELECT credits INTO v_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Add credits
  UPDATE profiles
  SET credits = credits + p_amount, updated_at = now()
  WHERE id = p_user_id;

  v_credits := v_credits + p_amount;

  -- Log transaction (unique constraint on stripe_session_id prevents duplicates)
  INSERT INTO transactions (user_id, type, credits_change, credits_after, stripe_session_id)
  VALUES (p_user_id, 'purchase', p_amount, v_credits, p_stripe_session_id);

  RETURN v_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can read their own transactions
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- All writes go through the backend (service role bypasses RLS)
