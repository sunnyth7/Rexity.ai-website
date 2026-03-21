"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Your Information" },
  { id: "storage-security", title: "Data Storage & Security" },
  { id: "sharing", title: "Data Sharing" },
  { id: "permissions", title: "Permissions" },
  { id: "your-rights", title: "Your Rights" },
  { id: "childrens-privacy", title: "Children's Privacy" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
]

export default function ClevrPrivacyPolicyPage() {
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
        Privacy Policy
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
        {/* Section 1: Introduction */}
        <section id="introduction" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            1. Introduction
          </h2>
          <p className="text-slate-700">
            CLEVR (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a social event planning app operated by REXITY.
            This privacy policy explains how we collect, use, and protect your information when you use the
            CLEVR mobile application.
          </p>
        </section>

        {/* Section 2: Information We Collect */}
        <section id="information-we-collect" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            2. Information We Collect
          </h2>

          <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
            Account Information
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Name, email address, and profile photo when you sign up via Google or Apple Sign-In</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
            Contacts
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>With your explicit permission, we access your device contacts solely to help you invite guests to your events</li>
            <li>We do <strong>not</strong> store or upload your contacts to our servers</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
            Event Data
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Event details you create (title, date, location, guest lists)</li>
            <li>Tasks, expenses, and music playlists</li>
            <li>Dress code options, food preferences, and gift wishlists</li>
            <li>Chat messages within event groups</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
            Device Information
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Device type, operating system version, and app version for crash reporting and performance improvement</li>
          </ul>
        </section>

        {/* Section 3: How We Use Your Information */}
        <section id="how-we-use" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>To create and manage your events</li>
            <li>To enable guest invitations via contacts</li>
            <li>To sync event data across your devices</li>
            <li>To facilitate group chat and collaborative features (music, food polls, expenses)</li>
            <li>To send event-related notifications</li>
          </ul>
        </section>

        {/* Section 4: Data Storage & Security */}
        <section id="storage-security" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            4. Data Storage &amp; Security
          </h2>
          <p className="text-slate-700 mb-4">
            Your data is stored securely using <strong>Supabase</strong> (hosted on AWS in the EU).
            All data is encrypted in transit (TLS) and at rest. Authentication is handled via Supabase Auth
            with OAuth 2.0 providers (Google, Apple).
          </p>
        </section>

        {/* Section 5: Data Sharing */}
        <section id="sharing" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            5. Data Sharing
          </h2>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-purple-800 font-medium">
              We do NOT sell, rent, or share your personal data with third parties.
            </p>
          </div>
          <p className="text-slate-700 mb-4">
            Event data is shared only with other members of the same event group. Third-party services used:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li><strong>Supabase</strong> &mdash; Database and authentication</li>
            <li><strong>Google Sign-In</strong> &mdash; Authentication</li>
            <li><strong>Apple Sign-In</strong> &mdash; Authentication (iOS only)</li>
            <li><strong>Spotify</strong> &mdash; Music playlist integration (optional, user-initiated)</li>
          </ul>
        </section>

        {/* Section 6: Permissions */}
        <section id="permissions" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            6. Permissions
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>
              <strong>READ_CONTACTS:</strong> Used exclusively to let you select guests from your phone contacts
              when creating an event. Contacts are read locally and never uploaded.
            </li>
            <li>
              <strong>INTERNET:</strong> Required for cloud sync and authentication.
            </li>
            <li>
              <strong>CAMERA/PHOTOS:</strong> Used for uploading event cover images and party memories (optional).
            </li>
          </ul>
        </section>

        {/* Section 7: Your Rights */}
        <section id="your-rights" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            7. Your Rights
          </h2>
          <p className="text-slate-700 mb-4">You can:</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Delete your account and all associated data at any time from the app settings</li>
            <li>Export your event data</li>
            <li>Revoke contact access from your device settings</li>
            <li>Opt out of notifications</li>
          </ul>
        </section>

        {/* Section 8: Children's Privacy */}
        <section id="childrens-privacy" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            8. Children&apos;s Privacy
          </h2>
          <p className="text-slate-700">
            CLEVR is not intended for children under 13. We do not knowingly collect data from children under 13.
          </p>
        </section>

        {/* Section 9: Changes to This Policy */}
        <section id="changes" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            9. Changes to This Policy
          </h2>
          <p className="text-slate-700">
            We may update this policy from time to time. We will notify users of significant changes via in-app notification.
          </p>
        </section>

        {/* Section 10: Contact Us */}
        <section id="contact" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            10. Contact Us
          </h2>
          <p className="text-slate-700 mb-4">
            For privacy questions or data deletion requests:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <p className="text-slate-800">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:privacy@rexity.ai"
                className="text-purple-600 hover:text-purple-800 hover:underline"
              >
                privacy@rexity.ai
              </a>
            </p>
            <p className="text-slate-800">
              <strong>Website:</strong>{" "}
              <a
                href="https://www.rexity.ai"
                className="text-purple-600 hover:text-purple-800 hover:underline"
              >
                www.rexity.ai
              </a>
            </p>
          </div>
        </section>
      </div>

      {/* Footer Note */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500 text-center">
          If you do not agree with this Privacy Policy, please stop using the app.
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
