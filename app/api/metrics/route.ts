import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "")

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const plant = url.searchParams.get("plant") ?? undefined
    const days = Number(url.searchParams.get("days") ?? "7")
    const top = Math.min(Number(url.searchParams.get("top") ?? "30"), 100)

    const since = new Date()
    since.setDate(since.getDate() - days)

    // Notifications (latest first) using raw SQL with Neon
    let notifications: any[] = []
    try {
      if (plant) {
        notifications = await sql`
          SELECT id, text, "creationDateIso", type, priority, plant, equipment, floc
          FROM "Notification"
          WHERE "creationDateIso" >= ${since.toISOString()} AND plant = ${plant}
          ORDER BY "creationDateIso" DESC
          LIMIT ${top}
        `
      } else {
        notifications = await sql`
          SELECT id, text, "creationDateIso", type, priority, plant, equipment, floc
          FROM "Notification"
          WHERE "creationDateIso" >= ${since.toISOString()}
          ORDER BY "creationDateIso" DESC
          LIMIT ${top}
        `
      }
    } catch {
      // Table might not exist yet
      notifications = []
    }

    // Compute lightweight KPIs from cached notifications
    const total = notifications.length
    const critical = notifications.filter((n) =>
      String(n.priority || "")
        .toUpperCase()
        .startsWith("1"),
    ).length
    const warning = notifications.filter((n) =>
      String(n.priority || "")
        .toUpperCase()
        .includes("2"),
    ).length
    const healthy = Math.max(total - (critical + warning), 0)

    // Last snapshot (if exists)
    let latestSnapshot: any = null
    try {
      const snapshots = plant
        ? await sql`SELECT * FROM "Snapshot" WHERE plant = ${plant} ORDER BY "takenAt" DESC LIMIT 1`
        : await sql`SELECT * FROM "Snapshot" ORDER BY "takenAt" DESC LIMIT 1`
      latestSnapshot = snapshots[0] || null
    } catch {
      // Table might not exist yet
    }

    return NextResponse.json({
      ok: true,
      plant: plant ?? null,
      kpis: {
        healthy,
        warning,
        critical,
        avgHealthPct: latestSnapshot?.avgHealthPct ?? 0,
        availabilityPct: latestSnapshot?.availabilityPct ?? 0,
        mtbfDays: latestSnapshot?.mtbfDays ?? 0,
        mttrHours: latestSnapshot?.mttrHours ?? 0,
        notifications: total,
      },
      notifications: notifications.map((r) => ({
        id: r.id,
        text: r.text,
        creationDate: r.creationDateIso,
        type: r.type,
        priority: r.priority,
        plant: r.plant,
        equipment: r.equipment,
        floc: r.floc,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}
