"use client"

import { useI18n } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n()
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-cyan-400/20 bg-black/40 p-0.5 font-mono text-[10px] uppercase tracking-widest",
        className,
      )}
    >
      {(["en", "de"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "rounded-full px-2.5 py-1 transition",
            locale === l
              ? "bg-cyan-400/90 text-black"
              : "text-cyan-300/60 hover:text-cyan-200",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
