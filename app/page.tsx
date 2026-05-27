"use client"

import Link from "next/link"
import { ArrowRight, Cpu, Zap } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SERVICES, bi } from "@/lib/services"
import { useI18n } from "@/components/i18n-provider"

export default function HomePage() {
  const { t, locale } = useI18n()

  return (
    <>
      <SiteHeader />
      <main className="relative">
        {/* Hero */}
        <section className="relative overflow-hidden tech-scanlines">
          <div className="mx-auto max-w-6xl px-6 pt-24 pb-32 md:pt-32 md:pb-40">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">
              <span className="status-dot" />
              {t("home.eyebrow")}
            </div>

            <h1 className="mt-6 text-5xl font-semibold tracking-tight md:text-7xl lg:text-8xl">
              {t("home.hero.line1")}
              <br />
              <span className="text-gradient">{t("home.hero.line2")}</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-white/60 md:text-xl">
              {t("home.hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-black shadow-[0_0_32px_rgba(34,211,238,0.5)] transition hover:bg-cyan-300"
              >
                <Zap size={16} />
                {t("home.cta.start")}
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/services"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:border-cyan-400/40 hover:bg-white/5"
              >
                {t("home.cta.explore")}
              </Link>
            </div>

            {/* HUD readout */}
            <div className="mt-16 grid max-w-2xl grid-cols-3 gap-4 font-mono text-[10px] uppercase tracking-widest text-cyan-300/70">
              <div className="hud rounded-md border border-cyan-400/10 bg-black/40 px-3 py-3">
                <p className="text-white/40">// services</p>
                <p className="mt-1 text-base text-white">08</p>
              </div>
              <div className="hud rounded-md border border-cyan-400/10 bg-black/40 px-3 py-3">
                <p className="text-white/40">// stack</p>
                <p className="mt-1 text-base text-white">AI-native</p>
              </div>
              <div className="hud rounded-md border border-cyan-400/10 bg-black/40 px-3 py-3">
                <p className="text-white/40">// SLA</p>
                <p className="mt-1 text-base text-white">{"<24h"}</p>
              </div>
            </div>
          </div>

          {/* Marquee */}
          <div className="relative overflow-hidden border-y border-cyan-400/10 bg-black/30 py-4">
            <div className="flex w-max gap-12 drift font-mono text-xs uppercase tracking-widest text-cyan-300/40">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex shrink-0 items-center gap-12 pr-12">
                  {SERVICES.map((s) => (
                    <span key={s.slug} className="flex items-center gap-2">
                      <Cpu size={12} /> {bi(s.title, locale)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services grid */}
        <section className="relative">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                  {t("home.services.eyebrow")}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                  {t("home.services.title")}
                </h2>
              </div>
              <Link
                href="/services"
                className="hidden font-mono text-xs uppercase tracking-widest text-cyan-300 hover:text-white md:inline-flex"
              >
                {t("common.allServices")} →
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES.map((s) => {
                const Icon = s.icon
                return (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="group gradient-border hud rounded-2xl p-6"
                  >
                    <div className="flex items-start justify-between">
                      <Icon size={22} className="text-cyan-300" />
                      <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">
                        {s.code}
                      </span>
                    </div>
                    <h3 className="mt-8 text-base font-medium text-white">{bi(s.title, locale)}</h3>
                    <p className="mt-2 text-sm text-white/50">{bi(s.tagline, locale)}</p>
                    <span className="mt-6 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cyan-300/70 transition group-hover:text-cyan-200">
                      {t("common.learnMore")} <ArrowRight size={11} />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="relative border-t border-cyan-400/10">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
              {t("home.process.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {t("home.process.title")}
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="gradient-border hud rounded-2xl p-8">
                  <p className="font-mono text-xs text-cyan-300">PHASE.0{n}</p>
                  <h3 className="mt-4 text-xl font-medium text-white">
                    {t(`home.process.step${n}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-white/55">
                    {t(`home.process.step${n}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t border-cyan-400/10">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              {t("home.finalCta.title")}
            </h2>
            <p className="mt-4 text-white/60">{t("home.finalCta.body")}</p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-black shadow-[0_0_32px_rgba(34,211,238,0.5)] hover:bg-cyan-300"
            >
              {t("home.cta.start")} <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
