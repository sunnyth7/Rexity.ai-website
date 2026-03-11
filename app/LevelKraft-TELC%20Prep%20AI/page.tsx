import Link from "next/link"

export default function LevelKraftHomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Welcome to LevelKraft
        </h1>
        <p className="text-xl text-slate-600 mb-8">
          TELC Prep AI - Your AI-powered German language learning companion
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/LevelKraft-TELC%20Prep%20AI/Privacypolicy"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
