const fs = require("fs");
const path = require("path");

const knowledgePath = path.join(process.cwd(), "data", "rexity-knowledge.json");
const knowledge = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));

const ADMIN_EMAIL = knowledge.brand.contact.admin;
const DEMO_EMAIL = knowledge.brand.contact.demo;

// DeepSeek (OpenAI-compatible). Key lives in Vercel env on the project that
// serves rexity.ai. Tolerate a couple of name spellings just in case.
const DEEPSEEK_KEY =
  process.env.Deepseek_API_Key ||
  process.env.DEEPSEEK_API_KEY ||
  process.env.DEEPSEEK_KEY ||
  "";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s@.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectLanguage(message) {
  const text = normalize(message);
  const germanSignals = [
    "was", "wie", "bitte", "danke", "kann", "können", "termin", "beratung",
    "erstattung", "rechnung", "deutsch", "projekt", "anforderungen"
  ];
  return germanSignals.some((word) => text.includes(word)) ? "de" : "en";
}

function includesAny(text, terms) {
  return terms.some((term) => normalize(text).includes(normalize(term)));
}

function scoreEntry(message, entry) {
  const text = normalize(message);
  const stopwords = new Set([
    "the", "and", "for", "you", "your", "are", "what", "does", "do", "can",
    "with", "about", "need", "want", "ich", "und", "der", "die", "das", "was",
    "wie", "kann", "bitte", "brauche", "einen", "eine", "ein"
  ]);
  const haystack = normalize([
    entry.title,
    entry.en,
    entry.de,
    ...(entry.keywords || [])
  ].join(" "));

  let score = 0;
  for (const token of text.split(" ")) {
    if (token.length > 2 && !stopwords.has(token) && haystack.includes(token)) score += 1;
  }
  for (const keyword of entry.keywords || []) {
    if (text.includes(normalize(keyword))) score += 4;
  }
  return score;
}

function retrieve(message, limit) {
  return knowledge.entries
    .map((entry) => ({ entry, score: scoreEntry(message, entry) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit || 3)
    .map((item) => item.entry);
}

function adminReply(lang) {
  if (lang === "de") {
    return `Dazu kann ich keine Entscheidung treffen. Für Erstattungen, Richtlinien, Rechnungen oder Admin-Themen schreiben Sie bitte an ${ADMIN_EMAIL}.`;
  }
  return `I can’t make decisions on that. For refunds, policies, billing, or admin matters, please email ${ADMIN_EMAIL}.`;
}

function demoReply(lang) {
  if (lang === "de") {
    return `Für Anforderungen, Demos oder ein Projektgespräch schreiben Sie bitte an ${DEMO_EMAIL}. Wir können dann sauber prüfen, was Sie bauen möchten.`;
  }
  return `For requirements, demos, or a project discussion, please email ${DEMO_EMAIL}. We can then review what you want to build properly.`;
}

function fallbackReply(lang) {
  if (lang === "de") {
    return "Ich kann bei Rexity Services, Produkten, Design, Entwicklung, Automatisierung, AI-Systemen, Skalierung und Demo-Anfragen helfen. Dazu habe ich keine bestätigte Rexity-Information.";
  }
  return "I can help with Rexity services, products, design, development, automation, AI systems, scaling, and demo requests. I don’t have confirmed Rexity information for that.";
}

// Deterministic, retrieval-only answer. Used when the LLM is unavailable or
// errors — the assistant must never go silent.
function composeAnswer(message, forcedLang) {
  const lang = forcedLang || detectLanguage(message);
  const text = normalize(message);

  if (!text || text.length < 2) {
    return {
      answer: lang === "de"
        ? "Schreiben Sie mir kurz, wobei ich zu Rexity helfen soll."
        : "Tell me what you’d like to know about Rexity.",
      sources: []
    };
  }

  if (includesAny(text, knowledge.rules.adminTopics)) {
    return { answer: adminReply(lang), sources: ["admin"] };
  }
  if (includesAny(text, knowledge.rules.demoTopics)) {
    return { answer: demoReply(lang), sources: ["demo"] };
  }

  const matches = retrieve(message);
  if (!matches.length) {
    return { answer: fallbackReply(lang), sources: [] };
  }
  const answer = matches.slice(0, 1).map((entry) => entry[lang] || entry.en).join(" ");
  return { answer, sources: matches.map((entry) => entry.id) };
}

// ---- DeepSeek layer ---------------------------------------------------------

function buildSystemPrompt(lang, contextLines) {
  const langName = lang === "de" ? "German (Sie-Form, professional)" : "English";
  const neverSay = (knowledge.rules.neverSay || [])
    .map((r, i) => `${i + 6}. ${r}`)
    .join("\n");

  return [
    `You are the Rexity assistant, a concise, warm, professional chat assistant on the Rexity Labs website (rexity.ai).`,
    `Rexity Labs UG builds AI workspaces and automation for ambitious teams: websites & SaaS, mobile apps, business-process automation, AI voice & WhatsApp bots, testing & support, and SEO & AI video. Everything is built to be production-grade, DSGVO/GDPR-compliant and EU-hosted.`,
    ``,
    `RULES:`,
    `1. Answer ONLY using the Rexity CONTEXT below and the general positioning above. If the answer is not covered, say you don't have confirmed information on that and offer to connect them — do NOT invent facts, pricing, timelines, client names, or guarantees.`,
    `2. For demos, quotes, requirements, or booking a call, encourage the visitor to email ${DEMO_EMAIL}.`,
    `3. For refunds, billing disputes, contracts, legal or policy decisions, do not decide anything — direct them to ${ADMIN_EMAIL}.`,
    `4. Stay strictly on Rexity topics. Politely decline unrelated requests.`,
    `5. Reply in ${langName}. Keep it to 2–4 short sentences. No markdown headings, no bullet dumps unless asked.`,
    neverSay,
    ``,
    `CONTEXT (approved Rexity information):`,
    contextLines.join("\n")
  ].join("\n");
}

// ---- Retrieval: semantic (KbChunk/pgvector via Gemini embeddings) with
// keyword fallback. Both produce plain "- Title: text" context lines. --------

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

async function embedQuery(text) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=" + GEMINI_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text: text.slice(0, 1500) }] },
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: 1536
        }),
        signal: controller.signal
      }
    );
    if (!resp.ok) throw new Error("gemini embed " + resp.status);
    const data = await resp.json();
    const vec = data && data.embedding && data.embedding.values;
    if (!Array.isArray(vec) || vec.length !== 1536) throw new Error("bad embedding");
    return vec;
  } finally {
    clearTimeout(timer);
  }
}

async function retrieveSemantic(message, lang, limit) {
  const vec = await embedQuery(message);
  const resp = await fetch(SUPABASE_URL + "/rest/v1/rpc/match_kb_chunks", {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query_embedding: JSON.stringify(vec),
      match_count: limit || 4,
      locale_filter: lang
    })
  });
  if (!resp.ok) throw new Error("kb rpc " + resp.status);
  const rows = await resp.json();
  if (!Array.isArray(rows) || !rows.length) throw new Error("kb empty");
  return rows.map((r) => `- ${r.title}: ${r.text}`);
}

function retrieveKeywordLines(message, lang, limit) {
  const matches = retrieve(message, limit || 4);
  const list = matches.length ? matches : knowledge.entries.slice(0, 4);
  return list.map((e) => `- ${e.title}: ${e[lang] || e.en}`);
}

async function buildContext(message, lang) {
  if (SUPABASE_URL && SUPABASE_KEY && GEMINI_KEY) {
    try {
      const lines = await retrieveSemantic(message, lang, 4);
      return { lines: lines, retrieval: "vector" };
    } catch (error) {
      console.error("[chat] semantic retrieval failed:", error && error.message);
    }
  }
  return { lines: retrieveKeywordLines(message, lang, 4), retrieval: "keyword" };
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "bot") && m.content)
    .slice(-6)
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content).slice(0, 800)
    }));
}

async function callDeepSeek(messages) {
  if (typeof fetch !== "function") throw new Error("fetch unavailable");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);
  try {
    const resp = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + DEEPSEEK_KEY
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: messages,
        temperature: 0.3,
        max_tokens: 500,
        stream: false
      }),
      signal: controller.signal
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      throw new Error("DeepSeek " + resp.status + " " + detail.slice(0, 200));
    }
    const data = await resp.json();
    const answer =
      data && data.choices && data.choices[0] && data.choices[0].message &&
      data.choices[0].message.content;
    if (!answer || !String(answer).trim()) throw new Error("Empty DeepSeek response");
    return String(answer).trim();
  } finally {
    clearTimeout(timer);
  }
}

// ---- handler ----------------------------------------------------------------

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 16000) {
      res.statusCode = 413;
      res.end(JSON.stringify({ error: "Message too large" }));
      return;
    }
  }

  let message = "";
  let clientLang = null;
  let history = [];
  try {
    const parsed = JSON.parse(body || "{}");
    message = String(parsed.message || "").slice(0, 1000);
    clientLang = parsed.lang === "de" ? "de" : parsed.lang === "en" ? "en" : null;
    history = sanitizeHistory(parsed.history);
  } catch (_error) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Invalid request" }));
    return;
  }

  const lang = clientLang || detectLanguage(message);
  const text = normalize(message);

  // Empty / trivial input — no need to spend an LLM call.
  if (!text || text.length < 2) {
    res.statusCode = 200;
    res.end(JSON.stringify(composeAnswer(message, lang)));
    return;
  }

  // Safety guardrail stays deterministic: never let the model improvise on
  // refunds / billing / legal / contract decisions.
  if (includesAny(text, knowledge.rules.adminTopics)) {
    res.statusCode = 200;
    res.end(JSON.stringify({ answer: adminReply(lang), sources: ["admin"], engine: "guardrail" }));
    return;
  }

  // Primary path: grounded DeepSeek answer (semantic retrieval when the
  // KbChunk store + Gemini key are available, keyword retrieval otherwise).
  if (DEEPSEEK_KEY) {
    try {
      const ctx = await buildContext(message, lang);
      const messages = [
        { role: "system", content: buildSystemPrompt(lang, ctx.lines) },
        ...history,
        { role: "user", content: message }
      ];
      const answer = await callDeepSeek(messages);
      res.statusCode = 200;
      res.end(JSON.stringify({
        answer: answer,
        retrieval: ctx.retrieval,
        engine: "deepseek"
      }));
      return;
    } catch (error) {
      // fall through to retrieval — assistant must keep working
      console.error("[chat] DeepSeek failed:", error && error.message);
    }
  }

  // Fallback: deterministic retrieval.
  const fallback = composeAnswer(message, lang);
  res.statusCode = 200;
  res.end(JSON.stringify(Object.assign({ engine: "fallback" }, fallback)));
};
