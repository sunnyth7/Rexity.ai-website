import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChatbotWidget } from "@/components/ChatbotWidget";

export const metadata: Metadata = {
  title: "Rexity Labs — AI-Native Software & Automation Studio",
  description:
    "Rexity Labs entwickelt maßgeschneiderte Websites, intelligente AI Agents und nahtlose Prozessautomatisierungen — 100% DSGVO-konform & EU-gehostet.",
  metadataBase: new URL("https://www.rexity.ai"),
  alternates: {
    canonical: "https://www.rexity.ai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="scroll-smooth">
      <body className="min-h-screen bg-[#FAF8F4] text-[#10233F] antialiased selection:bg-[#1560BD]/20 selection:text-[#1560BD]">
        <LanguageProvider>
          <div className="flex min-h-screen flex-col justify-between">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ChatbotWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
