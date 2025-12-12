"use client"

import { Header } from "@/components/Header"
import { AssetCard } from "@/components/portfolio/AssetCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatUSD, formatNumber } from "@/lib/utils"
import { useAccount } from "wagmi"
import { usePortfolio } from "@/hooks/usePortfolio"
import { usePortfolioStore } from "@/store/portfolioStore"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]

export default function PortfolioPage() {
  const { isConnected } = useAccount()
  const { assets, isLoading, error, refetch } = usePortfolio()
  const {
    assets: storeAssets,
    totalValue,
    protocolDistribution,
    assetTypeDistribution,
  } = usePortfolioStore()

  // Use store assets if available, fallback to query assets
  const displayAssets = storeAssets.length > 0 ? storeAssets : assets

  // Transform for chart
  const chartData = protocolDistribution.map((item) => ({
    name: item.protocol,
    value: item.value,
    percentage: item.percentage,
  }))

  const change24h = 1250
  const changePercent = totalValue > 0 ? (change24h / totalValue) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <p className="text-muted-foreground">
              Connect your wallet to view your portfolio
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
                <p className="text-muted-foreground">
                  Your complete asset overview across BASE protocols
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 dark:text-red-200">
                      Error Loading Portfolio
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-300">
                      {(error as Error).message || 'Failed to load portfolio assets'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="border-red-300 hover:bg-red-50"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {isLoading && displayAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading your portfolio...</p>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Assets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        <div className="h-12 w-48 bg-secondary/50 animate-pulse rounded" />
                        <div className="h-6 w-32 bg-secondary/50 animate-pulse rounded" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-4xl font-bold">{formatUSD(totalValue)}</p>
                        <p
                          className={`text-sm ${
                            changePercent >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {changePercent >= 0 ? "+" : ""}
                          {formatUSD(change24h)} ({formatNumber(changePercent, 2)}%)
                          24h
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribution by Protocol</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {chartData.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          No data available
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ percentage }) =>
                                `${formatNumber(percentage, 1)}%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => formatUSD(value)}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribution by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {assetTypeDistribution.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          No data available
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {assetTypeDistribution.map((item, index) => (
                            <div key={item.type} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium capitalize">{item.type}</span>
                                <span className="text-muted-foreground">
                                  {formatUSD(item.value)} ({formatNumber(item.percentage, 1)}
                                  %)
                                </span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${item.percentage}%`,
                                    backgroundColor: COLORS[index % COLORS.length],
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Your Assets</h2>
                  {displayAssets.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No assets found. Your portfolio will appear here once you add assets.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {displayAssets.map((asset, index) => (
                        <AssetCard key={asset.id || `${asset.protocol}-${index}`} asset={asset} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
