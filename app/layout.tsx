import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { I18nProvider } from "@/components/i18n-provider"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Rexity — Build. Automate. Grow. with AI.",
    template: "%s — Rexity",
  },
  description:
    "Rexity builds websites, apps, AI automations, and AI-generated video at scale. From SaaS platforms to WhatsApp automation to GenAI training — one partner, end to end.",
  keywords: [
    "Rexity", "AI agency", "Web development", "App development",
    "Business automation", "WhatsApp automation", "VoIP receptionist",
    "AI video marketing", "SEO", "GenAI training",
  ],
  openGraph: {
    title: "Rexity — Build. Automate. Grow. with AI.",
    description: "Websites, apps, automations, AI video, and training — delivered end to end.",
    type: "website",
    siteName: "Rexity",
  },
  metadataBase: new URL("https://rexity.ai"),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
      <body className="relative min-h-screen overflow-x-hidden bg-[#04060a] font-sans text-white antialiased">
        {/* global tech grid background */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 tech-grid" />
        <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[500px]">
          <div className="glow-orb glow-orb-violet h-[420px] w-[420px] -top-32 left-1/2 -translate-x-1/2" />
          <div className="glow-orb glow-orb-cyan h-[300px] w-[300px] top-10 left-10" />
          <div className="glow-orb glow-orb-fuchsia h-[280px] w-[280px] top-0 right-10" />
        </div>
        <I18nProvider>{children}</I18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
