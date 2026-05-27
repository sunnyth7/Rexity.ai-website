"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SERVICES, bi } from "@/lib/services"
import { useI18n } from "@/components/i18n-provider"

export default function ServicesPage() {
  const { t, locale } = useI18n()
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
          {t("services.eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
          {t("services.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/60">{t("services.intro")}</p>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {SERVICES.map((s) => {
            const Icon = s.icon
            return (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="group gradient-border hud rounded-2xl p-8"
              >
                <div className="flex items-start justify-between">
                  <Icon size={28} className="text-cyan-300" />
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                      {s.code}
                    </span>
                    <ArrowRight
                      size={18}
                      className="text-white/30 transition group-hover:translate-x-1 group-hover:text-cyan-300"
                    />
                  </div>
                </div>
                <h2 className="mt-6 text-2xl font-medium text-white">{bi(s.title, locale)}</h2>
                <p className="mt-2 font-mono text-xs uppercase tracking-widest text-cyan-300/70">
                  {bi(s.tagline, locale)}
                </p>
                <p className="mt-4 text-sm text-white/55">{bi(s.summary, locale)}</p>
              </Link>
            )
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
