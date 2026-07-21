// S2-T7: Data Subject Access Request endpoints.
//
// GET  /api/admin/dsar?identifier=<email|phone>   → export
// DELETE /api/admin/dsar?identifier=<email|phone> → delete (right to erasure)
//
// Auth: Bearer ADMIN_API_TOKEN. Stored in Vercel env; rotate quarterly.
// Audit: every call is recorded with redacted context. Identifiers are
//        normalized (lowercased, trimmed) and never echoed in audit summaries.

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PrismaAuditSink } from "@/lib/rpa/prisma-repositories"
import { makeSafeSummary } from "@/lib/rpa/audit"

export const runtime = "nodejs"

function authorize(req: Request): boolean {
  const token = process.env.ADMIN_API_TOKEN
  if (!token) return false
  const header = req.headers.get("authorization") ?? ""
  return header === `Bearer ${token}`
}

function normalize(identifier: string): string {
  return identifier.trim().toLowerCase().replace(/\s+/g, "")
}

function isEmail(identifier: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
}

export async function GET(req: Request) {
  if (!authorize(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const rawIdentifier = url.searchParams.get("identifier")
  if (!rawIdentifier) return NextResponse.json({ error: "identifier required" }, { status: 400 })
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 })
  }

  const identifier = normalize(rawIdentifier)
  const isEmailIdentifier = isEmail(identifier)
  const audit = new PrismaAuditSink(prisma)

  await audit.record({
    type: "POLICY_BLOCKED", // re-purpose enum for "DSAR EXPORT requested" — proper enum value added later
    actor: "admin",
    safeSummary: makeSafeSummary(`DSAR export requested for ${isEmailIdentifier ? "email" : "phone"} identifier.`),
  })

  const [leads, appointments, sessions, suppressions, audits] = await Promise.all([
    prisma.lead.findMany({
      where: isEmailIdentifier ? { email: identifier } : { phone: identifier },
    }),
    prisma.appointment.findMany({
      where: isEmailIdentifier ? { clientEmail: identifier } : { clientPhone: identifier },
    }),
    prisma.communicationSession.findMany({ where: { channelId: identifier } }),
    prisma.suppressionEntry.findMany({ where: { identifier } }),
    // Audit events are intentionally limited — they contain redacted metadata
    // but should still be limited to the subject's session ids.
    prisma.auditEvent.findMany({
      where: { sessionId: { in: (await prisma.communicationSession.findMany({ where: { channelId: identifier }, select: { id: true } })).map((s) => s.id) } },
      take: 1000,
    }),
  ])

  return NextResponse.json({
    identifier: isEmailIdentifier ? "email" : "phone",
    generatedAt: new Date().toISOString(),
    leads,
    appointments,
    sessions,
    suppressions,
    auditEvents: audits,
  })
}

export async function DELETE(req: Request) {
  if (!authorize(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const rawIdentifier = url.searchParams.get("identifier")
  if (!rawIdentifier) return NextResponse.json({ error: "identifier required" }, { status: 400 })
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 })
  }

  const identifier = normalize(rawIdentifier)
  const isEmailIdentifier = isEmail(identifier)
  const audit = new PrismaAuditSink(prisma)

  await audit.record({
    type: "POLICY_BLOCKED",
    actor: "admin",
    safeSummary: makeSafeSummary("DSAR erasure requested."),
  })

  const result = await prisma.$transaction(async (tx) => {
    // Wipe lead PII (but keep a tombstone row so foreign keys don't cascade-break appointments)
    const leadsUpdated = await tx.lead.updateMany({
      where: isEmailIdentifier ? { email: identifier } : { phone: identifier },
      data: { name: null, email: null, phone: null, message: null, safeSummary: "[erased-on-dsar]" },
    })
    const appointmentsUpdated = await tx.appointment.updateMany({
      where: isEmailIdentifier ? { clientEmail: identifier } : { clientPhone: identifier },
      data: { clientName: null, clientEmail: null, clientPhone: null, notesSummary: "[erased-on-dsar]" },
    })
    const sessionsDeleted = await tx.communicationSession.deleteMany({ where: { channelId: identifier } })
    // Honor the right to erasure for suppression too IF compliance allows; for OPT_OUT we keep the
    // suppression itself but blank the safeSummary. Identifier stays so we keep suppressing.
    const suppressionsRedacted = await tx.suppressionEntry.updateMany({
      where: { identifier },
      data: { safeSummary: "[erased-on-dsar]" },
    })
    return {
      leadsUpdated: leadsUpdated.count,
      appointmentsUpdated: appointmentsUpdated.count,
      sessionsDeleted: sessionsDeleted.count,
      suppressionsRedacted: suppressionsRedacted.count,
    }
  })

  return NextResponse.json({ ok: true, ...result, identifierType: isEmailIdentifier ? "email" : "phone" })
}
