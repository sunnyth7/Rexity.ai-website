"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import {
  HERO_CONTENT,
  PROBLEM_CONTENT,
  CASE_STUDIES,
  PROCESS_CONTENT,
  SERVICES_CONTENT,
  STATS_CONTENT,
  CTA_BAND_CONTENT,
  SITE_CONFIG,
} from "@/lib/content";
import { Testimonials } from "@/components/Testimonials";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  Clock,
  MessageSquare,
  ChevronRight,
  Play,
} from "lucide-react";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="w-full space-y-20 sm:space-y-32 pb-20">
      {/* 1. HERO SECTION */}
      <section className="pt-10 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0FB5A6]/30 bg-[#0FB5A6]/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-[#10233F]">
            <Sparkles className="h-4 w-4 text-[#0FB5A6]" />
            <span>{t(HERO_CONTENT.badge)}</span>
          </div>

          {/* 3-Word Promise */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#10233F] max-w-4xl leading-[1.1]">
            {t(HERO_CONTENT.promise)}
          </h1>

          {/* Subline */}
          <p className="text-lg sm:text-xl text-[#52637A] max-w-2xl leading-relaxed">
            {t(HERO_CONTENT.subline)}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2">
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#1560BD] px-7 py-3.5 text-base font-semibold text-white hover:bg-[#114E9B] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <span>{t(HERO_CONTENT.ctaPrimary)}</span>
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="#case-studies"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#E8E5DF] bg-white px-7 py-3.5 text-base font-semibold text-[#10233F] hover:border-[#1560BD] hover:text-[#1560BD] transition-all shadow-xs"
            >
              <span>{t(HERO_CONTENT.ctaSecondary)}</span>
            </a>
          </div>

          {/* Reserved Hero Media Slot */}
          <div className="w-full mt-8 sm:mt-12">
            <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E8E5DF] bg-gradient-to-br from-[#FAF8F4] via-white to-[#E6F7F5] aspect-video sm:aspect-[21/9] shadow-xl flex flex-col items-center justify-center p-6 text-center group">
              <div className="absolute inset-0 bg-radial from-[#1560BD]/5 to-transparent opacity-60" />
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border border-[#E8E5DF] shadow-md text-[#1560BD] group-hover:scale-105 transition-transform">
                  <Play className="h-6 w-6 sm:h-7 sm:h-7 ml-1 fill-current" />
                </div>
                <div className="space-y-1">
                  <span className="inline-block rounded-full bg-[#10233F] px-3 py-1 text-xs font-mono font-semibold text-white uppercase tracking-wider">
                    {t({ de: "Vorschau · Hero Video", en: "Preview · Hero Video" })}
                  </span>
                  <p className="text-xs sm:text-sm text-[#52637A] font-medium max-w-md mx-auto">
                    {t({
                      de: "Google Flow Animation in Produktion. Platzhalter aktiv.",
                      en: "Google Flow animation coming soon. Reserved slot active.",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-6 sm:p-12 shadow-sm space-y-10">
          <div className="space-y-3 text-center sm:text-left">
            <span className="text-xs font-bold tracking-widest text-[#1560BD] uppercase">
              {t(PROBLEM_CONTENT.badge)}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#10233F]">
              {t(PROBLEM_CONTENT.heading)}
            </h2>
            <p className="text-base sm:text-lg text-[#52637A] max-w-3xl">
              {t(PROBLEM_CONTENT.description)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROBLEM_CONTENT.cards.map((card, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#E8E5DF] bg-[#FAF8F4] p-6 space-y-3 hover:border-[#1560BD]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1560BD]/10 flex items-center justify-center text-[#1560BD]">
                  {idx === 0 && <MessageSquare className="h-5 w-5" />}
                  {idx === 1 && <Layers className="h-5 w-5" />}
                  {idx === 2 && <Clock className="h-5 w-5" />}
                </div>
                <h3 className="text-lg font-bold text-[#10233F]">{t(card.title)}</h3>
                <p className="text-sm text-[#52637A] leading-relaxed">{t(card.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CASE STUDIES SECTION */}
      <section id="case-studies" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#1560BD] uppercase">
              {t({ de: "Echte Projekte", en: "Real Case Studies" })}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#10233F] mt-1">
              {t({
                de: "Produkte, die wir durchgängig gebaut haben",
                en: "Products we designed & shipped end-to-end",
              })}
            </h2>
          </div>
          <Link
            href="/work"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1560BD] hover:underline"
          >
            <span>{t({ de: "Alle Arbeiten ansehen", en: "View All Projects" })}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {CASE_STUDIES.map((study) => (
            <div
              key={study.slug}
              className="rounded-3xl border border-[#E8E5DF] bg-white overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="relative aspect-4/3 w-full bg-[#FAF8F4] overflow-hidden border-b border-[#E8E5DF]">
                <Image
                  src={study.image}
                  alt={study.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-[#10233F] border border-[#E8E5DF]">
                  {t(study.category)}
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-[#10233F]">{study.name}</h3>
                    {study.url && (
                      <a
                        href={study.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1560BD] hover:opacity-80 transition-opacity"
                        aria-label={`Visit ${study.name}`}
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#1560BD]">{t(study.subtitle)}</p>
                  <p className="text-sm text-[#52637A] leading-relaxed">{t(study.description)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E8E5DF]">
                  {study.metrics.map((m, idx) => (
                    <div key={idx} className="rounded-xl bg-[#FAF8F4] p-3 text-center">
                      <div className="text-xl font-extrabold text-[#10233F]">{m.value}</div>
                      <div className="text-xs text-[#52637A] font-medium mt-0.5">{t(m.label)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PROCESS SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-[#E8E5DF] bg-[#FAF8F4] p-6 sm:p-12 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#1560BD] uppercase">
              {t(PROCESS_CONTENT.badge)}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#10233F]">
              {t(PROCESS_CONTENT.heading)}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROCESS_CONTENT.steps.map((step) => (
              <div
                key={step.num}
                className="relative rounded-2xl border border-[#E8E5DF] bg-white p-6 space-y-4 shadow-xs"
              >
                <div className="w-12 h-12 rounded-full bg-[#1560BD] text-white flex items-center justify-center font-bold text-lg">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-[#10233F]">{t(step.title)}</h3>
                <p className="text-sm text-[#52637A] leading-relaxed">{t(step.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SERVICES SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold tracking-widest text-[#1560BD] uppercase">
            {t({ de: "Unser Portfolio", en: "Our Services" })}
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#10233F]">
            {t({
              de: "Maßgeschneiderte Software & KI-Lösungen",
              en: "Tailored Software & AI Engineering",
            })}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES_CONTENT.map((svc) => (
            <Link
              key={svc.id}
              href={svc.href}
              className="rounded-2xl border border-[#E8E5DF] bg-white p-6 sm:p-8 space-y-5 hover:border-[#1560BD] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#10233F] group-hover:text-[#1560BD] transition-colors">
                    {t(svc.title)}
                  </h3>
                  <ArrowRight className="h-5 w-5 text-[#52637A] group-hover:text-[#1560BD] group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-sm text-[#52637A] leading-relaxed">{t(svc.desc)}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {svc.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#FAF8F4] border border-[#E8E5DF] px-2.5 py-1 text-xs font-medium text-[#10233F]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. STATS & IMPACT BAND */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-[#E8E5DF] bg-white text-[#10233F] p-8 sm:p-14 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-[#E8E5DF]">
            {STATS_CONTENT.map((stat, idx) => (
              <div key={idx} className={`space-y-2 text-center ${idx > 0 ? "pt-6 lg:pt-0" : ""}`}>
                <div className="text-3xl sm:text-5xl font-extrabold text-[#1560BD]">
                  {stat.value}{" "}
                  {stat.unit && (
                    <span className="text-lg font-bold text-[#10233F]">
                      {typeof stat.unit === "string" ? stat.unit : t(stat.unit)}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#4A5568] max-w-xs mx-auto font-medium">
                  {t(stat.label)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS (HIDDEN BEHIND FLAG) */}
      <Testimonials />

      {/* 8. SCOPE CTA BAND (REPLACES PRICING) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-[#E8E5DF] bg-[#FAF8F4] text-[#10233F] p-8 sm:p-14 text-center space-y-6 shadow-sm">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#10233F]">
            {t(CTA_BAND_CONTENT.heading)}
          </h2>
          <p className="text-base sm:text-lg text-[#4A5568] max-w-2xl mx-auto leading-relaxed">
            {t(CTA_BAND_CONTENT.subline)}
          </p>
          <div className="pt-2">
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#1560BD] px-8 py-4 text-base font-bold text-white hover:bg-[#114E9B] transition-all shadow-md transform hover:-translate-y-0.5"
            >
              <span>{t(CTA_BAND_CONTENT.button)}</span>
              <ArrowRight className="h-5 w-5 text-white" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
