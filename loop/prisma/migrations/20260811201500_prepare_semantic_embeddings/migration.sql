-- Day 15 semantic retrieval uses one stable 768-dimensional Gemini embedding space.
-- Refuse to coerce incompatible historical vectors silently; re-embed them first if this guard trips.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Embedding"
    WHERE "dimensions" <> 768
       OR vector_dims("vector") <> 768
  ) THEN
    RAISE EXCEPTION 'Embedding table contains vectors that are not 768-dimensional. Re-embed or remove incompatible rows before applying Day 15.';
  END IF;
END
$$;

ALTER TABLE "Embedding"
  DROP CONSTRAINT IF EXISTS "Embedding_vector_dimensions_match";

ALTER TABLE "Embedding"
  DROP CONSTRAINT IF EXISTS "Embedding_dimensions_positive";

ALTER TABLE "Embedding"
  ALTER COLUMN "vector" TYPE vector(768)
  USING "vector"::vector(768);

ALTER TABLE "Embedding"
  ADD CONSTRAINT "Embedding_dimensions_fixed"
  CHECK ("dimensions" = 768);

ALTER TABLE "Embedding"
  ADD CONSTRAINT "Embedding_vector_dimensions_match"
  CHECK (vector_dims("vector") = 768);

CREATE INDEX "Embedding_vector_cosine_hnsw_idx"
  ON "Embedding"
  USING hnsw ("vector" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);