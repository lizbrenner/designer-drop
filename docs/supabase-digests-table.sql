-- Run in Supabase: SQL Editor → New query → paste → Run
-- Creates draft_digests and digests for the weekly digest (review before publish).
-- Run this after supabase-drops-table.sql. Required for the Digest page to work.

CREATE TABLE IF NOT EXISTS draft_digests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  content_md    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_draft_digests_period ON draft_digests(period_end);

CREATE TABLE IF NOT EXISTS digests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  content_md    TEXT NOT NULL,
  published_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by  TEXT
);

CREATE INDEX IF NOT EXISTS idx_digests_published ON digests(published_at DESC);
