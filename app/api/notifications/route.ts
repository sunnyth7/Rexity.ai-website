export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const mode = url.searchParams.get("mode") || "dashboard";
    const plant = url.searchParams.get("plant") || "";
    const days  = Number(url.searchParams.get("days") || "7");
    const top   = Number(url.searchParams.get("top")  || "30");
    const from  = url.searchParams.get("from") || "";
    const to    = url.searchParams.get("to")   || "";

    if (!process.env.N8N_DASHBOARD_WEBHOOK) {
      return NextResponse.json({ error: "Missing env N8N_DASHBOARD_WEBHOOK" }, { status: 500 });
    }

    if (mode !== "dashboard") {
      // optional: passthrough for list/count if you need it later
      return NextResponse.json({ error: "Only mode=dashboard supported here" }, { status: 400 });
    }

    const res = await fetch(process.env.N8N_DASHBOARD_WEBHOOK!, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plant, days, top, from, to }),
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`n8n ${res.status}: ${text}`);

    return new NextResponse(text, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("[/api/notifications] error:", err?.message || err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 502 });
  }
}
