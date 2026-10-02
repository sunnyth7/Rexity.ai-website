// api/_notify.js — lead email notification via Brevo (Sendinblue; EU-hosted,
// France). The leading underscore keeps Vercel from exposing this file as a
// function; it is only required by /api/lead and /api/book.
//
// Inactive until BREVO_API_KEY is set: without it notifyLead() returns
// {sent:false, reason:"not_configured"} and does nothing.
//
// Privacy: never log names, emails, phone numbers or message text here —
// only metadata (kind, sent true/false, HTTP status).
//
// IMPORTANT (Brevo account settings): link tracking and open tracking MUST be
// disabled in Brevo (Transactional > Settings > Tracking). This code adds no
// tracking pixels, but Brevo applies account-
// level tracking to transactional mail unless it is turned off there.

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const TIMEOUT_MS = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SIGNATURE_TEXT = [
  "Rexity Labs UG (haftungsbeschränkt)",
  "info@rexity.ai",
  "+49 174 2471435",
  "www.rexity.ai"
].join("\n");

function escapeHtml(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function str(v) {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

function berlinTime(d) {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      dateStyle: "medium",
      timeStyle: "short"
    }).format(d) + " (Europe/Berlin)";
  } catch (_e) {
    return d.toISOString();
  }
}

async function brevoSend(apiKey, payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });
    let detail = "";
    if (!resp.ok) {
      // Brevo returns {code, message}; neither contains the key.
      try {
        const j = await resp.json();
        detail = String((j && j.code) || "") + ": " + String((j && j.message) || "").slice(0, 200);
      } catch (_e) { /* ignore */ }
    }
    return { ok: resp.ok, status: resp.status, detail: detail };
  } finally {
    clearTimeout(timer);
  }
}

function internalMail(f, sender, to) {
  const rows = [
    ["Art", f.kind],
    ["Name", f.name],
    ["E-Mail", f.email],
    ["Telefon", f.phone],
    ["Firma", f.company],
    ["Leistung / Betreff", f.service],
    ["Wunschtermin", f.start],
    ["Sprache", f.lang],
    ["Seite", f.source],
    ["Eingegangen", f.receivedAt],
    ["Nachricht", f.message]
  ].filter(([, v]) => v);

  const text = rows.map(([k, v]) => k + ": " + v).join("\n");
  const html =
    "<p>Neue Anfrage über die Website:</p>" +
    '<table cellpadding="4" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">' +
    rows
      .map(([k, v]) =>
        '<tr><td style="vertical-align:top;font-weight:bold">' + escapeHtml(k) +
        '</td><td style="white-space:pre-wrap">' + escapeHtml(v) + "</td></tr>")
      .join("") +
    "</table>";

  const payload = {
    sender: sender,
    to: [{ email: to }],
    subject: "Neue Anfrage: " + (f.name || "Unbekannt") + " (" + (f.kind || "lead") + ")",
    textContent: text,
    htmlContent: html
  };
  if (f.email && EMAIL_RE.test(f.email)) payload.replyTo = { email: f.email, name: f.name || undefined };
  return payload;
}

function confirmationMail(f, sender, replyTo) {
  const en = f.lang === "en";
  const subject = en ? "Thanks for contacting Rexity Labs" : "Danke für Ihre Anfrage bei Rexity Labs";
  const greeting = en
    ? "Dear " + (f.name || "Sir or Madam") + ","
    : (f.name ? "Guten Tag " + f.name + "," : "Sehr geehrte Damen und Herren,");
  const intro = en
    ? "thank you for your enquiry. We have received it and will reply within one working day."
    : "vielen Dank für Ihre Anfrage. Wir haben sie erhalten und melden uns innerhalb eines Werktages bei Ihnen.";
  const startLine = f.start ? (en ? "Requested appointment: " : "Wunschtermin: ") + f.start : "";
  const msgLabel = en ? "Your message:" : "Ihre Nachricht:";
  const closing = en ? "Kind regards" : "Mit freundlichen Grüßen";

  const textParts = [greeting, "", intro];
  if (startLine) textParts.push("", startLine);
  if (f.message) textParts.push("", msgLabel, f.message);
  textParts.push("", closing, "", SIGNATURE_TEXT);

  let html =
    '<div style="font-family:sans-serif;font-size:14px;line-height:1.5">' +
    "<p>" + escapeHtml(greeting) + "</p><p>" + escapeHtml(intro) + "</p>";
  if (startLine) html += "<p>" + escapeHtml(startLine) + "</p>";
  if (f.message) {
    html += "<p>" + escapeHtml(msgLabel) + "</p>" +
      '<blockquote style="margin:0 0 1em 0;padding-left:12px;border-left:3px solid #ccc;white-space:pre-wrap">' +
      escapeHtml(f.message) + "</blockquote>";
  }
  html += "<p>" + escapeHtml(closing) + "</p><p>" +
    SIGNATURE_TEXT.split("\n").map(escapeHtml).join("<br>") + "</p></div>";

  return {
    sender: sender,
    to: [{ email: f.email, name: f.name || undefined }],
    replyTo: replyTo,
    subject: subject,
    textContent: textParts.join("\n"),
    htmlContent: html
  };
}

// opts.confirmation === false: only the internal mail (Sprint 27: the Website-Check sends its own report mail to
// the visitor through sendMail(); the standard "we reply within one working day" confirmation would be wrong there).
async function notifyLead(input, opts) {
  const apiKey = str(process.env.BREVO_API_KEY);
  if (!apiKey) return { sent: false, reason: "not_configured" };
  // Key shape only (never the value), to tell an API key from an SMTP/MCP key.
  const keyShape = /^xkeysib-/.test(apiKey) ? "api" : /^xsmtpsib-/.test(apiKey) ? "smtp" : "other";

  const i = input || {};
  const f = {
    kind: str(i.kind) || "lead",
    name: str(i.name),
    email: str(i.email),
    phone: str(i.phone),
    company: str(i.company),
    message: str(i.message),
    service: str(i.service),
    start: str(i.start),
    source: str(i.source),
    lang: str(i.lang).toLowerCase().startsWith("en") ? "en" : "de",
    receivedAt: berlinTime(new Date())
  };

  const fromEmail = str(process.env.LEAD_NOTIFY_FROM) || "info@rexity.ai";
  const toEmail = str(process.env.LEAD_NOTIFY_TO) || "info@rexity.ai";
  const sender = { name: "Rexity Labs UG", email: fromEmail };

  const result = { sent: false, internal: null, confirmation: null };
  try {
    const r1 = await brevoSend(apiKey, internalMail(f, sender, toEmail));
    result.internal = r1.status;
    console.log("[notify] kind=" + f.kind + " mail=internal sent=" + r1.ok + " status=" + r1.status + (r1.ok ? "" : " key=" + keyShape + " detail=" + r1.detail));

    if (f.email && EMAIL_RE.test(f.email) && !(opts && opts.confirmation === false)) {
      const r2 = await brevoSend(apiKey, confirmationMail(f, { name: "Rexity Labs UG", email: fromEmail }, { email: toEmail }));
      result.confirmation = r2.status;
      console.log("[notify] kind=" + f.kind + " mail=confirmation sent=" + r2.ok + " status=" + r2.status + (r2.ok ? "" : " detail=" + r2.detail));
    }

    result.sent = r1.ok;
    if (!r1.ok) result.reason = "http_" + r1.status;
    return result;
  } catch (err) {
    const reason = err && err.name === "AbortError" ? "timeout" : "fetch_error";
    console.log("[notify] kind=" + f.kind + " sent=false reason=" + reason);
    return { sent: false, reason: reason };
  }
}

// Sprint 27: one transactional mail to a visitor who asked for it (the Website-Check report), same Brevo account,
// sender and reply-to as the confirmation mail. -> { sent, status?, reason? }. Logs metadata only.
async function sendMail(m) {
  const apiKey = str(process.env.BREVO_API_KEY);
  if (!apiKey) return { sent: false, reason: "not_configured" };
  const to = str(m && m.to);
  if (!EMAIL_RE.test(to)) return { sent: false, reason: "bad_address" };
  const fromEmail = str(process.env.LEAD_NOTIFY_FROM) || "info@rexity.ai";
  const toEmail = str(process.env.LEAD_NOTIFY_TO) || "info@rexity.ai";
  try {
    const payload = {
      sender: { name: "Rexity Labs UG", email: fromEmail },
      to: [{ email: to }],
      replyTo: { email: toEmail },
      subject: str(m.subject).slice(0, 200),
      textContent: String(m.textContent || ""),
      htmlContent: String(m.htmlContent || "")
    };
    // Sprint 34: optional mail headers (the follow-up mail's List-Unsubscribe / List-Unsubscribe-Post). Plain
    // one-line values only.
    if (m.headers && typeof m.headers === "object") {
      const headers = {};
      for (const [k, v] of Object.entries(m.headers)) if (/^[A-Za-z][A-Za-z0-9-]{0,60}$/.test(k) && typeof v === "string" && v.length <= 2500 && !/[\r\n]/.test(v)) headers[k] = v;
      if (Object.keys(headers).length) payload.headers = headers;
    }
    const r = await brevoSend(apiKey, payload);
    console.log("[notify] mail=report sent=" + r.ok + " status=" + r.status + (r.ok ? "" : " detail=" + r.detail));
    return r.ok ? { sent: true, status: r.status } : { sent: false, status: r.status, reason: "http_" + r.status };
  } catch (err) {
    const reason = err && err.name === "AbortError" ? "timeout" : "fetch_error";
    console.log("[notify] mail=report sent=false reason=" + reason);
    return { sent: false, reason: reason };
  }
}

module.exports = { notifyLead, escapeHtml, sendMail };
