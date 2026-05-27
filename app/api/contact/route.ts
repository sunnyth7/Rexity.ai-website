import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = String(body.name ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const message = String(body.message ?? "").trim()
    const company = body.company ? String(body.company).trim() : null
    const service = body.service ? String(body.service).trim() : null
    const source = body.source ? String(body.source).trim() : "website"

    if (!name || name.length > 200) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 })
    }
    if (!message || message.length > 5000) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      console.warn("[contact] DATABASE_URL not set — skipping persistence", {
        name,
        email,
        company,
        service,
      })
      return NextResponse.json({ ok: true, persisted: false })
    }

    const lead = await prisma.lead.create({
      data: { name, email, message, company, service, source },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, id: lead.id })
  } catch (err) {
    console.error("[contact] error", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
