"use client"

import type React from "react"

import { useState } from "react"
import {
  RefreshCw,
  Settings,
  Download,
  Database,
  BellDot as Bullhorn,
  UsersIcon,
  Baseline as ChartLine,
  Share2,
  CheckCircle,
  Plug,
  Circle,
  Heart,
  UserPlus,
  Percent,
  Euro,
  Smile,
  Expand,
  Clock,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const rexityColors = {
  primary: "#667eea",
  purple: "#764ba2",
  pink: "#f093fb",
  blue: "#4facfe",
  palette: ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#00f2fe"],
}

export default function MARCOAIDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString())
  const [timePeriod, setTimePeriod] = useState("ytd")
  const [campaignType, setCampaignType] = useState("all")
  const [channel, setChannel] = useState("all")
  const [region, setRegion] = useState("all")

  const [kpis, setKpis] = useState({
    totalReach: 2.8,
    engagementRate: 8.7,
    leadGen: 1847,
    conversionRate: 4.2,
    campaignROI: 385,
    brandSentiment: 92,
  })

  const performanceData = [
    { month: "Jan", reach: 180, engagement: 12 },
    { month: "Feb", reach: 220, engagement: 16 },
    { month: "Mar", reach: 250, engagement: 19 },
    { month: "Apr", reach: 280, engagement: 22 },
    { month: "May", reach: 320, engagement: 28 },
    { month: "Jun", reach: 380, engagement: 32 },
    { month: "Jul", reach: 420, engagement: 36 },
    { month: "Aug", reach: 460, engagement: 42 },
    { month: "Sep", reach: 520, engagement: 48 },
    { month: "Oct", reach: 580, engagement: 54 },
  ]

  const channelData = [
    { channel: "Email", rate: 12.4 },
    { channel: "Social Media", rate: 8.7 },
    { channel: "Website", rate: 6.2 },
    { channel: "Mobile App", rate: 9.8 },
    { channel: "Events", rate: 15.3 },
  ]

  const audienceData = [
    { name: "18-24", value: 15 },
    { name: "25-34", value: 32 },
    { name: "35-44", value: 28 },
    { name: "45-54", value: 18 },
    { name: "55+", value: 7 },
  ]

  const contentData = [
    { type: "Blog Posts", score: 85 },
    { type: "Videos", score: 92 },
    { type: "Infographics", score: 78 },
    { type: "Webinars", score: 88 },
    { type: "Case Studies", score: 81 },
  ]

  const campaigns = [
    { title: "Q4 Product Launch", status: "Active", impressions: "245K", clicks: "12.4K", ctr: "5.1%", spend: "€45K" },
    {
      title: "Holiday Season Campaign",
      status: "Active",
      impressions: "892K",
      clicks: "38.2K",
      ctr: "4.3%",
      spend: "€78K",
    },
    { title: "LinkedIn Lead Gen", status: "Active", impressions: "156K", clicks: "8.9K", ctr: "5.7%", spend: "€32K" },
  ]

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setKpis({
        totalReach: +(2.8 + (Math.random() - 0.5) * 0.3).toFixed(1),
        engagementRate: +(8.7 + (Math.random() - 0.5) * 0.5).toFixed(1),
        leadGen: Math.floor(1847 + (Math.random() - 0.5) * 100),
        conversionRate: +(4.2 + (Math.random() - 0.5) * 0.3).toFixed(1),
        campaignROI: Math.floor(385 + (Math.random() - 0.5) * 20),
        brandSentiment: Math.floor(92 + (Math.random() - 0.5) * 3),
      })
      setLastUpdated(new Date().toLocaleString())
      setIsRefreshing(false)
      showNotification("Data refreshed from Marketing Cloud")
    }, 2000)
  }

  const showNotification = (message: string) => {
    const notification = document.createElement("div")
    notification.className =
      "fixed top-16 right-4 bg-white border-l-4 border-green-600 rounded shadow-lg p-4 z-50 animate-in slide-in-from-right flex items-center gap-3"
    notification.innerHTML = `
      <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span class="text-sm font-medium">${message}</span>
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              MARCO - Market Communications
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <Plug className="w-3 h-3 text-green-600" />
                <span className="text-green-700 font-medium">Marketing Cloud Connected</span>
              </span>
              <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full animate-pulse">
                <Circle className="w-2 h-2 fill-current text-blue-600" />
                <span className="text-blue-700 font-medium">Real-Time Data</span>
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 border border-gray-300"
              onClick={() => showNotification("Settings panel opening...")}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              className="text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 border border-gray-300"
              onClick={() => showNotification("Exporting marketing data...")}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                isRefreshing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              } text-white`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-8 py-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fillRule="evenodd"%3E%3Cg fill="%23ffffff" fillOpacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold mb-2">Market Communications Analytics</h1>
          <p className="text-sm opacity-90">Campaign Performance, Audience Engagement & Channel Metrics</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">Time Period</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              <option value="ytd">Year to Date</option>
              <option value="q1">Q1 2025</option>
              <option value="q2">Q2 2025</option>
              <option value="q3">Q3 2025</option>
              <option value="q4">Q4 2025</option>
              <option value="mtd">Month to Date</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">Campaign Type</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={campaignType}
              onChange={(e) => setCampaignType(e.target.value)}
            >
              <option value="all">All Campaigns</option>
              <option value="email">Email Marketing</option>
              <option value="social">Social Media</option>
              <option value="content">Content Marketing</option>
              <option value="paid">Paid Advertising</option>
              <option value="events">Events & Webinars</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">Channel</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="social">Social Media</option>
              <option value="web">Website</option>
              <option value="mobile">Mobile App</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-medium">Region/Market</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="all">All Markets</option>
              <option value="emea">EMEA</option>
              <option value="amer">Americas</option>
              <option value="apac">APAC</option>
              <option value="dach">DACH</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        {/* Backend Integration Panel */}
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border border-gray-200 border-l-4 border-l-purple-500 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-semibold text-gray-800">Marketing Cloud Integration</h2>
            </div>
            <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
              <CheckCircle className="w-4 h-4" />
              All Systems Online
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <BackendCard
              icon={<Bullhorn />}
              title="Marketing Cloud"
              items={[
                "Campaign Management",
                "Lead Scoring & Nurturing",
                "Customer Segmentation",
                "Marketing Analytics",
              ]}
            />
            <BackendCard
              icon={<UsersIcon />}
              title="Customer Data Platform"
              items={["Unified Customer Profiles", "Audience Insights", "Behavioral Data", "Journey Analytics"]}
            />
            <BackendCard
              icon={<ChartLine />}
              title="Analytics Cloud"
              items={["Marketing Performance", "Attribution Modeling", "ROI Analytics", "Predictive Insights"]}
            />
            <BackendCard
              icon={<Share2 />}
              title="Social Media APIs"
              items={[
                "LinkedIn Campaign Manager",
                "Facebook Business API",
                "Twitter Analytics",
                "Google Ads Integration",
              ]}
            />
          </div>
        </div>

        {/* KPI Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard
              icon={<UsersIcon />}
              label="Total Reach"
              value={`${kpis.totalReach}M`}
              change="+34.5%"
              positive
              color="primary"
            />
            <KPICard
              icon={<Heart />}
              label="Engagement Rate"
              value={`${kpis.engagementRate}%`}
              change="+2.1%"
              positive
              color="purple"
            />
            <KPICard
              icon={<UserPlus />}
              label="Lead Generation"
              value={kpis.leadGen}
              change="+28.3%"
              positive
              color="pink"
            />
            <KPICard
              icon={<Percent />}
              label="Conversion Rate"
              value={`${kpis.conversionRate}%`}
              change="+0.8%"
              positive
              color="blue"
            />
            <KPICard
              icon={<Euro />}
              label="Campaign ROI"
              value={`${kpis.campaignROI}%`}
              change="+42%"
              positive
              color="primary"
            />
            <KPICard
              icon={<Smile />}
              label="Brand Sentiment"
              value={`${kpis.brandSentiment}%`}
              change="+5% positive"
              positive
              color="purple"
            />
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">Active Campaigns</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign, index) => (
              <CampaignCard key={index} {...campaign} />
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Analytics & Insights
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Campaign Performance Trend">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reach" stroke="#667eea" strokeWidth={2} name="Reach (000s)" />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="#764ba2"
                    strokeWidth={2}
                    name="Engagement (000s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Channel Performance">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="channel" stroke="#6B7280" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" name="Engagement Rate %">
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={rexityColors.palette[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Audience Demographics">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={audienceData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {audienceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={rexityColors.palette[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Content Engagement by Type">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={contentData}>
                  <PolarGrid stroke="#E5E5E5" />
                  <PolarAngleAxis dataKey="type" stroke="#6B7280" style={{ fontSize: "12px" }} />
                  <PolarRadiusAxis stroke="#6B7280" />
                  <Radar name="Engagement Score" dataKey="score" stroke="#667eea" fill="#667eea" fillOpacity={0.2} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-8 py-4 text-center text-xs text-gray-600">
        <span className="inline-flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Last updated: {lastUpdated}
        </span>
        <span className="mx-4">|</span>
        <span>MARCO - Market Communications Dashboard v1.0</span>
        <span className="mx-4">|</span>
        <span>Powered by REXITY.AI</span>
      </div>
    </div>
  )
}

interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  change: string
  positive: boolean
  color: "primary" | "purple" | "pink" | "blue"
}

function KPICard({ icon, label, value, change, positive, color }: KPICardProps) {
  const colorClasses = {
    primary: "border-t-purple-500",
    purple: "border-t-purple-600",
    pink: "border-t-pink-500",
    blue: "border-t-blue-500",
  }

  const iconColors = {
    primary: "text-purple-500",
    purple: "text-purple-600",
    pink: "text-pink-500",
    blue: "text-blue-500",
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border-t-4 ${colorClasses[color]} relative overflow-hidden group`}
    >
      {/* RGB corner lighting effect */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 opacity-0 group-hover:opacity-20 rounded-bl-full transition-opacity duration-300"></div>

      <div className="flex justify-between items-start mb-4">
        <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">{label}</span>
        <div className={`w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center ${iconColors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="flex items-center gap-2 text-xs">
        <span className={positive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{change}</span>
        <span className="text-gray-500">vs last period</span>
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
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <div className="flex gap-2">
          <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 hover:border-purple-500 hover:text-purple-600 transition-colors">
            <Expand className="w-4 h-4" />
          </button>
          <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 hover:border-purple-500 hover:text-purple-600 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

interface BackendCardProps {
  icon: React.ReactNode
  title: string
  items: string[]
}

function BackendCard({ icon, title, items }: BackendCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg border-l-4 border-l-purple-500 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
        <div className="text-purple-600">{icon}</div>
        <span>{title}</span>
      </div>
      <div className="text-xs text-gray-600 leading-relaxed space-y-1">
        {items.map((item, index) => (
          <div key={index}>• {item}</div>
        ))}
      </div>
    </div>
  )
}

interface CampaignCardProps {
  title: string
  status: string
  impressions: string
  clicks: string
  ctr: string
  spend: string
}

function CampaignCard({ title, status, impressions, clicks, ctr, spend }: CampaignCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="text-sm font-semibold text-gray-800">{title}</div>
        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">{status}</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{impressions}</div>
            <div className="text-xs text-gray-600 mt-1">Impressions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{clicks}</div>
            <div className="text-xs text-gray-600 mt-1">Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{ctr}</div>
            <div className="text-xs text-gray-600 mt-1">CTR</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{spend}</div>
            <div className="text-xs text-gray-600 mt-1">Spend</div>
          </div>
        </div>
      </div>
    </div>
  )
}
