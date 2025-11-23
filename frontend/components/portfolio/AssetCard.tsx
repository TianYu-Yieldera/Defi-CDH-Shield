"use client"

import { PortfolioAsset } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatUSD, formatNumber } from "@/lib/utils"
import { TrendingUp, DollarSign, Droplet, Lock } from "lucide-react"

interface AssetCardProps {
  asset: PortfolioAsset
}

const typeIcons = {
  CDP: DollarSign,
  LP: Droplet,
  Staking: Lock,
  Wallet: TrendingUp,
}

const typeColors = {
  CDP: "text-blue-500",
  LP: "text-green-500",
  Staking: "text-purple-500",
  Wallet: "text-orange-500",
}

export function AssetCard({ asset }: AssetCardProps) {
  const Icon = typeIcons[asset.type]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {asset.protocol}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${typeColors[asset.type]}`} />
            <span className="text-sm text-muted-foreground">{asset.type}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Total Value</p>
          <p className="text-2xl font-bold">
            {formatUSD(asset.totalValueUSD)}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Assets</p>
          {asset.assets.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-muted-foreground">{item.token}</span>
              <div className="text-right">
                <p className="font-medium">
                  {item.amount >= 0 ? "+" : ""}
                  {formatNumber(item.amount, 4)}
                </p>
                <p
                  className={`text-xs ${
                    item.valueUSD >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {formatUSD(Math.abs(item.valueUSD))}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 space-y-2 border-t">
          {asset.apy !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">APY</span>
              <span className="text-sm font-medium text-green-500">
                {formatNumber(asset.apy, 2)}%
              </span>
            </div>
          )}
          {asset.healthFactor !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Health Factor
              </span>
              <span
                className={`text-sm font-medium ${
                  asset.healthFactor >= 2.0
                    ? "text-green-500"
                    : asset.healthFactor >= 1.5
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {formatNumber(asset.healthFactor, 2)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
