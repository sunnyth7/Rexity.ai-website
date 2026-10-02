// Cloudflare Turnstile, server side (shared by api/lead.js: the chat's entry form, and api/check.js: the
// Website-Check). Active only when TURNSTILE_SECRET_KEY is set in Vercel; the callers decide what happens without it.
// The file name starts with "_": Vercel does not turn it into a route.

const turnstileSecret = () => String(process.env.TURNSTILE_SECRET_KEY || "").trim();

// -> true only when Cloudflare confirms the token. A missing token, a refusal, a timeout or an error is false.
async function verifyTurnstile(token, ip) {
  const secret = turnstileSecret();
  if (!token || !secret) return false;
  try {
    const body = new URLSearchParams({ secret, response: String(token).slice(0, 4000) });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, signal: AbortSignal.timeout(5000) });
    const j = await r.json();
    return Boolean(j && j.success);
  } catch (_e) {
    console.error("[turnstile] verification unavailable");
    return false;
  }
}

module.exports = { verifyTurnstile, turnstileSecret };
