"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

const sections = [
  { id: "age-requirement", title: "Age Requirement" },
  { id: "csae-prevention", title: "Prevention of CSAE" },
  { id: "reporting", title: "Reporting Mechanisms" },
  { id: "content-moderation", title: "Content Moderation" },
  { id: "compliance", title: "Compliance" },
]

export default function ClevrChildSafetyPage() {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </button>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
        Child Safety Standards
      </h1>
      <p className="text-lg text-slate-600 mb-2">
        CLEVR &mdash; Social Event Planning
      </p>
      <p className="text-sm text-slate-500 mb-8">
        Last updated: March 21, 2026
      </p>

      {/* Table of Contents */}
      <nav className="bg-slate-50 rounded-xl p-6 mb-10 border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Table of Contents
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-purple-600 hover:text-purple-800 hover:underline transition-colors"
              >
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content Sections */}
      <div className="prose prose-slate max-w-none">
        {/* Section 1: Age Requirement */}
        <section id="age-requirement" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            1. Age Requirement
          </h2>
          <p className="text-slate-700">
            CLEVR is designed for users aged <strong>13 and above</strong>. We do not knowingly allow
            children under 13 to create accounts or use the app.
          </p>
        </section>

        {/* Section 2: Prevention of CSAE */}
        <section id="csae-prevention" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            2. Prevention of Child Sexual Abuse and Exploitation (CSAE)
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-medium">
              CLEVR has zero tolerance for child sexual abuse material (CSAM) or any form of child exploitation.
            </p>
          </div>
          <p className="text-slate-700 mb-4">We are committed to:</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Prohibiting any content that sexually exploits or endangers children</li>
            <li>Removing and reporting any such content immediately upon discovery</li>
            <li>Cooperating fully with law enforcement and relevant authorities</li>
          </ul>
        </section>

        {/* Section 3: Reporting Mechanisms */}
        <section id="reporting" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            3. Reporting Mechanisms
          </h2>
          <p className="text-slate-700 mb-4">
            Users can report concerns about child safety through:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
            <li><strong>In-app:</strong> Settings &gt; Help Center &gt; Report a Problem</li>
            <li>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:privacy@rexity.ai?subject=CLEVR%20Child%20Safety%20Report"
                className="text-purple-600 hover:text-purple-800 hover:underline"
              >
                privacy@rexity.ai
              </a>
            </li>
          </ul>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-800 font-medium">
              All reports are reviewed within 24 hours.
            </p>
          </div>
        </section>

        {/* Section 4: Content Moderation */}
        <section id="content-moderation" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            4. Content Moderation
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>User-generated content (chat messages, photos, event descriptions) is monitored for policy violations</li>
            <li>Event groups are invite-only, limiting exposure to known contacts</li>
            <li>Hosts have the ability to remove members from event groups</li>
          </ul>
        </section>

        {/* Section 5: Compliance */}
        <section id="compliance" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            5. Compliance
          </h2>
          <p className="text-slate-700 mb-4">
            CLEVR complies with all applicable child safety laws and reports to regional and national
            authorities as required.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-slate-800">
              <strong>Contact:</strong>{" "}
              <a
                href="mailto:privacy@rexity.ai"
                className="text-purple-600 hover:text-purple-800 hover:underline"
              >
                privacy@rexity.ai
              </a>
            </p>
          </div>
        </section>
      </div>

      {/* Footer Note */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500 text-center">
          &copy; {new Date().getFullYear()} REXITY AI Solutions. All rights reserved.
        </p>
      </div>

      {/* Back to Top */}
      <div className="mt-8 text-center">
        <a
          href="#"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: "smooth" })
          }}
        >
          Back to top
        </a>
      </div>
    </div>
  )
}
