"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

const sections = [
  { id: "what-we-collect", title: "What We Collect" },
  { id: "microphone-voice", title: "Microphone / Voice Recordings" },
  { id: "how-we-use", title: "How We Use Data" },
  { id: "storage-retention", title: "Storage & Retention" },
  { id: "sharing", title: "Sharing" },
  { id: "user-rights", title: "User Rights" },
  { id: "contact", title: "Contact" },
  { id: "updates", title: "Updates" },
]

export default function PrivacyPolicyPage() {
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
        className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </button>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
        Privacy Policy
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        LevelKraft TELC Prep AI
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
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
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
            Onboarding Details
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Current language level</li>
            <li>Target language level</li>
            <li>Self-rating assessment</li>
            <li>Practice frequency preferences</li>
            <li>Learning motivation</li>
            <li>Preferred learning method</li>
            <li>Occupation / Job / Profession</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
            User Inputs Inside the App
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Test answers and quiz responses</li>
            <li>Writing submissions</li>
            <li>Speaking recordings</li>
            <li>Feedback interactions</li>
            <li>Optional pictures/images uploaded for exercises (if user provides them)</li>
          </ul>
        </section>

        {/* Section 2: Microphone / Voice Recordings */}
        <section id="microphone-voice" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            2. Microphone / Voice Recordings
          </h2>
          <p className="text-slate-700 mb-4">
            We record voice audio <strong>only when you explicitly start speaking tasks</strong> within the app. 
            Voice recording is never activated automatically or in the background.
          </p>
          <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
            Purpose of Voice Recording
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Enable speaking practice exercises for German language learning</li>
            <li>Provide AI-powered pronunciation evaluation and feedback</li>
            <li>Track your speaking progress over time</li>
            <li>Generate personalized recommendations for improvement</li>
          </ul>
        </section>

        {/* Section 3: How We Use Data */}
        <section id="how-we-use" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            3. How We Use Data
          </h2>
          <p className="text-slate-700 mb-4">
            We use your data to provide and improve our language learning services:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li><strong>Learning Features:</strong> Deliver personalized lessons, exercises, and content</li>
            <li><strong>Personalization:</strong> Tailor the learning experience to your level and goals</li>
            <li><strong>Progress Tracking:</strong> Monitor and display your learning journey and achievements</li>
            <li><strong>Support:</strong> Respond to your questions and provide customer assistance</li>
            <li><strong>Fraud Prevention:</strong> Protect against unauthorized access and abuse</li>
            <li><strong>Service Improvement:</strong> Analyze usage patterns to enhance our platform</li>
          </ul>
        </section>

        {/* Section 4: Storage & Retention */}
        <section id="storage-retention" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            4. Storage & Retention
          </h2>
          <p className="text-slate-700 mb-4">
            We retain your personal data for as long as necessary to provide the service and fulfill 
            the purposes described in this policy. This includes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Maintaining your account and learning progress</li>
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
            <li><strong>AI/ML Providers:</strong> To power speech recognition and language analysis</li>
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
                className="text-blue-600 hover:text-blue-800 hover:underline"
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
            the "Last updated" date below.
          </p>
          <p className="text-slate-700 mb-4">
            We encourage you to review this Privacy Policy periodically to stay informed about how 
            we protect your information.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
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
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
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
