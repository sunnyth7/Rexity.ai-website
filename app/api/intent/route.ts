import { NextResponse } from "next/server";

/**
 * POST /api/intent
 * Body: { message: string }
 * Forwards the message to your n8n webhook and returns its JSON.
 */
export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      return NextResponse.json({ error: "N8N_WEBHOOK_URL is not set" }, { status: 500 });
    }

    const r = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ message }),
      cache: "no-store",
    });

    const text = await r.text(); // n8n might send text or json
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return NextResponse.json(data, { status: r.ok ? 200 : r.status });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
