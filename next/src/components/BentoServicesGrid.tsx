"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { BENTO_SERVICES } from "@/lib/content";
import {
  WorkflowNodeGraphVisual,
  DeviceFramesVisual,
  VoiceWaveformVisual,
  GrowthChartVisual,
  QAMatrixVisual,
} from "./ServiceMicroVisuals";
import { ArrowUpRight, Sparkles, ChevronRight } from "lucide-react";

export function BentoServicesGrid() {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {BENTO_SERVICES.map((pillar) => {
        const isFlagship = pillar.isFlagship;

        return (
          <div
            key={pillar.id}
            className={`rounded-3xl border border-[#E8E5DF] bg-white p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#1560BD]/50 transition-all duration-200 group relative ${
              isFlagship ? "lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-white via-white to-[#FAF8F4]" : ""
            }`}
          >
            <div className="space-y-6">
              {/* Header / Badge */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#1560BD] tracking-wider uppercase flex items-center gap-1.5">
                  {isFlagship && <Sparkles className="h-4 w-4 text-[#0FB5A6]" />}
                  <span>{isFlagship ? "AI FLAGSHIP PILLAR" : "SERVICE PILLAR"}</span>
                </span>
                <Link
                  href={pillar.href}
                  className="w-9 h-9 rounded-full bg-[#FAF8F4] border border-[#E8E5DF] flex items-center justify-center text-[#10233F] group-hover:bg-[#1560BD] group-hover:text-white transition-colors"
                  aria-label={t(pillar.title)}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-2">
                <h3 className={`font-extrabold text-[#10233F] ${isFlagship ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>
                  <Link href={pillar.href} className="hover:text-[#1560BD] transition-colors">
                    {t(pillar.title)}
                  </Link>
                </h3>
                <p className="text-sm font-semibold text-[#1560BD]">{t(pillar.tagline)}</p>
                <p className={`text-[#4A5568] leading-relaxed ${isFlagship ? "text-base max-w-xl" : "text-sm"}`}>
                  {t(pillar.desc)}
                </p>
              </div>

              {/* In-Card Micro-Visual */}
              <div className="pt-2">
                {pillar.id === "automation" && <WorkflowNodeGraphVisual />}
                {pillar.id === "web" && <DeviceFramesVisual />}
                {pillar.id === "marketing" && <GrowthChartVisual />}
                {pillar.id === "testing-support" && <QAMatrixVisual />}
              </div>

              {/* Named Sub-Services Chips */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono font-bold text-[#4A5568] tracking-wider uppercase block">
                  {t({ de: "Spezifische Leistungen & Routen:", en: "Sub-Services & Direct Routes:" })}
                </span>
                <div className="flex flex-wrap gap-2">
                  {pillar.chips.map((chip, idx) => (
                    <Link
                      key={idx}
                      href={chip.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DF] bg-[#FAF8F4] px-3.5 py-1.5 text-xs font-semibold text-[#10233F] hover:bg-[#1560BD] hover:text-white hover:border-[#1560BD] transition-all shadow-2xs group/chip"
                    >
                      <span>{t(chip.label)}</span>
                      {chip.hasWaveform && <VoiceWaveformVisual />}
                      <ChevronRight className="h-3 w-3 text-[#1560BD] group-hover/chip:text-white transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Link */}
            <div className="pt-6 border-t border-[#E8E5DF] mt-6 flex items-center justify-between">
              <Link
                href={pillar.href}
                className="text-xs font-bold text-[#1560BD] hover:underline flex items-center gap-1"
              >
                <span>{t({ de: "Zur Hauptseite", en: "Go to Pillar Hub" })}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <span className="font-mono text-[10px] text-[#4A5568]">
                {pillar.chips.length} {t({ de: "Routen", en: "Routes" })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
