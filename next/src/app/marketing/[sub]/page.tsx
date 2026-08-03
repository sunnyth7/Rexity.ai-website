import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, ChevronLeft } from "lucide-react";

export function generateStaticParams() {
  return [
    { sub: "seo" },
    { sub: "content" },
    { sub: "video" },
  ];
}

const subDetails: Record<string, { titleDe: string; titleEn: string; descDe: string; descEn: string }> = {
  seo: {
    titleDe: "Technisches SEO & Suchmaschinenoptimierung",
    titleEn: "Technical SEO & Search Engine Optimization",
    descDe: "Optimierung der technischen Web-Performance, Keyword-Architektur und Suchmaschinen-Sichtbarkeit.",
    descEn: "Technical web vitals optimization, keyword architecture mapping, and search engine visibility.",
  },
  content: {
    titleDe: "Content & Social Strategie",
    titleEn: "Content & Social Strategy",
    descDe: "Zielgerichtete Content-Konzepte und Keyword-Maps für qualifizierte B2B- und B2C-Neukundengewinnung.",
    descEn: "Targeted content frameworks and keyword maps engineered for qualified lead acquisition.",
  },
  video: {
    titleDe: "KI-Videomarketing & Kurzvideo-Konzepte",
    titleEn: "AI Video Marketing & Short-Form Concepts",
    descDe: "Automatisierte Skripte, KI-Avatare und kampagnenreife Kurzvideo-Workflows für Social Media.",
    descEn: "Automated video scriptwriting, AI avatars, and short-form video workflows for modern campaigns.",
  },
};

export default async function MarketingSubPage({ params }: { params: Promise<{ sub: string }> }) {
  const { sub } = await params;
  const detail = subDetails[sub] || subDetails["seo"];

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      <Link href="/marketing" className="inline-flex items-center gap-1 text-sm font-semibold text-[#1560BD] hover:underline">
        <ChevronLeft className="h-4 w-4" />
        <span>Zurück zu Marketing</span>
      </Link>

      <div className="space-y-4">
        <span className="font-mono text-xs font-bold text-[#1560BD] uppercase tracking-wider">
          MARKETING · LEISTUNG {sub.toUpperCase()}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#10233F]">{detail.titleDe}</h1>
        <p className="text-lg text-[#4A5568] leading-relaxed">{detail.descDe}</p>
      </div>

      <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-6 shadow-xs">
        <h2 className="text-2xl font-bold text-[#10233F]">Was Rexity für Sie umsetzt</h2>
        <ul className="space-y-3 text-sm text-[#4A5568]">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#0FB5A6]" />
            <span>Fundiertes Audit und strukturierter Content-Entwicklungsplan</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#0FB5A6]" />
            <span>Messbare Performance-Kriterien ohne unberechtigte Ranking-Versprechen</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#0FB5A6]" />
            <span>Schnelle Bereitstellung im 14–21 Tage Scoping-Zeitfenster</span>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl bg-[#FAF8F4] border border-[#E8E5DF] p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#10233F]">Möchten Sie Ihr Marketing mit {detail.titleDe} skalieren?</h2>
        <a
          href="mailto:hello@rexity.ai"
          className="inline-flex items-center gap-2 rounded-full bg-[#1560BD] px-7 py-3 text-sm font-bold text-white hover:bg-[#114E9B] transition-all"
        >
          <span>Jetzt E-Mail an hello@rexity.ai</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
