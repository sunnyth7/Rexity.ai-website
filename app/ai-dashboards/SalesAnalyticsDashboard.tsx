"use client"

import type React from "react"

import { useState } from "react"
import {
  RefreshCw,
  Download,
  Euro,
  Users,
  TrendingUp,
  Trophy,
  Filter,
  Database,
  CheckCircle,
  Lightbulb,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const rexityColors = {
  primary: "#8B5CF6", // purple
  secondary: "#EC4899", // pink
  accent: "#3B82F6", // blue
  success: "#10B981", // green
  warning: "#F59E0B", // orange
  error: "#EF4444", // red
  neutral: "#6B7280",
  background: "#F9FAFB",
  palette: ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B"],
}

interface SalesAnalyticsDashboardProps {
  onBack: () => void
}

export default function SalesAnalyticsDashboard({ onBack }: SalesAnalyticsDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("Never")
  const [timePeriod, setTimePeriod] = useState("custom")
  const [year, setYear] = useState("2025")
  const [startDate, setStartDate] = useState("2025-01-01")
  const [endDate, setEndDate] = useState("2025-10-27")
  const [region, setRegion] = useState("all")
  const [product, setProduct] = useState("all")
  const [showCustomDate, setShowCustomDate] = useState(true)

  // KPI Data
  const [kpis, setKpis] = useState({
    totalRevenue: "€4.2M",
    activeCustomers: 287,
    avgDealSize: "€85K",
    winRate: "38.4%",
    pipelineValue: "€12.8M",
  })

  // Chart Data
  const [revenueData] = useState([
    { month: "Jan", actual: 320, target: 300 },
    { month: "Feb", actual: 380, target: 350 },
    { month: "Mar", actual: 420, target: 400 },
    { month: "Apr", actual: 460, target: 450 },
    { month: "May", actual: 510, target: 500 },
    { month: "Jun", actual: 540, target: 550 },
    { month: "Jul", actual: 580, target: 600 },
    { month: "Aug", actual: 620, target: 650 },
    { month: "Sep", actual: 670, target: 700 },
    { month: "Oct", actual: 720, target: 750 },
  ])

  const productData = [
    { name: "SAP Agentic AI", value: 1800 },
    { name: "Joule Agents", value: 1200 },
    { name: "AI Workflows", value: 800 },
    { name: "Consulting", value: 400 },
  ]

  const regionalData = [
    { region: "North America", revenue: 1800 },
    { region: "Europe", revenue: 1200 },
    { region: "Asia Pacific", revenue: 900 },
    { region: "Latin America", revenue: 300 },
  ]

  const funnelData = [
    { stage: "Leads", count: 850 },
    { stage: "Qualified", count: 420 },
    { stage: "Proposal", count: 180 },
    { stage: "Negotiation", count: 95 },
    { stage: "Closed Won", count: 68 },
  ]

  const handleTimePeriodChange = (value: string) => {
    setTimePeriod(value)
    setShowCustomDate(value === "custom")
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      const baseRevenue = 4.2
      const revenue = (baseRevenue + (Math.random() - 0.5) * 0.5).toFixed(1)
      setKpis((prev) => ({
        ...prev,
        totalRevenue: `€${revenue}M`,
        activeCustomers: Math.floor(287 + (Math.random() - 0.5) * 20),
        avgDealSize: `€${Math.floor(85 + (Math.random() - 0.5) * 10)}K`,
        winRate: `${(38.4 + (Math.random() - 0.5) * 3).toFixed(1)}%`,
        pipelineValue: `€${(12.8 + (Math.random() - 0.5) * 1).toFixed(1)}M`,
      }))

      setLastUpdated(new Date().toLocaleString())
      setIsRefreshing(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Sales Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">Real-time sales analytics and performance metrics</p>
            </div>
            <div className="flex gap-2">
              <button
                className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm transition-colors hidden sm:flex items-center gap-2"
                onClick={() => alert("Export functionality")}
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isRefreshing
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                } text-white`}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs text-gray-600 font-medium">Time Period</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={timePeriod}
              onChange={(e) => handleTimePeriodChange(e.target.value)}
            >
              <option value="custom">Custom Date Range</option>
              <option value="ytd">Year to Date (YTD)</option>
              <option value="q1">Q1 (Jan - Mar)</option>
              <option value="q2">Q2 (Apr - Jun)</option>
              <option value="q3">Q3 (Jul - Sep)</option>
              <option value="q4">Q4 (Oct - Dec)</option>
              <option value="h1">H1 (Jan - Jun)</option>
              <option value="h2">H2 (Jul - Dec)</option>
              <option value="mtd">Month to Date</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="text-xs text-gray-600 font-medium">Year</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          {showCustomDate && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Date Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-600 text-sm">to</span>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs text-gray-600 font-medium">Region</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="all">All Regions</option>
              <option value="north-america">North America</option>
              <option value="europe">Europe</option>
              <option value="asia-pacific">Asia Pacific</option>
              <option value="latin-america">Latin America</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs text-gray-600 font-medium">Product</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              <option value="all">All Products</option>
              <option value="sap-ai">SAP Agentic AI</option>
              <option value="joule">Joule Agents</option>
              <option value="workflows">AI Workflows</option>
              <option value="consulting">Consulting</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
        {/* KPI Section */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPITile
              icon={<Euro />}
              label="Total Revenue"
              value={kpis.totalRevenue}
              change="+24.5%"
              positive
              color="purple"
            />
            <KPITile
              icon={<Users />}
              label="Active Customers"
              value={kpis.activeCustomers}
              change="+18.3%"
              positive
              color="green"
            />
            <KPITile
              icon={<TrendingUp />}
              label="Avg Deal Size"
              value={kpis.avgDealSize}
              change="+12.7%"
              positive
              color="blue"
            />
            <KPITile icon={<Trophy />} label="Win Rate" value={kpis.winRate} change="+5.2%" positive color="pink" />
            <KPITile
              icon={<Filter />}
              label="Pipeline Value"
              value={kpis.pipelineValue}
              change="+35.8%"
              positive
              color="orange"
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 border-l-4 border-l-purple-600 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-semibold text-gray-800">AI-Powered Insights</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border-l-4 border-l-purple-600 text-sm leading-relaxed">
              <strong className="font-semibold text-purple-900">Revenue Momentum:</strong> Q4 2025 revenue is trending
              24.5% above target, driven by strong Enterprise segment performance across North America and Europe
              regions.
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-l-pink-600 text-sm leading-relaxed">
              <strong className="font-semibold text-pink-900">Deal Velocity:</strong> Average deal closure time has
              improved by 18% compared to previous quarter, indicating better sales efficiency and streamlined
              processes.
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-l-blue-600 text-sm leading-relaxed">
              <strong className="font-semibold text-blue-900">Pipeline Health:</strong> Current pipeline of €12.8M
              suggests potential to exceed Q1 2026 targets by 15-20% if conversion rates hold steady at current levels.
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-semibold text-gray-800">Data Model & Backend Integration</h3>
            </div>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Ready for Backend
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataEntity
              name="Sales Transactions"
              fields={["transaction_id", "date", "revenue", "customer_id", "product_id", "region"]}
            />
            <DataEntity name="Customers" fields={["customer_id", "name", "segment", "region", "acquisition_date"]} />
            <DataEntity
              name="Pipeline"
              fields={["opportunity_id", "stage", "value", "probability", "expected_close_date"]}
            />
            <DataEntity name="Products" fields={["product_id", "name", "category", "price"]} />
          </div>
        </div>

        {/* Charts Section */}
        <h2 className="text-base font-semibold text-gray-800 mb-4">Analytics & Visualizations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Revenue Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: "12px" }} />
                <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: "#8B5CF6" }}
                  name="Actual Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Product Performance">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={productData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={rexityColors.palette[index % rexityColors.palette.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Regional Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="region" stroke="#6B7280" style={{ fontSize: "12px" }} />
                <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" name="Revenue (€K)">
                  {regionalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={rexityColors.palette[index % rexityColors.palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Sales Funnel">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" style={{ fontSize: "12px" }} />
                <YAxis dataKey="stage" type="category" stroke="#6B7280" style={{ fontSize: "12px" }} />
                <Tooltip />
                <Bar dataKey="count" name="Count">
                  {funnelData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === funnelData.length - 1 ? "#10B981" : `rgba(139, 92, 246, ${0.9 - index * 0.15})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-8 py-4 mt-8 text-center text-xs text-gray-600">
        <span className="inline-flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Last updated: {lastUpdated}
        </span>
        <span className="mx-4">|</span>
        <span>Powered by REXITY.AI</span>
      </div>
    </div>
  )
}

interface KPITileProps {
  icon: React.ReactNode
  label: string
  value: string | number
  change: string
  positive?: boolean
  color?: "purple" | "green" | "blue" | "pink" | "orange"
}

function KPITile({ icon, label, value, change, positive = true, color = "purple" }: KPITileProps) {
  const colorClasses = {
    purple: "border-purple-500 hover:shadow-purple-200",
    green: "border-green-500 hover:shadow-green-200",
    blue: "border-blue-500 hover:shadow-blue-200",
    pink: "border-pink-500 hover:shadow-pink-200",
    orange: "border-orange-500 hover:shadow-orange-200",
  }

  const iconColorClasses = {
    purple: "text-purple-600",
    green: "text-green-600",
    blue: "text-blue-600",
    pink: "text-pink-600",
    orange: "text-orange-600",
  }

  return (
    <div
      className={`bg-white border-2 ${colorClasses[color]} rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-pink-500/20 to-transparent rounded-full blur-xl"></div>
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">{label}</span>
          <div
            className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center ${iconColorClasses[color]}`}
          >
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
        <div className="flex items-center gap-2 text-xs">
          <span className={positive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{change}</span>
          <span className="text-gray-500">vs previous period</span>
        </div>
      </div>
    </div>
  )
}

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow relative overflow-hidden group">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full blur-2xl"></div>
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-purple-500 hover:text-purple-600 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface DataEntityProps {
  name: string
  fields: string[]
}

function DataEntity({ name, fields }: DataEntityProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-l-purple-600">
      <div className="text-sm font-semibold text-gray-800 mb-2">{name}</div>
      <div className="text-xs text-gray-600 space-y-1.5">
        {fields.map((field, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-purple-600 text-[10px]">●</span>
            <span>{field}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
