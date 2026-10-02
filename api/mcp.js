// /api/mcp (also /mcp, vercel.json rewrite) — the Website-Check as a tool for AI assistants (Sprint 30).
// A minimal, stateless Model Context Protocol server over the Streamable HTTP transport: every JSON-RPC request is
// one POST and gets one JSON object back. No session, no stream, no dependency. One tool: website_check.
//
// Specification used (modelcontextprotocol.io, read 2 Oct 2026):
//   2026-07-28 ("current"): basic/index (messages, resultType, error codes, _meta), basic/versioning (no handshake;
//     UnsupportedProtocolVersionError -32022; dual-era servers), basic/transports/streamable-http (POST only; Origin
//     check; the headers MCP-Protocol-Version, Mcp-Method, Mcp-Name mirror the body, mismatch = 400 with -32020;
//     unknown method = 404 with -32601; GET and DELETE = 405; session ids are ignored), server/discover, server/tools.
//   2025-06-18: basic/lifecycle (initialize / notifications/initialized), basic/transports (202 for notifications,
//     400 for an unsupported MCP-Protocol-Version header), server/tools.
// This server is "dual-era" as the 2026-07-28 versioning page describes it:
//   - a request that carries _meta["io.modelcontextprotocol/protocolVersion"] is served by the 2026-07-28 rules;
//   - an `initialize` request (and what follows it without that _meta) is served by the handshake rules. Versions
//     answered there: 2025-06-18, 2025-03-26, 2024-11-05. A client asking for another one (for example 2025-11-25,
//     whose text was not read for this implementation) is answered with 2025-06-18, as the lifecycle page prescribes.
// Not implemented because a single-response, stateless server does not need it: SSE streams, subscriptions/listen,
// sessions, resumability, authorization, structuredContent, pagination (one tool).
//
// The tool runs the same code as GET /api/check (api/check.js assistantCheck): the public tier as Markdown, the
// assistant limits (3 fresh checks per IP and hour, cached results free, a daily cap), no bot check.
// Origin: a request with an Origin header is accepted only from our own site, from the deployment's own host or
// from an origin listed in MCP_ALLOWED_ORIGINS (comma separated; "*" allows every origin). Assistants call from
// servers and send no Origin header.
// Logs: method, status and the checked host (through api/check.js); never an IP address.

const check = require("./check");

const MODERN = "2026-07-28";
const LEGACY = ["2025-06-18", "2025-03-26", "2024-11-05"];
const SUPPORTED = [MODERN, ...LEGACY];
const SERVER_INFO = { name: "rexity-website-check", title: "Rexity Website-Check", version: "1.0.0" };
const META_VERSION = "io.modelcontextprotocol/protocolVersion";
const META_CLIENT_CAPS = "io.modelcontextprotocol/clientCapabilities";
const META_SERVER = "io.modelcontextprotocol/serverInfo";
const MAX_BODY = 20000;

const L = check.LIMITS;
const INSTRUCTIONS =
  "Website-Check by Rexity Labs: checks one publicly reachable website in four areas (speed & technology, findability, readiness for enquiries, trust & legal) and returns scores from 0 to 100. " +
  "Use the tool website_check when a user asks how well a public website works for visitors and enquiries. It returns scores and one verdict line per area, not the single findings and no recommendations; " +
  "the full report is sent by e-mail to an address the user confirms on " + check.LINKS.page + ". A check can take up to about a minute.";

const TOOL = {
  name: "website_check",
  title: "Website-Check (Rexity Labs)",
  description:
    "Checks one public website and returns a Markdown summary: an overall score (0–100) with a band (good / medium / weak), the scores of four areas " +
    "(speed & technology, findability, readiness for enquiries, trust & legal), one verdict line per area, how many checks per area were met, partly met, open, notes or not checkable, " +
    "how speed was measured (with Lighthouse's four category scores and LCP, CLS, TBT when Lighthouse ran), the address and time of the check and the labels of the pages read. " +
    "It does not return the single findings and gives no advice; the full report with every check is sent by e-mail to an address the user confirms on " + check.LINKS.page + ". " +
    "Only public http/https websites on standard ports; IP addresses, internal hosts and sites whose owners opted out are refused. A fresh check takes up to about a minute; " +
    `results are cached for ${L.cacheHours} hours. Limits: ${L.api.freshPerIpPerHour} fresh checks per caller and hour and a daily cap for all callers; when a limit is reached the result says when to try again. ` +
    "The checker identifies itself as " + check.UA + ".",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "The address of the website to check, for example www.example.de or https://www.example.de/. Public websites only." },
      lang: { type: "string", enum: ["de", "en"], description: "Language of the result: de (German, default) or en (English)." }
    },
    required: ["url"],
    additionalProperties: false
  },
  annotations: { readOnlyHint: true, openWorldHint: true }
};

const headerOf = (req, name) => { const v = req.headers && req.headers[name]; return typeof v === "string" ? v : Array.isArray(v) ? v.join(", ") : ""; };
const OWN_HOSTS = new Set(["www.rexity.ai", "rexity.ai"]);
// -> "" (no Origin header), the allowed origin, or null (present and not allowed)
function allowedOrigin(req) {
  const origin = headerOf(req, "origin");
  if (!origin) return "";
  const list = String(process.env.MCP_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (list.includes("*") || list.includes(origin)) return origin;
  let host;
  try { host = new URL(origin).host.toLowerCase(); } catch (_e) { return null; }
  const own = (headerOf(req, "x-forwarded-host") || headerOf(req, "host")).toLowerCase();
  return OWN_HOSTS.has(host) || (own && host === own) ? origin : null;
}
// "=?base64?…?=" (Value Encoding of the 2026-07-28 transport) -> the plain value
function decodeHeaderValue(v) {
  const m = /^=\?base64\?(.*)\?=$/.exec(v);
  if (!m) return v;
  try { return Buffer.from(m[1], "base64").toString("utf8"); } catch (_e) { return v; }
}

function reply(res, status, payload, headers) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(headers || {})) res.setHeader(k, v);
  if (payload === null) return res.end();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(payload));
}
const rpcError = (id, code, message, data) => {
  const out = { jsonrpc: "2.0", error: { code, message } };
  if (id !== undefined && id !== null) out.id = id;
  if (data !== undefined) out.error.data = data;
  return out;
};

async function callTool(params, req, modern) {
  const args = params && typeof params.arguments === "object" && params.arguments && !Array.isArray(params.arguments) ? params.arguments : {};
  const lang = String(args.lang || "").toLowerCase().startsWith("en") ? "en" : "de";
  const done = (text, isError) => (modern ? { resultType: "complete", content: [{ type: "text", text }], isError, _meta: { [META_SERVER]: SERVER_INFO } } : { content: [{ type: "text", text }], isError });
  if (typeof args.url !== "string" || !args.url.trim()) {
    return done(lang === "en" ? "The argument url is missing: the address of the website to check, for example www.example.de." : "Das Argument url fehlt: die Adresse der Website, die geprüft werden soll, zum Beispiel www.example.de.", true);
  }
  const r = await check.assistantCheck({ url: args.url, lang, ip: check.clientIp(req), via: "mcp" }); // via: counted as an MCP call (Sprint 34)
  if (r.status === 200) return done(check.publicMarkdown(r.body), false);
  const retry = r.headers && r.headers["Retry-After"];
  const wait = retry ? (lang === "en" ? ` Try again in about ${Math.ceil(Number(retry) / 60)} minutes.` : ` Bitte in etwa ${Math.ceil(Number(retry) / 60)} Minuten erneut versuchen.`) : "";
  return done(`${r.body.message}${wait} (${r.body.error})`, true);
}

async function handler(req, res) {
  const origin = allowedOrigin(req);
  if (origin === null) return reply(res, 403, rpcError(null, -32600, "Origin not allowed"));
  const cors = origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};

  if (req.method === "OPTIONS") {
    return reply(res, 204, null, { ...cors, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Session-Id", "Access-Control-Max-Age": "86400" });
  }
  // No stream to listen to and no session to end: GET and DELETE are not offered.
  if (req.method !== "POST") return reply(res, 405, rpcError(null, -32600, "Method not allowed: this MCP endpoint accepts POST only"), { ...cors, Allow: "POST, OPTIONS" });

  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > MAX_BODY) return reply(res, 413, rpcError(null, -32600, "Request too large"), cors);
  }
  let msg;
  try { msg = JSON.parse(body); } catch (_e) { return reply(res, 400, rpcError(null, -32700, "Parse error"), cors); }
  if (!msg || typeof msg !== "object" || Array.isArray(msg) || msg.jsonrpc !== "2.0") return reply(res, 400, rpcError(null, -32600, "Invalid Request: one JSON-RPC 2.0 message per POST"), cors);

  // A response or a notification from the client: accepted, nothing to answer.
  if (typeof msg.method !== "string") return reply(res, 202, null, cors);
  const id = msg.id;
  if (id === undefined || id === null) return reply(res, 202, null, cors);
  if (typeof id !== "string" && typeof id !== "number") return reply(res, 400, rpcError(null, -32600, "Invalid Request: id must be a string or a number"), cors);

  const params = msg.params && typeof msg.params === "object" && !Array.isArray(msg.params) ? msg.params : {};
  const meta = params._meta && typeof params._meta === "object" ? params._meta : null;
  const headerVersion = headerOf(req, "mcp-protocol-version").trim();
  const metaVersion = meta && typeof meta[META_VERSION] === "string" ? meta[META_VERSION] : "";
  const unsupported = (requested) => reply(res, 400, rpcError(id, -32022, "Unsupported protocol version", { supported: SUPPORTED, requested }), cors);

  // ---- 2026-07-28: every request names its version; no handshake ----
  if (metaVersion || headerVersion === MODERN) {
    if (!metaVersion) return reply(res, 400, rpcError(id, -32602, `Invalid params: _meta["${META_VERSION}"] is required`), cors);
    if (metaVersion !== MODERN) return unsupported(metaVersion);
    if (!headerVersion) return reply(res, 400, rpcError(id, -32020, "Header mismatch: the MCP-Protocol-Version header is missing"), cors);
    if (headerVersion !== metaVersion) return reply(res, 400, rpcError(id, -32020, `Header mismatch: MCP-Protocol-Version header value '${headerVersion.slice(0, 40)}' does not match body value '${metaVersion}'`), cors);
    const hMethod = headerOf(req, "mcp-method").trim();
    if (!hMethod) return reply(res, 400, rpcError(id, -32020, "Header mismatch: the Mcp-Method header is missing"), cors);
    if (hMethod !== msg.method) return reply(res, 400, rpcError(id, -32020, `Header mismatch: Mcp-Method header value '${hMethod.slice(0, 60)}' does not match body value '${msg.method.slice(0, 60)}'`), cors);
    if (!meta[META_CLIENT_CAPS] || typeof meta[META_CLIENT_CAPS] !== "object") return reply(res, 400, rpcError(id, -32602, `Invalid params: _meta["${META_CLIENT_CAPS}"] is required`), cors);
    const withMeta = (result) => ({ jsonrpc: "2.0", id, result: { resultType: "complete", ...result, _meta: { [META_SERVER]: SERVER_INFO } } });
    if (msg.method === "server/discover") return reply(res, 200, withMeta({ supportedVersions: SUPPORTED, capabilities: { tools: {} }, instructions: INSTRUCTIONS, ttlMs: 3600000, cacheScope: "public" }), cors);
    if (msg.method === "tools/list") return reply(res, 200, withMeta({ tools: [TOOL], ttlMs: 3600000, cacheScope: "public" }), cors);
    if (msg.method === "ping") return reply(res, 200, withMeta({}), cors);
    if (msg.method === "tools/call") {
      const hName = decodeHeaderValue(headerOf(req, "mcp-name").trim());
      if (!hName) return reply(res, 400, rpcError(id, -32020, "Header mismatch: the Mcp-Name header is missing"), cors);
      if (hName !== String(params.name)) return reply(res, 400, rpcError(id, -32020, `Header mismatch: Mcp-Name header value '${hName.slice(0, 60)}' does not match body value '${String(params.name).slice(0, 60)}'`), cors);
      if (params.name !== TOOL.name) return reply(res, 400, rpcError(id, -32602, "Unknown tool: " + String(params.name).slice(0, 60)), cors);
      return reply(res, 200, { jsonrpc: "2.0", id, result: await callTool(params, req, true) }, cors);
    }
    return reply(res, 404, rpcError(id, -32601, "Method not found: " + msg.method.slice(0, 60)), cors);
  }

  // ---- handshake-based versions (2025-06-18 and earlier) ----
  if (headerVersion && !LEGACY.includes(headerVersion)) return unsupported(headerVersion);
  const ok = (result) => reply(res, 200, { jsonrpc: "2.0", id, result }, cors);
  if (msg.method === "initialize") {
    const asked = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
    return ok({ protocolVersion: LEGACY.includes(asked) ? asked : LEGACY[0], capabilities: { tools: { listChanged: false } }, serverInfo: SERVER_INFO, instructions: INSTRUCTIONS });
  }
  if (msg.method === "ping") return ok({});
  if (msg.method === "tools/list") return ok({ tools: [TOOL] });
  if (msg.method === "tools/call") {
    if (params.name !== TOOL.name) return reply(res, 200, rpcError(id, -32602, "Unknown tool: " + String(params.name).slice(0, 60)), cors);
    return ok(await callTool(params, req, false));
  }
  if (msg.method === "server/discover") return reply(res, 400, rpcError(id, -32602, `Invalid params: _meta["${META_VERSION}"] is required (supported: ${SUPPORTED.join(", ")})`), cors);
  return reply(res, 200, rpcError(id, -32601, "Method not found: " + msg.method.slice(0, 60)), cors);
}

module.exports = handler;
module.exports._test = { TOOL, SERVER_INFO, SUPPORTED, MODERN, LEGACY, INSTRUCTIONS, allowedOrigin, decodeHeaderValue };
