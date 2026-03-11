"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Download, Printer, TrendingUp } from "lucide-react"
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

// ============================================
// TYPE DEFINITIONS
// ============================================

interface Project {
  id: number
  name: string
  progress: number
  status: "On Track" | "At Risk" | "Completed"
  budget: number
  spent: number
  owner: string
  dueDate: string
  priority: "Critical" | "High" | "Medium" | "Low"
  department: string
}

interface KPIData {
  total: number
  onTrack: number
  atRisk: number
  completed: number
  budgetVariance: number
}

interface ChartData {
  trend: {
    labels: string[]
    planned: number[]
    completed: number[]
  }
  budget: {
    projects: string[]
    budgeted: number[]
    actual: number[]
  }
  status: {
    onTrack: number
    atRisk: number
    completed: number
  }
  resources: {
    teams: string[]
    utilization: number[]
  }
}

interface FilterState {
  status: string
  priority: string
  owner: string
  dateStart: string
  dateEnd: string
}

interface Alert {
  id: string
  message: string
  type: "success" | "error" | "warning" | "info"
}

// ============================================
// API SERVICE LAYER
// ============================================

const APIConfig = {
  BASE_URL: process.env.REACT_APP_API_URL || "http://localhost:3000/api",
  ENDPOINTS: {
    PROJECTS: "/projects",
    KPI: "/kpi",
    CHARTS: "/charts",
    RESOURCES: "/resources",
  },
  TIMEOUT: 5000,
  USE_MOCK: true, // Set to false when backend is ready
}

class APIService {
  private isOnline: boolean = APIConfig.USE_MOCK

  async fetchProjects(filters?: Record<string, any>): Promise<Project[]> {
    try {
      if (APIConfig.USE_MOCK) {
        return this.getMockProjects()
      }

      const params = new URLSearchParams(filters || {})
      const response = await this.request(`${APIConfig.ENDPOINTS.PROJECTS}?${params}`)
      return response
    } catch (error) {
      console.error("Failed to fetch projects:", error)
      return this.getMockProjects()
    }
  }

  async fetchKPI(): Promise<KPIData> {
    try {
      if (APIConfig.USE_MOCK) {
        return this.getMockKPI()
      }

      const response = await this.request(APIConfig.ENDPOINTS.KPI)
      return response
    } catch (error) {
      console.error("Failed to fetch KPI:", error)
      return this.getMockKPI()
    }
  }

  async fetchCharts(): Promise<ChartData> {
    try {
      if (APIConfig.USE_MOCK) {
        return this.getMockCharts()
      }

      const response = await this.request(APIConfig.ENDPOINTS.CHARTS)
      return response
    } catch (error) {
      console.error("Failed to fetch charts data:", error)
      return this.getMockCharts()
    }
  }

  private async request(endpoint: string): Promise<any> {
    const url = `${APIConfig.BASE_URL}${endpoint}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), APIConfig.TIMEOUT)

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      this.isOnline = true
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      this.isOnline = false
      throw error
    }
  }

  private getMockProjects(): Project[] {
    return [
      {
        id: 1,
        name: "Digital Transformation",
        progress: 85,
        status: "On Track",
        budget: 2100,
        spent: 1800,
        owner: "John Smith",
        dueDate: "2025-12-31",
        priority: "High",
        department: "IT",
      },
      {
        id: 2,
        name: "Cloud Migration",
        progress: 62,
        status: "On Track",
        budget: 1500,
        spent: 930,
        owner: "Sarah Johnson",
        dueDate: "2025-11-15",
        priority: "High",
        department: "Infrastructure",
      },
      {
        id: 3,
        name: "Mobile App Dev",
        progress: 45,
        status: "At Risk",
        budget: 800,
        spent: 420,
        owner: "Mike Chen",
        dueDate: "2025-10-30",
        priority: "Critical",
        department: "Development",
      },
      {
        id: 4,
        name: "Data Analytics Platform",
        progress: 90,
        status: "On Track",
        budget: 600,
        spent: 540,
        owner: "Lisa Wong",
        dueDate: "2025-09-15",
        priority: "Medium",
        department: "Analytics",
      },
      {
        id: 5,
        name: "API Modernization",
        progress: 28,
        status: "At Risk",
        budget: 950,
        spent: 280,
        owner: "Robert Davis",
        dueDate: "2025-11-30",
        priority: "High",
        department: "Development",
      },
      {
        id: 6,
        name: "Security Enhancement",
        progress: 75,
        status: "On Track",
        budget: 450,
        spent: 340,
        owner: "Sarah Johnson",
        dueDate: "2025-10-20",
        priority: "Critical",
        department: "Security",
      },
      {
        id: 7,
        name: "Automation Framework",
        progress: 55,
        status: "On Track",
        budget: 700,
        spent: 385,
        owner: "John Smith",
        dueDate: "2025-12-10",
        priority: "Medium",
        department: "IT",
      },
      {
        id: 8,
        name: "UI/UX Redesign",
        progress: 40,
        status: "At Risk",
        budget: 550,
        spent: 220,
        owner: "Mike Chen",
        dueDate: "2025-09-30",
        priority: "High",
        department: "Design",
      },
    ]
  }

  private getMockKPI(): KPIData {
    return {
      total: 24,
      onTrack: 18,
      atRisk: 4,
      completed: 2,
      budgetVariance: -2.3,
    }
  }

  private getMockCharts(): ChartData {
    return {
      trend: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        planned: [40, 45, 60, 70, 75, 80],
        completed: [35, 42, 58, 65, 72, 80],
      },
      budget: {
        projects: ["Digital Trans.", "Cloud Migrate", "Mobile App", "Data Analytics", "API Modern."],
        budgeted: [2100, 1500, 800, 600, 950],
        actual: [1800, 930, 420, 540, 280],
      },
      status: {
        onTrack: 18,
        atRisk: 4,
        completed: 2,
      },
      resources: {
        teams: ["Developers", "QA", "Project Mgmt", "Design"],
        utilization: [85, 72, 90, 65],
      },
    }
  }
}

// ============================================
// COMPONENTS
// ============================================

const AlertComponent: React.FC<{ alert: Alert; onClose: (id: string) => void }> = ({ alert, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(alert.id), 5000)
    return () => clearTimeout(timer)
  }, [alert.id, onClose])

  const bgColors = {
    success: "bg-green-50 border-l-green-500 text-green-900",
    error: "bg-red-50 border-l-red-500 text-red-900",
    warning: "bg-yellow-50 border-l-yellow-500 text-yellow-900",
    info: "bg-blue-50 border-l-blue-500 text-blue-900",
  }

  return (
    <div
      className={`${bgColors[alert.type]} border-l-4 p-4 rounded-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top`}
    >
      <span>{alert.message}</span>
      <button onClick={() => onClose(alert.id)} className="text-lg opacity-60 hover:opacity-100">
        ×
      </button>
    </div>
  )
}

const KPICard: React.FC<{
  label: string
  value: string | number
  change: string
  icon: string
  variant?: "default" | "success" | "warning" | "critical"
}> = ({ label, value, change, icon, variant = "default" }) => {
  const borderColors = {
    default: "from-purple-500 to-pink-500",
    success: "from-green-500 to-emerald-500",
    warning: "from-yellow-500 to-orange-500",
    critical: "from-red-500 to-rose-500",
  }

  return (
    <div className="relative bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* RGB Corner Lighting */}
      <div
        className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${borderColors[variant]} opacity-70 group-hover:opacity-100 transition-opacity`}
      />
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${borderColors[variant]} opacity-70 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      <div className={change.includes("-") ? "text-red-600 text-xs" : "text-green-600 text-xs"}>{change}</div>
    </div>
  )
}

const FilterPanel: React.FC<{
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  onReset: () => void
  onApply: () => void
  owners: string[]
  isOpen: boolean
  onToggle: () => void
}> = ({ filters, onFilterChange, onReset, onApply, owners, isOpen, onToggle }) => {
  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center mb-4 cursor-pointer hover:opacity-70 transition"
      >
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">Advanced Filters</h3>
        <div
          className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
            isOpen ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-purple-50 text-purple-600"
          }`}
        >
          {isOpen ? "−" : "+"}
        </div>
      </button>

      {isOpen && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
              >
                <option value="">All Status</option>
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
              >
                <option value="">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">
                Project Owner
              </label>
              <select
                value={filters.owner}
                onChange={(e) => handleChange("owner", e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
              >
                <option value="">All Owners</option>
                {owners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">Start Date</label>
              <input
                type="date"
                value={filters.dateStart}
                onChange={(e) => handleChange("dateStart", e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">End Date</label>
              <input
                type="date"
                value={filters.dateEnd}
                onChange={(e) => handleChange("dateEnd", e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onReset}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Reset
            </button>
            <button
              onClick={onApply}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium"
            >
              Apply Filters
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const ProjectsTable: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-100 text-green-800"
      case "At Risk":
        return "bg-red-100 text-red-800"
      case "Completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 text-center text-gray-500">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-medium">No projects found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Project</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Progress</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Priority</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Budget</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Owner</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Due Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                Department
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const utilization = Math.round((project.spent / project.budget) * 100)
              return (
                <tr key={project.id} className="border-b border-gray-100 hover:bg-purple-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{project.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{project.progress}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(project.priority)}`}
                    >
                      {project.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-semibold text-gray-900">
                      €{project.spent}K / €{project.budget}K
                    </div>
                    <div className="text-xs text-gray-500">{utilization}% utilized</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{project.owner}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{project.dueDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{project.department}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProjectManagementDashboard({ onBack }: { onBack: () => void }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [kpi, setKPI] = useState<KPIData | null>(null)
  const [chartsData, setChartsData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [updateTime, setUpdateTime] = useState(new Date().toLocaleString())

  const [filters, setFilters] = useState<FilterState>({
    status: "",
    priority: "",
    owner: "",
    dateStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    dateEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 12, 0).toISOString().split("T")[0],
  })

  const apiService = useMemo(() => new APIService(), [])

  useEffect(() => {
    const initDashboard = async () => {
      try {
        setLoading(true)
        const [projectsData, kpiData, chartsDataRes] = await Promise.all([
          apiService.fetchProjects(),
          apiService.fetchKPI(),
          apiService.fetchCharts(),
        ])

        setProjects(projectsData)
        setKPI(kpiData)
        setChartsData(chartsDataRes)
        addAlert("Dashboard loaded successfully", "success")
      } catch (error) {
        addAlert("Error initializing dashboard", "error")
      } finally {
        setLoading(false)
      }
    }

    initDashboard()

    const timer = setInterval(() => {
      setUpdateTime(new Date().toLocaleString())
    }, 60000)

    return () => clearInterval(timer)
  }, [apiService])

  const addAlert = useCallback((message: string, type: Alert["type"]) => {
    const id = `alert-${Date.now()}`
    setAlerts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchStatus = !filters.status || p.status === filters.status
      const matchPriority = !filters.priority || p.priority === filters.priority
      const matchOwner = !filters.owner || p.owner === filters.owner

      return matchStatus && matchPriority && matchOwner
    })
  }, [projects, filters])

  const owners = useMemo(() => [...new Set(projects.map((p) => p.owner))], [projects])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    setFilters({
      status: "",
      priority: "",
      owner: "",
      dateStart: filters.dateStart,
      dateEnd: filters.dateEnd,
    })
    addAlert("Filters reset", "success")
  }

  const handleApplyFilters = () => {
    addAlert(`Applied filters - ${filteredProjects.length} projects found`, "success")
  }

  const exportCSV = () => {
    let csv = "Project Name,Status,Progress,Budget,Spent,Owner,Due Date,Priority\n"
    filteredProjects.forEach((p) => {
      csv += `"${p.name}",${p.status},${p.progress}%,"€${p.budget}K","€${p.spent}K",${p.owner},${p.dueDate},${p.priority}\n`
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rexity_projects_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    addAlert("CSV exported successfully", "success")
  }

  const printReport = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4 mx-auto">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-purple-500 rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Alerts */}
        <div className="mb-6 space-y-3">
          {alerts.map((alert) => (
            <AlertComponent key={alert.id} alert={alert} onClose={removeAlert} />
          ))}
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Project Management Dashboard</h1>
              <p className="text-purple-100">Real-time project analytics and performance tracking</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={printReport}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition font-semibold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={exportCSV}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        {kpi && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard label="Total Projects" value={kpi.total} change="+3 from last month" icon="📊" />
            <KPICard
              label="On Track"
              value={kpi.onTrack}
              change={`${Math.round((kpi.onTrack / kpi.total) * 100)}% of total`}
              icon="✓"
              variant="success"
            />
            <KPICard label="At Risk" value={kpi.atRisk} change="Requires attention" icon="⚠️" variant="warning" />
            <KPICard
              label="Budget Variance"
              value={`${kpi.budgetVariance}%`}
              change="Under budget"
              icon="💰"
              variant="critical"
            />
          </div>
        )}

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          onApply={handleApplyFilters}
          owners={owners}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
        />

        {/* Charts */}
        {chartsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Project Completion Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={chartsData.trend.labels.map((label, i) => ({
                    month: label,
                    planned: chartsData.trend.planned[i],
                    completed: chartsData.trend.completed[i],
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="planned" stroke="#cbd5e1" strokeWidth={2} name="Planned" />
                  <Line type="monotone" dataKey="completed" stroke="#a855f7" strokeWidth={2} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Budget vs Actual</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartsData.budget.projects.map((project, i) => ({
                    project,
                    budgeted: chartsData.budget.budgeted[i],
                    actual: chartsData.budget.actual[i],
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="project" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="budgeted" fill="#a855f7" name="Budgeted (€K)" />
                  <Bar dataKey="actual" fill="#ec4899" name="Actual (€K)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "On Track", value: chartsData.status.onTrack },
                      { name: "At Risk", value: chartsData.status.atRisk },
                      { name: "Completed", value: chartsData.status.completed },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#a855f7" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resource Utilization</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartsData.resources.teams.map((team, i) => ({
                    team,
                    utilization: chartsData.resources.utilization[i],
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" domain={[0, 100]} />
                  <YAxis type="category" dataKey="team" stroke="#6b7280" width={100} />
                  <Tooltip />
                  <Bar dataKey="utilization" fill="#a855f7" name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Projects Table */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Active Projects ({filteredProjects.length})</h2>
            </div>
          </div>
          <ProjectsTable projects={filteredProjects} />
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow-sm p-4 text-center text-sm text-gray-600">
          Last Updated: {updateTime} | Data Currency: Real-time | REXITY.AI Enterprise
        </div>
      </div>
    </div>
  )
}
