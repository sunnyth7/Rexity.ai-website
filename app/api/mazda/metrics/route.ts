// /app/api/mazda/metrics/route.ts
import { NextResponse } from "next/server";

function jsonTryParse(t: string) {
  try { return JSON.parse(t); } catch { return null; }
}

// Normalize any plausible shape from n8n into { ok, notifs, kpis }
function normalize(data: any) {
  if (!data) return { ok: false, notifs: [], kpis: [] };

  // Our designed payload
  if (typeof data === "object" && ("notifs" in data || "kpis" in data)) {
    const notifs = Array.isArray(data.notifs) ? data.notifs : [];
    const kpis = Array.isArray(data.kpis) ? data.kpis : [];
    return { ok: true, notifs, kpis, plant: data.plant ?? "", days: data.days ?? 60, count: notifs.length };
  }

  // Plain array fallback
  if (Array.isArray(data)) {
    return { ok: true, notifs: data, kpis: [], count: data.length };
  }

  // Single object fallback
  if (typeof data === "object") {
    return { ok: true, notifs: [data], kpis: [], count: 1 };
  }

  return { ok: false, notifs: [], kpis: [] };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const plant = (url.searchParams.get("plant") || "").trim();
  const days = url.searchParams.get("days") || "60";

  const base = process.env.N8N_MAZDA_WEBHOOK;
  if (!base) {
    return NextResponse.json({ ok: false, error: "N8N_MAZDA_WEBHOOK not set" }, { status: 500 });
  }

  // Append query correctly (avoid double '?')
  const sep = base.includes("?") ? "&" : "?";
  const target = `${base}${sep}plant=${encodeURIComponent(plant)}&days=${encodeURIComponent(days)}`;

  try {
    const res = await fetch(target, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const text = await res.text();
    const parsed = jsonTryParse(text);

    if (!res.ok) {
      return NextResponse.json({ ok: false, status: res.status, body: text, error: "n8n returned error" }, { status: res.status });
    }

    const normalized = normalize(parsed);
    return NextResponse.json({ ...normalized, _debug: { target } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "fetch failed" }, { status: 500 });
  }
}
