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
  STATS_CONTENT,
  CTA_BAND_CONTENT,
  SITE_CONFIG,
} from "@/lib/content";
import { Testimonials } from "@/components/Testimonials";
import { HeroAgentDemo } from "@/components/HeroAgentDemo";
import { BentoServicesGrid } from "@/components/BentoServicesGrid";
import {
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  Clock,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="w-full space-y-0 pb-0 bg-white">
      {/* 1. HERO SECTION (WHITE WITH SOFT RADIAL LAVENDER GLOW + FAINT DOT GRID) */}
      <section className="relative bg-white pt-12 sm:pt-20 lg:pt-24 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Soft Radial Lavender Glow Behind Headline */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-radial from-[#A78BFA]/20 via-[#F6F3FC]/40 to-transparent blur-3xl pointer-events-none" />

        {/* Faint Technical Dot-Grid Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#1E1B4B_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.035] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 sm:space-y-8">
          {/* Monospace Micro-Label */}
          <div className="font-mono text-xs font-bold tracking-widest text-[#7C3AED] uppercase">
            {HERO_CONTENT.monoTag}
          </div>

          {/* Badge with Lavender Accent */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E9E4F8] bg-[#F6F3FC] px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#1E1B4B]">
            <Sparkles className="h-4 w-4 text-[#7C3AED]" />
            <span>{t(HERO_CONTENT.badge)}</span>
          </div>

          {/* Headline with Gradient Accent on Exactly One Keyword: "Automatisieren." */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1E1B4B] max-w-4xl leading-[1.1]">
            <span>{t(HERO_CONTENT.promiseLead)} </span>
            <span className="bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] bg-clip-text text-transparent">
              {t(HERO_CONTENT.promiseAccent)}
            </span>
          </h1>

          {/* Subline */}
          <p className="text-base sm:text-xl text-[#6B6690] max-w-2xl leading-relaxed">
            {t(HERO_CONTENT.subline)}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2">
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#7C3AED] px-7 py-3.5 text-base font-bold text-white hover:bg-gradient-to-r hover:from-[#7C3AED] hover:to-[#4F46E5] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <span>{t(HERO_CONTENT.ctaPrimary)}</span>
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="#services-bento"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#E9E4F8] bg-[#F6F3FC] px-7 py-3.5 text-base font-semibold text-[#1E1B4B] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all shadow-2xs"
            >
              <span>{t(HERO_CONTENT.ctaSecondary)}</span>
            </a>
          </div>

          {/* Working Agent Demo Vignette */}
          <div className="w-full mt-8 sm:mt-12 max-w-4xl mx-auto">
            <HeroAgentDemo />
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION (--BG-TINT: #F6F3FC) */}
      <section className="bg-[#F6F3FC] py-16 sm:py-24 border-y border-[#E9E4F8]">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
          <div className="space-y-3 text-center sm:text-left">
            <div className="font-mono text-xs font-bold tracking-widest text-[#7C3AED] uppercase">
              {PROBLEM_CONTENT.monoTag}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1E1B4B]">
              {t(PROBLEM_CONTENT.heading)}
            </h2>
            <p className="text-base sm:text-lg text-[#6B6690] max-w-3xl">
              {t(PROBLEM_CONTENT.description)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROBLEM_CONTENT.cards.map((card, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#E9E4F8] bg-white p-6 space-y-3 shadow-xs hover:border-[#7C3AED]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F6F3FC] border border-[#E9E4F8] flex items-center justify-center text-[#7C3AED]">
                  {idx === 0 && <MessageSquare className="h-5 w-5" />}
                  {idx === 1 && <Layers className="h-5 w-5" />}
                  {idx === 2 && <Clock className="h-5 w-5" />}
                </div>
                <h3 className="text-lg font-bold text-[#1E1B4B]">{t(card.title)}</h3>
                <p className="text-sm text-[#6B6690] leading-relaxed">{t(card.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CASE STUDIES SECTION (WHITE: #FFFFFF) */}
      <section id="case-studies" className="bg-white py-16 sm:py-24">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="font-mono text-xs font-bold tracking-widest text-[#7C3AED] uppercase">
                02. REAL CLIENT METRICS
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1E1B4B]">
                {t({
                  de: "Produkte, die wir durchgängig gebaut haben",
                  en: "Products we designed & shipped end-to-end",
                })}
              </h2>
            </div>
            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7C3AED] hover:underline"
            >
              <span>{t({ de: "Alle Arbeiten ansehen", en: "View All Projects" })}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {CASE_STUDIES.map((study) => (
              <div
                key={study.slug}
                className="rounded-3xl border border-[#E9E4F8] bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="relative aspect-4/3 w-full bg-[#F6F3FC] overflow-hidden border-b border-[#E9E4F8]">
                  <Image
                    src={study.image}
                    alt={study.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-[#1E1B4B] border border-[#E9E4F8]">
                    {t(study.category)}
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-[#1E1B4B]">{study.name}</h3>
                      {study.url && (
                        <a
                          href={study.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7C3AED] hover:opacity-80 transition-opacity"
                          aria-label={`Visit ${study.name}`}
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#7C3AED]">{t(study.subtitle)}</p>
                    <p className="text-sm text-[#6B6690] leading-relaxed">{t(study.description)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E9E4F8]">
                    {study.metrics.map((m, idx) => (
                      <div key={idx} className="rounded-xl bg-[#F6F3FC] p-3 text-center border border-[#E9E4F8]">
                        <div className="text-xl font-extrabold text-[#1E1B4B]">{m.value}</div>
                        <div className="text-xs text-[#6B6690] font-medium mt-0.5">{t(m.label)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PROCESS SECTION (--BG-TINT: #F6F3FC) */}
      <section className="bg-[#F6F3FC] py-16 sm:py-24 border-y border-[#E9E4F8]">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="font-mono text-xs font-bold tracking-widest text-[#7C3AED] uppercase">
              {PROCESS_CONTENT.monoTag}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1E1B4B]">
              {t(PROCESS_CONTENT.heading)}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROCESS_CONTENT.steps.map((step) => (
              <div
                key={step.num}
                className="relative rounded-2xl border border-[#E9E4F8] bg-white p-6 space-y-4 shadow-xs"
              >
                <div className="w-12 h-12 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-lg">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-[#1E1B4B]">{t(step.title)}</h3>
                <p className="text-sm text-[#6B6690] leading-relaxed">{t(step.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SERVICES BENTO SECTION (WHITE: #FFFFFF) */}
      <section id="services-bento" className="bg-white py-16 sm:py-24">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="font-mono text-xs font-bold tracking-widest text-[#7C3AED] uppercase">
              01. BENTO TAXONOMY · ALL PILLARS
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B]">
              {t({
                de: "Alle Leistungen & Routen im Überblick",
                en: "Every Service & Route in One Bento Taxonomy",
              })}
            </h2>
            <p className="text-base text-[#6B6690] max-w-2xl mx-auto leading-relaxed">
              {t({
                de: "Wählen Sie eine Disziplin oder springen Sie direkt zu einer spezifischen Leistung.",
                en: "Pick a primary pillar or jump straight to a specialized sub-service route.",
              })}
            </p>
          </div>

          <BentoServicesGrid />
        </div>
      </section>

      {/* 6. STATS & IMPACT BAND (--BG-TINT: #F6F3FC) */}
      <section className="bg-[#F6F3FC] py-16 sm:py-24 border-y border-[#E9E4F8]">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-3xl border border-[#E9E4F8] bg-white text-[#1E1B4B] p-8 sm:p-14 shadow-xs">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-[#E9E4F8]">
              {STATS_CONTENT.map((stat, idx) => (
                <div key={idx} className={`space-y-2 text-center ${idx > 0 ? "pt-6 lg:pt-0" : ""}`}>
                  <div className="text-3xl sm:text-5xl font-extrabold text-[#7C3AED]">
                    {stat.value}{" "}
                    {stat.unit && (
                      <span className="text-lg font-bold text-[#1E1B4B]">
                        {typeof stat.unit === "string" ? stat.unit : t(stat.unit)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[#6B6690] max-w-xs mx-auto font-medium">
                    {t(stat.label)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS (HIDDEN BEHIND FLAG) */}
      <Testimonials />

      {/* 8. SCOPE CTA BAND (VIOLET GRADIENT: #7C3AED -> #4F46E5, WHITE TEXT) */}
      <section className="bg-white py-16 sm:py-24">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white p-8 sm:p-16 text-center space-y-6 shadow-xl">
            <div className="font-mono text-xs font-bold tracking-widest text-[#A78BFA] uppercase">
              03. 14-21 DAY SCOPING
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white max-w-3xl mx-auto">
              {t(CTA_BAND_CONTENT.heading)}
            </h2>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mx-auto leading-relaxed">
              {t(CTA_BAND_CONTENT.subline)}
            </p>
            <div className="pt-4">
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-base font-bold text-[#1E1B4B] hover:bg-[#F6F3FC] transition-all shadow-md transform hover:-translate-y-0.5"
              >
                <span>{t(CTA_BAND_CONTENT.button)}</span>
                <ArrowRight className="h-5 w-5 text-[#7C3AED]" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
