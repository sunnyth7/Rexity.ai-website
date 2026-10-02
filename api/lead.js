// /api/lead — persists a website contact-form / chatbot-gate submission as a
// Lead row in Supabase (project ixzgyqiteepitseywqlc, the dedicated Rexity
// backend). Uses the service_role key over the REST API (RLS is deny-by-
// default on every table; service_role bypasses it). No Prisma/npm — this is
// a no-build static site. The key lives in Vercel env, never client-side.

const crypto = require("crypto");
const { notifyLead, sendMail, escapeHtml } = require("./_notify");

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

// Per-instance global ceiling: caps total lead inserts per warm instance per
// minute, so a distributed bot (many IPs each under the per-IP limit) can't
// flood the Lead table without bound.
const GLOBAL_LEAD_CEILING = 40;
const globalHits = [];
function globalCeilingExceeded() {
  const now = Date.now();
  while (globalHits.length && now - globalHits[0] > 60000) globalHits.shift();
  if (globalHits.length >= GLOBAL_LEAD_CEILING) return true;
  globalHits.push(now);
  return false;
}

// Cloudflare Turnstile: api/_turnstile.js (shared with the Website-Check, api/check.js).
const { verifyTurnstile, turnstileSecret } = require("./_turnstile");
const TURNSTILE_SECRET = turnstileSecret();

function refererPath(req) {
  try {
    const ref = req.headers["referer"] || req.headers["referrer"];
    return typeof ref === "string" && ref ? new URL(ref).pathname : "";
  } catch (_e) {
    return "";
  }
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

  if (rateLimited(clientIp(req), 8, 10 * 60 * 1000) || globalCeilingExceeded()) {
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

  // ---- Chat transcript (founder, 2 Oct 2026): the widget sends what the visitor chatted, with the e-mail
  // address from the entry form. One internal mail to us; nothing goes to the visitor and nothing is stored
  // in the database. Never log the content.
  if (data.kind === "chat-transcript") {
    const tEmail = clip(data.email, 200).trim();
    const turns = (Array.isArray(data.transcript) ? data.transcript : []).slice(-60)
      .map((m) => (m && typeof m.content === "string" ? { who: m.role === "user" ? "Besucher" : "Assistent", text: m.content.slice(0, 1500) } : null))
      .filter(Boolean);
    // the address is optional since 2 Oct 2026 (founder): an empty one is fine, a malformed one is not
    if ((tEmail && !EMAIL_RE.test(tEmail)) || !turns.some((m) => m.who === "Besucher")) {
      res.statusCode = 422;
      res.end(JSON.stringify({ ok: false, error: "Nothing to send." }));
      return;
    }
    const noMk = data.noMarketing === true;
    const head = ["Chat-Verlauf von der Website", "E-Mail des Besuchers: " + (tEmail || "nicht angegeben"), "Kein Marketing-Kontakt gewünscht: " + (noMk ? "ja" : "nein"), "Seite: " + (refererPath(req) || "-"), ""];
    const text = head.concat(turns.map((m) => m.who + ": " + m.text)).join("\n");
    const html = "<p>" + head.slice(0, 4).map(escapeHtml).join("<br>") + "</p>" + turns.map((m) => "<p><strong>" + m.who + ":</strong> " + escapeHtml(m.text).replace(/\n/g, "<br>") + "</p>").join("");
    const to = String(process.env.LEAD_NOTIFY_TO || "info@rexity.ai").trim();
    const r = await sendMail({ to: to, subject: "Chat-Verlauf: " + (tEmail || "ohne E-Mail-Adresse"), textContent: text, htmlContent: html });
    res.statusCode = r.sent || r.reason === "not_configured" ? 200 : 502;
    res.end(JSON.stringify({ ok: r.sent === true }));
    return;
  }

  // Accept both the CF7 field names and plain ones.
  const name = clip(data.name || data["your-name"], 200).trim();
  const email = clip(data.email || data["your-email"], 200).trim();
  const subject = clip(data.subject || data["your-subject"], 300).trim();
  const message = clip(data.message || data["your-message"], 4000).trim();
  const phone = clip(data.phone, 60).trim();
  const company = clip(data.company, 200).trim();
  const service = clip(data.service, 300).trim();
  const isChat = service === "Chatbot";

  // Bot protection (Cloudflare Turnstile, api/_turnstile.js). Active only when TURNSTILE_SECRET_KEY is set in Vercel.
  // Sprint 31: then EVERY lead submission needs a valid token: the chat's entry form and its hand-over form (service
  // "Chatbot", rexity-chatbot.js) and the contact form (form[data-rx-form="lead"], assets/js/rexity.js). The one
  // exception is the chat transcript above: it is sent with navigator.sendBeacon when the page is left and cannot
  // carry a token (it writes nothing to the database and mails only us). Without the secret the honeypot and the
  // rate limits above remain the protection.
  if (TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(clip(data.turnstileToken, 4000), clientIp(req));
    if (!ok) {
      console.log("[lead] bot check refused a " + (isChat ? "chat" : "contact-form") + " submission");
      res.statusCode = 403;
      res.end(JSON.stringify({ ok: false, code: "bot_check", error: "Bot check failed. Please try again." }));
      return;
    }
  }

  // Chat started without an e-mail address (founder, 2 Oct 2026): the bot check above has passed; nothing is
  // stored and nothing is mailed.
  if (data.kind === "chat-start") {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Contact-form leads carry an email; chatbot-gate leads carry a phone.
  if (!name || (!email && !phone)) {
    res.statusCode = 422;
    res.end(JSON.stringify({ ok: false, error: "Name and email or phone are required." }));
    return;
  }
  if (email && !EMAIL_RE.test(email)) {
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
    email: email || null,
    phone: phone || null,
    company: company || null,
    service: service || subject || null,
    message: message || null,
    source: "WEBSITE",
    updatedAt: now
  };

  try {
    await insertLead(lead);
    // Email notification must never affect the client response.
    try {
      await notifyLead({
        kind: isChat || (phone && !email) ? "chatbot" : "kontakt",
        name: name,
        email: email,
        phone: phone,
        company: company,
        message: message,
        service: service || subject,
        source: refererPath(req),
        lang: clip(data.lang, 10)
      }, isChat ? { confirmation: false } : undefined); // chat: no mail to the visitor (founder, 2 Oct 2026)
    } catch (_e) { /* notifyLead never throws; belt and braces */ }
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error("[lead] insert failed:", error && error.message);
    res.statusCode = 502;
    res.end(JSON.stringify({ ok: false, error: "Could not save your message. Please email info@rexity.ai." }));
  }
};
// Sprint 27: the Website-Check (api/check.js) stores its report requests through the same insert.
module.exports.insertLead = insertLead;
module.exports.verifyTurnstile = verifyTurnstile;
