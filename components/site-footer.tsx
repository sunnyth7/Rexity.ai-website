"use client"

import Link from "next/link"
import { SERVICES, bi } from "@/lib/services"
import { useI18n } from "@/components/i18n-provider"

export function SiteFooter() {
  const { t, locale } = useI18n()
  return (
    <footer className="relative mt-32 border-t border-cyan-400/10 bg-black/40">
      <div className="absolute inset-x-0 top-0 beam" />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 font-semibold">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-sm font-bold text-black">
                R
              </span>
              <span className="text-white">Rexity</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/50">{t("footer.tagline")}</p>
            <div className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-cyan-300/70">
              <span className="status-dot" />
              <span>SYSTEM ONLINE</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/60">
              // {t("footer.services")}
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="text-white/60 transition hover:text-cyan-300"
                  >
                    {bi(s.title, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/60">
              // {t("footer.company")}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" className="text-white/60 hover:text-cyan-300">{t("nav.about")}</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-cyan-300">{t("nav.contact")}</Link></li>
              <li><Link href="/privacy" className="text-white/60 hover:text-cyan-300">{t("footer.privacy")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-cyan-400/10 pt-8 font-mono text-[10px] uppercase tracking-widest text-white/40 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} REXITY // {t("footer.rights")}</p>
          <p>hello@rexity.ai</p>
        </div>
      </div>
    </footer>
  )
}
