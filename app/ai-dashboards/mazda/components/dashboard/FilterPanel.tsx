"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Search, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"

type Props = {
  searchQuery: string
  onSearchChange: (value: string) => void
  timeRange: string
  onTimeRangeChange: (value: string) => void
  customStart: string
  onCustomStartChange: (value: string) => void
  customEnd: string
  onCustomEndChange: (value: string) => void
}

export default function FilterPanel({
  searchQuery,
  onSearchChange,
  timeRange,
  onTimeRangeChange,
  customStart,
  onCustomStartChange,
  customEnd,
  onCustomEndChange,
}: Props) {
  const [isSelectingStart, setIsSelectingStart] = useState(true)
  const [open, setOpen] = useState(false)

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Search is already reactive, but we can trigger a blur to ensure it's applied
      e.currentTarget.blur()
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    const dateStr = format(date, "yyyy-MM-dd")

    if (isSelectingStart) {
      onCustomStartChange(dateStr)
      setIsSelectingStart(false)
    } else {
      onCustomEndChange(dateStr)
      setOpen(false)
      setIsSelectingStart(true)
    }
  }

  const dateRangeText =
    customStart && customEnd
      ? `${format(new Date(customStart), "dd.MM.yyyy")} - ${format(new Date(customEnd), "dd.MM.yyyy")}`
      : "Select date range"

  return (
    <Card className="border shadow-lg">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Time range (single select)</label>
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="3">Last 3 days</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="15">Last 15 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Custom Date Range</label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-transparent"
                  disabled={timeRange !== "custom"}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {timeRange === "custom" ? dateRangeText : "Select date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">{isSelectingStart ? "Select start date" : "Select end date"}</p>
                </div>
                <Calendar mode="single" selected={undefined} onSelect={handleDateSelect} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="ID, text, plant, equipment..."
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
