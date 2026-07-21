import type { Metadata } from "next"
import MacbookScrollSequence from "./MacbookScrollSequence"

export const metadata: Metadata = {
  title: "MacBook Pro M5 — Power, taken apart",
  description:
    "A scroll-linked, frame-by-frame teardown of the MacBook Pro M5. Watch it disassemble and reassemble as you scroll.",
}

export default function MacbookM5Page() {
  return (
    // Full-bleed opaque stage that overrides the global grid/orb background
    // so the frame edges stay perfectly seamless against pure dark.
    <main className="relative min-h-screen w-full bg-[#070708] text-white">
      {/* Minimal top bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-sm font-semibold tracking-tight text-white/90">
          MacBook Pro
        </span>
        <span className="font-mono text-[10px] tracking-[0.35em] text-white/40">
          M5
        </span>
      </header>

      {/* Scroll-driven canvas sequence */}
      <MacbookScrollSequence />

      {/* Closing panel after the sticky stage releases */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 bg-[#070708] px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/40">
          MacBook Pro M5
        </p>
        <h2 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-white/90 sm:text-6xl">
          Built to be seen
          <br />
          <span className="text-white/40">from the inside out.</span>
        </h2>
        <p className="max-w-md text-base leading-relaxed text-white/60">
          From a single block of aluminium to the most powerful notebook silicon
          on the planet.
        </p>
        <button className="mt-4 rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.03] active:scale-95">
          Pre-order now
        </button>
        <p className="mt-10 font-mono text-[10px] tracking-[0.3em] text-white/25">
          FICTIONAL CONCEPT · NOT AFFILIATED WITH APPLE
        </p>
      </section>
    </main>
  )
}
