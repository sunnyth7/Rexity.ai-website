// S3-T7: RAG retrieval pipeline scaffold.
//
// Design:
//   - Knowledge base lives in a `KbChunk` Postgres table with a `pgvector`
//     embedding column. Migration in
//     prisma/migrations/20260606130000_kb_chunk/migration.sql.
//   - At ingest (`scripts/ingest-kb.ts`), each KB document is split into
//     ~500-token chunks, embedded with a configurable embedding adapter,
//     and inserted into `KbChunk`.
//   - At query, we embed the question, run a top-K cosine-similarity search,
//     and pipe the snippets to a model adapter for closed-book answering.
//   - Output passes through `applyClosedBookPolicy` (guardrails.ts) — anything
//     below confidence threshold returns a no-answer fallback.
//
// Adapters are injected so we can swap providers without touching call sites.

import type { Locale, RagAdapter, RagResult } from "../rpa-showcase/contracts"

export interface EmbeddingAdapter {
  embed(text: string): Promise<number[]>
}

export interface ChatAdapter {
  /**
   * Returns answer + confidence. Implementations should be tuned to
   * return a low confidence (<0.5) when the snippets don't actually
   * cover the question.
   */
  answer(input: {
    question: string
    locale: Locale
    snippets: Array<{ id: string; title: string; text: string }>
  }): Promise<{ answer: string; confidence: number }>
}

export interface KbSearchPort {
  /** Top-K cosine-similarity search against KbChunk embeddings. */
  search(embedding: number[], topK: number): Promise<Array<{ id: string; title: string; text: string; score: number }>>
}

export interface RagPipelineDeps {
  embeddings: EmbeddingAdapter
  chat: ChatAdapter
  kb: KbSearchPort
  topK?: number
}

export function createRagPipeline(deps: RagPipelineDeps): RagAdapter {
  const topK = deps.topK ?? 5
  return {
    async answer({ question, locale }): Promise<RagResult> {
      const embedding = await deps.embeddings.embed(question)
      const hits = await deps.kb.search(embedding, topK)
      if (hits.length === 0) {
        return { answer: "", confidence: 0, citations: [] }
      }
      const completion = await deps.chat.answer({ question, locale, snippets: hits })
      return {
        answer: completion.answer,
        confidence: completion.confidence,
        citations: hits.map((hit) => ({ id: hit.id, title: hit.title })),
      }
    },
  }
}

// ---- In-memory implementations for tests --------------------------------

export class InMemoryKbSearchPort implements KbSearchPort {
  private readonly corpus: Array<{ id: string; title: string; text: string; embedding: number[] }>

  constructor(corpus: Array<{ id: string; title: string; text: string; embedding: number[] }>) {
    this.corpus = corpus
  }

  async search(embedding: number[], topK: number) {
    const scored = this.corpus.map((entry) => ({
      ...entry,
      score: cosineSimilarity(entry.embedding, embedding),
    }))
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, topK).map(({ id, title, text, score }) => ({ id, title, text, score }))
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}
