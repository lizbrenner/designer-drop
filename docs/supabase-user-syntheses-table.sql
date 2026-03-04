-- Run in Supabase SQL Editor. Creates table for per-user "Synthesize my work" outputs.

CREATE TABLE IF NOT EXISTS user_syntheses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  output_type   TEXT NOT NULL,
  content_md    TEXT NOT NULL,
  source_ids    UUID[] DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_syntheses_user ON user_syntheses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_syntheses_created ON user_syntheses(created_at DESC);
