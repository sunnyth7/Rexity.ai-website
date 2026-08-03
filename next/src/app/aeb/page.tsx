"use client";

import React from "react";
import Link from "next/link";

export default function AEBPage() {
  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8 text-[#10233F]">
      <Link href="/" className="text-sm font-semibold text-[#1560BD] hover:underline">
        ← Zurück zur Startseite
      </Link>

      <h1 className="text-3xl sm:text-4xl font-extrabold">Allgemeine Einkaufsbedingungen (AEB)</h1>
      <p className="text-sm text-[#52637A]">Stand: 23.07.2026 · Rexity Labs UG (haftungsbeschränkt)</p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Geltungsbereich</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Diese Allgemeinen Einkaufsbedingungen gelten für alle Bestellungen von Waren, Dienstleistungen und Softwarekomponenten durch die Rexity Labs UG (haftungsbeschränkt) bei Auftragnehmern und Lieferanten.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-[#E8E5DF]">
        <h2 className="text-xl font-bold">2. Qualitäts- & Compliance-Standards</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Zulieferungen und beauftragte Dienstleistungen müssen den hohen Standards von Rexity Labs bezüglich DSGVO-Konformität, EU-Hosting und IT-Sicherheit entsprechen.
        </p>
      </section>
    </div>
  );
}
