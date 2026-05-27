"use client"

import Link from "next/link"
import { ArrowRight, Check, ChevronRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SERVICES, getService, bi } from "@/lib/services"
import { useI18n } from "@/components/i18n-provider"

export function ServiceDetail({ slug }: { slug: string }) {
  const { t, locale } = useI18n()
  const service = getService(slug)!
  const Icon = service.icon
  const others = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 3)

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-cyan-400/10 tech-scanlines">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-40 tech-grid-dense" />
          <div className="mx-auto max-w-5xl px-6 pt-16 pb-20">
            <Link
              href="/services"
              className="font-mono text-xs uppercase tracking-widest text-cyan-300/70 hover:text-cyan-200"
            >
              {t("common.backToServices")}
            </Link>
            <div className="mt-8 flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 shadow-[0_0_24px_rgba(34,211,238,0.25)]">
                <Icon size={24} className="text-cyan-300" />
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300/70">
                  {service.code}
                </p>
                <p className="mt-1 text-sm text-cyan-200/80">{bi(service.tagline, locale)}</p>
              </div>
            </div>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight md:text-7xl">
              {bi(service.title, locale)}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/60">{bi(service.summary, locale)}</p>
          </div>
        </section>

        {/* Deliver + Outcomes */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                {t("service.deliver.eyebrow")}
              </p>
              <ul className="mt-6 space-y-4">
                {bi(service.offerings, locale).map((o) => (
                  <li key={o} className="flex items-start gap-3 rounded-lg border border-cyan-400/10 bg-black/30 p-4">
                    <Check size={16} className="mt-1 shrink-0 text-cyan-300" />
                    <span className="text-white/80">{o}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                {t("service.outcomes.eyebrow")}
              </p>
              <ul className="mt-6 space-y-4">
                {bi(service.outcomes, locale).map((o) => (
                  <li key={o} className="flex items-start gap-3 rounded-lg border border-violet-400/15 bg-black/30 p-4">
                    <ChevronRight size={16} className="mt-1 shrink-0 text-violet-300" />
                    <span className="text-white/80">{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="border-y border-cyan-400/10 bg-black/30">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
              {t("service.process.eyebrow")}
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {service.process.map((p, i) => (
                <div key={i} className="gradient-border hud rounded-2xl p-6">
                  <p className="font-mono text-xs text-cyan-300">STEP.0{i + 1}</p>
                  <h3 className="mt-4 text-lg font-medium text-white">{bi(p.title, locale)}</h3>
                  <p className="mt-2 text-sm text-white/55">{bi(p.body, locale)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stack */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
            {t("service.stack.eyebrow")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {service.stack.map((s) => (
              <span
                key={s}
                className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 font-mono text-xs text-cyan-200/90"
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-cyan-400/10">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
              {t("service.faq.eyebrow")}
            </p>
            <div className="mt-8 space-y-3">
              {service.faqs.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-cyan-400/10 bg-black/30 p-5 open:border-cyan-400/30"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-base font-medium text-white">
                    {bi(f.q, locale)}
                    <ChevronRight
                      size={16}
                      className="text-cyan-300 transition group-open:rotate-90"
                    />
                  </summary>
                  <p className="mt-3 text-sm text-white/60">{bi(f.a, locale)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="hud relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 p-8 md:p-12">
            <div aria-hidden className="absolute inset-0 -z-10 opacity-30 tech-grid-dense" />
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {t("service.cta.title")}
            </h2>
            <p className="mt-3 text-white/70">{t("service.cta.body")}</p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-black shadow-[0_0_24px_rgba(34,211,238,0.45)] hover:bg-cyan-300"
            >
              {t("home.cta.start")} <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Other services */}
        <section className="border-t border-cyan-400/10">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
              // {t("common.otherServices")}
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {others.map((s) => {
                const OIcon = s.icon
                return (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="gradient-border hud rounded-2xl p-6"
                  >
                    <div className="flex items-start justify-between">
                      <OIcon size={20} className="text-cyan-300" />
                      <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">
                        {s.code}
                      </span>
                    </div>
                    <h3 className="mt-4 font-medium text-white">{bi(s.title, locale)}</h3>
                    <p className="mt-1 text-sm text-white/50">{bi(s.tagline, locale)}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
