// S3-T9: admin ops snapshot.
//
// GET /api/admin/ops → JSON with last-24h KPIs:
//   - pending appointments
//   - open handoffs (state HANDOFF_REQUESTED / HANDOFF_ACTIVE)
//   - suppression list size
//   - failed webhooks (status FAILED)
//
// Same bearer-token auth as DSAR.

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function authorize(req: Request): boolean {
  const token = process.env.ADMIN_API_TOKEN
  if (!token) return false
  return req.headers.get("authorization") === `Bearer ${token}`
}

export async function GET(req: Request) {
  if (!authorize(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 })
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [
    pendingAppointments,
    openHandoffs,
    suppressions,
    failedWebhooks,
    recentWebhooks,
    sessionsByState,
  ] = await Promise.all([
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.communicationSession.count({
      where: { currentState: { in: ["HANDOFF_REQUESTED", "HANDOFF_ACTIVE"] } },
    }),
    prisma.suppressionEntry.count(),
    prisma.webhookEvent.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }),
    prisma.webhookEvent.count({ where: { createdAt: { gte: since24h } } }),
    prisma.communicationSession.groupBy({
      by: ["currentState"],
      _count: { _all: true },
    }),
  ])

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    last24h: {
      webhooksReceived: recentWebhooks,
      webhooksFailed: failedWebhooks,
    },
    open: {
      pendingAppointments,
      openHandoffs,
      suppressions,
    },
    sessionsByState: Object.fromEntries(
      sessionsByState.map((row) => [row.currentState, row._count._all]),
    ),
  })
}
