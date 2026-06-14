// Re-embed the Rexity knowledge base into Supabase KbChunk (pgvector).
// Reads data/rexity-knowledge.json, embeds every entry + FAQ in EN and DE via
// Gemini embedding-001 (1536-dim, RETRIEVAL_DOCUMENT), upserts into KbChunk
// (id = documentId-locale), then deletes any chunk whose documentId is no
// longer present (removes retired topics like SAP).
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
import { readFileSync } from "node:fs";

const SB = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEM = process.env.GEMINI_API_KEY;
if (!SB || !KEY || !GEM) { console.error("missing env"); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SITE = "https://www.rexity.ai";

async function embed(text, tries = 0) {
  const resp = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=" + GEM,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: text.slice(0, 2000) }] },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: 1536
      })
    }
  );
  if (resp.status === 429 && tries < 5) { await sleep(2000 * (tries + 1)); return embed(text, tries + 1); }
  if (!resp.ok) throw new Error("embed " + resp.status + " " + (await resp.text()).slice(0, 200));
  const v = (await resp.json())?.embedding?.values;
  if (!Array.isArray(v) || v.length !== 1536) throw new Error("bad vec " + (v && v.length));
  return v;
}

async function upsert(rows) {
  const resp = await fetch(SB + "/rest/v1/KbChunk", {
    method: "POST",
    headers: {
      apikey: KEY, Authorization: "Bearer " + KEY,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(rows)
  });
  if (!resp.ok) throw new Error("upsert " + resp.status + " " + (await resp.text()).slice(0, 300));
}

const d = JSON.parse(readFileSync("data/rexity-knowledge.json", "utf8"));
const docs = [
  ...d.entries.map((e) => ({ documentId: e.id, title: e.title, url: e.url || "", en: e.en, de: e.de })),
  ...d.faqs.map((f) => ({ documentId: f.id, title: "FAQ: " + f.id.replace(/^faq-/, ""), url: "", en: f.en, de: f.de }))
];

const now = new Date().toISOString();
const validDocIds = docs.map((x) => x.documentId);
let n = 0, batch = [];
for (const doc of docs) {
  for (const locale of ["en", "de"]) {
    let text = doc[locale];
    if (doc.url) text += (locale === "de" ? "\n\nSeite: " : "\n\nPage: ") + SITE + doc.url;
    const embedding = await embed(text);
    batch.push({
      id: doc.documentId + "-" + locale,
      documentId: doc.documentId,
      title: doc.title,
      text,
      locale,
      embedding: "[" + embedding.join(",") + "]",
      updatedAt: now
    });
    n++;
    if (batch.length >= 10) { await upsert(batch); process.stdout.write("."); batch = []; }
    await sleep(120);
  }
}
if (batch.length) { await upsert(batch); process.stdout.write("."); }
console.log("\nembedded+upserted chunks:", n);

// delete stale chunks (documentId no longer in the KB)
const inList = "(" + validDocIds.join(",") + ")";
const del = await fetch(SB + "/rest/v1/KbChunk?documentId=not.in." + encodeURIComponent(inList), {
  method: "DELETE",
  headers: { apikey: KEY, Authorization: "Bearer " + KEY, Prefer: "return=representation" }
});
if (!del.ok) { console.error("delete stale failed", del.status, (await del.text()).slice(0, 200)); }
else { const removed = await del.json(); console.log("stale chunks removed:", Array.isArray(removed) ? removed.length : 0, Array.isArray(removed) ? removed.map((r) => r.id).join(", ") : ""); }
