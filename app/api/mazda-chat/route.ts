import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAZDA_CHATBOX_WEBHOOK = process.env.MAZDA_CHATBOX_WEBHOOK

export async function POST(req: Request) {
  if (!MAZDA_CHATBOX_WEBHOOK) {
    return NextResponse.json({ error: "MAZDA_CHATBOX_WEBHOOK is not set on the server" }, { status: 500 })
  }

  const body = await req.text()

  try {
    const upstream = await fetch(MAZDA_CHATBOX_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
    })

    const raw = await upstream.text()

    // If n8n sent JSON, pick the AI Agent's "output" field.
    let textOut = raw
    try {
      const json = JSON.parse(raw)
      if (typeof json?.output === "string") textOut = json.output
      else if (typeof json?.message === "string") textOut = json.message
      else if (typeof json?.text === "string") textOut = json.text
    } catch {
      // raw was already plain text; keep it
    }

    return new NextResponse(textOut, {
      status: upstream.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch {
    return NextResponse.json({ error: "Failed to reach Mazda chatbox webhook" }, { status: 502 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
