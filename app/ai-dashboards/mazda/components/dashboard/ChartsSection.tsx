"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { format, parseISO, eachDayOfInterval, subDays } from "date-fns"
import { motion } from "framer-motion"

const PRIORITY_COLORS: Record<number, string> = { 1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#3b82f6" }
const STATUS_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"]

export default function ChartsSection({ notifications, isLoading }: { notifications: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const priorityData = [1, 2, 3, 4].map((p) => ({
    priority: `P${p}`,
    count: notifications.filter((n) => n.priority === p).length,
    fill: PRIORITY_COLORS[p],
  }))

  const plantCounts: Record<string, number> = {}
  notifications.forEach((n) => {
    if (n.plant) plantCounts[n.plant] = (plantCounts[n.plant] || 0) + 1
  })
  const plantData = Object.entries(plantCounts).map(([plant, count]) => ({ plant: `Plant ${plant}`, count }))

  const statusCounts: Record<string, number> = {}
  notifications.forEach((n) => {
    if (n.status) statusCounts[n.status] = (statusCounts[n.status] || 0) + 1
  })
  const statusData = Object.entries(statusCounts).map(([name, value], idx) => ({
    name,
    value,
    fill: STATUS_COLORS[idx % STATUS_COLORS.length],
  }))

  const now = new Date()
  const start = subDays(now, 14)
  const days = eachDayOfInterval({ start, end: now })
  const timelineData = days.map((d) => {
    const key = format(d, "yyyy-MM-dd")
    const count = notifications.filter(
      (n) => n.creationDate && format(parseISO(n.creationDate), "yyyy-MM-dd") === key,
    ).length
    return { date: format(d, "MMM dd"), count }
  })

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Plant Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={plantData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="plant" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">14-Day Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
