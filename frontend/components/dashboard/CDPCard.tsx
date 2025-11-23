"use client"

import { CDPPosition } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatUSD, formatNumber, getRiskLevel } from "@/lib/utils"
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react"

interface CDPCardProps {
  position: CDPPosition
}

export function CDPCard({ position }: CDPCardProps) {
  const risk = getRiskLevel(position.healthFactor)
  const priceDiff = position.currentPrice - position.liquidationPrice
  const priceChangePercent = (priceDiff / position.liquidationPrice) * 100

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {position.protocol}
          </CardTitle>
          <span
            className={`text-sm font-medium px-2 py-1 rounded ${
              risk.level === "safe"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : risk.level === "warning"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : risk.level === "danger"
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {risk.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Collateral</p>
            <p className="text-lg font-semibold">
              {formatNumber(position.collateralAmount, 2)}{" "}
              {position.collateralToken}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatUSD(position.collateralValueUSD)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Borrowed</p>
            <p className="text-lg font-semibold">
              {formatNumber(position.borrowedAmount, 2)}{" "}
              {position.borrowedToken}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatUSD(position.borrowedValueUSD)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Health Factor</span>
            <span className={`text-lg font-bold ${risk.color}`}>
              {formatNumber(position.healthFactor, 2)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="text-sm font-medium">
              {formatUSD(position.currentPrice)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Liquidation Price
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-red-500">
                {formatUSD(position.liquidationPrice)}
              </span>
              {priceChangePercent > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">APY</span>
            <span className="text-sm font-medium text-green-500">
              {formatNumber(position.apy, 2)}%
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" size="sm">
            Reduce Leverage
          </Button>
          <Button variant="destructive" className="flex-1" size="sm">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Emergency Close
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
