"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

const sections = [
  { id: "what-we-collect", title: "What We Collect" },
  { id: "camera-photos", title: "Camera & Photos" },
  { id: "how-we-use", title: "How We Use Data" },
  { id: "storage-retention", title: "Storage & Retention" },
  { id: "sharing", title: "Sharing" },
  { id: "user-rights", title: "User Rights" },
  { id: "contact", title: "Contact" },
  { id: "updates", title: "Updates" },
]

export default function SaveAndFreshPrivacyPolicyPage() {
  const router = useRouter()
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-green-600 transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </button>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
        Privacy Policy
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Save&amp;Fresh &mdash; Smart Food &amp; Grocery Management
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
                className="text-green-600 hover:text-green-800 hover:underline transition-colors"
              >
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content Sections */}
      <div className="prose prose-slate max-w-none">
        {/* Section 1: What We Collect */}
        <section id="what-we-collect" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            1. What We Collect
          </h2>

          <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
            Account Information
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Email address</li>
            <li>Name (if provided)</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
            Household &amp; Preferences
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Household size</li>
            <li>Dietary preferences and restrictions</li>
            <li>Notification preferences</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
            Food &amp; Grocery Data
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Food items added to your inventory (name, category, quantity)</li>
            <li>Expiry and best-before dates</li>
            <li>Purchase dates and storage locations</li>
            <li>Photos of food items or receipts (if you choose to upload them)</li>
            <li>Shopping lists and meal plans</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
            Usage Data
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>App interactions (items added, removed, consumed, or discarded)</li>
            <li>Feature usage patterns</li>
            <li>Device information and app version</li>
          </ul>
        </section>

        {/* Section 2: Camera & Photos */}
        <section id="camera-photos" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            2. Camera &amp; Photos
          </h2>
          <p className="text-slate-700 mb-4">
            Save&amp;Fresh may request access to your device camera or photo library <strong>only when you
            explicitly choose</strong> to scan a barcode, photograph a food item, or capture a receipt.
            Camera access is never activated automatically or in the background.
          </p>
          <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
            Purpose of Camera Access
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Scan product barcodes to quickly add items to your inventory</li>
            <li>Capture photos of food items for easy identification</li>
            <li>Scan receipts to auto-populate grocery purchases</li>
            <li>Recognize expiry dates from product labels</li>
          </ul>
        </section>

        {/* Section 3: How We Use Data */}
        <section id="how-we-use" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            3. How We Use Data
          </h2>
          <p className="text-slate-700 mb-4">
            We use your data to provide and improve our food management services:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li><strong>Inventory Management:</strong> Track your food items, quantities, and expiry dates</li>
            <li><strong>Expiry Alerts:</strong> Send timely notifications before items expire</li>
            <li><strong>Personalization:</strong> Tailor suggestions based on your dietary preferences and habits</li>
            <li><strong>Waste Reduction Insights:</strong> Provide analytics on your food consumption and waste patterns</li>
            <li><strong>Shopping Assistance:</strong> Help generate smart shopping lists based on your inventory</li>
            <li><strong>Support:</strong> Respond to your questions and provide customer assistance</li>
            <li><strong>Service Improvement:</strong> Analyze usage patterns to enhance the app experience</li>
          </ul>
        </section>

        {/* Section 4: Storage & Retention */}
        <section id="storage-retention" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            4. Storage &amp; Retention
          </h2>
          <p className="text-slate-700 mb-4">
            We retain your personal data for as long as necessary to provide the service and fulfill
            the purposes described in this policy. This includes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Maintaining your account, inventory, and consumption history</li>
            <li>Complying with legal obligations</li>
            <li>Resolving disputes and enforcing our agreements</li>
          </ul>
          <p className="text-slate-700 mt-4">
            <strong>You can request deletion of your data at any time</strong> by contacting us at the email
            address provided below. Upon receiving your request, we will delete your data within 30 days,
            unless we are required to retain it for legal purposes.
          </p>
        </section>

        {/* Section 5: Sharing */}
        <section id="sharing" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            5. Sharing
          </h2>
          <p className="text-slate-700 mb-4">
            We may share your data with trusted service providers who help us operate the app:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li><strong>Hosting Providers:</strong> To store and serve the application</li>
            <li><strong>Database Services:</strong> To securely store your data</li>
            <li><strong>Analytics Services:</strong> To understand usage and improve the service</li>
            <li><strong>AI/ML Providers:</strong> To power barcode scanning, receipt recognition, and expiry date detection</li>
          </ul>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
            <p className="text-green-800 font-medium">
              We do NOT sell your personal data to third parties.
            </p>
          </div>
        </section>

        {/* Section 6: User Rights */}
        <section id="user-rights" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            6. User Rights
          </h2>
          <p className="text-slate-700 mb-4">
            Depending on your location, you may have the following rights regarding your personal data:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data</li>
            <li><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing where applicable</li>
            <li><strong>Data Portability:</strong> Request your data in a portable format</li>
            <li><strong>Objection:</strong> Object to certain types of data processing</li>
          </ul>
          <p className="text-slate-700 mt-4">
            To exercise any of these rights, please contact us using the information below.
          </p>
        </section>

        {/* Section 7: Contact */}
        <section id="contact" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            7. Contact
          </h2>
          <p className="text-slate-700 mb-4">
            If you have any questions about this Privacy Policy or wish to exercise your rights,
            please contact us at:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-slate-800">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:support@rexity.ai"
                className="text-green-600 hover:text-green-800 hover:underline"
              >
                support@rexity.ai
              </a>
            </p>
          </div>
        </section>

        {/* Section 8: Updates */}
        <section id="updates" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            8. Updates
          </h2>
          <p className="text-slate-700 mb-4">
            We may update this Privacy Policy from time to time to reflect changes in our practices
            or for legal, operational, or regulatory reasons. When we make changes, we will update
            the &ldquo;Last updated&rdquo; date below.
          </p>
          <p className="text-slate-700 mb-4">
            We encourage you to review this Privacy Policy periodically to stay informed about how
            we protect your information.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              <strong>Last updated:</strong> {today}
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
          className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 transition-colors"
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
