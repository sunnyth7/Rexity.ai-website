"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { useI18n } from "@/components/i18n-provider"

export default function AboutPage() {
  const { t } = useI18n()
  const values = [1, 2, 3, 4] as const
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative tech-scanlines">
          <div className="mx-auto max-w-4xl px-6 pt-20 pb-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
              {t("about.eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
              {t("about.title")}
            </h1>
            <p className="mt-6 text-lg text-white/60">{t("about.intro")}</p>
          </div>
        </section>

        <section className="border-y border-cyan-400/10 bg-black/30">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
              {t("about.values.eyebrow")}
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {values.map((n) => (
                <div key={n} className="gradient-border hud rounded-2xl p-8">
                  <p className="font-mono text-xs text-cyan-300">VAL.0{n}</p>
                  <h3 className="mt-3 text-lg font-medium text-white">{t(`about.value${n}.title`)}</h3>
                  <p className="mt-2 text-sm text-white/55">{t(`about.value${n}.body`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {t("about.finalCta")}
          </h2>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-black shadow-[0_0_24px_rgba(34,211,238,0.45)] hover:bg-cyan-300"
          >
            {t("home.cta.start")} <ArrowRight size={16} />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
