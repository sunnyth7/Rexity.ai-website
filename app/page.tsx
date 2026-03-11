"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Menu, X, ChevronRight, Sparkles, ArrowRight, Play, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SocialIcon } from "@/components/social-icon"

export default function RexityWebsite() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")
  const [currentPage, setCurrentPage] = useState("home")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [language, setLanguage] = useState("en")
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    phone: "",
    query: "",
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const underlineWordsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentPage])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const words = entry.target.querySelectorAll(".fx-underline")
            words.forEach((word) => {
              word.classList.add("fx-animate")
            })
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.5 },
    )

    if (underlineWordsRef.current) {
      observer.observe(underlineWordsRef.current)
    }

    return () => observer.disconnect()
  }, [currentPage])

  const t = {
    en: {
      nav: {
        home: "Home",
        sapAgentic: "SAP Agentic AI",
        joule: "Joule Agents",
        workflows: "AI Powered Dashboard",
        caseStudies: "Case Studies",
      },
      hero: {
        badge: "ENTERPRISE AI PLATFORM",
        title1: "Transform Beyond",
        title2: "Limits with REXITY",
        subtitle: "Where SAP Intelligence Meets Autonomous Innovation",
        description:
          "Empowering businesses worldwide with next-generation AI agents and autonomous workflows that don't just automate—they think, adapt, and optimize in real-time.",
        ctaJourney: "Start Your Journey",
        ctaDemo: "Watch Demo",
        trusted: "Trusted by Industry Leaders",
      },
      solutions: {
        title: "Service Offered",
        sapAgentic: {
          title: "SAP Agentic AI Workflows",
          description:
            "Transform your SAP ecosystem with intelligent autonomous agents that adapt, learn, and optimize business processes in real-time with predictive analytics and smart automation.",
        },
        joule: {
          title: "SAP Joule AI Agents",
          description: "Natural language AI assistants powered by SAP Joule for seamless enterprise operations",
        },
        workflows: {
          title: "SAP AI Powered Dashboards",
          description:
            "Gain actionable insights with AI-driven dashboards that provide real-time analytics, predictive intelligence, and comprehensive visibility across assets, projects, sales, and customer relationships.",
        },
        caseStudies: {
          title: "Case Studies",
          description: "Real-world success stories from leading enterprises transforming with Rexity",
        },
        explore: "Explore solution",
      },
      cta: {
        title: "Ready to Lead the Future?",
        subtitle: "Start Transforming your business with REXITY.ai now",
        button: "Schedule Your Consultation",
      },
      form: {
        title: "Schedule Your Demo",
        subtitle: "See Rexity in action. Our experts will walk you through our solutions.",
        name: "Full Name",
        business: "Business / Company Name",
        email: "Email Address",
        phone: "Phone Number",
        query: "Your Query / Interests",
        queryPlaceholder: "Tell us about your specific needs, interests, or questions about our SAP AI solutions...",
        submit: "Submit Request",
        terms: "By submitting this form, you agree to our Terms of Service and Privacy Policy",
        thankYou: "Thank You!",
        success: "Your demo request has been submitted successfully. We'll contact you soon!",
        backToHome: "Back to Home",
      },
      footer: {
        description: "Empowering businesses worldwide with autonomous AI agents and intelligent workflows.",
        company: "Company",
        resources: "Resources",
        about: "About",
        careers: "Careers",
        partners: "Partners",
        blog: "Blog",
        documentation: "Documentation",
        support: "Support",
        contact: "Contact",
        copyright: "© 2025 REXITY AI Solutions. All rights reserved.",
        privacy: "Privacy Policy",
        terms: "Terms",
        cookies: "Cookies",
        sitemap: "Sitemap",
      },
    },
    de: {
      nav: {
        home: "Startseite",
        sapAgentic: "SAP Agentic KI",
        joule: "Joule Agenten",
        workflows: "AI-gestützte Dashboard",
        caseStudies: "Fallstudien",
      },
      hero: {
        badge: "ENTERPRISE KI-PLATTFORM",
        title1: "Transformation Über",
        title2: "Grenzen hinaus mit REXITY",
        subtitle: "Wo SAP-Intelligenz auf Autonome Innovation trifft",
        description:
          "Wir befähigen Unternehmen weltweit mit KI-Agenten und autonomen Workflows der nächsten Generation, die nicht nur automatisieren – sie denken, passen sich an und optimieren in Echtzeit.",
        ctaJourney: "Ihre Reise beginnen",
        ctaDemo: "Demo ansehen",
        trusted: "Vertraut von Branchenführern",
      },
      solutions: {
        title: "Service Offered",
        sapAgentic: {
          title: "SAP Agentic KI-Workflows",
          description:
            "Transformieren Sie Ihren SAP-Ekosystem mit intelligenten autonomen Agenten, die in Echtzeit adaptieren, lernen und optimieren Sie Geschäftsprozesse mit Vorhersageanalyse und intelligentem Automatisierungsverfahren.",
        },
        joule: {
          title: "SAP Joule KI-Agenten",
          description: "Natürlichsprachige KI-Assistenten auf Basis von SAP Joule für nahtlose Unternehmensabläufe",
        },
        workflows: {
          title: "SAP AI-gestützte Dashboards",
          description:
            "Erhalten Sie handlungsfähige Einblicke mit KI-gestützten Dashboards, die in Echtzeit-Analysen, vorhersagefähige Intelligenz und umfassende Sichtbarkeit über Anlagen, Projekte, Vertrieb und Kundenbeziehungen bieten.",
        },
        caseStudies: {
          title: "Fallstudien",
          description: "Reale Erfolgsgeschichten führender Unternehmen, die sich mit Rexity transformieren",
        },
        explore: "Lösung erkunden",
      },
      cta: {
        title: "Bereit, die Zukunft anzuführen?",
        subtitle: "Beginnen Sie jetzt mit der Transformation Ihres Unternehmens mit REXITY.ai",
        button: "Beratungstermin vereinbaren",
      },
      form: {
        title: "Demo vereinbaren",
        subtitle: "Erleben Sie Rexity in Aktion. Unsere Experten führen Sie durch unsere Lösungen.",
        name: "Vollständiger Name",
        business: "Unternehmen / Firmenname",
        email: "E-Mail-Adresse",
        phone: "Telefonnummer",
        query: "Ihre Anfrage / Interessen",
        queryPlaceholder:
          "Erzählen Sie uns von Ihren spezifischen Anforderungen, Interessen oder Fragen zu unseren SAP KI-Lösungen...",
        submit: "Anfrage absenden",
        terms:
          "Mit dem Absenden dieses Formulars stimmen Sie unseren Nutzungsbedingungen und Datenschutzrichtlinien zu",
        thankYou: "Vielen Dank!",
        success: "Ihre Demo-Anfrage wurde erfolgreich übermittelt. Wir werden uns in Kürze bei Ihnen melden!",
        backToHome: "Zurück zur Startseite",
      },
      footer: {
        description: "Wir befähigen Unternehmen weltweit mit autonomen KI-Agenten und intelligenten Workflows.",
        company: "Unternehmen",
        resources: "Ressourcen",
        about: "Über uns",
        careers: "Karriere",
        partners: "Partner",
        blog: "Blog",
        documentation: "Dokumentation",
        support: "Support",
        contact: "Kontakt",
        copyright: "© 2025 REXITY AI Solutions. Alle Rechte vorbehalten.",
        privacy: "Datenschutz",
        terms: "AGB",
        cookies: "Cookies",
        sitemap: "Sitemap",
      },
    },
  }

  const currentLang = t[language]

  const solutions = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: currentLang.solutions.sapAgentic.title,
      description: currentLang.solutions.sapAgentic.description,
      color: "from-purple-500 to-pink-500",
      page: "/sap-agentic",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: currentLang.solutions.workflows.title,
      description: currentLang.solutions.workflows.description,
      color: "from-blue-500 to-blue-600",
      page: "/ai-dashboards",
    },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
    setTimeout(() => {
      setFormSubmitted(false)
      setFormData({ name: "", business: "", email: "", phone: "", query: "" })
      setCurrentPage("home")
    }, 3000)
  }

  const handleTileClick = (solution: { page: string }) => {
    // Check if it's a route (starts with /)
    if (solution.page.startsWith("/")) {
      router.push(solution.page)
    } else {
      setCurrentPage(solution.page)
      setActiveSection(solution.page)
    }
  }

  const ScheduleDemoPage = () => (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setCurrentPage("home")}
          className="mb-6 sm:mb-8 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm sm:text-base"
        >
          ← {currentLang.form.backToHome}
        </button>

        <div className="bg-white border-2 border-blue-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent text-center">
            {currentLang.form.title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 text-center">
            {currentLang.form.subtitle}
          </p>

          {formSubmitted ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">✅</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{currentLang.form.thankYou}</h2>
              <p className="text-lg sm:text-xl text-gray-600">{currentLang.form.success}</p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentLang.form.name} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-900 text-sm sm:text-base"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="business" className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentLang.form.business} *
                </label>
                <input
                  type="text"
                  id="business"
                  name="business"
                  required
                  value={formData.business}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-900 text-sm sm:text-base"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentLang.form.email} *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-900 text-sm sm:text-base"
                  placeholder="john.doe@company.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentLang.form.phone} *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-900 text-sm sm:text-base"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="query" className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentLang.form.query} *
                </label>
                <textarea
                  id="query"
                  name="query"
                  required
                  value={formData.query}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-900 resize-none text-sm sm:text-base"
                  placeholder={currentLang.form.queryPlaceholder}
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-xl font-semibold text-base sm:text-lg md:text-xl hover:scale-105 transition-all shadow-lg shadow-blue-500/50"
              >
                {currentLang.form.submit}
              </button>

              <p className="text-xs sm:text-sm text-gray-500 text-center">{currentLang.form.terms}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  )

  const JouleAgentsPage = () => (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => setCurrentPage("home")}
          className="mb-6 sm:mb-8 flex items-center gap-2 text-cyan-600 hover:text-cyan-800 font-semibold text-sm sm:text-base"
        >
          ← {currentLang.form.backToHome}
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          {currentLang.solutions.joule.title}
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12">
          Your natural language AI copilot for SAP, powered by generative AI
        </p>
      </div>
    </div>
  )

  const WorkflowsPage = () => (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => setCurrentPage("home")}
          className="mb-6 sm:mb-8 flex items-center gap-2 text-orange-600 hover:text-orange-800 font-semibold text-sm sm:text-base"
        >
          ← {currentLang.form.backToHome}
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          {currentLang.solutions.workflows.title}
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12">
          Multi-agent orchestration systems that transform complex business processes
        </p>
      </div>
    </div>
  )

  const CaseStudiesPage = () => (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => setCurrentPage("home")}
          className="mb-6 sm:mb-8 flex items-center gap-2 text-green-600 hover:text-green-800 font-semibold text-sm sm:text-base"
        >
          ← {currentLang.form.backToHome}
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          {currentLang.solutions.caseStudies.title}
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12">
          Real transformations from leading enterprises powered by Rexity
        </p>
      </div>
    </div>
  )

  const HomePage = () => (
    <>
      <section className="min-h-screen flex items-center justify-center relative px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full mb-6 sm:mb-8 shadow-lg">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-blue-700 text-xs sm:text-sm font-semibold tracking-wide">
              {currentLang.hero.badge}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            <div className="block">
              <span className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">
                {currentLang.hero.title1}
              </span>
            </div>
            <div className="block">
              <span className="bg-gradient-to-r from-blue-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                {currentLang.hero.title2}
              </span>
            </div>
          </h1>

          <div
            ref={underlineWordsRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-4 sm:mb-6"
          >
            <span
              className="fx-underline text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              style={{ "--fx": "rgb(37, 99, 235)" } as React.CSSProperties}
            >
              Innovate
            </span>
            <span
              className="fx-underline text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              style={{ "--fx": "rgb(147, 51, 234)" } as React.CSSProperties}
            >
              Accelerate
            </span>
            <span
              className="fx-underline text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent"
              style={{ "--fx": "rgb(219, 39, 119)" } as React.CSSProperties}
            >
              Dominate
            </span>
          </div>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-4 sm:mb-6 max-w-4xl mx-auto leading-relaxed px-4">
            {currentLang.hero.subtitle}
          </p>

          <p className="text-sm sm:text-base text-gray-500 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
            {currentLang.hero.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4">
            <button
              onClick={() => {
                const ctaSection = document.getElementById("consultation-section")
                if (ctaSection) {
                  ctaSection.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              }}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-red-600 rounded-full font-semibold text-sm sm:text-base hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-white"
            >
              {currentLang.hero.ctaJourney}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setShowVideoModal(true)}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-gray-300 rounded-full font-semibold text-sm sm:text-base hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2 shadow-md"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              {currentLang.hero.ctaDemo}
            </button>
          </div>

          <div className="mb-8 sm:mb-12 px-4">
            <button
              onClick={() => router.push("/assets-dashboard")}
              className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm border border-white/10 transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
            >
              Open Asset Dashboard →
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-60 px-4">
            <div className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {currentLang.hero.trusted}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8 relative bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-4">
              <span className="bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
                Service Offered
              </span>
            </h2>
          </div>

          <div className="flex flex-col gap-6 sm:gap-8">
            {solutions.map((solution, idx) => (
              <div
                key={idx}
                onClick={() => handleTileClick(solution)}
                className="agent-tile group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 cursor-pointer hover:border-blue-300 transition-all duration-500 hover:scale-[1.02] shadow-lg hover:shadow-2xl border-2 border-transparent overflow-hidden"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div
                    className={`flex-shrink-0 inline-flex p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br ${solution.color} text-white shadow-lg`}
                  >
                    {solution.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-gray-900">{solution.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{solution.description}</p>
                  </div>

                  <div className="flex items-center text-blue-600 font-semibold text-sm sm:text-base md:ml-4">
                    {currentLang.solutions.explore}
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>

                <div
                  className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${solution.color} opacity-10 rounded-bl-full transform group-hover:scale-150 transition-transform duration-500`}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="consultation-section" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8 relative">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl overflow-hidden">
            <div className="relative text-center text-white">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-4">
                {currentLang.cta.title}
              </h2>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 opacity-95 font-light px-4">
                {currentLang.cta.subtitle}
              </p>
              <button
                onClick={() => {
                  setCurrentPage("schedule-demo")
                  setActiveSection("schedule-demo")
                }}
                className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-6 bg-white text-blue-700 rounded-full font-bold text-base sm:text-lg md:text-xl hover:scale-110 transition-all"
              >
                {currentLang.cta.button}
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 sm:py-12 px-4 sm:px-6 md:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg">
                  R
                </div>
                <div>
                  <div className="font-bold text-xl bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                    REXITY
                  </div>
                  <div className="text-xs text-gray-500 font-medium">Enterprise AI Platform</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{currentLang.footer.description}</p>
            </div>

            <div className="flex gap-3" role="group" aria-label="Social media links">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                aria-label="Visit our LinkedIn page"
              >
                <SocialIcon platform="linkedin" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                aria-label="Visit our Twitter/X page"
              >
                <SocialIcon platform="twitter" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                aria-label="Visit our Facebook page"
              >
                <SocialIcon platform="facebook" />
              </a>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-6 sm:pt-8 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-primary">
                {currentLang.footer.company}
              </a>
              <a href="#" className="hover:text-primary">
                {currentLang.footer.resources}
              </a>
              <a href="#" className="hover:text-primary">
                {currentLang.footer.about}
              </a>
              <a href="#" className="hover:text-primary">
                {currentLang.footer.careers}
              </a>
              <a href="#" className="hover:text-primary">
                {currentLang.footer.partners}
              </a>
              <a href="#" className="hover:text-primary">
                {currentLang.footer.blog}
              </a>
              <a href="#" className="hover:text-primary">
                {currentLang.footer.documentation}
              </a>
              <a href="#" className="hover:text-primary">
                {currentLang.footer.support}
              </a>
              <a href="#" className="hover:text-primary">
                {currentLang.footer.contact}
              </a>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-gray-600 mt-6 sm:mt-8">
              <Link href="/privacy" className="hover:text-primary">
                {currentLang.footer.privacy}
              </Link>
              <a href="#" className="hover:text-primary">
                {currentLang.footer.terms}
              </a>
              <a href="#" className="hover:text-primary">
                {currentLang.footer.cookies}
              </a>
              <a href="/sitemap.xml" className="hover:text-primary">
                {currentLang.footer.sitemap}
              </a>
            </div>
            <p className="text-sm text-center mt-6 sm:mt-8 text-gray-600">{currentLang.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </>
  )

  const renderPage = () => {
    switch (currentPage) {
      case "joule-agents":
        return <JouleAgentsPage />
      case "workflows":
        return <WorkflowsPage />
      case "case-studies":
        return <CaseStudiesPage />
      case "schedule-demo":
        return <ScheduleDemoPage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          style={{
            left: `${mousePosition.x / 20}px`,
            top: `${mousePosition.y / 20}px`,
            transition: "all 0.3s ease-out",
          }}
        />
      </div>

      <nav className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-b border-border z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => setCurrentPage("home")}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-red-600 rounded-xl flex items-center justify-center font-bold text-white text-xl sm:text-2xl shadow-lg">
                R
              </div>
              <div>
                <div className="font-bold text-lg sm:text-2xl bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">
                  REXITY
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">Enterprise AI Platform</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin")}
                className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-700 text-gray-700 rounded-full font-semibold hover:bg-gray-700 hover:text-white transition-all duration-300 text-xs sm:text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Admin
              </button>

              <button
                onClick={() => setLanguage(language === "en" ? "de" : "en")}
                className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-primary text-primary rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-xs sm:text-sm"
              >
                {language === "en" ? "DE" : "EN"}
              </button>

              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-foreground">
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div
            className="fixed right-0 top-0 bottom-0 w-72 sm:w-80 bg-card shadow-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <div className="font-bold text-lg sm:text-xl bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">
                Menu
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              </button>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setCurrentPage("schedule-demo")
                  setSidebarOpen(false)
                }}
                className="py-3 px-4 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-semibold text-center text-sm sm:text-base"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl">
              <div className="relative h-[500px] flex items-center justify-center bg-black">
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e40af15_1px,transparent_1px),linear-gradient(to_bottom,#1e40af15_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-white"
                    style={{ animation: "sceneOne 15s infinite" }}
                  >
                    <div className="text-6xl mb-4">🧠</div>
                    <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      SAP AI Intelligence
                    </h3>
                    <p className="text-xl text-gray-300">Autonomous decision-making</p>
                  </div>

                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-white opacity-0"
                    style={{ animation: "sceneTwo 15s infinite" }}
                  >
                    <div className="text-6xl mb-4">⚡</div>
                    <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      SAP Joule AI Agents
                    </h3>
                    <p className="text-xl text-gray-300">Natural language commands</p>
                  </div>

                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-white opacity-0"
                    style={{ animation: "sceneThree 15s infinite" }}
                  >
                    <div className="text-6xl mb-4">🔄</div>
                    <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      N8N Workflow Automation
                    </h3>
                    <p className="text-xl text-gray-300">Multi-agent orchestration</p>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                    style={{ animation: "progressBar 15s linear infinite" }}
                  ></div>
                </div>
              </div>

              <div className="bg-gray-900 p-6 text-center border-t border-gray-800">
                <p className="text-gray-400 mb-4">Ready to transform your enterprise?</p>
                <button
                  onClick={() => {
                    setShowVideoModal(false)
                    setCurrentPage("schedule-demo")
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-semibold hover:scale-105 transition-all"
                >
                  Schedule Your Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="pt-16 sm:pt-20">{renderPage()}</main>

      <style>{`
        .fx-underline {
          position: relative;
          display: inline-block;
        }
        .fx-underline::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 2px;
          background-color: var(--fx);
          transform: scaleX(0);
          transform-origin: bottom left;
          transition: transform 0.5s ease-in-out;
        }
        .fx-animate::after {
          transform: scaleX(1);
        }
        
        @keyframes rgb-border {
          0% { border-color: rgba(59, 130, 246, 1); box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 15px rgba(59, 130, 246, 0.1); }
          25% { border-color: rgba(139, 92, 246, 1); box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3), inset 0 0 15px rgba(139, 92, 246, 0.1); }
          50% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3), inset 0 0 15px rgba(239, 68, 68, 0.1); }
          75% { border-color: rgba(16, 185, 129, 1); box-shadow: 0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3), inset 0 0 15px rgba(16, 185, 129, 0.1); }
          100% { border-color: rgba(59, 130, 246, 1); box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 15px rgba(59, 130, 246, 0.1); }
        }
        
        .agent-tile {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .agent-tile:hover {
          animation: rgb-border 3s linear infinite;
        }

        @keyframes sceneOne {
          0%, 33% { opacity: 1; }
          34%, 100% { opacity: 0; }
        }
        @keyframes sceneTwo {
          0%, 33% { opacity: 0; }
          34%, 66% { opacity: 1; }
          67%, 100% { opacity: 0; }
        }
        @keyframes sceneThree {
          0%, 66% { opacity: 0; }
          67%, 100% { opacity: 1; }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .agent-tile:hover {
            animation: none;
          }
          .fx-underline::after {
            transition: none;
          }
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}
