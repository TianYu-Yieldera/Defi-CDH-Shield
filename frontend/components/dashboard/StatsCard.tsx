"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon, Loader2 } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative"
  icon: LucideIcon
  isLoading?: boolean
}

export function StatsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  isLoading = false,
}: StatsCardProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className="p-2 rounded-full bg-secondary/50">
           {isLoading ? (
             <Loader2 className="h-4 w-4 text-primary animate-spin" />
           ) : (
             <Icon className="h-4 w-4 text-primary" />
           )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-secondary/50 animate-pulse rounded" />
            <div className="h-4 w-32 bg-secondary/50 animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight text-number">{value}</div>
            {change && (
              <p
                className={`text-xs font-medium mt-1 ${
                  changeType === "positive" ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {change}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}