-- S3-T7: Knowledge base chunk store backed by pgvector.
--
-- Each chunk is ~500 tokens of an approved KB document. We retrieve top-K by
-- cosine similarity at query time.
--
-- Embedding dimension is 1536 (default for OpenAI text-embedding-3-small).
-- If you swap embedding providers, ALTER COLUMN the type accordingly.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "KbChunk" (
  "id"          TEXT PRIMARY KEY,
  "documentId"  TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "text"        TEXT NOT NULL,
  "locale"      TEXT NOT NULL DEFAULT 'en',
  "embedding"   vector(1536),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL
);

CREATE INDEX "KbChunk_documentId_idx" ON "KbChunk" ("documentId");
CREATE INDEX "KbChunk_locale_idx"     ON "KbChunk" ("locale");

-- Approximate-nearest-neighbour index (ivfflat) for fast cosine search.
-- Tune `lists` after ingest; rule of thumb: lists ≈ sqrt(row_count).
CREATE INDEX "KbChunk_embedding_cosine_idx"
  ON "KbChunk" USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);
