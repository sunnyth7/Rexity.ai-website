"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, Mail, ShieldCheck } from "lucide-react"

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md">
              S
            </div>
            <span className="font-bold text-lg text-gray-900">
              Save&amp;Fresh
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-6">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Delete Your Account
          </h1>
          <p className="text-lg text-gray-600">
            Save&amp;Fresh &mdash; Smart Food &amp; Grocery Management
          </p>
        </div>

        {/* Option 1: In-App Deletion */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Option 1: Delete from the App (Recommended)
              </h2>
              <p className="text-gray-600 mb-4">
                You can delete your account directly within the Save&amp;Fresh app:
              </p>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>Open the <strong>Save&amp;Fresh</strong> app</li>
                <li>Go to <strong>Profile</strong> or <strong>Settings</strong></li>
                <li>Tap <strong>&quot;Delete Account&quot;</strong></li>
                <li>Confirm your decision when prompted</li>
              </ol>
              <p className="text-gray-600 mt-4">
                Your account and all associated data will be permanently deleted.
              </p>
            </div>
          </div>
        </div>

        {/* Option 2: Email Request */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Option 2: Request via Email
              </h2>
              <p className="text-gray-600 mb-4">
                If you are unable to delete your account through the app, you can send a deletion
                request to our support team:
              </p>
              <a
                href="mailto:support@rexity.ai?subject=Save%26Fresh%20Account%20Deletion%20Request"
                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@rexity.ai
              </a>
              <p className="text-gray-600 mt-4">
                Please include the email address associated with your account. We will process your
                request and delete your account within <strong>30 days</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* What Gets Deleted */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            What data is deleted?
          </h2>
          <p className="text-gray-600 mb-4">
            When you delete your account, the following data is permanently removed:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Account information (email, name)</li>
            <li>Food inventory and expiry tracking data</li>
            <li>Shopping lists and meal plans</li>
            <li>Dietary preferences and household settings</li>
            <li>Usage history and app activity</li>
            <li>Photos of food items or receipts (if uploaded)</li>
          </ul>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> Account deletion is permanent and cannot be undone. Some data may
              be retained if required by law (e.g., transaction records for legal compliance), but all
              personal and usage data will be removed.
            </p>
          </div>
        </div>

        {/* Privacy Policy Link */}
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-2">
            For more information, read our
          </p>
          <Link
            href="/save-and-fresh/privacy"
            className="text-green-600 hover:text-green-800 hover:underline font-medium"
          >
            Save&amp;Fresh Privacy Policy
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-8 mt-12">
          <p>&copy; {new Date().getFullYear()} REXITY AI Solutions. All rights reserved.</p>
        </div>
      </main>
    </div>
  )
}
