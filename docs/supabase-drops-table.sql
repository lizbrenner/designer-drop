-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Creates the drops table for persistent storage (replaces in-memory store).

CREATE TABLE IF NOT EXISTS drops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  owner_avatar  TEXT,
  type          TEXT NOT NULL CHECK (type IN ('screen_recording', 'screenshot', 'url')),
  title         TEXT NOT NULL,
  description   TEXT,
  video_url     TEXT,
  image_url     TEXT,
  url           TEXT,
  thumbnail_url TEXT,
  tags          TEXT[] DEFAULT '{}',
  mentioned_ids TEXT[] DEFAULT '{}',
  project       TEXT,
  labels        TEXT[] DEFAULT '{}',
  visibility    TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'draft')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drops_owner ON drops(owner_id);
CREATE INDEX IF NOT EXISTS idx_drops_visibility_created ON drops(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drops_tags ON drops USING GIN(tags);
