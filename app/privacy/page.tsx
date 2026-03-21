"use client"

import Link from "next/link"
import { ArrowLeft, Shield, FileText, ExternalLink } from "lucide-react"

export default function PrivacyPolicyPage() {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const productPrivacyPolicies = [
    {
      name: "LevelKraft TELC Prep AI",
      description: "Privacy policy for the LevelKraft TELC language exam preparation app",
      href: "/LevelKraft-TELC%20Prep%20AI/Privacypolicy",
    },
    {
      name: "Save&Fresh",
      description: "Privacy policy for the Save&Fresh smart food & grocery management app",
      href: "/save-and-fresh/privacy",
    },
    {
      name: "CLEVR",
      description: "Privacy policy for the CLEVR social event planning app",
      href: "/clevr/privacy",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md">
              R
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
              REXITY
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">
            Last updated: {today}
          </p>
        </div>

        {/* Main Privacy Policy Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-10 mb-12">
          <section className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-600 mb-6">
              REXITY AI Solutions (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website
              and use our services.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Scope</h2>
            <p className="text-gray-600 mb-6">
              This policy applies to our website. Some products (such as the LevelKraft mobile app) have their own product-specific
              privacy policies (see below). Where the app is involved, subscriptions are managed via the Google Play Store.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Information We Collect</h2>
            <p className="text-gray-600 mb-4">We may collect information about you in various ways, including:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>
                <strong>Personal Data:</strong> Name, email address, phone number, and company information when you submit forms,
                request a demo, or contact us.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you interact with our website, including pages visited and features used.
              </li>
              <li>
                <strong>Device Data:</strong> Information about your device, browser type, approximate location (derived from IP), and IP address.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>Provide, operate, and maintain our website and services</li>
              <li>Respond to your inquiries, support requests, and demo requests</li>
              <li>Send you updates and service-related communications (and marketing where permitted)</li>
              <li>Improve our website performance, usability, and content</li>
              <li>Detect, prevent, and address security issues and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Legal Bases (GDPR)</h2>
            <p className="text-gray-600 mb-4">
              If you are located in the European Economic Area (EEA), we process personal data under the following legal bases:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li><strong>Contract:</strong> to provide requested services and respond to inquiries</li>
              <li><strong>Legitimate Interests:</strong> to secure, improve, and operate our website</li>
              <li><strong>Consent:</strong> where we ask for it (e.g., certain analytics or marketing communications)</li>
              <li><strong>Legal Obligation:</strong> where required by law</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Third-Party Services</h2>
            <p className="text-gray-600 mb-4">
              We may use third-party services for hosting, analytics, and other business purposes. These providers may process
              limited data on our behalf under appropriate safeguards.
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li><strong>Hosting/Infrastructure:</strong> may include cloud providers used to deliver the website</li>
              <li><strong>Analytics:</strong> used to understand website performance and improve content</li>
            </ul>
            <p className="text-gray-600 mb-6">
              For the LevelKraft mobile app, subscription payments are handled by <strong>Google Play</strong>, and subscription status
              may be validated via providers like <strong>RevenueCat</strong> to enable Premium features. We do not store full payment
              card details.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Data Retention</h2>
            <p className="text-gray-600 mb-6">
              We retain personal information only as long as necessary for the purposes described in this policy, unless a longer
              retention period is required or permitted by law.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Data Security</h2>
            <p className="text-gray-600 mb-6">
              We implement appropriate technical and organizational measures to protect personal information against unauthorized access,
              alteration, disclosure, or destruction. No method of transmission over the Internet is 100% secure, but we work hard to
              safeguard your data.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Your Rights</h2>
            <p className="text-gray-600 mb-4">
              Depending on your location (especially in the EEA/UK), you may have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>Access, correct, or delete your personal information</li>
              <li>Object to or restrict certain processing of your data</li>
              <li>Request data portability</li>
              <li>Withdraw consent at any time (where processing is based on consent)</li>
              <li>Lodge a complaint with a data protection authority</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Account Deletion (LevelKraft App)</h2>
            <p className="text-gray-600 mb-6">
              If you use the LevelKraft mobile app, you can delete your account directly in the app’s profile settings.
              Alternatively, you can request deletion by emailing{" "}
              <a href="mailto:support@rexity.ai?subject=Account%20Deletion%20Request" className="text-blue-600 hover:underline">
                support@rexity.ai
              </a>
              . Account deletion is permanent and will remove personal data associated with your account, unless we must retain
              certain records to comply with legal obligations.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Contact Us</h2>
            <p className="text-gray-600 mb-3">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-gray-600 mb-6">
              Support:{" "}
              <a href="mailto:support@rexity.ai" className="text-blue-600 hover:underline">
                support@rexity.ai
              </a>
              <br />
              Privacy:{" "}
              <a href="mailto:datenschutz@rexity.ai" className="text-blue-600 hover:underline">
                datenschutz@rexity.ai
              </a>
            </p>
          </section>
        </div>

        {/* Product-Specific Privacy Policies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            Product-Specific Privacy Policies
          </h2>
          <p className="text-gray-600 mb-6">
            Some of our products and services have their own privacy policies. Please review the relevant policy for the specific
            product you are using.
          </p>

          <div className="grid gap-4">
            {productPrivacyPolicies.map((policy) => (
              <Link
                key={policy.name}
                href={policy.href}
                className="group flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {policy.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{policy.description}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-8">
          <p>&copy; {new Date().getFullYear()} REXITY AI Solutions. All rights reserved.</p>
        </div>
      </main>
    </div>
  )
}
