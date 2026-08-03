"use client";

import React from "react";
import Link from "next/link";

export default function BarrierefreiheitPage() {
  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8 text-[#10233F]">
      <Link href="/" className="text-sm font-semibold text-[#1560BD] hover:underline">
        ← Zurück zur Startseite
      </Link>

      <h1 className="text-3xl sm:text-4xl font-extrabold">Erklärung zur Barrierefreiheit</h1>
      <p className="text-sm text-[#52637A]">Stand: 23.07.2026 · Rexity Labs UG (haftungsbeschränkt)</p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Unser Ziel für zugängliche Software</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Rexity Labs ist bestrebt, ihre digitalen Angebote im Einklang mit den Bestimmungen des Behindertengleichstellungsgesetzes (BGG) sowie der Barrierefreien-Informationstechnik-Verordnung (BITV 2.0) zur Umsetzung der Richtlinie (EU) 2016/2102 barrierefrei zugänglich zu machen.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-[#E8E5DF]">
        <h2 className="text-xl font-bold">Stand der Vereinbarkeit mit den Anforderungen</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Diese Website ist mit den Anforderungen der BITV 2.0 weitestgehend vereinbar. Wir arbeiten kontinuierlich an der Verbesserung von Kontrasten, Tastaturnavigation und ARIA-Labels für Screenreader.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-[#E8E5DF]">
        <h2 className="text-xl font-bold">Feedback und Kontakt</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Sollten Ihnen Mängel in Bezug auf die barrierefreie Gestaltung unserer Website auffallen, können Sie uns gerne kontaktieren:<br />
          E-Mail: <a href="mailto:hello@rexity.ai" className="text-[#1560BD] font-semibold hover:underline">hello@rexity.ai</a>
        </p>
      </section>
    </div>
  );
}
