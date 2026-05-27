"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"

export function SiteHeader() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  const NAV = [
    { href: "/services", key: "nav.services" },
    { href: "/about", key: "nav.about" },
    { href: "/contact", key: "nav.contact" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/10 bg-[#04060a]/70 backdrop-blur-xl">
      <div className="absolute inset-x-0 bottom-0 beam" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-sm font-bold text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            R
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-semibold tracking-tight text-white">Rexity</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300/60">// AI.SYSTEMS</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-white/70 transition hover:text-cyan-300"
            >
              {t(item.key)}
            </Link>
          ))}
          <LanguageSwitcher />
          <Link
            href="/contact"
            className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-black shadow-[0_0_24px_rgba(34,211,238,0.45)] transition hover:bg-cyan-300"
          >
            {t("nav.cta")}
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <LanguageSwitcher />
          <button
            aria-label="Toggle menu"
            className="text-white"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden border-t border-cyan-400/10 transition-[max-height] duration-300",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-sm text-white/80"
            >
              {t(item.key)}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="rounded-full bg-cyan-400 px-4 py-2 text-center text-sm font-medium text-black"
          >
            {t("nav.cta")}
          </Link>
        </div>
      </div>
    </header>
  )
}
