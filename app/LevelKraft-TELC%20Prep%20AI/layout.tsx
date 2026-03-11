"use client"

import React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export default function LevelKraftLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <Link 
              href="/LevelKraft-TELC%20Prep%20AI" 
              className="flex items-center gap-2 text-xl font-bold text-slate-800 hover:text-blue-600 transition-colors"
            >
              <span className="text-2xl">📚</span>
              <span>LevelKraft</span>
              <span className="text-sm font-normal text-slate-500">TELC Prep AI</span>
            </Link>

            {/* Navigation Pills */}
            <nav className="flex items-center gap-2">
              <Link
                href="/admin"
                className="px-4 py-1.5 text-sm font-medium rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Admin
              </Link>
              <button
                className="px-4 py-1.5 text-sm font-medium rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                title="Language: German"
              >
                DE
              </button>
              <Link
                href="/LevelKraft-TELC%20Prep%20AI/Privacypolicy"
                className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-all ${
                  pathname?.includes("Privacypolicy")
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
