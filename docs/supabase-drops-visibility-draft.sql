-- Run in Supabase SQL Editor if you already have the drops table.
-- Allows 'draft' visibility so users can save drafts and finish later.

ALTER TABLE drops DROP CONSTRAINT IF EXISTS drops_visibility_check;
ALTER TABLE drops ADD CONSTRAINT drops_visibility_check
  CHECK (visibility IN ('public', 'private', 'draft'));
