-- Run in Supabase SQL Editor. Requires pgvector (enable in Dashboard → Extensions).
-- For "Related work" and "For you" relevance.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS drop_embeddings (
  drop_id    UUID PRIMARY KEY REFERENCES drops(id) ON DELETE CASCADE,
  embedding  vector(1536) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drop_embeddings_vector ON drop_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- Returns related drop ids and similarity score (1 = identical, 0 = orthogonal).
CREATE OR REPLACE FUNCTION get_related_drop_ids(p_drop_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE(related_id UUID, score FLOAT)
LANGUAGE sql
STABLE
AS $$
  SELECT de2.drop_id AS related_id, 1 - (de.embedding <=> de2.embedding)::float AS score
  FROM drop_embeddings de
  JOIN drop_embeddings de2 ON de2.drop_id != de.drop_id
  WHERE de.drop_id = p_drop_id
  ORDER BY de.embedding <=> de2.embedding
  LIMIT p_limit;
$$;

-- For "For you" feed: rank all drops by similarity to a query embedding.
CREATE OR REPLACE FUNCTION match_drops_by_embedding(query_embedding vector(1536), p_limit INT DEFAULT 20)
RETURNS TABLE(drop_id UUID, score FLOAT)
LANGUAGE sql
STABLE
AS $$
  SELECT de.drop_id, (1 - (de.embedding <=> query_embedding))::float AS score
  FROM drop_embeddings de
  ORDER BY de.embedding <=> query_embedding
  LIMIT p_limit;
$$;
