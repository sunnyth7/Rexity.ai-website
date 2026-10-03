// api/_gemini.js — Gemini on Google Cloud Vertex AI through a regional endpoint in the EU (Sprint 41).
// Used by api/automation-check.js for the wording of the Automatisierungs-Check's analysis. No dependency.
// The file name starts with "_": Vercel does not turn it into a route.
//
//   POST https://{region}-aiplatform.googleapis.com/v1/projects/{project}/locations/{region}/publishers/google/models/{model}:generateContent
//   header x-goog-api-key
//
// Environment (all read from the process environment only; never logged):
//   GCP_VERTEX_API_KEY         the key; without it (or without the project) nothing is called
//   GCP_VERTEX_PROJECT         the Google Cloud project
//   GEMINI_REGION              default europe-west4. Only regions in EU member states are accepted: the name must
//                              start with "europe-", and europe-west2 (London) and europe-west6 (Zurich) are refused,
//                              because /datenschutz names an EU region. Any other value: no call at all.
//   GEMINI_MODEL               default gemini-2.5-pro
//   GEMINI_THINKING_BUDGET     default 128: the lowest value Gemini 2.5 Pro accepts; its thinking cannot be switched off
//   GEMINI_MAX_OUTPUT_TOKENS   default 4096
//   GEMINI_TIMEOUT_MS          default 25000, for the whole call including the one retry
//   GEMINI_PRICE               "input/output" in US dollars per million tokens, default "1.25/10" (list price for
//                              prompts up to 200,000 tokens; output includes the thinking tokens)
//   GEMINI_DAILY_USD_CEILING   default 3
//
// Google's documents, read on 3 Oct 2026 (docs/logs/sprint-41-autocheck.md has the quotes):
//   request and response fields   docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference
//   structured output             …/docs/multimodal/control-generated-output: responseMimeType "application/json" with a
//                                 responseSchema; supported schema fields are anyOf, enum (strings), format, items,
//                                 maximum, maxItems, minimum, minItems, nullable, properties, description,
//                                 propertyOrdering, required. Other fields are ignored (so no maxLength: the caller
//                                 checks lengths itself).
//   thinking                      …/docs/thinking: Gemini 2.5 Pro 128 to 32,768 tokens, default dynamic up to 8,192,
//                                 "You can't turn off thinking for Gemini 2.5 Pro", the budget is a soft limit,
//                                 thinking tokens are billed
//   prices                        cloud.google.com/vertex-ai/generative-ai/pricing: Gemini 2.5 Pro input 1.25 USD,
//                                 "Text output (response and reasoning)" 10 USD per million tokens (<= 200K input)
//   safety                        …/docs/multimodal/configure-safety-filters
//
// Daily ceiling of its own (the mechanism of the Claude ceiling in api/chat.js): every call first reserves its
// worst-case cost in a per-day counter and is made only when the reservation fits into GEMINI_DAILY_USD_CEILING.
// After the call the reservation is replaced by the estimate from the real token counts.
//   worst case = (UTF-8 bytes of the request + 100) × input price + (maxOutputTokens + 4 × thinking budget) × output price
//                (a token is at least one byte; the thinking budget is a soft limit, hence the factor)
//   Counter: Supabase, table chat_usage, bucket gemini:YYYY-MM-DD (Europe/Berlin), through public.gemini_budget_take
//   (docs/sql/auto_check.sql), which adds and compares in one statement. geministop:YYYY-MM-DD counts refusals.
//   Store configured but not usable (SQL not applied, error, no answer): NO call (fail closed).
//   No store configured at all (local runs, tests): the counter lives in this instance's memory.
// Logs: one line per call with status, token counts, estimated cost and duration. Never a prompt, an answer or a key.

const DEFAULT_REGION = "europe-west4";
const DEFAULT_MODEL = "gemini-2.5-pro";
const NON_EU = new Set(["europe-west2", "europe-west6"]); // London, Zurich
const env = (name) => String(process.env[name] || "").trim();
const numEnv = (name, def, min, max) => {
  const raw = env(name);
  if (!raw) return def;
  const v = parseFloat(raw.replace(",", "."));
  if (Number.isFinite(v) && v >= min && v <= max) return v;
  console.error("[gemini] " + name + " is not a number between " + min + " and " + max + ": the default " + def + " applies");
  return def;
};

const deps = {
  fetch: (...a) => fetch(...a),
  now: () => Date.now(),
  wait: (ms) => new Promise((r) => setTimeout(r, ms))
};

// -> { region } or { error }
function regionOf() {
  const r = (env("GEMINI_REGION") || DEFAULT_REGION).toLowerCase();
  if (!/^europe-[a-z]+[0-9]{1,2}$/.test(r) || NON_EU.has(r)) return { error: "GEMINI_REGION \"" + r.slice(0, 40) + "\" is not a region in an EU member state" };
  return { region: r };
}
function config() {
  const model = env("GEMINI_MODEL") || DEFAULT_MODEL;
  const price = (() => {
    const m = /^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(env("GEMINI_PRICE").replace(/,/g, "."));
    return m ? { inp: parseFloat(m[1]), out: parseFloat(m[2]), source: "GEMINI_PRICE" } : { inp: 1.25, out: 10, source: "list price (3 Oct 2026)" };
  })();
  return {
    key: env("GCP_VERTEX_API_KEY"), project: env("GCP_VERTEX_PROJECT"), ...regionOf(),
    model: /^gemini-[a-z0-9.-]{1,60}$/.test(model) ? model : DEFAULT_MODEL,
    thinkingBudget: Math.round(numEnv("GEMINI_THINKING_BUDGET", 128, 128, 32768)),
    maxOutputTokens: Math.round(numEnv("GEMINI_MAX_OUTPUT_TOKENS", 4096, 256, 16384)),
    timeoutMs: Math.round(numEnv("GEMINI_TIMEOUT_MS", 25000, 2000, 55000)),
    ceilingUsd: numEnv("GEMINI_DAILY_USD_CEILING", 3, 0, 1000),
    price
  };
}
// -> null when a call can be made, else the reason ("not_configured" | "region")
function unavailable(c) {
  const cfg = c || config();
  if (!cfg.key || !/^[a-z][a-z0-9-]{4,40}$/.test(cfg.project)) return "not_configured";
  if (cfg.error) return "region";
  return null;
}

function berlinDay() {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(deps.now())); }
  catch (_e) { return new Date(deps.now()).toISOString().slice(0, 10); }
}

// ---- the daily ceiling ---------------------------------------------------------------------------------------------
const SUPABASE_URL = () => env("SUPABASE_URL").replace(/\/+$/, "");
const SUPABASE_KEY = () => env("SUPABASE_SERVICE_ROLE_KEY");
const storeConfigured = () => Boolean(SUPABASE_URL() && SUPABASE_KEY());
const mem = { day: "", usd: 0, calls: 0, refused: 0, logged: false };
let offUntil = 0; // the ceiling's store answered with an error: no call on this instance until then
function today() {
  const d = berlinDay();
  if (mem.day !== d) { mem.day = d; mem.usd = 0; mem.calls = 0; mem.refused = 0; mem.logged = false; }
  return mem;
}
// -> row { granted, usd, calls, refused } of public.gemini_budget_take, or null (not usable)
async function budgetRpc(day, usd, limit) {
  const off = (reason) => {
    if (deps.now() >= offUntil) {
      offUntil = deps.now() + 10 * 60 * 1000;
      console.error("[gemini] ceiling counter unavailable (" + reason + "): no call on this instance for 10 minutes, the rule-based analysis answers (docs/sql/auto_check.sql applied?)");
    }
    return null;
  };
  if (deps.now() < offUntil) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1500);
  try {
    const resp = await deps.fetch(SUPABASE_URL() + "/rest/v1/rpc/gemini_budget_take", {
      method: "POST",
      headers: { apikey: SUPABASE_KEY(), Authorization: "Bearer " + SUPABASE_KEY(), "Content-Type": "application/json" },
      body: JSON.stringify({ p_day: day, p_usd: Math.round(usd * 1e6) / 1e6, p_limit: limit }),
      signal: ctrl.signal
    });
    if (!resp.ok) { await resp.text().catch(() => ""); return off("HTTP " + resp.status); }
    const data = await resp.json();
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object" || typeof row.granted !== "boolean") return off("unexpected response");
    return { granted: row.granted, usd: Number(row.usd) || 0, calls: Number(row.calls) || 0, refused: Number(row.refused) || 0 };
  } catch (e) {
    return off(e && e.name === "AbortError" ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }
}
function ceilingLog(m, spent, ceiling) {
  if (m.logged) return;
  m.logged = true;
  console.error("[gemini] daily ceiling reached (" + ceiling.toFixed(2) + " USD; estimated spend " + spent.toFixed(4) + " USD): no call until midnight Europe/Berlin, the rule-based analysis answers");
}
// -> { ok: true, day, usd (reserved), shared } or { ok: false, reason: "ceiling" | "store" }
async function reserve(worstUsd, ceilingUsd) {
  const m = today();
  const worst = Math.max(0, Number(worstUsd) || 0);
  if (!storeConfigured()) {
    if (m.usd + worst > ceilingUsd + 1e-9) { m.refused++; ceilingLog(m, m.usd, ceilingUsd); return { ok: false, reason: "ceiling" }; }
    m.usd += worst; // synchronous: calls running in parallel on this instance see each other's reservation
    m.calls++;
    return { ok: true, day: m.day, usd: worst, shared: false };
  }
  const row = await budgetRpc(m.day, worst, ceilingUsd);
  if (!row) return { ok: false, reason: "store" };
  m.usd = row.usd; m.calls = row.calls; m.refused = row.refused;
  if (!row.granted) {
    if (row.refused <= 1) ceilingLog(m, row.usd, ceilingUsd);
    return { ok: false, reason: "ceiling" };
  }
  return { ok: true, day: m.day, usd: worst, shared: true };
}
// Replaces a reservation by what the call cost (actualUsd), or keeps it (actualUsd null: unknown, e.g. a timeout).
async function settle(reservation, actualUsd) {
  if (!reservation || !reservation.ok || actualUsd === null || actualUsd === undefined) return;
  const delta = Math.max(0, Number(actualUsd) || 0) - reservation.usd;
  if (!delta) return;
  if (!reservation.shared) {
    const m = today();
    if (m.day === reservation.day) m.usd = Math.max(0, m.usd + delta);
    return;
  }
  const row = await budgetRpc(reservation.day, delta, null);
  const m = today();
  if (row && m.day === reservation.day) m.usd = row.usd;
}

// ---- cost ----------------------------------------------------------------------------------------------------------
const usageOf = (u) => ({
  prompt: Math.max(0, Number(u && u.promptTokenCount) || 0),
  thinking: Math.max(0, Number(u && u.thoughtsTokenCount) || 0),
  output: Math.max(0, Number(u && u.candidatesTokenCount) || 0),
  total: Math.max(0, Number(u && u.totalTokenCount) || 0)
});
const estimateUsd = (usage, price) => (usage.prompt * price.inp + (usage.thinking + usage.output) * price.out) / 1e6;
function worstUsd(body, cfg) {
  const bytes = Buffer.byteLength(JSON.stringify(body) || "", "utf8");
  return ((bytes + 100) * cfg.price.inp + (cfg.maxOutputTokens + 4 * cfg.thinkingBudget) * cfg.price.out) / 1e6;
}

// The four configurable categories at the documented REST default, set explicitly so the behaviour does not change
// with a model's own default. A blocked prompt or answer is reported as reason "blocked".
const SAFETY = ["HARM_CATEGORY_HATE_SPEECH", "HARM_CATEGORY_DANGEROUS_CONTENT", "HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_SEXUALLY_EXPLICIT"]
  .map((category) => ({ category, threshold: "BLOCK_MEDIUM_AND_ABOVE" }));

function requestBody({ system, user, schema, temperature }, cfg) {
  return {
    systemInstruction: { parts: [{ text: String(system || "") }] },
    contents: [{ role: "user", parts: [{ text: String(user || "") }] }],
    generationConfig: {
      temperature: typeof temperature === "number" ? temperature : 0.2,
      maxOutputTokens: cfg.maxOutputTokens,
      responseMimeType: "application/json",
      responseSchema: schema,
      thinkingConfig: { thinkingBudget: cfg.thinkingBudget }
    },
    safetySettings: SAFETY
  };
}

// One JSON answer. -> { ok: true, data, usage, usd, ms, model, region, finishReason }
//                  or { ok: false, reason, status?, usage?, usd?, ms }
// reason: not_configured | region | ceiling | store | http_<status> | timeout | network | blocked | cut | empty | json
async function generateJson({ system, user, schema, temperature, tag }) {
  const cfg = config();
  const label = String(tag || "gemini").replace(/[^a-z0-9-]/gi, "").slice(0, 20) || "gemini";
  const started = deps.now();
  const no = unavailable(cfg);
  if (no) {
    if (no === "region") console.error("[gemini] EU guard: " + cfg.error + ": no call");
    return { ok: false, reason: no, ms: 0 };
  }
  const body = requestBody({ system, user, schema, temperature }, cfg);
  const reservation = await reserve(worstUsd(body, cfg), cfg.ceilingUsd);
  if (!reservation.ok) return { ok: false, reason: reservation.reason, ms: deps.now() - started };
  const url = "https://" + cfg.region + "-aiplatform.googleapis.com/v1/projects/" + encodeURIComponent(cfg.project) + "/locations/" + cfg.region + "/publishers/google/models/" + encodeURIComponent(cfg.model) + ":generateContent";
  const deadline = started + cfg.timeoutMs;
  const log = (status, usage, usd, extra) => console.log("[gemini] tag=" + label + " model=" + cfg.model + " region=" + cfg.region + " status=" + status + " ms=" + (deps.now() - started) +
    (usage ? " prompt=" + usage.prompt + " thinking=" + usage.thinking + " output=" + usage.output : "") + (usd === null || usd === undefined ? "" : " usd=" + usd.toFixed(5) + " price=" + cfg.price.source.replace(/\s+/g, "_")) + (extra ? " " + extra : ""));
  let data = null;
  let failure = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const left = deadline - deps.now();
    if (left < 1500) { failure = failure || { reason: "timeout", billed: true }; break; }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), left);
    try {
      const resp = await deps.fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.key }, body: JSON.stringify(body), signal: ctrl.signal });
      if (!resp.ok) {
        await resp.text().catch(() => "");
        failure = { reason: "http_" + resp.status, status: resp.status, billed: false };
        // one retry on "too many requests" and on a server error
        if (attempt === 0 && (resp.status === 429 || resp.status >= 500)) { await deps.wait(Math.min(800, Math.max(0, deadline - deps.now() - 1500))); continue; }
        break;
      }
      data = await resp.json();
      failure = null;
      break;
    } catch (e) {
      // a timeout or a broken connection may have been billed: the reservation stays
      failure = { reason: e && e.name === "AbortError" ? "timeout" : "network", billed: true };
      break;
    } finally {
      clearTimeout(timer);
    }
  }
  if (failure) {
    await settle(reservation, failure.billed ? null : 0);
    log(failure.reason);
    return { ok: false, reason: failure.reason, status: failure.status, ms: deps.now() - started };
  }
  const usage = usageOf(data && data.usageMetadata);
  const counted = usage.prompt + usage.thinking + usage.output > 0;
  const usd = counted ? estimateUsd(usage, cfg.price) : null;
  await settle(reservation, usd);
  const cand = data && Array.isArray(data.candidates) ? data.candidates[0] : null;
  const finish = String((cand && cand.finishReason) || "");
  const out = (reason) => { log(reason, usage, usd, finish ? "finish=" + finish : ""); return { ok: false, reason, usage, usd, ms: deps.now() - started }; };
  if (!cand || (data.promptFeedback && data.promptFeedback.blockReason)) return out("blocked");
  if (/SAFETY|BLOCKLIST|PROHIBITED|SPII|RECITATION/.test(finish)) return out("blocked");
  const text = ((cand.content && cand.content.parts) || []).filter((p) => p && typeof p.text === "string" && !p.thought).map((p) => p.text).join("");
  if (finish === "MAX_TOKENS") return out("cut");
  if (!text.trim()) return out("empty");
  let parsed;
  try { parsed = JSON.parse(text); } catch (_e) { return out("json"); }
  log("ok", usage, usd, "finish=" + finish);
  return { ok: true, data: parsed, usage, usd, ms: deps.now() - started, model: cfg.model, region: cfg.region, finishReason: finish };
}

module.exports = { generateJson, config, unavailable, worstUsd, estimateUsd };
module.exports._test = { deps, mem, reserve, settle, today, requestBody, usageOf, regionOf, SAFETY, reset() { mem.day = ""; mem.usd = 0; mem.calls = 0; mem.refused = 0; mem.logged = false; offUntil = 0; } };
