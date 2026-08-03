"use client";

import React from "react";
import { useLanguage } from "@/lib/language-context";

// Brief constraint: Keep hidden behind flag until real approved quotes exist.
const SHOW_TESTIMONIALS = false;

export function Testimonials() {
  const { t } = useLanguage();

  if (!SHOW_TESTIMONIALS) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 border-t border-[#E8E5DF]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-[#10233F]">
          {t({ de: "Was unsere Partner sagen", en: "What Our Partners Say" })}
        </h2>
      </div>
    </section>
  );
}
