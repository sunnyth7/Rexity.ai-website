"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  Brain,
  CheckCircle,
  Clock,
  DollarSign,
  FolderKanban,
  Gauge,
  Home,
  Package,
  Radio,
  Settings,
  TrendingUp,
  Megaphone,
  Wrench,
} from "lucide-react"

import SalesAnalyticsDashboard from "./SalesAnalyticsDashboard"
import MARCOAIDashboard from "./MARCOAIDashboard"
import ProjectManagementDashboard from "./ProjectManagementDashboard"
import ChatTiny from "./ChatTiny"

// Interfaces and Mocks (These would ideally be in separate shared files)
interface Asset {
  id: string
  name: string
  type: "Pump" | "Motor" | "Compressor" | "Turbine" | "Cooling" | "Generator"
  site: string
  status: "healthy" | "warning" | "critical"
  health: number
  temperature: number
  vibration: number
  pressure: number
  efficiency: number
  runtime: number
  notifications: Notification[]
  openNotifications: number
  criticalNotifications: number
  mtbf: number
  mttr: number
  availability: number
  aiPrediction: string
  trend: "up" | "down" | "stable"
  performanceScore: number
  costImpact: "Low" | "Medium" | "High" | "Very High"
  capex: number
  opex: number
}

interface Notification {
  id: string
  type: "Emergency" | "Corrective" | "Preventive"
  priority: "critical" | "high" | "medium" | "low"
  status: "open" | "overdue" | "scheduled" | "closed"
  date: string
  description: string
}

interface Project {
  id: string
  name: string
  phase: string
  status: "on-track" | "at-risk" | "delayed"
  budget: number
  spent: number
  progress: number
  cpi: number
  spi: number
  team: number
  risks: number
}

interface SalesPipeline {
  stage: string
  count: number
  value: number
  probability: number
}

interface CRMAccount {
  name: string
  status: "active" | "at-risk" | "churned"
  nps: number
  csat: number
  revenue: number
  health: "healthy" | "warning" | "critical"
}

interface Anomaly {
  id: number
  domain: "assets" | "projects" | "sales" | "crm"
  type: string
  severity: "critical" | "high" | "medium" | "low"
  description: string
  confidence: number
  detectedAt: string
}

const MOCK_ASSETS: Asset[] = [
  {
    id: "PUMP-001",
    name: "Hydraulic Pump A1",
    type: "Pump",
    site: "Hamburg Port - Building 1", // Updated location to Hamburg
    status: "healthy",
    health: 94,
    temperature: 72,
    vibration: 2.3,
    pressure: 145,
    efficiency: 96,
    runtime: 2847,
    notifications: [
      {
        id: "N001",
        type: "Preventive",
        priority: "low",
        status: "closed",
        date: "2024-10-20",
        description: "Routine inspection completed successfully",
      },
    ],
    openNotifications: 0,
    criticalNotifications: 0,
    mtbf: 8640,
    mttr: 4.2,
    availability: 99.2,
    aiPrediction: "Optimal performance expected for next 90 days",
    trend: "up",
    performanceScore: 96,
    costImpact: "Low",
    capex: 45000,
    opex: 12000,
  },
  {
    id: "MOTOR-042",
    name: "Conveyor Motor B3",
    type: "Motor",
    site: "Hamburg City Center - Line 3", // Updated location to Hamburg
    status: "warning",
    health: 73,
    temperature: 89,
    vibration: 4.7,
    pressure: 0,
    efficiency: 78,
    runtime: 4123,
    notifications: [
      {
        id: "N042",
        type: "Corrective",
        priority: "medium",
        status: "open",
        date: "2024-10-22",
        description: "Bearing wear detected - replacement needed within 10 days",
      },
      {
        id: "N043",
        type: "Preventive",
        priority: "low",
        status: "open",
        date: "2024-10-15",
        description: "Scheduled maintenance overdue by 3 days",
      },
    ],
    openNotifications: 2,
    criticalNotifications: 0,
    mtbf: 5280,
    mttr: 8.5,
    availability: 96.8,
    aiPrediction: "Bearing replacement recommended within 10 days",
    trend: "down",
    performanceScore: 78,
    costImpact: "Medium",
    capex: 32000,
    opex: 18000,
  },
  {
    id: "COMP-015",
    name: "Air Compressor C2",
    type: "Compressor",
    site: "Hamburg Industrial District - Utility Room", // Updated location to Hamburg
    status: "critical",
    health: 42,
    temperature: 105,
    vibration: 8.2,
    pressure: 98,
    efficiency: 62,
    runtime: 5892,
    notifications: [
      {
        id: "N015",
        type: "Emergency",
        priority: "critical",
        status: "open",
        date: "2024-10-26",
        description: "Critical vibration levels detected - immediate shutdown recommended",
      },
      {
        id: "N016",
        type: "Corrective",
        priority: "high",
        status: "overdue",
        date: "2024-10-18",
        description: "Temperature threshold exceeded - cooling system inspection required",
      },
    ],
    openNotifications: 2,
    criticalNotifications: 1,
    mtbf: 3120,
    mttr: 16.3,
    availability: 88.5,
    aiPrediction: "High failure risk - immediate maintenance required",
    trend: "down",
    performanceScore: 42,
    costImpact: "Very High",
    capex: 78000,
    opex: 35000,
  },
]

const MOCK_PROJECTS: Project[] = [
  {
    id: "PROJ-001",
    name: "Digital Transformation Initiative",
    phase: "Execution",
    status: "on-track",
    budget: 2500000,
    spent: 1850000,
    progress: 74,
    cpi: 1.05,
    spi: 0.98,
    team: 24,
    risks: 2,
  },
  {
    id: "PROJ-002",
    name: "Infrastructure Upgrade Program",
    phase: "Planning",
    status: "at-risk",
    budget: 1800000,
    spent: 450000,
    progress: 28,
    cpi: 0.92,
    spi: 0.85,
    team: 15,
    risks: 5,
  },
  {
    id: "PROJ-003",
    name: "Cloud Migration Project",
    phase: "Execution",
    status: "delayed",
    budget: 3200000,
    spent: 2100000,
    progress: 58,
    cpi: 0.88,
    spi: 0.78,
    team: 18,
    risks: 7,
  },
  {
    id: "PROJ-004",
    name: "Manufacturing Automation",
    phase: "Initiation",
    status: "on-track",
    budget: 4500000,
    spent: 320000,
    progress: 8,
    cpi: 1.12,
    spi: 1.05,
    team: 12,
    risks: 3,
  },
]

const MOCK_SALES_PIPELINE: SalesPipeline[] = [
  { stage: "Prospect", count: 45, value: 2250000, probability: 10 },
  { stage: "Qualified", count: 28, value: 3360000, probability: 30 },
  { stage: "Proposal", count: 15, value: 2250000, probability: 50 },
  { stage: "Negotiation", count: 8, value: 1600000, probability: 75 },
  { stage: "Closed Won", count: 12, value: 2400000, probability: 100 },
]

const MOCK_CRM_ACCOUNTS: CRMAccount[] = [
  { name: "Acme Corporation", status: "active", nps: 65, csat: 92, revenue: 1250000, health: "healthy" },
  { name: "TechStart Inc", status: "active", nps: 48, csat: 85, revenue: 890000, health: "healthy" },
  { name: "Global Industries Ltd", status: "at-risk", nps: 12, csat: 68, revenue: 2100000, health: "warning" },
  { name: "Innovation Partners", status: "active", nps: 72, csat: 95, revenue: 1680000, health: "healthy" },
  { name: "Enterprise Solutions Co", status: "at-risk", nps: -8, csat: 55, revenue: 950000, health: "critical" },
]

const MOCK_ANOMALIES: Anomaly[] = [
  {
    id: 1,
    domain: "assets",
    type: "Vibration Spike Detected",
    severity: "critical",
    description: "Abnormal vibration pattern detected in Air Compressor C2 - immediate investigation required",
    confidence: 94,
    detectedAt: "2024-10-26 14:23:45",
  },
  {
    id: 2,
    domain: "projects",
    type: "Budget Overrun Risk",
    severity: "high",
    description: "Cloud Migration project exceeding planned budget by 12% with 42% remaining work",
    confidence: 88,
    detectedAt: "2024-10-26 11:15:22",
  },
  {
    id: 3,
    domain: "sales",
    type: "Deal Stagnation Pattern",
    severity: "medium",
    description: "3 high-value deals ($1.6M total) stalled in negotiation phase for 30+ days",
    confidence: 76,
    detectedAt: "2024-10-26 09:42:11",
  },
  {
    id: 4,
    domain: "crm",
    type: "Churn Risk Indicator",
    severity: "high",
    description: "Enterprise Solutions Co showing negative NPS (-8) and declining CSAT scores",
    confidence: 82,
    detectedAt: "2024-10-25 16:30:55",
  },
]

type CurrentPage = "hub" | "assets" | "projects" | "sales" | "crm" | "marco"
// </CHANGE> Removed AssetSubPage type - no longer needed
export default function AIPoweredDashboardsClient() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState<CurrentPage>("hub")
  const [statusFilter, setStatusFilter] = useState<"all" | "healthy" | "warning" | "critical">("all")
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [selectedLocationAssetId, setSelectedLocationAssetId] = useState<string | null>(null)
  const [liveData, setLiveData] = useState({
    timestamp: new Date().toLocaleTimeString(),
    activeAlerts: 12,
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentPage])

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData({
        timestamp: new Date().toLocaleTimeString(),
        activeAlerts: Math.floor(Math.random() * 5) + 10,
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const filteredAssets = statusFilter === "all" ? MOCK_ASSETS : MOCK_ASSETS.filter((a) => a.status === statusFilter)

  const filteredLocationAssets = selectedLocationAssetId
    ? MOCK_ASSETS.filter((a) => a.id === selectedLocationAssetId)
    : MOCK_ASSETS

  const stats = {
    healthy: MOCK_ASSETS.filter((a) => a.status === "healthy").length,
    warning: MOCK_ASSETS.filter((a) => a.status === "warning").length,
    critical: MOCK_ASSETS.filter((a) => a.status === "critical").length,
    avgHealth: Math.round(MOCK_ASSETS.reduce((acc, a) => acc + a.health, 0) / MOCK_ASSETS.length),
    openNotifications: MOCK_ASSETS.reduce((acc, a) => acc + a.openNotifications, 0),
    criticalNotifications: MOCK_ASSETS.reduce((acc, a) => acc + a.criticalNotifications, 0),
    avgAvailability: (MOCK_ASSETS.reduce((acc, a) => acc + a.availability, 0) / MOCK_ASSETS.length).toFixed(1),
  }

  const getHealthColor = (health: number) => {
    if (health >= 85) return "text-green-400"
    if (health >= 70) return "text-yellow-400"
    return "text-red-400"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      default:
        return "bg-blue-500"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "critical":
        return "bg-red-50 pulse-glow"
      default:
        return "bg-gray-500"
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  const navigation = [
    { name: "Home", page: "hub" as const, icon: Home },
    { name: "Asset Management", page: "assets" as const, icon: Package },
    { name: "Project Management", page: "projects" as const, icon: FolderKanban },
    { name: "Sales Analytics", page: "sales" as const, icon: TrendingUp },
    // </CHANGE> Removed CRM Intelligence from navigation
    { name: "MARCO AI Dashboard", page: "marco" as const, icon: Megaphone },
  ]

  const dashboardCards = [
    {
      title: "Asset Management",
      description: "Comprehensive asset tracking with performance, health, location, and cost analytics",
      icon: Package,
      page: "assets" as const,
      gradient: "from-blue-500 to-cyan-500",
      stats: `${stats.healthy + stats.warning + stats.critical} Assets • ${stats.critical} Critical`,
    },
    {
      title: "Asset Dashboard",
      description: "Advanced asset management with real-time monitoring and maintenance assistant",
      icon: Gauge,
      page: null, // null means it's an external route
      gradient: "from-cyan-500 to-blue-600",
      stats: "Real-time Monitoring • AI Assistant • Notifications",
      externalRoute: "/assets-dashboard",
    },
    {
      title: "Mazda Dashboard",
      description: "Live maintenance notifications from n8n webhook with real-time analytics and filtering",
      icon: Wrench, // Changed from Car to Wrench icon for better representation of maintenance dashboard
      page: null,
      gradient: "from-slate-600 to-slate-800",
      stats: "Real-time Sync • n8n Webhook • Advanced Filtering",
      externalRoute: "/ai-dashboards/mazda",
    },
    {
      title: "Project Management",
      description: "Track project costs, health, risks, milestones, and resource allocation",
      icon: FolderKanban,
      page: "projects" as const,
      gradient: "from-purple-500 to-pink-500",
      // Changed currency symbol to EUR
      stats: `${MOCK_PROJECTS.length} Projects • €${(MOCK_PROJECTS.reduce((acc, p) => acc + p.budget, 0) / 1000000).toFixed(1)}M Budget`,
    },
    {
      title: "Sales Analytics",
      description: "Pipeline analysis, forecasting, territory performance, and win rate optimization",
      icon: TrendingUp,
      page: "sales" as const,
      gradient: "from-green-500 to-emerald-500",
      // Changed currency symbol to EUR
      stats: `€${(MOCK_SALES_PIPELINE.reduce((acc, s) => acc + s.value, 0) / 1000000).toFixed(1)}M Pipeline • 28% Win Rate`,
    },
    {
      title: "MARCO AI Dashboard",
      description: "Market communications analytics with campaign performance and audience insights",
      icon: Megaphone, // Changed icon from Brain to Megaphone
      page: "marco" as const,
      gradient: "from-orange-500 to-red-500", // Changed gradient to orange-red
      stats: "6 Active Campaigns • 2.4M Reach • 4.8% Engagement",
    },
  ]

  const handleBack = () => {
    if (currentPage === "hub") {
      router.push("/")
    } else {
      setCurrentPage("hub")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
        }
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes notification-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .notification-badge {
          animation: notification-pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        
        @keyframes rgb-border {
          0% { border-color: rgba(59, 130, 246, 1); box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 15px rgba(59, 130, 246, 0.1); }
          25% { border-color: rgba(139, 92, 246, 1); box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3), inset 0 0 15px rgba(139, 92, 246, 0.1); }
          50% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3), inset 0 0 15px rgba(239, 68, 68, 0.1); }
          75% { border-color: rgba(16, 185, 129, 1); box-shadow: 0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3), inset 0 0 15px rgba(16, 185, 129, 0.1); }
          100% { border-color: rgba(59, 130, 246, 1); box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 15px rgba(59, 130, 246, 0.1); }
        }
        
        .dashboard-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .dashboard-card:hover {
          animation: rgb-border 3s linear infinite;
        }
        
        /* Modern floating chatbot styles */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideOutDown {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
        }
        
        @keyframes fabPulse {
          0%, 100% {
            box-shadow: 0 8px 24px rgba(168, 85, 247, 0.4), 0 0 0 0 rgba(168, 85, 247, 0.4);
          }
          50% {
            box-shadow: 0 12px 32px rgba(168, 85, 247, 0.6), 0 0 0 8px rgba(168, 85, 247, 0);
          }
        }
        
        .chat-fab {
          animation: fabPulse 3s ease-in-out infinite;
        }
        
        .chat-window-enter {
          animation: slideInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .chat-window-exit {
          animation: slideOutDown 0.2s ease-out;
        }
        
        .glass-morphism {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        
        /* Override n8n chat styles for modern look */
        #floating-asset-chat .n8n-chat {
          border-radius: 0 0 20px 20px !important;
          box-shadow: none !important;
        }
        
        #floating-asset-chat .n8n-chat-header {
          display: none !important;
        }
        
        #floating-asset-chat .n8n-chat-messages {
          background: linear-gradient(to bottom, #fafafa, #ffffff) !important;
        }
        
        #floating-asset-chat .n8n-chat-message-bot {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          border-radius: 18px 18px 18px 4px !important;
        }
        
        #floating-asset-chat .n8n-chat-message-user {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
          color: white !important;
          border-radius: 18px 18px 4px 18px !important;
        }
        
        #floating-asset-chat .n8n-chat-input {
          border-radius: 24px !important;
          border: 2px solid #e5e7eb !important;
          padding: 12px 20px !important;
        }
        
        #floating-asset-chat .n8n-chat-input:focus {
          border-color: #a855f7 !important;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1) !important;
        }
        /* </CHANGE> */
      `}</style>

      {/* Main Content - Full Width */}
      <div className="flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-xl px-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">{currentPage === "hub" ? "Back to Home" : "Back to Dashboard"}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1">
              <Radio className="h-4 w-4 text-green-500 animate-pulse" />
              <span className="text-sm text-gray-700 hidden sm:inline">Live</span>
              <span className="text-xs text-gray-500">{liveData.timestamp}</span>
            </div>
            <button className="relative rounded-md border border-gray-300 bg-white p-2 hover:bg-gray-50">
              <Bell className="h-5 w-5 text-gray-700" />
              <span className="notification-badge absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {liveData.activeAlerts}
              </span>
            </button>
            <button className="rounded-md border border-gray-300 bg-white p-2 hover:bg-gray-50">
              <Settings className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {/* HUB PAGE */}
          {currentPage === "hub" && (
            <div>
              <div className="mb-6 sm:mb-8">
                <h1 className="mb-2 text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Powered Dashboard
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Unified intelligence across assets, projects, sales, and customer relationships
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:gap-6">
                {dashboardCards.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (card.externalRoute) {
                        router.push(card.externalRoute)
                      } else if (card.page) {
                        setCurrentPage(card.page)
                      }
                      // </CHANGE>
                    }}
                    className="dashboard-card group relative bg-white backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 cursor-pointer hover:border-blue-300 transition-all duration-500 hover:scale-[1.02] shadow-lg hover:shadow-2xl border-2 border-transparent overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      <div
                        className={`flex-shrink-0 inline-flex p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-lg`}
                      >
                        <card.icon className="w-8 h-8" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-gray-900">
                          {card.title}
                          {card.badge && (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {card.badge}
                            </span>
                          )}
                          {/* </CHANGE> */}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-2">{card.description}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{card.stats}</p>
                      </div>

                      <div className="flex items-center text-blue-600 font-semibold text-sm sm:text-base md:ml-4">
                        Open Dashboard
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 ml-1 rotate-180 group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>

                    <div
                      className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${card.gradient} opacity-10 rounded-bl-full transform group-hover:scale-150 transition-transform duration-500`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ASSET MANAGEMENT PAGE */}
          {currentPage === "assets" && (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      Asset Management
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                      Real-time asset tracking with predictive maintenance and performance optimization
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Our Asset Management Dashboard provides real-time visibility into your entire asset portfolio with
                    AI-powered predictive maintenance, performance optimization, and cost analytics. Monitor critical
                    metrics like health scores, vibration patterns, temperature thresholds, and efficiency ratings to
                    prevent downtime and maximize asset utilization. Leverage intelligent insights to reduce maintenance
                    costs by up to 30% while extending asset lifespan through proactive interventions and data-driven
                    decision making.
                  </p>
                </div>
              </div>

              {/* LIVE COCKPIT DASHBOARD - SAP S/4HANA Integration Ready */}
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Live Cockpit - Unified Asset Intelligence
                      </h2>
                      <p className="text-sm text-gray-600">
                        Real-time monitoring dashboard with SAP S/4HANA Maintenance Notification API integration
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-green-700">API Ready</span>
                    </div>
                  </div>

                  {/* SAP Integration Status Panel */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-600" />
                      SAP S/4HANA Integration Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <div className="text-xs text-gray-600 mb-1">API Endpoint</div>
                        <div className="text-xs font-mono text-gray-900">/sap/opu/odata/sap/API_MAINTNOTIFICATION</div>
                        <div className="text-xs text-green-600 mt-1">✓ Connected</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <div className="text-xs text-gray-600 mb-1">Data Sync</div>
                        <div className="text-xs font-semibold text-gray-900">Real-time (3s interval)</div>
                        <div className="text-xs text-green-600 mt-1">✓ Active</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <div className="text-xs text-gray-600 mb-1">Last Sync</div>
                        <div className="text-xs font-semibold text-gray-900">{liveData.timestamp}</div>
                        <div className="text-xs text-blue-600 mt-1">Auto-refresh enabled</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="mb-6 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:border-green-500 transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Healthy</span>
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.healthy}</div>
                    <p className="text-xs text-gray-500">Equipment</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:border-yellow-500 transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Warning</span>
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.warning}</div>
                    <p className="text-xs text-gray-500">Needs attention</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:border-red-500 transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Critical</span>
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.critical}</div>
                    <p className="text-xs text-red-400">Immediate action</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:border-blue-500 transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Avg Health</span>
                      <Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.avgHealth}%</div>
                    <p className="text-xs text-gray-500">Fleet average</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:border-purple-500 transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Notifications</span>
                      <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.openNotifications}</div>
                    <p className="text-xs text-red-400">{stats.criticalNotifications} critical</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:border-indigo-500 transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Availability</span>
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.avgAvailability}%</div>
                    <p className="text-xs text-green-500">+2.3% vs target</p>
                  </div>
                </div>

                {/* AI-Powered Insights Panel */}
                <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    AI-Powered Metadata Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-semibold text-gray-900">Critical Alert</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        COMP-015 showing abnormal vibration patterns (8.2 mm/s). Immediate maintenance recommended.
                      </p>
                      <div className="text-xs text-gray-600">Confidence: 94% • Detected: 2 hours ago</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-semibold text-gray-900">Predictive Maintenance</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        MOTOR-042 bearing replacement needed within 10 days based on wear pattern analysis.
                      </p>
                      <div className="text-xs text-gray-600">Confidence: 88% • Detected: 5 hours ago</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-semibold text-gray-900">Optimization Opportunity</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        PUMP-001 operating at 96% efficiency. Optimal performance expected for next 90 days.
                      </p>
                      <div className="text-xs text-gray-600">Confidence: 96% • Updated: 1 hour ago</div>
                    </div>
                  </div>
                </div>

                {/* Asset Cards */}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className="group relative bg-white backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 cursor-pointer hover:border-blue-300 transition-all duration-500 hover:scale-[1.02] shadow-lg hover:shadow-2xl border-2 border-transparent overflow-hidden"
                    >
                      {/* Decorative gradient circle */}
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                {asset.id}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(asset.status)} text-white`}
                              >
                                {asset.status.toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{asset.name}</h3>
                            <p className="text-sm text-gray-600">{asset.site}</p>
                          </div>
                          <div
                            className={`p-3 rounded-xl ${asset.status === "critical" ? "bg-red-100" : asset.status === "warning" ? "bg-yellow-100" : "bg-green-100"}`}
                          >
                            {asset.status === "critical" ? (
                              <AlertTriangle className="h-6 w-6 text-red-600" />
                            ) : asset.status === "warning" ? (
                              <AlertTriangle className="h-6 w-6 text-yellow-600" />
                            ) : (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Health Score</span>
                            <span className="text-lg font-bold text-blue-600">{asset.health}%</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Efficiency</span>
                            <span className="text-lg font-bold text-purple-600">{asset.efficiency}%</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Uptime</span>
                            <span className="text-lg font-bold text-green-600">{asset.availability}%</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Last Maintenance</span>
                            <span className="font-semibold text-gray-900">
                              {asset.notifications.find((n) => n.status === "closed")?.date || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Floating Maintenance Assistant chat — only on Assets tab */}
                <ChatTiny />
              </div>
            </div>
          )}

          {/* PROJECT MANAGEMENT PAGE */}
          {currentPage === "projects" && (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                    <FolderKanban className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Project Management
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                      Comprehensive project tracking with budget, schedule, and risk analytics
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Transform your project delivery with our AI-powered Project Management Dashboard that provides
                    real-time visibility into budget performance, schedule adherence, and risk exposure. Track Cost
                    Performance Index (CPI) and Schedule Performance Index (SPI) across your entire portfolio while
                    identifying at-risk projects before they impact your bottom line. Our intelligent analytics help you
                    optimize resource allocation, predict project outcomes, and improve delivery success rates by up to
                    40% through data-driven insights and proactive risk management.
                  </p>
                </div>
              </div>

              <div className="mb-6 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:border-blue-500 transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Active Projects</span>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{MOCK_PROJECTS.length}</div>
                  <p className="text-xs text-gray-500">
                    {MOCK_PROJECTS.filter((p) => p.status === "on-track").length} on track
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:border-green-500 transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Total Budget</span>
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    ${(MOCK_PROJECTS.reduce((acc, p) => acc + p.budget, 0) / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-xs text-gray-500">Across all projects</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:border-purple-500 transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Avg CPI</span>
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {(MOCK_PROJECTS.reduce((acc, p) => acc + p.cpi, 0) / MOCK_PROJECTS.length).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500">Cost Performance</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:border-orange-500 transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Avg SPI</span>
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {(MOCK_PROJECTS.reduce((acc, p) => acc + p.spi, 0) / MOCK_PROJECTS.length).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500">Schedule Performance</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:border-yellow-500 transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">At Risk</span>
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {MOCK_PROJECTS.filter((p) => p.status !== "on-track").length}
                  </div>
                  <p className="text-xs text-red-400">Require attention</p>
                </div>
              </div>

              <ProjectManagementDashboard onBack={() => setCurrentPage("hub")} />
            </div>
          )}

          {/* SALES ANALYTICS PAGE */}
          {currentPage === "sales" && <SalesAnalyticsDashboard onBack={() => setCurrentPage("hub")} />}

          {/* MARCO AI PAGE */}
          {currentPage === "marco" && (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
                    <Megaphone className="w-8 h-8" /> {/* Changed icon to Megaphone */}
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      MARCO AI Dashboard
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                      Intelligent market communications with campaign analytics and audience insights
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 rounded-lg">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Experience comprehensive market communications analytics with MARCO AI Dashboard. Monitor campaign
                    performance, track audience engagement across multiple channels, analyze customer demographics, and
                    optimize your marketing ROI with AI-powered insights. Our advanced analytics platform helps you
                    understand what resonates with your audience, identify high-performing content types, and make
                    data-driven decisions to maximize your marketing impact and drive business growth.
                  </p>
                </div>
              </div>

              {/* Embed the full MARCO AI Dashboard */}
              <MARCOAIDashboard />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

const campaigns = [
  { title: "Q4 Product Launch", status: "Active" },
  { title: "Holiday Season Campaign", status: "Active" },
  { title: "LinkedIn Lead Gen", status: "Active" },
]
