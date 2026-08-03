"use client";

import React from "react";
import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">
      <Link href="/" className="text-sm font-semibold text-[#1560BD] hover:underline">
        ← Zurück zur Startseite
      </Link>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#10233F]">Impressum</h1>
      <p className="text-sm text-[#52637A]">Stand: 23.07.2026</p>

      <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 space-y-3">
        <p className="text-[#10233F] font-bold">Rexity Labs UG (haftungsbeschränkt)</p>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Willighäuser Weg 11<br />
          29320 Südheide<br />
          Deutschland
        </p>
        <p className="text-sm text-[#52637A] pt-2">
          <strong>Vertreten durch:</strong><br />
          Sunny Singh Thakur (Geschäftsführer)
        </p>
        <p className="text-sm text-[#52637A] pt-2">
          <strong>Registergericht:</strong> Amtsgericht Lüneburg<br />
          <strong>Registernummer:</strong> HRB 213911
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-[#E8E5DF]">
        <h2 className="text-xl font-bold text-[#10233F]">Kontakt</h2>
        <p className="text-sm text-[#52637A]">
          E-Mail:{" "}
          <a href="mailto:hello@rexity.ai" className="text-[#1560BD] font-semibold hover:underline">
            hello@rexity.ai
          </a>
        </p>
        <p className="text-sm text-[#52637A]">
          Datenschutz:{" "}
          <a href="mailto:datenschutz@rexity.ai" className="text-[#1560BD] font-semibold hover:underline">
            datenschutz@rexity.ai
          </a>
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-[#E8E5DF]">
        <h2 className="text-xl font-bold text-[#10233F]">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p className="text-sm text-[#52637A]">
          Sunny Singh Thakur<br />
          Willighäuser Weg 11, 29320 Südheide, Deutschland
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-[#E8E5DF]">
        <h2 className="text-xl font-bold text-[#10233F]">Streitschlichtung</h2>
        <p className="text-sm text-[#52637A] leading-relaxed">
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </div>
    </div>
  );
}
