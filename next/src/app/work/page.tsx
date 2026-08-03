"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import { CASE_STUDIES, SITE_CONFIG } from "@/lib/content";
import { ArrowRight, ExternalLink } from "lucide-react";

export default function WorkPage() {
  const { t } = useLanguage();

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold tracking-widest text-[#1560BD] uppercase">
          {t({ de: "Portfolio · Arbeiten", en: "Portfolio · Real Work" })}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#10233F]">
          {t({
            de: "Echte Produkte, durchgängig ausgeliefert",
            en: "Real Products Designed & Shipped End-to-End",
          })}
        </h1>
        <p className="text-base sm:text-lg text-[#52637A] leading-relaxed">
          {t({
            de: "Von Party-Planung und Prüfungsvorbereitung bis zur Haushalts-Automatisierung — ausgewählte Live-Systeme von Rexity Labs.",
            en: "From event hosting and exam prep to household automation — selected live software systems built by Rexity Labs.",
          })}
        </p>
      </div>

      {/* Case studies list */}
      <div className="space-y-12">
        {CASE_STUDIES.map((study) => (
          <div
            key={study.slug}
            className="rounded-3xl border border-[#E8E5DF] bg-white overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-0"
          >
            <div className="relative lg:col-span-5 aspect-4/3 lg:aspect-auto bg-[#FAF8F4] border-b lg:border-b-0 lg:border-r border-[#E8E5DF]">
              <Image
                src={study.image}
                alt={study.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="lg:col-span-7 p-8 sm:p-12 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-full bg-[#FAF8F4] border border-[#E8E5DF] px-3.5 py-1 text-xs font-bold text-[#1560BD]">
                    {t(study.category)}
                  </span>
                  {study.url && (
                    <a
                      href={study.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-bold text-[#1560BD] hover:underline"
                    >
                      <span>{t({ de: "Website besuchen", en: "Visit Live Site" })}</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                <h2 className="text-3xl font-bold text-[#10233F]">{study.name}</h2>
                <p className="text-base font-semibold text-[#1560BD]">{t(study.subtitle)}</p>
                <p className="text-base text-[#52637A] leading-relaxed">{t(study.description)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[#E8E5DF]">
                {study.metrics.map((m, idx) => (
                  <div key={idx} className="rounded-2xl bg-[#FAF8F4] p-4 text-center">
                    <div className="text-2xl font-extrabold text-[#10233F]">{m.value}</div>
                    <div className="text-xs text-[#52637A] font-medium mt-1">{t(m.label)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scope CTA */}
      <div className="rounded-3xl bg-[#FAF8F4] border border-[#E8E5DF] p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl font-bold text-[#10233F]">
          {t({ de: "Planen Sie Ihre eigene Anwendung?", en: "Planning Your Own Application?" })}
        </h2>
        <a
          href={`mailto:${SITE_CONFIG.email}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#1560BD] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#114E9B] transition-all"
        >
          <span>{t({ de: "Projekt anfragen", en: "Inquire About Your Project" })}</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
