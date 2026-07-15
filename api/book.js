// /api/book — persists a "Termin buchen" appointment request in Supabase
// (same project/tables as /api/lead): one Lead row (pipeline) plus one linked
// Appointment row (startTime/endTime, status PENDING). Service-role key over
// the REST API; the key lives in Vercel env and is NEVER exposed to the client.

const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLOT_MINUTES = 45;

function clip(v, n) {
  return typeof v === "string" ? v.slice(0, n) : "";
}

// Best-effort per-IP spam protection (in-memory; resets on cold start).
const rateBuckets = new Map();
function rateLimited(ip, limit, windowMs) {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) { rateBuckets.set(ip, hits); return true; }
  hits.push(now);
  rateBuckets.set(ip, hits);
  if (rateBuckets.size > 5000) rateBuckets.clear();
  return false;
}
function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  return (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") || req.socket.remoteAddress || "unknown";
}

const GLOBAL_BOOK_CEILING = 20;
const globalHits = [];
function globalCeilingExceeded() {
  const now = Date.now();
  while (globalHits.length && now - globalHits[0] > 60000) globalHits.shift();
  if (globalHits.length >= GLOBAL_BOOK_CEILING) return true;
  globalHits.push(now);
  return false;
}

async function insertRow(table, row) {
  const resp = await fetch(SUPABASE_URL + "/rest/v1/" + table, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: "Bearer " + SERVICE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(row)
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error("supabase " + table + " " + resp.status + " " + detail.slice(0, 200));
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
    return;
  }

  if (rateLimited(clientIp(req), 5, 10 * 60 * 1000) || globalCeilingExceeded()) {
    res.statusCode = 429;
    res.setHeader("Retry-After", "300");
    res.end(JSON.stringify({ ok: false, error: "Too many requests. Please try again later." }));
    return;
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 20000) {
      res.statusCode = 413;
      res.end(JSON.stringify({ ok: false, error: "Payload too large" }));
      return;
    }
  }

  let data;
  try {
    data = JSON.parse(body || "{}");
  } catch (_e) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
    return;
  }

  // Honeypot: real users never fill this hidden field.
  if (clip(data.company_website || data._gotcha, 100).trim()) {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  const name = clip(data.name, 200).trim();
  const email = clip(data.email, 200).trim();
  const phone = clip(data.phone, 60).trim();
  const message = clip(data.message, 4000).trim();
  const startRaw = clip(data.start, 40).trim();

  if (!name || !email || !EMAIL_RE.test(email)) {
    res.statusCode = 422;
    res.end(JSON.stringify({ ok: false, error: "Name and a valid email are required." }));
    return;
  }
  const start = new Date(startRaw);
  if (!startRaw || isNaN(start.getTime())) {
    res.statusCode = 422;
    res.end(JSON.stringify({ ok: false, error: "Please pick a preferred date and time." }));
    return;
  }
  if (start.getTime() < Date.now() - 60 * 60 * 1000 || start.getTime() > Date.now() + 366 * 24 * 60 * 60 * 1000) {
    res.statusCode = 422;
    res.end(JSON.stringify({ ok: false, error: "Please pick a date in the future (within a year)." }));
    return;
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[book] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env");
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: "Server not configured." }));
    return;
  }

  const now = new Date().toISOString();
  const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
  const leadId = "web_" + crypto.randomUUID();

  const lead = {
    id: leadId,
    name: name,
    email: email,
    phone: phone || null,
    service: "Terminanfrage",
    message: message || null,
    source: "WEBSITE",
    updatedAt: now
  };
  const appointment = {
    id: "apt_" + crypto.randomUUID(),
    leadId: leadId,
    clientName: name,
    clientEmail: email,
    clientPhone: phone || null,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    status: "PENDING",
    source: "WEBSITE",
    notesSummary: message ? message.slice(0, 1000) : null,
    idempotencyKey: "web_" + crypto.createHash("sha256").update(email + "|" + start.toISOString()).digest("hex").slice(0, 40),
    updatedAt: now
  };

  try {
    await insertRow("Lead", lead);
    await insertRow("Appointment", appointment);
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    // Duplicate idempotency key = same person re-submitting the same slot;
    // treat as success rather than surfacing an error.
    if (/23505|duplicate/i.test(String(error && error.message))) {
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    console.error("[book] insert failed:", error && error.message);
    res.statusCode = 502;
    res.end(JSON.stringify({ ok: false, error: "Could not save your booking. Please email hello@rexity.ai." }));
  }
};
