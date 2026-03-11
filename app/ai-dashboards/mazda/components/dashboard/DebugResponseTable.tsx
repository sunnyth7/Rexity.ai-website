"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Bug } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DebugResponseTable({ data }: { data: any }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const arr = Array.isArray(data) ? data : [data]
  const keys = Array.from(new Set(arr.flatMap((x: any) => (x && typeof x === "object" ? Object.keys(x) : []))))

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader
        className="cursor-pointer hover:bg-orange-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-lg text-orange-900">Debug: Raw Webhook Response</CardTitle>
            <Badge variant="secondary" className="bg-orange-200 text-orange-800">
              {arr.length} {arr.length === 1 ? "item" : "items"}
            </Badge>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-4">
          <details className="mb-4">
            <summary className="cursor-pointer text-sm font-medium text-orange-900 hover:text-orange-700 mb-2">
              View Raw JSON
            </summary>
            <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-100">
                    <TableHead className="font-bold text-orange-900 sticky top-0 bg-orange-100">#</TableHead>
                    {keys.map((k) => (
                      <TableHead
                        key={k}
                        className="font-bold text-orange-900 sticky top-0 bg-orange-100 whitespace-nowrap"
                      >
                        {k}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arr.map((it: any, i: number) => {
                    const cells = [
                      <TableCell key="row-num" className="font-medium">
                        {i + 1}
                      </TableCell>,
                      ...keys.map((k) => {
                        const v = it?.[k]
                        const display =
                          v === null
                            ? "null"
                            : v === undefined
                              ? "undefined"
                              : typeof v === "object"
                                ? JSON.stringify(v, null, 2)
                                : String(v)

                        return (
                          <TableCell
                            key={k}
                            className={cn(
                              "max-w-xs truncate text-sm",
                              k === "notificationId" && "font-mono font-bold text-blue-600",
                              (v === null || v === undefined) && "text-slate-400 italic",
                              typeof v === "object" && "whitespace-pre text-xs font-mono",
                            )}
                          >
                            {display}
                          </TableCell>
                        )
                      }),
                    ]

                    return (
                      <TableRow key={i} className="hover:bg-orange-50">
                        {cells}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
