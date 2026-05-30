const fs = require("fs");
const path = require("path");

const knowledgePath = path.join(process.cwd(), "data", "rexity-knowledge.json");
const knowledge = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));

const ADMIN_EMAIL = knowledge.brand.contact.admin;
const DEMO_EMAIL = knowledge.brand.contact.demo;

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

function retrieve(message) {
  return knowledge.entries
    .map((entry) => ({ entry, score: scoreEntry(message, entry) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
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

function composeAnswer(message) {
  const lang = detectLanguage(message);
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

  const lines = matches.slice(0, 1).map((entry) => entry[lang] || entry.en);
  const answer = lines.join(" ");

  return {
    answer,
    sources: matches.map((entry) => entry.id)
  };
}

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
    if (body.length > 12000) {
      res.statusCode = 413;
      res.end(JSON.stringify({ error: "Message too large" }));
      return;
    }
  }

  try {
    const parsed = JSON.parse(body || "{}");
    const message = String(parsed.message || "").slice(0, 1000);
    const result = composeAnswer(message);
    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch (_error) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Invalid request" }));
  }
};
