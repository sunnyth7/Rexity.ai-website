/**
 * API Route Template for AI Assistant Chat
 *
 * This is a Next.js App Router API route that proxies chat messages
 * to your AI webhook (n8n, Make.com, or custom endpoint).
 *
 * Setup:
 * 1. Copy this file to app/api/chat/route.ts (or your preferred path)
 * 2. Set the CHAT_WEBHOOK_URL environment variable
 * 3. Update the component's apiEndpoint prop to match this route
 *
 * Environment Variable:
 * CHAT_WEBHOOK_URL=https://your-webhook-url.com/webhook
 */

import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const CHAT_WEBHOOK = process.env.CHAT_WEBHOOK_URL

export async function POST(req: Request) {
  if (!CHAT_WEBHOOK) {
    return NextResponse.json({ error: "CHAT_WEBHOOK_URL is not configured on the server" }, { status: 500 })
  }

  const body = await req.text()

  try {
    const upstream = await fetch(CHAT_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
    })

    const raw = await upstream.text()

    // Try to parse JSON response and extract the AI message
    let textOut = raw
    try {
      const json = JSON.parse(raw)
      // Check common response field names from various AI platforms
      if (typeof json?.output === "string") textOut = json.output
      else if (typeof json?.message === "string") textOut = json.message
      else if (typeof json?.text === "string") textOut = json.text
      else if (typeof json?.reply === "string") textOut = json.reply
      else if (typeof json?.response === "string") textOut = json.response
    } catch {
      // If parsing fails, keep the raw text response
    }

    return new NextResponse(textOut, {
      status: upstream.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    console.error("Chat webhook error:", error)
    return NextResponse.json({ error: "Failed to reach chat webhook" }, { status: 502 })
  }
}

// Optional: Health check endpoint
export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: !!CHAT_WEBHOOK,
  })
}
