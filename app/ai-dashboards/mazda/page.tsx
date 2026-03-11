"use client"
import { useEffect, useMemo, useState, useCallback } from "react"
import { format, parseISO, subDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns"
import KPICards from "./components/dashboard/KPICards"
import FilterPanel from "./components/dashboard/FilterPanel"
import { RefreshCw, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react"
import MazdaChatTiny from "./components/MazdaChatTiny"
import Link from "next/link"
import Image from "next/image"

type Row = {
  notificationId?: string | number
  notificationText?: string
  priority?: number | string
  plant?: string | number
  equipment?: string
  notifProcessingPhaseDesc?: string
  userStatus?: string
  maintenanceObjectIsDown?: number | boolean
  creationDateIso?: string
  lastChangeDateIso?: string
}

function getPriorityLabel(priority?: number | string): string {
  const p = typeof priority === "number" ? priority : Number(priority ?? 0)
  if (p === 1) return "Low"
  if (p === 2) return "Medium"
  if (p === 3) return "High"
  return "—"
}

function getPriorityColor(priority?: number | string): string {
  const p = typeof priority === "number" ? priority : Number(priority ?? 0)
  if (p === 1) return "bg-green-100 text-green-800 border-green-300"
  if (p === 2) return "bg-yellow-100 text-yellow-800 border-yellow-300"
  if (p === 3) return "bg-red-100 text-red-800 border-red-300"
  return "bg-slate-100 text-slate-600 border-slate-300"
}

const PAGE_SIZE = 15

function extractNotifs(raw: any): any[] {
  // Most tolerant extractor possible
  if (!raw) return []

  // If the whole thing is already an array of notifs
  if (Array.isArray(raw) && raw.length && (raw[0]?.notificationId || raw[0]?.NotificationId)) {
    return raw as any[]
  }

  if (Array.isArray(raw?.notifs) && raw.notifs.length > 0) {
    // Check if the first item has a nested notifs array
    if (Array.isArray(raw.notifs[0]?.notifs)) {
      // Flatten all nested notifs arrays from all items
      return raw.notifs.flatMap((item: any) => (Array.isArray(item.notifs) ? item.notifs : []))
    }
    // Otherwise, the notifs array itself contains the notifications
    return raw.notifs
  }

  // If it's an array wrapper from n8n: [ { ok, notifs:[...] } ]
  if (Array.isArray(raw) && raw.length && Array.isArray(raw[0]?.notifs)) {
    // Check for double nesting
    if (Array.isArray(raw[0].notifs[0]?.notifs)) {
      return raw[0].notifs.flatMap((item: any) => (Array.isArray(item.notifs) ? item.notifs : []))
    }
    return raw[0].notifs
  }

  // If it's inside data: { data: { notifs:[...] } } or [ { data: { notifs:[...] } } ]
  if (Array.isArray(raw?.data?.notifs)) return raw.data.notifs
  if (Array.isArray(raw?.[0]?.data?.notifs)) return raw[0].data.notifs

  // Nothing matched
  return []
}

export default function MazdaPage() {
  const [raw, setRaw] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [timeRange, setTimeRange] = useState("") // Default to empty string to show all notifications on page load
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [showRawWebhook, setShowRawWebhook] = useState(false)

  const fetchIt = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      // keep it simple: always ask days=60
      const res = await fetch(`/api/mazda/metrics?days=60`, { cache: "no-store" })
      const j = await res.json()
      setRaw(j)
      if (!res.ok) setErr(`HTTP ${res.status}`)
    } catch (e: any) {
      setErr(e?.message || "Fetch failed")
    } finally {
      setLoading(false)
      setPage(1)
    }
  }, [])

  useEffect(() => {
    fetchIt()
  }, [fetchIt])

  // pull array of notifications from whatever shape the webhook returns
  const source = useMemo(() => extractNotifs(raw), [raw])

  // map directly to your 9 columns
  const rows: Row[] = useMemo(() => {
    return source.map((r: any) => ({
      notificationId: r.notificationId ?? r.NotificationId ?? r.id,
      notificationText: r.notificationText ?? r.NotificationText ?? "",
      priority: r.priority ?? r.MaintPriority ?? "",
      plant: r.plant ?? r.MaintenancePlant ?? "",
      equipment: r.equipment || "N/A", // Default to "N/A" if not available
      notifProcessingPhaseDesc: r.notifProcessingPhaseDesc ?? r.EAMProcessPhaseCodeDesc ?? "",
      userStatus: r.userStatus ?? "",
      maintenanceObjectIsDown: r.maintenanceObjectIsDown ?? 0,
      creationDateIso: r.creationDateIso ?? r.creationDate ?? r.CreationDateIso ?? r.CreationDate ?? "",
      lastChangeDateIso: r.lastChangeDateIso ?? r.lastChangeDate ?? r.LastChangeDateIso ?? r.LastChangeDate ?? "",
    }))
  }, [source])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aId = Number(a.notificationId) || 0
      const bId = Number(b.notificationId) || 0
      return bId - aId // Descending order
    })
  }, [rows])

  const filtered = useMemo(() => {
    let result = sorted

    // Apply KPI filter
    if (activeFilter === "outstanding") {
      result = result.filter((n) => n.notifProcessingPhaseDesc?.toLowerCase().includes("outstanding"))
    } else if (activeFilter === "high-priority") {
      result = result.filter((n) => Number(n.priority) === 3)
    } else if (activeFilter === "critical") {
      result = result.filter((n) => n.maintenanceObjectIsDown)
    }

    if (customStart && customEnd) {
      // Custom date range supersedes time range
      const startDate = startOfDay(parseISO(customStart))
      const endDate = endOfDay(parseISO(customEnd))
      result = result.filter((n) => {
        if (!n.creationDateIso) return false
        try {
          const notifDate = parseISO(n.creationDateIso)
          return isAfter(notifDate, startDate) && isBefore(notifDate, endDate)
        } catch {
          return false
        }
      })
    } else if (timeRange && timeRange !== "" && timeRange !== "custom") {
      // Apply time range filter (3, 7, 15, 30 days)
      const days = Number(timeRange)
      const cutoffDate = subDays(new Date(), days)
      result = result.filter((n) => {
        if (!n.creationDateIso) return false
        try {
          const notifDate = parseISO(n.creationDateIso)
          return isAfter(notifDate, cutoffDate)
        } catch {
          return false
        }
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (n) =>
          String(n.notificationId).toLowerCase().includes(q) ||
          (n.notificationText || "").toLowerCase().includes(q) ||
          String(n.plant || "")
            .toLowerCase()
            .includes(q) ||
          (n.equipment || "").toLowerCase().includes(q),
      )
    }

    return result
  }, [sorted, activeFilter, searchQuery, timeRange, customStart, customEnd])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const kpiMetrics = useMemo(() => {
    return {
      total: sorted.length,
      outstanding: sorted.filter((n) => n.notifProcessingPhaseDesc?.toLowerCase().includes("outstanding")).length,
      highPriority: sorted.filter((n) => Number(n.priority) === 3).length,
      critical: sorted.filter((n) => n.maintenanceObjectIsDown).length,
    }
  }, [sorted])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-xl px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/ai-dashboards"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            onClick={fetchIt}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex p-2 rounded-xl bg-black shadow-lg">
              <Image
                src="/images/mazda-ai-logo.jpg"
                alt="Mazda AI Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                Mazda — Maintenance Intelligence
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Real-time maintenance notifications with predictive analytics and intelligent filtering
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-slate-600 rounded-lg">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Our Mazda Maintenance Intelligence Dashboard provides real-time visibility into maintenance notifications
              from SAP with AI-powered analytics and intelligent filtering. Monitor critical alerts, track maintenance
              status, and optimize response times with predictive insights. Leverage real-time data synchronization to
              reduce downtime and maximize operational efficiency through proactive maintenance management.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <KPICards
            metrics={kpiMetrics}
            activeFilter={activeFilter}
            onFilterClick={(filter) => {
              setActiveFilter(activeFilter === filter ? null : filter)
              setPage(1)
            }}
            isLoading={loading}
          />
        </div>

        <div className="mb-6">
          <FilterPanel
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            timeRange={timeRange}
            onTimeRangeChange={(value) => {
              setTimeRange(value)
              if (value !== "custom") {
                setCustomStart("")
                setCustomEnd("")
              }
              setPage(1)
            }}
            customStart={customStart}
            onCustomStartChange={setCustomStart}
            customEnd={customEnd}
            onCustomEndChange={setCustomEnd}
          />
        </div>

        <section className="bg-white backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-transparent hover:border-blue-300 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Notifications ({filtered.length})</h3>
            {activeFilter && (
              <button
                onClick={() => setActiveFilter(null)}
                className="text-sm px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>

          {err && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">Error: {err}</p>
            </div>
          )}

          <div className="overflow-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="text-left font-semibold px-4 py-3 text-gray-700 whitespace-nowrap">ID</th>
                  <th className="text-left font-semibold px-4 py-3 text-gray-700 whitespace-nowrap">Text</th>
                  <th className="text-left font-semibold px-4 py-3 text-gray-700 whitespace-nowrap">Priority</th>
                  <th className="text-left font-semibold px-4 py-3 text-gray-700 whitespace-nowrap">Plant</th>
                  <th className="text-left font-semibold px-4 py-3 text-gray-700 whitespace-nowrap">Equipment</th>
                  <th className="text-left font-semibold px-4 py-3 text-gray-700 whitespace-nowrap">Phase / Status</th>
                  <th className="text-left font-semibold px-4 py-3 text-gray-700 whitespace-nowrap">Obj. Status</th>
                  <th className="text-left font-semibold px-4 py-3 text-gray-700 whitespace-nowrap">Created</th>
                  <th className="text-left font-semibold px-4 py-3 text-gray-700 whitespace-nowrap">Last Change</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="font-medium">No notifications found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paged.map((n, i) => (
                    <tr
                      key={`${n.notificationId}-${i}`}
                      className="border-b border-gray-100 last:border-0 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <span className="font-mono text-sm font-semibold text-gray-900">{n.notificationId ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-700">{n.notificationText || "No description"}</td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(n.priority)}`}
                        >
                          {getPriorityLabel(n.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-700">{n.plant ?? "—"}</td>
                      <td className="px-4 py-3 align-top text-gray-700">{n.equipment}</td>
                      <td className="px-4 py-3 align-top text-gray-700">
                        {n.notifProcessingPhaseDesc || n.userStatus || "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                            n.maintenanceObjectIsDown
                              ? "bg-red-100 text-red-800 border-red-300"
                              : "bg-green-100 text-green-800 border-green-300"
                          }`}
                        >
                          {n.maintenanceObjectIsDown ? "Down" : "Up"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-600">
                        {n.creationDateIso ? format(parseISO(n.creationDateIso), "yyyy-MM-dd") : "—"}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-600">
                        {n.lastChangeDateIso ? format(parseISO(n.lastChangeDateIso), "yyyy-MM-dd") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Previous
            </button>
            <div className="text-sm text-gray-600 font-medium">
              Page {page} of {totalPages}
            </div>
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next →
            </button>
          </div>
        </section>

        <section className="mt-6 bg-white backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-transparent hover:border-blue-300 transition-all duration-500">
          <button
            onClick={() => setShowRawWebhook(!showRawWebhook)}
            className="flex items-center justify-between w-full hover:text-blue-600 transition-colors group"
          >
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600">Raw Webhook Response</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{showRawWebhook ? "Click to collapse" : "Click to expand"}</span>
              {showRawWebhook ? (
                <ChevronUp className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              )}
            </div>
          </button>
          {showRawWebhook && (
            <div className="mt-4">
              <pre className="bg-gradient-to-br from-slate-900 to-slate-800 text-green-300 rounded-lg p-4 max-h-96 overflow-auto text-xs font-mono shadow-inner border border-slate-700">
                {JSON.stringify(raw ?? {}, null, 2)}
              </pre>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Detected notifications:</span> {source.length}
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Mazda Maintenance Assistant chatbox */}
      <MazdaChatTiny />
    </div>
  )
}
