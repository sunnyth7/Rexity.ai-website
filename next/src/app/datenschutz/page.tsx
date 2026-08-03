"use client";

import React from "react";
import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8 text-[#10233F]">
      <Link href="/" className="text-sm font-semibold text-[#1560BD] hover:underline">
        ← Zurück zur Startseite
      </Link>

      <h1 className="text-3xl sm:text-4xl font-extrabold">Datenschutzerklärung</h1>
      <p className="text-sm text-[#52637A]">Stand: 23.07.2026</p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Datenschutz auf einen Blick</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-[#E8E5DF]">
        <h2 className="text-xl font-bold">2. Verantwortliche Stelle</h2>
        <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 space-y-2 text-sm text-[#52637A]">
          <p className="font-bold text-[#10233F]">Rexity Labs UG (haftungsbeschränkt)</p>
          <p>Willighäuser Weg 11, 29320 Südheide, Deutschland</p>
          <p>E-Mail: datenschutz@rexity.ai</p>
        </div>
      </section>

      <section className="space-y-3 pt-4 border-t border-[#E8E5DF]">
        <h2 className="text-xl font-bold">3. Datenerfassung auf unserer Website</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Unsere Systeme verarbeiten Daten ausschließlich in EU-Rechenzentren. KI-gestützte Funktionen (wie der Rexity Chatbot) nutzen Azure OpenAI in der Datenregion Germany West Central. Ihre Daten werden nicht für das Training öffentlicher KI-Modelle verwendet.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-[#E8E5DF]">
        <h2 className="text-xl font-bold">4. Ihre Rechte</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung sowie ein Recht auf Berichtigung oder Löschung dieser Daten. Wenden Sie sich hierzu an datenschutz@rexity.ai.
        </p>
      </section>
    </div>
  );
}
