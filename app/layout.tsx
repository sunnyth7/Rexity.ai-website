import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-geist",
})
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "REXITY.AI - Enterprise SAP AI Platform | Agentic AI Workflows & Intelligent Dashboards",
  description:
    "Transform your SAP enterprise with REXITY.AI's next-generation agentic AI workflows, intelligent dashboards, and autonomous agents. Optimize business processes with real-time AI analytics, predictive maintenance, and smart automation for SAP systems.",
  generator: "v0.app",
  keywords: [
    "REXITY",
    "REXITY.AI",
    "SAP AI",
    "SAP Agentic AI",
    "SAP AI Workflows",
    "Enterprise AI Platform",
    "SAP Joule",
    "SAP Automation",
    "AI Dashboards",
    "SAP Analytics",
    "Predictive Maintenance",
    "Asset Management AI",
    "SAP Business Intelligence",
    "Enterprise Automation",
    "AI Agents",
    "SAP Integration",
    "Business Process Automation",
    "SAP S/4HANA AI",
    "Intelligent Enterprise",
    "SAP Digital Transformation",
  ],
  authors: [{ name: "REXITY AI Solutions", url: "https://rexity.ai" }],
  creator: "REXITY AI Solutions",
  publisher: "REXITY AI Solutions",
  metadataBase: new URL("https://rexity.ai"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "de-DE": "/de",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rexity.ai",
    title: "REXITY.AI - Enterprise SAP AI Platform | Agentic AI Workflows & Intelligent Dashboards",
    description:
      "Transform your SAP enterprise with REXITY.AI's next-generation agentic AI workflows, intelligent dashboards, and autonomous agents. Optimize business processes with real-time AI analytics.",
    siteName: "REXITY.AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "REXITY.AI - Enterprise SAP AI Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "REXITY.AI - Enterprise SAP AI Platform | Agentic AI Workflows",
    description:
      "Transform your SAP enterprise with REXITY.AI's next-generation agentic AI workflows, intelligent dashboards, and autonomous agents.",
    images: ["/og-image.png"],
    creator: "@rexityai",
    site: "@rexityai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    bing: "your-bing-verification-code",
  },
  category: "technology",
  classification: "Business Software",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${_geist.variable} ${_geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "REXITY AI Solutions",
              alternateName: "REXITY.AI",
              url: "https://rexity.ai",
              logo: "https://rexity.ai/logo.png",
              description:
                "Enterprise AI platform providing SAP Agentic AI solutions, intelligent dashboards, Joule Agents, and autonomous workflow automation for digital transformation.",
              sameAs: [
                "https://linkedin.com/company/rexity",
                "https://twitter.com/rexityai",
                "https://facebook.com/rexityai",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Sales",
                email: "contact@rexity.ai",
                availableLanguage: ["English", "German"],
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "DE",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "REXITY Enterprise AI Platform",
              applicationCategory: "BusinessApplication",
              applicationSubCategory: "Enterprise Resource Planning",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "127",
                bestRating: "5",
                worstRating: "1",
              },
              featureList: [
                "SAP Agentic AI Workflows",
                "AI Powered Dashboards",
                "Asset Management",
                "Predictive Maintenance",
                "Real-time Analytics",
                "Business Process Automation",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "REXITY.AI",
              url: "https://rexity.ai",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://rexity.ai/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://rexity.ai",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "SAP Agentic AI Workflows",
                  item: "https://rexity.ai/sap-agentic",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "AI Powered Dashboards",
                  item: "https://rexity.ai/ai-dashboards",
                },
              ],
            }),
          }}
        />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="canonical" href="https://rexity.ai" />
        <link rel="alternate" hrefLang="en" href="https://rexity.ai" />
        <link rel="alternate" hrefLang="de" href="https://rexity.ai/de" />
        <link rel="alternate" hrefLang="x-default" href="https://rexity.ai" />
      </head>
      <body className={`font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Skip to main content
        </a>
        <div id="main-content">{children}</div>
        <Analytics />
      </body>
    </html>
  )
}
