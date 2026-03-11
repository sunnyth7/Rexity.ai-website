"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, AlertCircle, AlertTriangle, Clock } from "lucide-react"
import { motion } from "framer-motion"

type KPIMetrics = {
  total: number
  outstanding: number
  highPriority: number
  critical: number
}

type Props = {
  metrics: KPIMetrics
  activeFilter: string | null
  onFilterClick: (filter: string) => void
  isLoading: boolean
}

export default function KPICards({ metrics, activeFilter, onFilterClick, isLoading }: Props) {
  const kpis = [
    {
      id: "total",
      title: "Notifications",
      value: metrics.total,
      icon: FileText,
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      id: "outstanding",
      title: "Outstanding",
      value: metrics.outstanding,
      icon: Clock,
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
    },
    {
      id: "high-priority",
      title: "High Priority",
      value: metrics.highPriority,
      icon: AlertTriangle,
      gradient: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200",
    },
    {
      id: "critical",
      title: "Critical Alerts",
      value: metrics.critical,
      icon: AlertCircle,
      gradient: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-xl mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, i) => {
        const isActive = activeFilter === kpi.id
        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className={`relative overflow-hidden border-2 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                isActive ? `${kpi.borderColor} ring-2 ring-offset-2` : "border-transparent"
              }`}
              onClick={() => onFilterClick(kpi.id)}
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${kpi.gradient} opacity-10 rounded-full transform translate-x-8 -translate-y-8`}
              />
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${kpi.bgColor}`}>
                    <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
                  </div>
                  {isActive && (
                    <div className="px-2 py-1 rounded-full bg-slate-900 text-white text-xs font-medium">Active</div>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">{kpi.title}</p>
                <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
