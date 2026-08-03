"use client";

import React from "react";
import Link from "next/link";

export default function AGBPage() {
  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8 text-[#10233F]">
      <Link href="/" className="text-sm font-semibold text-[#1560BD] hover:underline">
        ← Zurück zur Startseite
      </Link>

      <h1 className="text-3xl sm:text-4xl font-extrabold">Allgemeine Geschäftsbedingungen (AGB)</h1>
      <p className="text-sm text-[#52637A]">Stand: 23.07.2026 · Rexity Labs UG (haftungsbeschränkt)</p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Geltungsbereich</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge über Softwareentwicklung, KI-Agenten-Implementierung, Prozessautomatisierung und digitale Dienstleistungen zwischen Rexity Labs UG (haftungsbeschränkt) und ihren Auftraggebern.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-[#E8E5DF]">
        <h2 className="text-xl font-bold">2. Leistungsumfang & Scoping</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Der konkrete Leistungsumfang wird in individuellen Projektangeboten oder Scoping-Dokumenten vereinbart. Ein typisches Umsetzungsfenster für fokussierte Projekte liegt bei 14 bis 21 Tagen.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-[#E8E5DF]">
        <h2 className="text-xl font-bold">3. Nutzungsrechte & Urheberrecht</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Der Auftraggeber erhält nach vollständiger Vergütung die vereinbarten Nutzungsrechte an den für ihn individuell entwickelten Softwarekomponenten und Codebasis.
        </p>
      </section>
    </div>
  );
}
