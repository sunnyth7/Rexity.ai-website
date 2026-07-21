/* eslint-disable no-console */
// S3-T7: KB ingestion CLI.
//
// Usage:
//   npx tsx scripts/ingest-kb.ts ./docs/kb/*.md
//
// Reads markdown files, chunks them, embeds each chunk via the configured
// embedding provider, and inserts/updates KbChunk rows.
//
// Embedding provider is selected via env:
//   - EMBEDDING_PROVIDER=openai  → uses OPENAI_API_KEY + text-embedding-3-small
//   - EMBEDDING_PROVIDER=stub    → deterministic fake (for CI / dev without an API key)

import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"

import { PrismaClient } from "@prisma/client"

const CHUNK_SIZE_TOKENS = 500
const CHUNK_OVERLAP_TOKENS = 60
const STUB_DIM = 1536

interface EmbeddingProvider {
  embed(text: string): Promise<number[]>
}

function stubEmbedder(): EmbeddingProvider {
  return {
    async embed(text: string) {
      // Deterministic but spread out enough that different text → different vectors.
      const hash = crypto.createHash("sha256").update(text).digest()
      const out = new Array<number>(STUB_DIM)
      for (let i = 0; i < STUB_DIM; i += 1) {
        out[i] = (hash[i % hash.length] / 255) * 2 - 1
      }
      return out
    },
  }
}

async function openaiEmbedder(): Promise<EmbeddingProvider> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY required for openai embedding provider")
  }
  return {
    async embed(text: string) {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ input: text, model: "text-embedding-3-small" }),
      })
      if (!res.ok) throw new Error(`embedding failed: ${res.status}`)
      const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
      return data.data[0].embedding
    },
  }
}

function chunkText(input: string): string[] {
  // Rough token count proxy: 1 token ≈ 4 chars. Good enough for chunk sizing.
  const charsPerChunk = CHUNK_SIZE_TOKENS * 4
  const charsOverlap = CHUNK_OVERLAP_TOKENS * 4
  if (input.length <= charsPerChunk) return [input]

  const chunks: string[] = []
  for (let start = 0; start < input.length; start += charsPerChunk - charsOverlap) {
    chunks.push(input.slice(start, start + charsPerChunk))
    if (start + charsPerChunk >= input.length) break
  }
  return chunks
}

async function main() {
  const files = process.argv.slice(2)
  if (files.length === 0) {
    console.error("usage: tsx scripts/ingest-kb.ts <files...>")
    process.exit(1)
  }
  const provider =
    process.env.EMBEDDING_PROVIDER === "openai" ? await openaiEmbedder() : stubEmbedder()
  const prisma = new PrismaClient()

  try {
    for (const file of files) {
      const abs = path.resolve(file)
      const text = await fs.readFile(abs, "utf8")
      const documentId = path.relative(process.cwd(), abs)
      const title = path.basename(file, path.extname(file))
      const locale = file.includes(".de.") ? "de" : "en"
      const chunks = chunkText(text)
      console.log(`[ingest] ${documentId} → ${chunks.length} chunk(s)`)

      for (let i = 0; i < chunks.length; i += 1) {
        const chunkId = `${documentId}#${i.toString().padStart(4, "0")}`
        const embedding = await provider.embed(chunks[i])

        // Raw SQL because Prisma doesn't natively model `vector` columns yet.
        await prisma.$executeRawUnsafe(
          `INSERT INTO "KbChunk" ("id", "documentId", "title", "text", "locale", "embedding", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6::vector, NOW())
             ON CONFLICT ("id") DO UPDATE
               SET "text" = EXCLUDED."text",
                   "embedding" = EXCLUDED."embedding",
                   "updatedAt" = NOW()`,
          chunkId,
          documentId,
          title,
          chunks[i],
          locale,
          `[${embedding.join(",")}]`,
        )
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
