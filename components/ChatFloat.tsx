"use client"

import { useState } from "react"

/** Minimal matte floating assistant launcher; wire to your chat page or widget later */
export default function FloatingAssistantChat() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((x) => !x)}
        className="fixed bottom-20 right-6 z-40 rounded-full shadow-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
        aria-label="Chat with Assistant"
      >
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Chat with Assistant
        </span>
      </button>

      {/* Sheet */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="text-sm font-medium">Maintenance Assistant</div>
            <button className="text-slate-500 text-sm hover:text-slate-700" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <div className="p-4 text-sm text-slate-600 space-y-3">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              Ask things like:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>"Show critical notifications in plant 1010 last 7 days."</li>
                <li>"Open notification 10000012."</li>
                <li>"Trend of health for COMP-015."</li>
              </ul>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const q = String(fd.get("q") || "")
                if (!q.trim()) return
                // TODO: POST to /api/intent → n8n → respond
                alert(`(demo) would send to /api/intent: ${q}`)
                e.currentTarget.reset()
              }}
              className="flex gap-2"
            >
              <input
                name="q"
                placeholder="Type your request…"
                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
              <button className="rounded-md border border-slate-200 bg-slate-900 text-white px-3 py-2 text-sm hover:bg-black">
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
