"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import FloatingAssistantChat from "@/components/ChatFloat"

/**
 * Rexity Asset Intelligence — Executive Dashboard
 * - Soft, clean, “Claude-like” light UI with subtle depth
 * - KPI ribbon (health/warn/critical/avg health/notifs/availability/MTBF/MTTR)
 * - Integration status card
 * - AI Metadata Insights (critical/predictive/optimization)
 * - Asset grid (status badge, location, health/efficiency/uptime)
 * - Notifications table (sticky header, hover, pagination)
 * - Floating chat button
 *
 * WIRING LATER:
 * Replace fetchDashboard() with a call to your BFF (or n8n routes).
 * The UI expects the typed shape below; everything else stays the same.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */
type Kpis = {
  healthy: number
  warning: number
  critical: number
  avgHealthPct: number // 0-100
  availabilityPct: number // 0-100
  mtbfDays: number
  mttrHours: number
  notifications: number
}

type Integration = {
  endpoint: string
  connected: boolean
  syncMode: "Real-time" | "Batch"
  autoRefresh: boolean
  lastSyncIso?: string
}

type Insight = {
  id: string
  title: string
  text: string
  confidencePct?: number
  updatedAgo?: string // "2 hours ago"
  tone: "ok" | "warn" | "crit"
}

type Asset = {
  id: string // friendly tag (e.g., PUMP-001)
  state: "HEALTHY" | "WARNING" | "CRITICAL"
  name: string // Hydraulic Pump A1
  location: string // Hamburg Port - Building 1
  healthPct: number
  efficiencyPct: number
  uptimePct: number
  lastMaintenance?: string // ISO date or "N/A"
}

type NotificationRow = {
  id: string
  text?: string | null
  creationDate?: string | null
  type?: string | null
  priority?: string | null
  plant?: string | null
  equipment?: string | null
  floc?: string | null
}

type DashboardPayload = {
  integration: Integration
  kpis: Kpis
  insights: Insight[]
  assets: Asset[]
  notifications: {
    total: number
    items: NotificationRow[]
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Mock data (swap via fetchDashboard)                                       */
/* ────────────────────────────────────────────────────────────────────────── */
const MOCK: DashboardPayload = {
  integration: {
    endpoint: "/sap/opu/odata/sap/API_MAINTNOTIFICATION",
    connected: true,
    syncMode: "Real-time",
    autoRefresh: true,
    lastSyncIso: new Date().toISOString(),
  },
  kpis: {
    healthy: 12,
    warning: 4,
    critical: 3,
    avgHealthPct: 78,
    availabilityPct: 96,
    mtbfDays: 38,
    mttrHours: 5.6,
    notifications: 94,
  },
  insights: [
    {
      id: "i1",
      title: "Critical Alert",
      text: "COMP-015 shows abnormal vibration (8.2 mm/s). Immediate intervention recommended.",
      confidencePct: 94,
      updatedAgo: "2 hours ago",
      tone: "crit",
    },
    {
      id: "i2",
      title: "Predictive Maintenance",
      text: "MOTOR-042 bearing replacement likely needed within 10 days based on wear patterns.",
      confidencePct: 88,
      updatedAgo: "5 hours ago",
      tone: "warn",
    },
    {
      id: "i3",
      title: "Optimization Opportunity",
      text: "PUMP-001 operating at 96% efficiency. Expected optimal performance next 90 days.",
      confidencePct: 96,
      updatedAgo: "1 hour ago",
      tone: "ok",
    },
  ],
  assets: [
    {
      id: "PUMP-001",
      state: "HEALTHY",
      name: "Hydraulic Pump A1",
      location: "Hamburg Port — Building 1",
      healthPct: 94,
      efficiencyPct: 96,
      uptimePct: 99.2,
      lastMaintenance: "2024-10-20",
    },
    {
      id: "MOTOR-042",
      state: "WARNING",
      name: "Conveyor Motor B3",
      location: "Hamburg City — Line 3",
      healthPct: 73,
      efficiencyPct: 78,
      uptimePct: 96.8,
      lastMaintenance: "N/A",
    },
    {
      id: "COMP-015",
      state: "CRITICAL",
      name: "Air Compressor C2",
      location: "Industrial District — Utility",
      healthPct: 42,
      efficiencyPct: 62,
      uptimePct: 88.5,
      lastMaintenance: "2024-10-12",
    },
  ],
  notifications: {
    total: 87,
    items: Array.from({ length: 8 }).map((_, i) => ({
      id: String(10000000 + i + 1),
      text:
        i % 2
          ? "Seal wear detected on pump stage 2. Vibration trending up."
          : "Leak reported near bearing housing. Inspect ASAP.",
      creationDateIso: new Date(Date.now() - (i + 1) * 3600e3).toISOString(),
      type: ["M1", "M2", "Q1"][i % 3],
      priority: ["1-VH", "2-H", "3-M", "4-L"][i % 4],
      plant: ["1000", "1010", "2000"][i % 3],
    })),
  },
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Fetch (swap to real BFF later)                                            */
/* ────────────────────────────────────────────────────────────────────────── */
async function fetchDashboard(_params: {
  // place your filters here when wiring: plant, type, from/to, priority, etc.
}): Promise<DashboardPayload> {
  // TODO wire to your BFF:
  // const r = await fetch("/api/notifications?..." , { cache: "no-store" });
  // return (await r.json()) as DashboardPayload;
  await new Promise((r) => setTimeout(r, 400))
  return structuredClone(MOCK)
}

/* ────────────────────────────────────────────────────────────────────────── */
/* UI helpers                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */
const toneDot: Record<Insight["tone"], string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  crit: "bg-rose-500",
}

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ")
}

function Badge({ text, tone }: { text: string; tone: "ok" | "warn" | "crit" }) {
  const bg =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warn"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200"
  return (
    <span className={cx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border", bg)}>
      <span className={cx("w-1.5 h-1.5 rounded-full", toneDot[tone])} />
      {text}
    </span>
  )
}

function Stat({
  label,
  value,
  sub,
  tone,
}: { label: string; value: string; sub?: string; tone?: "ok" | "warn" | "crit" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-slate-500">{label}</div>
        {tone && <Badge text={tone === "ok" ? "Healthy" : tone === "warn" ? "Warning" : "Critical"} tone={tone} />}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-slate-500">{sub}</div>}
    </div>
  )
}

function Meter({ pct, title }: { pct: number; title: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] text-slate-500">
        <span>{title}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 mt-1 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Component                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
export default function AssetDashboard() {
  const router = useRouter()
  const [plant, setPlant] = useState<string>("1010") // default plant
  const [days, setDays] = useState<number>(7)
  const [loading, setLoading] = useState(false)
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [rows, setRows] = useState<NotificationRow[]>([])
  const [error, setError] = useState<string | null>(null)

  async function refreshAll(opts?: { skipSync?: boolean }) {
    try {
      setLoading(true)
      setError(null)

      if (!opts?.skipSync) {
        const syncQs = new URLSearchParams({ plant, days: String(days), top: "30" })
        const syncRes = await fetch(`/api/sync?${syncQs.toString()}`, { cache: "no-store" })
        if (!syncRes.ok) {
          const t = await syncRes.text()
          throw new Error(`Sync failed: ${t}`)
        }
      }

      const mQs = new URLSearchParams({ plant, days: String(days), top: "30" })
      const mRes = await fetch(`/api/metrics?${mQs.toString()}`, { cache: "no-store" })
      if (!mRes.ok) {
        const t = await mRes.text()
        throw new Error(`Metrics failed: ${t}`)
      }
      const data = (await mRes.json()) as {
        ok: boolean
        kpis: Kpis
        notifications: NotificationRow[]
        error?: string
      }

      if (!data.ok) throw new Error(data.error || "Metrics response not ok")
      setKpis(data.kpis)
      setRows(data.notifications)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plant, days])

  const skeleton = useMemo(() => <div className="animate-pulse text-sm opacity-60">Loading real-time data…</div>, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation header with back button */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push("/ai-dashboards")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to AI Dashboards</span>
          </button>
        </div>
      </header>

      {/* Page header */}
      <header className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Live Cockpit — Unified Asset Intelligence</h1>
        <p className="mt-1 text-sm text-slate-600 max-w-3xl">
          Real-time visibility into your assets with AI-powered insights, predictive maintenance and notification
          telemetry.
        </p>
      </header>

      {/* Integration status */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <div className="text-sm text-slate-600 mb-3 flex items-center gap-2">
            <span className="font-medium">SAP S/4HANA Integration Status</span>
            {/* Placeholder for integration status */}
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <div className="text-[12px] text-slate-500">API Endpoint</div>
              <div className="text-sm font-medium">/api/sync</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <div className="text-[12px] text-slate-500">Data Sync</div>
              <div className="text-sm font-medium">Real-time · Auto-refresh 30s</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 flex items-center justify-between">
              <div>
                <div className="text-[12px] text-slate-500">Last Sync</div>
                <div className="text-sm font-medium">{/* Placeholder for last sync time */}</div>
              </div>
              <button
                onClick={() => refreshAll({ skipSync: false })}
                className="text-xs rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
                disabled={loading}
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI ribbon */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis ? (
            <>
              <Stat label="Healthy" value={String(kpis.healthy ?? "—")} tone="ok" />
              <Stat label="Warning" value={String(kpis.warning ?? "—")} tone="warn" />
              <Stat label="Critical" value={String(kpis.critical ?? "—")} tone="crit" />
              <Stat label="Notifications" value={String(kpis.notifications ?? "—")} tone="slate" />
            </>
          ) : (
            <>
              {skeleton}
              {skeleton}
              {skeleton}
              {skeleton}
            </>
          )}
        </div>
      </section>

      {/* Derived KPIs */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Avg Health" value={`${kpis?.avgHealthPct ?? "—"}%`} sub="Fleet average" />
          <Stat label="Availability" value={`${kpis?.availabilityPct ?? "—"}%`} sub="< 2.5% variance to target" />
          <Stat label="MTBF" value={`${kpis?.mtbfDays ?? "—"} days`} sub="Mean time between failures" />
          <Stat label="MTTR" value={`${kpis?.mttrHours ?? "—"} hours`} sub="Mean time to repair" />
        </div>
      </section>

      {/* Notifications table */}
      <section className="max-w-7xl mx-auto px-6 mt-8 mb-20">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 text-sm font-medium border-b border-slate-200 bg-slate-50">
            Notifications ({rows.length})
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200">
                <tr className="text-left text-[12px] text-slate-500">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Text</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Plant</th>
                  <th className="px-4 py-2">Equipment</th>
                  <th className="px-4 py-2">FLOC</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="px-4 py-2 font-medium">{r.id}</td>
                    <td className="px-4 py-2 text-slate-700">{r.text}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {r.creationDate ? new Date(r.creationDate).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2">{r.type ?? "—"}</td>
                    <td className="px-4 py-2">{r.priority ?? "—"}</td>
                    <td className="px-4 py-2">{r.plant ?? "—"}</td>
                    <td className="px-4 py-2">{r.equipment ?? "—"}</td>
                    <td className="px-4 py-2">{r.floc ?? "—"}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={8}>
                      No notifications in the selected window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {error && <div className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-700">{error}</div>}
        </div>
      </section>

      {/* Floating Chat */}
      <FloatingAssistantChat />
    </div>
  )
}

function KpiCard({
  label,
  value,
  tone,
}: { label: string; value: number | string; tone: "green" | "amber" | "red" | "slate" }) {
  const dot = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    slate: "bg-slate-400",
  }[tone]
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}

function StatCard({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">
        {Number.isFinite(value) ? value.toFixed(1) : "0"}
        <span className="text-base font-normal text-slate-400">{suffix}</span>
      </div>
    </div>
  )
}
