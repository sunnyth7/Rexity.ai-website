// /api/lead — persists a website contact-form submission as a Lead row in
// Supabase (project ixzgyqiteepitseywqlc). Uses the service_role key over the
// REST API (no Prisma/npm — this is a no-build static site). The key lives in
// Vercel env and is NEVER exposed to the client.

const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

async function insertLead(lead) {
  const resp = await fetch(SUPABASE_URL + "/rest/v1/Lead", {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: "Bearer " + SERVICE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(lead)
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error("supabase " + resp.status + " " + detail.slice(0, 200));
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

  if (rateLimited(clientIp(req), 8, 10 * 60 * 1000)) {
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

  // Honeypot: real users never fill this hidden field. Pretend success so bots
  // get no signal, but write nothing.
  if (clip(data.company_website || data._gotcha, 100).trim()) {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Accept both the CF7 field names and plain ones.
  const name = clip(data.name || data["your-name"], 200).trim();
  const email = clip(data.email || data["your-email"], 200).trim();
  const subject = clip(data.subject || data["your-subject"], 300).trim();
  const message = clip(data.message || data["your-message"], 4000).trim();
  const phone = clip(data.phone, 60).trim();
  const company = clip(data.company, 200).trim();

  if (!name || !email) {
    res.statusCode = 422;
    res.end(JSON.stringify({ ok: false, error: "Name and email are required." }));
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.statusCode = 422;
    res.end(JSON.stringify({ ok: false, error: "Please enter a valid email address." }));
    return;
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[lead] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env");
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: "Server not configured." }));
    return;
  }

  const now = new Date().toISOString();
  const lead = {
    id: "web_" + crypto.randomUUID(),
    name: name,
    email: email,
    phone: phone || null,
    company: company || null,
    service: subject || null,
    message: message || null,
    source: "WEBSITE",
    updatedAt: now
  };

  try {
    await insertLead(lead);
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error("[lead] insert failed:", error && error.message);
    res.statusCode = 502;
    res.end(JSON.stringify({ ok: false, error: "Could not save your message. Please email hello@rexity.ai." }));
  }
};
