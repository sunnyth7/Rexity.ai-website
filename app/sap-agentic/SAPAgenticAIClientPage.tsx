"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  ArrowLeft,
  ShoppingCart,
  Wrench,
  FolderKanban,
  DollarSign,
  CheckCircle,
  Bell,
  ClipboardList,
  Calendar,
  Heart,
  Package,
  MessageCircle,
  Clock,
  Zap,
  TrendingDown,
  Brain,
} from "lucide-react"

export default function SAPAgenticAIClientPage() {
  const [language, setLanguage] = useState("en")
  const [currentView, setCurrentView] = useState("main")

  // WhatsApp Agent animation states
  const [counters, setCounters] = useState({
    openRate: 0,
    downtimeReduction: 0,
    savings: 0,
    responseTime: 0,
  })
  const [hasAnimated, setHasAnimated] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentView])

  const translations = {
    en: {
      backButton: "Back to Home",
      backToAgents: "Back to All Agents",
      backToMaintenance: "Back to Maintenance Agents",
      title: "SAP Agentic AI Workflows",
      subtitle: "Intelligent automation agents that transform your SAP ecosystem",
      description:
        "Discover our suite of specialized AI agents designed to revolutionize your SAP business processes with autonomous intelligence and real-time optimization.",
      learnMore: "Learn More",
      exploreAgents: "Explore Sub-Agents",
      viewDetails: "View Details",
      assetMaintenanceTitle: "Asset Maintenance Specialized Agents",
      assetMaintenanceSubtitle: "Advanced AI agents for comprehensive asset maintenance management",
      whatsappTitle: "WhatsApp Notification Agent",
      whatsappSubtitle: "Real-time maintenance notifications through WhatsApp Business API",
      whatsappBadge: "INTELLIGENT NOTIFICATION SYSTEM",
      agents: {
        salesOrder: {
          title: "Sales Order Agents",
          description:
            "Automate end-to-end sales order processing with intelligent agents that handle order creation, validation, pricing, and fulfillment autonomously.",
          features: [
            "Automated Order Processing",
            "Smart Pricing Engine",
            "Real-time Inventory Check",
            "Dynamic Fulfillment Routing",
          ],
        },
        assetMaintenance: {
          title: "Asset Maintenance Agents",
          description:
            "Predictive maintenance AI that monitors asset health, schedules preventive maintenance, and optimizes resource allocation to minimize downtime.",
          features: [
            "Predictive Analytics",
            "Automated Work Orders",
            "Asset Health Monitoring",
            "Maintenance Optimization",
          ],
        },
        projectManagement: {
          title: "Project Management Agents",
          description:
            "Intelligent project coordination agents that manage timelines, resources, budgets, and deliverables with autonomous decision-making capabilities.",
          features: ["Smart Resource Allocation", "Budget Forecasting", "Risk Assessment", "Timeline Optimization"],
        },
        purchasing: {
          title: "Purchase Order Agents",
          description:
            "Streamline procurement with AI agents that handle purchase requisitions, vendor selection, price negotiation, and order tracking automatically.",
          features: ["Vendor Intelligence", "Price Optimization", "Automated Approvals", "Supply Chain Integration"],
        },
        plantMaintenance: {
          title: "Plant Maintenance Agents",
          description:
            "Advanced AI for plant operations that predicts equipment failures, optimizes maintenance schedules, and ensures operational excellence.",
          features: ["Equipment Monitoring", "Failure Prediction", "Maintenance Planning", "Compliance Management"],
        },
      },
      subAgents: {
        maintenanceNotification: {
          title: "Maintenance Notification Agent",
          description:
            "Automatically creates, categorizes, and prioritizes maintenance notifications based on equipment status, sensor data, and historical patterns with real-time alerts.",
          features: ["Auto-Create Notifications", "Smart Categorization", "Priority Assignment", "Real-time Alerts"],
        },
        workOrder: {
          title: "Work Order Management Agent",
          description:
            "Intelligently generates, assigns, and tracks work orders with optimal resource allocation, priority scheduling, and automated status updates.",
          features: ["Smart Work Order Generation", "Resource Optimization", "Priority Scheduling", "Status Tracking"],
        },
        scheduling: {
          title: "Preventive Maintenance Scheduling Agent",
          description:
            "Optimizes maintenance schedules using predictive algorithms to prevent failures while minimizing operational disruption and maximizing equipment uptime.",
          features: ["Predictive Scheduling", "Failure Prevention", "Uptime Optimization", "Smart Calendar Management"],
        },
        monitoring: {
          title: "Equipment Health Monitoring Agent",
          description:
            "Continuously monitors equipment performance, detects anomalies, and predicts potential failures using IoT sensors, AI analytics, and machine learning.",
          features: ["Real-time Monitoring", "Anomaly Detection", "Failure Prediction", "IoT Integration"],
        },
        inventory: {
          title: "Spare Parts Inventory Agent",
          description:
            "Manages spare parts inventory with predictive ordering, stock optimization, automated procurement for critical components, and vendor management.",
          features: ["Predictive Ordering", "Stock Optimization", "Auto Procurement", "Vendor Integration"],
        },
      },
    },
  }

  const currentLang = translations[language]

  // Reset animation state when view changes
  useEffect(() => {
    if (currentView === "whatsappAgent") {
      setHasAnimated(false)
      setCounters({ openRate: 0, downtimeReduction: 0, savings: 0, responseTime: 0 })
    }
  }, [currentView])

  // Animated counter effect
  const animateCounters = () => {
    if (hasAnimated) return
    setHasAnimated(true)

    const duration = 2500
    const steps = 60
    const increment = duration / steps

    const targets = { openRate: 98, downtimeReduction: 60, savings: 200, responseTime: 2 }
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    let frame = 0
    const timer = setInterval(() => {
      frame++
      const progress = easeOutCubic(frame / steps)

      setCounters({
        openRate: Math.floor(targets.openRate * progress),
        downtimeReduction: Math.floor(targets.downtimeReduction * progress),
        savings: Math.floor(targets.savings * progress),
        responseTime: Number.parseFloat((targets.responseTime * progress).toFixed(1)),
      })

      if (frame >= steps) {
        setCounters({
          openRate: targets.openRate,
          downtimeReduction: targets.downtimeReduction,
          savings: targets.savings,
          responseTime: Number.parseFloat(targets.responseTime.toFixed(1)),
        })
        clearInterval(timer)
      }
    }, increment)
  }

  // Intersection Observer for scroll-triggered animation
  useEffect(() => {
    if (currentView !== "whatsappAgent") return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            animateCounters()
          }
        })
      },
      { threshold: 0.3 },
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current)
      }
    }
  }, [currentView, hasAnimated])

  const sapAgents = [
    {
      title: currentLang.agents.salesOrder.title,
      description: currentLang.agents.salesOrder.description,
      features: currentLang.agents.salesOrder.features,
      icon: <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      title: currentLang.agents.assetMaintenance.title,
      description: currentLang.agents.assetMaintenance.description,
      features: currentLang.agents.assetMaintenance.features,
      icon: <Wrench className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
      gradient: "from-purple-500 via-pink-500 to-red-500",
      bgGradient: "from-purple-50 to-pink-50",
      hasSubPage: true,
    },
    {
      title: currentLang.agents.projectManagement.title,
      description: currentLang.agents.projectManagement.description,
      features: currentLang.agents.projectManagement.features,
      icon: <FolderKanban className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      bgGradient: "from-green-50 to-emerald-50",
    },
    {
      title: currentLang.agents.purchasing.title,
      description: currentLang.agents.purchasing.description,
      features: currentLang.agents.purchasing.features,
      icon: <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
      gradient: "from-orange-500 via-red-500 to-pink-500",
      bgGradient: "from-orange-50 to-red-50",
    },
  ]

  const maintenanceSubAgents = [
    {
      title: currentLang.subAgents.maintenanceNotification.title,
      description: currentLang.subAgents.maintenanceNotification.description,
      features: currentLang.subAgents.maintenanceNotification.features,
      icon: <Bell className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
      hasDetailPage: true,
    },
    {
      title: currentLang.subAgents.workOrder.title,
      description: currentLang.subAgents.workOrder.description,
      features: currentLang.subAgents.workOrder.features,
      icon: <ClipboardList className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
      gradient: "from-purple-500 via-purple-600 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      title: currentLang.subAgents.scheduling.title,
      description: currentLang.subAgents.scheduling.description,
      features: currentLang.subAgents.scheduling.features,
      icon: <Calendar className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
      gradient: "from-green-500 via-emerald-600 to-teal-600",
      bgGradient: "from-green-50 to-teal-50",
    },
    {
      title: currentLang.subAgents.monitoring.title,
      description: currentLang.subAgents.monitoring.description,
      features: currentLang.subAgents.monitoring.features,
      icon: <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
      gradient: "from-red-500 via-pink-600 to-rose-600",
      bgGradient: "from-red-50 to-rose-50",
    },
    {
      title: currentLang.subAgents.inventory.title,
      description: currentLang.subAgents.inventory.description,
      features: currentLang.subAgents.inventory.features,
      icon: <Package className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
      gradient: "from-orange-500 via-amber-600 to-yellow-600",
      bgGradient: "from-orange-50 to-yellow-50",
    },
  ]

  const handleBack = () => {
    if (currentView === "whatsappAgent") {
      setCurrentView("assetMaintenance")
    } else if (currentView === "assetMaintenance") {
      setCurrentView("main")
    } else {
      window.location.href = "/"
    }
  }

  const getBackButtonText = () => {
    if (currentView === "whatsappAgent") return currentLang.backToMaintenance
    if (currentView === "assetMaintenance") return currentLang.backToAgents
    return currentLang.backButton
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <style>{`
        @keyframes rgb-border {
          0% { border-color: rgba(59, 130, 246, 1); box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 15px rgba(59, 130, 246, 0.1); }
          25% { border-color: rgba(139, 92, 246, 1); box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3), inset 0 0 15px rgba(139, 92, 246, 0.1); }
          50% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3), inset 0 0 15px rgba(239, 68, 68, 0.1); }
          75% { border-color: rgba(16, 185, 129, 1); box-shadow: 0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3), inset 0 0 15px rgba(16, 185, 129, 0.1); }
          100% { border-color: rgba(59, 130, 246, 1); box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 15px rgba(59, 130, 246, 0.1); }
        }
        
        .agent-tile {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
        }
        
        .agent-tile:hover {
          animation: rgb-border 3s linear infinite;
          transform: scale(1.03) translateY(-5px);
        }

        @media (min-width: 768px) {
          .agent-tile:hover {
            transform: scale(1.05) translateY(-10px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.7); }
        }

        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }

        .bpmn-node { transition: all 0.3s ease; }
        .bpmn-node:hover { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(34, 197, 94, 0.5)); }

        .flow-arrow {
          stroke-dasharray: 5, 5;
          animation: dash 1s linear infinite;
        }

        @keyframes dash { to { stroke-dashoffset: -10; } }

        @media (prefers-reduced-motion: reduce) {
          .agent-tile:hover {
            animation: none;
            transform: scale(1.02);
          }
          .pulse-glow {
            animation: none;
          }
          .flow-arrow {
            animation: none;
          }
        }
      `}</style>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{getBackButtonText()}</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-all ${
                language === "en" ? "bg-white shadow-sm text-blue-600" : "text-gray-600"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Main Agents View */}
      {currentView === "main" && (
        <>
          <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/60 backdrop-blur-sm rounded-full mb-4 sm:mb-6 border border-blue-200">
                <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />{" "}
                {/* Updated badge icon to Brain for AI workflows */}
                <span className="text-xs sm:text-sm font-semibold text-blue-600">INTELLIGENT AI WORKFLOWS</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 bg-clip-text text-transparent px-4">
                {currentLang.title}
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 mb-3 sm:mb-4 font-semibold max-w-4xl mx-auto px-4">
                Autonomous AI agents that revolutionize SAP business processes with intelligent automation{" "}
                {/* Updated subtitle to be more descriptive */}
              </p>

              <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                Deploy specialized AI agents across sales, maintenance, projects, and procurement to automate complex
                workflows, optimize operations, and drive business transformation with real-time intelligence.{" "}
                {/* Updated description to be more service-specific */}
              </p>
            </div>
          </section>

          <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 pb-16 sm:pb-24 md:pb-32">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col gap-6 sm:gap-8">
                {sapAgents.map((agent, idx) => (
                  <div
                    key={idx}
                    onClick={() => agent.hasSubPage && setCurrentView("assetMaintenance")}
                    className={`agent-tile relative bg-gradient-to-br ${agent.bgGradient} rounded-2xl sm:rounded-3xl p-6 sm:p-8 ${agent.hasSubPage ? "cursor-pointer" : ""} overflow-hidden group border-2 border-transparent`}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                      <div
                        className={`flex-shrink-0 inline-flex p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br ${agent.gradient} text-white shadow-xl sm:shadow-2xl group-hover:scale-110 transition-transform duration-300`}
                      >
                        {agent.icon}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                          {agent.title}
                        </h3>

                        <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">{agent.description}</p>

                        <div className="flex flex-wrap items-center gap-2">
                          {agent.features.map((feature, featureIdx) => (
                            <React.Fragment key={featureIdx}>
                              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/60 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-green-200">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                                <span className="text-gray-700 text-xs font-medium whitespace-nowrap">{feature}</span>
                              </div>
                              {featureIdx < agent.features.length - 1 && (
                                <div className="w-1 h-1 rounded-full bg-gray-400 hidden sm:block"></div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <button
                        className={`flex-shrink-0 px-6 py-3 bg-gradient-to-r ${agent.gradient} text-white rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2`}
                      >
                        {agent.hasSubPage ? currentLang.exploreAgents : currentLang.learnMore}
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>

                    <div
                      className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${agent.gradient} opacity-10 rounded-bl-full transform group-hover:scale-150 transition-transform duration-500`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Asset Maintenance Sub-Agents View */}
      {currentView === "assetMaintenance" && (
        <>
          <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/60 backdrop-blur-sm rounded-full mb-4 sm:mb-6 border border-purple-200">
                <Wrench className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                <span className="text-xs sm:text-sm font-semibold text-purple-600">PREDICTIVE MAINTENANCE AI</span>{" "}
                {/* Updated badge to be more specific */}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent px-4">
                {currentLang.assetMaintenanceTitle}
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 mb-3 sm:mb-4 font-semibold max-w-4xl mx-auto px-4">
                AI-powered maintenance agents that predict failures, optimize schedules, and minimize downtime{" "}
                {/* Updated subtitle to be more descriptive */}
              </p>

              <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                Leverage intelligent agents for notifications, work orders, preventive scheduling, health monitoring,
                and inventory management to achieve operational excellence and reduce maintenance costs.{" "}
                {/* Updated description to be more service-specific */}
              </p>
            </div>
          </section>

          <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 pb-16 sm:pb-24 md:pb-32">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col gap-6 sm:gap-8">
                {maintenanceSubAgents.map((agent, idx) => (
                  <div
                    key={idx}
                    onClick={() => agent.hasDetailPage && setCurrentView("whatsappAgent")}
                    className={`agent-tile relative bg-gradient-to-br ${agent.bgGradient} rounded-2xl sm:rounded-3xl p-6 sm:p-8 ${agent.hasDetailPage ? "cursor-pointer" : ""} overflow-hidden group border-2 border-transparent`}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                      <div
                        className={`flex-shrink-0 inline-flex p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br ${agent.gradient} text-white shadow-xl sm:shadow-2xl group-hover:scale-110 transition-transform duration-300`}
                      >
                        {agent.icon}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300">
                          {agent.title}
                        </h3>

                        <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">{agent.description}</p>

                        <div className="flex flex-wrap items-center gap-2">
                          {agent.features.map((feature, featureIdx) => (
                            <React.Fragment key={featureIdx}>
                              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/60 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-green-200">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                                <span className="text-gray-700 text-xs font-medium whitespace-nowrap">{feature}</span>
                              </div>
                              {featureIdx < agent.features.length - 1 && (
                                <div className="w-1 h-1 rounded-full bg-gray-400 hidden sm:block"></div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <button
                        className={`flex-shrink-0 px-6 py-3 bg-gradient-to-r ${agent.gradient} text-white rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2`}
                      >
                        {agent.hasDetailPage ? currentLang.viewDetails : currentLang.learnMore}
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>

                    <div
                      className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${agent.gradient} opacity-10 rounded-bl-full transform group-hover:scale-150 transition-transform duration-500`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* WhatsApp Agent Detail View */}
      {currentView === "whatsappAgent" && (
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
          <section className="py-12 sm:py-16 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/60 backdrop-blur-sm rounded-full border border-green-300 pulse-glow">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span className="text-xs sm:text-sm font-semibold text-green-600">REAL-TIME NOTIFICATION SYSTEM</span>{" "}
                  {/* Updated badge to be more specific */}
                </div>
              </div>

              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4 sm:mb-6 shadow-2xl">
                  {" "}
                  {/* Updated icon container with better styling */}
                  <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent px-4">
                  {currentLang.whatsappTitle}
                </h1>

                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto px-4">
                  Instant maintenance alerts via WhatsApp with intelligent priority routing and technician engagement{" "}
                  {/* Updated subtitle to be more descriptive */}
                </p>
              </div>

              {/* Process Flow Diagram */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 shadow-xl mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent text-center">
                  Process Flow
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 md:mb-10 text-center px-4">
                  Visual representation of the WhatsApp Notification workflow
                </p>

                <div className="bg-gradient-to-br from-gray-50 to-white p-3 sm:p-4 md:p-8 rounded-xl sm:rounded-2xl border-2 border-gray-200 overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <svg
                      className="w-full h-auto"
                      style={{ minWidth: "600px" }}
                      viewBox="0 0 1200 800"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <g className="bpmn-node">
                        <circle cx="60" cy="400" r="30" fill="#22c55e" stroke="#16a34a" strokeWidth="3" />
                        <text
                          x="60"
                          y="460"
                          textAnchor="middle"
                          style={{ fontSize: "14px", fontWeight: 600 }}
                          fill="#374151"
                        >
                          Equipment
                          <tspan x="60" dy="20">
                            Failure
                          </tspan>
                        </text>
                      </g>
                      <line
                        x1="90"
                        y1="400"
                        x2="160"
                        y2="400"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                        className="flow-arrow"
                      />
                      <g className="bpmn-node">
                        <rect
                          x="160"
                          y="350"
                          width="140"
                          height="100"
                          rx="10"
                          fill="#3b82f6"
                          stroke="#2563eb"
                          strokeWidth="2"
                        />
                        <text
                          x="230"
                          y="395"
                          textAnchor="middle"
                          style={{ fontSize: "14px", fontWeight: 600 }}
                          fill="white"
                        >
                          SAP PM
                        </text>
                        <text x="230" y="415" textAnchor="middle" style={{ fontSize: "12px" }} fill="white">
                          Notification
                        </text>
                        <text x="230" y="430" textAnchor="middle" style={{ fontSize: "12px" }} fill="white">
                          Created
                        </text>
                      </g>
                      <line
                        x1="300"
                        y1="400"
                        x2="370"
                        y2="400"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                        className="flow-arrow"
                      />
                      <g className="bpmn-node">
                        <rect
                          x="370"
                          y="350"
                          width="140"
                          height="100"
                          rx="10"
                          fill="#8b5cf6"
                          stroke="#7c3aed"
                          strokeWidth="2"
                        />
                        <text
                          x="440"
                          y="390"
                          textAnchor="middle"
                          style={{ fontSize: "14px", fontWeight: 600 }}
                          fill="white"
                        >
                          AI Agent
                        </text>
                        <text x="440" y="410" textAnchor="middle" style={{ fontSize: "12px" }} fill="white">
                          Priority Analysis
                        </text>
                        <text x="440" y="425" textAnchor="middle" style={{ fontSize: "12px" }} fill="white">
                          Skill Matching
                        </text>
                      </g>
                      <line
                        x1="510"
                        y1="400"
                        x2="580"
                        y2="400"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                        className="flow-arrow"
                      />
                      <g className="bpmn-node">
                        <polygon
                          points="640,400 610,430 640,460 670,430"
                          fill="#f59e0b"
                          stroke="#d97706"
                          strokeWidth="2"
                        />
                        <text
                          x="640"
                          y="490"
                          textAnchor="middle"
                          style={{ fontSize: "14px", fontWeight: 600 }}
                          fill="#374151"
                        >
                          Priority?
                        </text>
                      </g>
                      <line
                        x1="640"
                        y1="360"
                        x2="640"
                        y2="280"
                        stroke="#ef4444"
                        strokeWidth="3"
                        markerEnd="url(#arrowhead-red)"
                        className="flow-arrow"
                      />
                      <text x="650" y="320" style={{ fontSize: "12px", fontWeight: 600 }} fill="#ef4444">
                        HIGH
                      </text>
                      <g className="bpmn-node">
                        <rect
                          x="580"
                          y="180"
                          width="120"
                          height="80"
                          rx="10"
                          fill="#ef4444"
                          stroke="#dc2626"
                          strokeWidth="2"
                        />
                        <text
                          x="640"
                          y="215"
                          textAnchor="middle"
                          style={{ fontSize: "12px", fontWeight: 700 }}
                          fill="white"
                        >
                          URGENT
                        </text>
                        <text x="640" y="235" textAnchor="middle" style={{ fontSize: "11px" }} fill="white">
                          WhatsApp +
                        </text>
                        <text x="640" y="250" textAnchor="middle" style={{ fontSize: "11px" }} fill="white">
                          Phone Call
                        </text>
                      </g>
                      <line
                        x1="670"
                        y1="430"
                        x2="760"
                        y2="430"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                        className="flow-arrow"
                      />
                      <text x="700" y="420" style={{ fontSize: "12px", fontWeight: 600 }} fill="#f59e0b">
                        MEDIUM
                      </text>
                      <g className="bpmn-node">
                        <rect
                          x="760"
                          y="390"
                          width="120"
                          height="80"
                          rx="10"
                          fill="#10b981"
                          stroke="#059669"
                          strokeWidth="2"
                        />
                        <text
                          x="820"
                          y="420"
                          textAnchor="middle"
                          style={{ fontSize: "12px", fontWeight: 700 }}
                          fill="white"
                        >
                          Standard
                        </text>
                        <text x="820" y="440" textAnchor="middle" style={{ fontSize: "11px" }} fill="white">
                          WhatsApp
                        </text>
                        <text x="820" y="455" textAnchor="middle" style={{ fontSize: "11px" }} fill="white">
                          Notification
                        </text>
                      </g>
                      <line
                        x1="640"
                        y1="460"
                        x2="640"
                        y2="540"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                        className="flow-arrow"
                      />
                      <text x="650" y="500" style={{ fontSize: "12px", fontWeight: 600 }} fill="#6b7280">
                        LOW
                      </text>
                      <g className="bpmn-node">
                        <rect
                          x="580"
                          y="540"
                          width="120"
                          height="80"
                          rx="10"
                          fill="#6b7280"
                          stroke="#4b5563"
                          strokeWidth="2"
                        />
                        <text
                          x="640"
                          y="570"
                          textAnchor="middle"
                          style={{ fontSize: "12px", fontWeight: 700 }}
                          fill="white"
                        >
                          Scheduled
                        </text>
                        <text x="640" y="590" textAnchor="middle" style={{ fontSize: "11px" }} fill="white">
                          Daily Digest
                        </text>
                        <text x="640" y="605" textAnchor="middle" style={{ fontSize: "11px" }} fill="white">
                          WhatsApp
                        </text>
                      </g>
                      <line
                        x1="700"
                        y1="220"
                        x2="950"
                        y2="220"
                        stroke="#6b7280"
                        strokeWidth="2"
                        className="flow-arrow"
                      />
                      <line
                        x1="950"
                        y1="220"
                        x2="950"
                        y2="380"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                      <line
                        x1="880"
                        y1="430"
                        x2="950"
                        y2="430"
                        stroke="#6b7280"
                        strokeWidth="2"
                        className="flow-arrow"
                      />
                      <line
                        x1="950"
                        y1="430"
                        x2="950"
                        y2="400"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                      <line
                        x1="700"
                        y1="580"
                        x2="950"
                        y2="580"
                        stroke="#6b7280"
                        strokeWidth="2"
                        className="flow-arrow"
                      />
                      <line
                        x1="950"
                        y1="580"
                        x2="950"
                        y2="420"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                      <g className="bpmn-node">
                        <rect
                          x="920"
                          y="380"
                          width="140"
                          height="100"
                          rx="10"
                          fill="#25D366"
                          stroke="#128C7E"
                          strokeWidth="3"
                        />
                        <text
                          x="990"
                          y="415"
                          textAnchor="middle"
                          style={{ fontSize: "14px", fontWeight: 700 }}
                          fill="white"
                        >
                          Technician
                        </text>
                        <text x="990" y="435" textAnchor="middle" style={{ fontSize: "12px" }} fill="white">
                          Receives
                        </text>
                        <text x="990" y="450" textAnchor="middle" style={{ fontSize: "12px" }} fill="white">
                          via WhatsApp
                        </text>
                      </g>
                      <line
                        x1="1060"
                        y1="430"
                        x2="1110"
                        y2="430"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                        className="flow-arrow"
                      />
                      <g className="bpmn-node">
                        <rect
                          x="1110"
                          y="300"
                          width="140"
                          height="80"
                          rx="10"
                          fill="#3b82f6"
                          stroke="#2563eb"
                          strokeWidth="2"
                        />
                        <text
                          x="1180"
                          y="335"
                          textAnchor="middle"
                          style={{ fontSize: "12px", fontWeight: 700 }}
                          fill="white"
                        >
                          Accept
                        </text>
                        <text x="1180" y="355" textAnchor="middle" style={{ fontSize: "11px" }} fill="white">
                          Work Order
                        </text>
                      </g>
                      <g className="bpmn-node">
                        <rect
                          x="1110"
                          y="400"
                          width="140"
                          height="80"
                          rx="10"
                          fill="#8b5cf6"
                          stroke="#7c3aed"
                          strokeWidth="2"
                        />
                        <text
                          x="1180"
                          y="435"
                          textAnchor="middle"
                          style={{ fontSize: "12px", fontWeight: 700 }}
                          fill="white"
                        >
                          Request Info
                        </text>
                        <text x="1180" y="455" textAnchor="middle" style={{ fontSize: "11px" }} fill="white">
                          (Parts/Specs)
                        </text>
                      </g>
                      <g className="bpmn-node">
                        <rect
                          x="1110"
                          y="500"
                          width="140"
                          height="80"
                          rx="10"
                          fill="#f59e0b"
                          stroke="#d97706"
                          strokeWidth="2"
                        />
                        <text
                          x="1180"
                          y="535"
                          textAnchor="middle"
                          style={{ fontSize: "12px", fontWeight: 700 }}
                          fill="white"
                        >
                          Escalate
                        </text>
                        <text x="1180" y="555" textAnchor="middle" style={{ fontSize: "11px" }} fill="white">
                          (Need Support)
                        </text>
                      </g>
                      <line
                        x1="1060"
                        y1="410"
                        x2="1090"
                        y2="340"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                        className="flow-arrow"
                      />
                      <line
                        x1="1060"
                        y1="430"
                        x2="1110"
                        y2="440"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                        className="flow-arrow"
                      />
                      <line
                        x1="1060"
                        y1="450"
                        x2="1090"
                        y2="540"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                        className="flow-arrow"
                      />
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
                        </marker>
                        <marker id="arrowhead-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Animated Stats */}
              <div
                ref={statsRef}
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 transition-opacity duration-700 ${hasAnimated ? "opacity-100" : "opacity-0"}`}
              >
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 transform hover:scale-105 transition-transform duration-300">
                  <div className="inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white mb-2 sm:mb-3">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 tabular-nums">
                    {counters.openRate}%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Message Open Rate</div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 transform hover:scale-105 transition-transform duration-300">
                  <div className="inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white mb-2 sm:mb-3">
                    <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 tabular-nums">
                    {counters.downtimeReduction}%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Downtime Reduction</div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 transform hover:scale-105 transition-transform duration-300">
                  <div className="inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-2 sm:mb-3">
                    <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 tabular-nums">
                    ${counters.savings}K+
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Annual Savings</div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 transform hover:scale-105 transition-transform duration-300">
                  <div className="inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white mb-2 sm:mb-3">
                    <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 tabular-nums">
                    &lt;{counters.responseTime} min
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Response Time</div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-green-600 to-emerald-600">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-4">
                Ready to Revolutionize Your Maintenance Notifications?
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90 px-4">
                Join leading enterprises achieving 60% downtime reduction with WhatsApp Notification Agent
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
                <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-green-600 rounded-full font-bold text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                  Schedule Demo
                </button>
                <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-base sm:text-lg hover:bg-white hover:text-green-600 transition-all duration-300">
                  Download ROI Calculator
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
