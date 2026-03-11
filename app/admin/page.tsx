"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Plus, Trash2, LogOut, Copy, Check, AlertCircle, ChevronRight } from "lucide-react"

// ============================================
// TYPES & CONSTANTS
// ============================================

type KV = { key: string; value: string }

type ApiConfig = {
  baseUrl: string
  username?: string
  password?: string
  headers: KV[]
  params: KV[]
  method: "GET"
  isActive?: boolean
}

type PanelConfigMap = {
  [panelId: string]: ApiConfig
}

interface DashboardPanel {
  id: string
  title: string
  description?: string
  icon?: string
}

const DASHBOARD_PANELS: DashboardPanel[] = [
  { id: "asset-management", title: "Asset Management", icon: "📦" },
  { id: "inventory-tracking", title: "Inventory Tracking", icon: "📊" },
  { id: "sales-analytics", title: "Sales Analytics", icon: "📈" },
  { id: "customer-insights", title: "Customer Insights", icon: "👥" },
  { id: "supply-chain", title: "Supply Chain", icon: "🚚" },
  { id: "financial-overview", title: "Financial Overview", icon: "💰" },
  { id: "workforce-management", title: "Workforce Management", icon: "👔" },
  { id: "market-trends", title: "Market Trends", icon: "📉" },
]

const ADMIN_CREDENTIALS = {
  email: "sunny@rexity.ai",
  password: "Password",
}

// ============================================
// UTILITIES
// ============================================

const buildUrl = (baseUrl: string, params: KV[]): string => {
  try {
    const url = new URL(baseUrl)
    params.forEach(({ key, value }) => {
      if (key) url.searchParams.append(key, value)
    })
    return url.toString()
  } catch {
    return baseUrl
  }
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const generateCurl = (config: ApiConfig): string => {
  const url = buildUrl(config.baseUrl, config.params)
  let curl = `curl -X GET "${url}"`

  config.headers.forEach(({ key, value }) => {
    if (key) curl += ` \\\n  -H "${key}: ${value}"`
  })

  if (config.username && config.password) {
    curl += ` \\\n  -u "${config.username}:${config.password}"`
  }

  return curl
}

// ============================================
// COMPONENTS - LOGIN PAGE
// ============================================

const LoginPage: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem("auth_token", "admin_token_" + Date.now())
      onSuccess()
    } else {
      setError("Invalid credentials")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Marble effect background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:60px_60px]"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10 border border-gray-200">
        {/* Rexity Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-red-600 rounded-xl flex items-center justify-center font-bold text-white text-2xl shadow-lg">
            R
          </div>
          <div>
            <div className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
              REXITY
            </div>
            <div className="text-xs text-gray-500 font-medium">Admin Portal</div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Admin Login</h1>
        <p className="text-gray-600 text-sm mb-6 text-center">Access the configuration dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="sunny@rexity.ai"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <button
          onClick={() => router.push("/")}
          className="w-full mt-4 text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          ← Back to Home
        </button>

        <p className="text-xs text-gray-500 mt-6 p-3 bg-gray-50 rounded text-center">
          Default credentials: sunny@rexity.ai / Password
        </p>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTS - CONFIG FORM MODAL
// ============================================

const ConfigFormModal: React.FC<{
  panelId: string
  panel: DashboardPanel
  initialConfig?: ApiConfig
  onSave: (config: ApiConfig) => void
  onApply: () => void
  onClose: () => void
}> = ({ panelId, panel, initialConfig, onSave, onApply, onClose }) => {
  const [config, setConfig] = useState<ApiConfig>(
    initialConfig || {
      baseUrl: "",
      headers: [],
      params: [],
      method: "GET",
    },
  )

  const [showPassword, setShowPassword] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testError, setTestError] = useState("")
  const [copyFeedback, setCopyFeedback] = useState("")
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const handleBaseUrlChange = (value: string) => {
    setConfig({ ...config, baseUrl: value })
    setUnsavedChanges(true)
  }

  const handleAddHeader = () => {
    setConfig({
      ...config,
      headers: [...config.headers, { key: "", value: "" }],
    })
    setUnsavedChanges(true)
  }

  const handleRemoveHeader = (index: number) => {
    setConfig({
      ...config,
      headers: config.headers.filter((_, i) => i !== index),
    })
    setUnsavedChanges(true)
  }

  const handleHeaderChange = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...config.headers]
    newHeaders[index][field] = value
    setConfig({ ...config, headers: newHeaders })
    setUnsavedChanges(true)
  }

  const handleAddParam = () => {
    setConfig({
      ...config,
      params: [...config.params, { key: "", value: "" }],
    })
    setUnsavedChanges(true)
  }

  const handleRemoveParam = (index: number) => {
    setConfig({
      ...config,
      params: config.params.filter((_, i) => i !== index),
    })
    setUnsavedChanges(true)
  }

  const handleParamChange = (index: number, field: "key" | "value", value: string) => {
    const newParams = [...config.params]
    newParams[index][field] = value
    setConfig({ ...config, params: newParams })
    setUnsavedChanges(true)
  }

  const handleTestGet = async () => {
    setTestError("")
    setTestLoading(true)

    try {
      const url = buildUrl(config.baseUrl, config.params)

      if (!isValidUrl(url)) {
        setTestError("Invalid Base URL")
        setTestLoading(false)
        return
      }

      const headers: Record<string, string> = {}
      config.headers.forEach(({ key, value }) => {
        if (key) headers[key] = value
      })

      if (config.username && config.password) {
        headers["Authorization"] = "Basic " + btoa(`${config.username}:${config.password}`)
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      })

      const data = await response.json()
      setTestResult(data)
    } catch (error: any) {
      setTestError(error.message || "Failed to fetch. Check CORS and URL.")
    } finally {
      setTestLoading(false)
    }
  }

  const handleSave = () => {
    if (!config.baseUrl) {
      setTestError("Base URL is required")
      return
    }
    if (!isValidUrl(config.baseUrl)) {
      setTestError("Invalid Base URL format")
      return
    }
    onSave(config)
    setUnsavedChanges(false)
  }

  const handleCopyCurl = () => {
    const curl = generateCurl(config)
    navigator.clipboard.writeText(curl)
    setCopyFeedback("Copied to clipboard!")
    setTimeout(() => setCopyFeedback(""), 2000)
  }

  const handleReset = () => {
    setConfig({
      baseUrl: "",
      headers: [],
      params: [],
      method: "GET",
    })
    setTestResult(null)
    setUnsavedChanges(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-black text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Configure {panel.title} API</h2>
            <p className="text-gray-300 text-sm mt-1">Backend information for GET requests</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Base URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Base API URL *</label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              placeholder="https://api.example.com/v1/endpoint"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            {config.baseUrl && !isValidUrl(config.baseUrl) && (
              <p className="text-red-500 text-xs mt-1">Invalid URL format</p>
            )}
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Username</label>
              <input
                type="text"
                value={config.username || ""}
                onChange={(e) => {
                  setConfig({ ...config, username: e.target.value })
                  setUnsavedChanges(true)
                }}
                placeholder="Optional"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={config.password || ""}
                  onChange={(e) => {
                    setConfig({ ...config, password: e.target.value })
                    setUnsavedChanges(true)
                  }}
                  placeholder="Optional"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* HTTP Method (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">HTTP Method</label>
            <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">GET (Read-only)</div>
          </div>

          {/* Headers */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-900">Headers</label>
              <button
                onClick={handleAddHeader}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                <Plus size={16} /> Add Header
              </button>
            </div>
            <div className="space-y-2">
              {config.headers.map((header, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <input
                    type="text"
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="Header value"
                    value={header.value}
                    onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <button onClick={() => handleRemoveHeader(index)} className="text-red-500 hover:text-red-700 p-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Query Parameters */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-900">Query Parameters</label>
              <button
                onClick={handleAddParam}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                <Plus size={16} /> Add Parameter
              </button>
            </div>
            <div className="space-y-2">
              {config.params.map((param, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <input
                    type="text"
                    placeholder="Parameter name"
                    value={param.key}
                    onChange={(e) => handleParamChange(index, "key", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="Parameter value"
                    value={param.value}
                    onChange={(e) => handleParamChange(index, "value", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <button onClick={() => handleRemoveParam(index)} className="text-red-500 hover:text-red-700 p-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Test Response (Success)</h3>
              <pre className="bg-white p-3 rounded border border-green-100 text-xs overflow-auto max-h-40 text-gray-900">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          {testError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{testError}</span>
            </div>
          )}

          {copyFeedback && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <Check size={16} />
              {copyFeedback}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <button
              onClick={handleTestGet}
              disabled={!config.baseUrl || testLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition"
            >
              {testLoading ? "Testing..." : "Test GET"}
            </button>

            <button
              onClick={handleCopyCurl}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition"
            >
              <Copy size={16} /> Copy cURL
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition"
            >
              Reset
            </button>

            <div className="flex-1" />

            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
            >
              Save
            </button>

            <button
              onClick={() => {
                handleSave()
                setTimeout(onApply, 100)
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              Apply to Dashboard
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition"
            >
              Close
            </button>
          </div>

          {unsavedChanges && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              You have unsaved changes
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTS - CONFIG DASHBOARD
// ============================================

const ConfigDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const router = useRouter()
  const [configs, setConfigs] = useState<PanelConfigMap>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("rexity_api_configs")
      return stored ? JSON.parse(stored) : {}
    }
    return {}
  })
  const [selectedPanel, setSelectedPanel] = useState<DashboardPanel | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const persistConfigs = (newConfigs: PanelConfigMap) => {
    setConfigs(newConfigs)
    localStorage.setItem("rexity_api_configs", JSON.stringify(newConfigs))
  }

  const saveConfig = (panelId: string, config: ApiConfig) => {
    const updated = { ...configs, [panelId]: config }
    persistConfigs(updated)
  }

  const getConfig = (panelId: string) => {
    return configs[panelId]
  }

  const applyConfig = (panelId: string) => {
    const config = configs[panelId]
    if (config) {
      const updated = {
        ...configs,
        [panelId]: { ...config, isActive: true },
      }
      persistConfigs(updated)
    }
  }

  const applyAllConfigs = () => {
    const updated = Object.keys(configs).reduce(
      (acc, panelId) => {
        const config = configs[panelId]
        acc[panelId] = { ...config, isActive: true }
        return acc
      },
      { ...configs },
    )
    persistConfigs(updated)
  }

  const clearAllConfigs = () => {
    persistConfigs({})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Marble effect background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:60px_60px]"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              {/* Rexity Logo */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-red-600 rounded-xl flex items-center justify-center font-bold text-white text-2xl shadow-lg">
                  R
                </div>
                <div>
                  <div className="font-bold text-2xl bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">
                    REXITY
                  </div>
                  <div className="text-xs text-gray-400 font-medium">Admin Configuration</div>
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-white">API Configuration Dashboard</h1>
              <p className="text-gray-300">Configure backend API endpoints for all dashboard panels</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={applyAllConfigs}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition backdrop-blur-sm"
              >
                Apply All
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg font-semibold transition backdrop-blur-sm"
              >
                Clear All
              </button>

              <button
                onClick={onLogout}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold flex items-center gap-2 transition backdrop-blur-sm"
              >
                <LogOut size={18} /> Logout
              </button>

              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition backdrop-blur-sm"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Clear All Configurations?</h3>
            <p className="text-gray-600 mb-6">This will permanently delete all saved API configurations.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllConfigs()
                  setShowClearConfirm(false)
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Panels Grid */}
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DASHBOARD_PANELS.map((panel) => {
            const config = getConfig(panel.id)
            const hasConfig = !!config
            const isActive = config?.isActive

            return (
              <button
                key={panel.id}
                onClick={() => setSelectedPanel(panel)}
                className="bg-white/10 backdrop-blur-xl rounded-lg shadow-lg hover:shadow-2xl transition text-left p-6 border-2 border-white/20 hover:border-blue-400/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{panel.icon}</div>
                  {isActive && (
                    <span className="px-3 py-1 bg-green-500/80 text-white text-xs font-semibold rounded-full backdrop-blur-sm">
                      Active
                    </span>
                  )}
                  {hasConfig && !isActive && (
                    <span className="px-3 py-1 bg-yellow-500/80 text-white text-xs font-semibold rounded-full backdrop-blur-sm">
                      Saved
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Configure {panel.title}</h3>
                <p className="text-gray-300 text-sm mb-4">
                  {hasConfig ? `URL: ${config.baseUrl.substring(0, 40)}...` : "No API configured"}
                </p>
                <div className="flex items-center text-blue-400 font-semibold text-sm">
                  Edit Configuration <ChevronRight size={16} className="ml-1" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedPanel && (
        <ConfigFormModal
          panelId={selectedPanel.id}
          panel={selectedPanel}
          initialConfig={getConfig(selectedPanel.id)}
          onSave={(config) => saveConfig(selectedPanel.id, config)}
          onApply={() => applyConfig(selectedPanel.id)}
          onClose={() => setSelectedPanel(null)}
        />
      )}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("auth_token")
    if (stored) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem("auth_token")
  }

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => setIsAuthenticated(true)} />
  }

  return <ConfigDashboard onLogout={handleLogout} />
}
