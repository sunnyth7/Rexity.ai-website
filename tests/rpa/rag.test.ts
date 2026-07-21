// S3-T7 tests for the RAG pipeline scaffold.
import test from "node:test"
import assert from "node:assert/strict"

import {
  InMemoryKbSearchPort,
  cosineSimilarity,
  createRagPipeline,
} from "../../lib/rag/index.ts"
import { applyClosedBookPolicy } from "../../lib/rpa-showcase/guardrails.ts"

test("S3-T7 cosineSimilarity basics", () => {
  const eq = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`)
  eq(cosineSimilarity([1, 0], [1, 0]), 1)
  eq(cosineSimilarity([1, 0], [0, 1]), 0)
  eq(cosineSimilarity([], [1, 2]), 0)
  eq(cosineSimilarity([1, 1], [1, 1]), 1)
})

test("S3-T7 RAG pipeline retrieves top-K and routes through closed-book policy", async () => {
  const corpus = [
    { id: "kb1", title: "What is Rexity", text: "Rexity offers AI services.", embedding: [1, 0, 0] },
    { id: "kb2", title: "Pricing", text: "Pricing varies by service.",        embedding: [0, 1, 0] },
    { id: "kb3", title: "Calendar",  text: "We accept appointments Mon–Fri.", embedding: [0, 0, 1] },
  ]
  const kb = new InMemoryKbSearchPort(corpus)

  const embeddings = { embed: async (q: string) => (q.includes("service") ? [1, 0, 0] : [0, 0, 1]) }
  const chat = {
    async answer({ snippets }: { snippets: Array<{ title: string }> }) {
      return { answer: `Top match: ${snippets[0].title}`, confidence: 0.95 }
    },
  }
  const pipeline = createRagPipeline({ embeddings, chat, kb, topK: 2 })

  const ragResult = await pipeline.answer({ question: "what services do you offer?", locale: "en" })
  assert.equal(ragResult.answer, "Top match: What is Rexity")
  assert.equal(ragResult.citations[0].id, "kb1")
  assert.equal(applyClosedBookPolicy(ragResult).ok, true)
})

test("S3-T7 RAG: empty KB falls back to no-answer policy", async () => {
  const kb = new InMemoryKbSearchPort([])
  const pipeline = createRagPipeline({
    embeddings: { embed: async () => [1, 2, 3] },
    chat: { answer: async () => ({ answer: "should not be called", confidence: 1 }) },
    kb,
  })
  const ragResult = await pipeline.answer({ question: "?", locale: "en" })
  assert.equal(ragResult.answer, "")
  assert.equal(applyClosedBookPolicy(ragResult).ok, false)
})

test("S3-T7 RAG: low-confidence model output falls back via closed-book policy", async () => {
  const corpus = [{ id: "kb1", title: "Off-topic", text: "irrelevant", embedding: [1, 0] }]
  const pipeline = createRagPipeline({
    embeddings: { embed: async () => [1, 0] },
    chat: { answer: async () => ({ answer: "weak guess", confidence: 0.3 }) },
    kb: new InMemoryKbSearchPort(corpus),
  })
  const ragResult = await pipeline.answer({ question: "anything", locale: "en" })
  assert.equal(applyClosedBookPolicy(ragResult).ok, false)
})
