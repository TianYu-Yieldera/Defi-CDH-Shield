"use client"

import { Header } from "@/components/Header"
import { AssetCard } from "@/components/portfolio/AssetCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  mockPortfolioAssets,
  calculateTotalAssets,
  getAssetDistribution,
} from "@/lib/mockData"
import { formatUSD, formatNumber } from "@/lib/utils"
import { useAccount } from "wagmi"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]

export default function PortfolioPage() {
  const { isConnected } = useAccount()
  const totalAssets = calculateTotalAssets()
  const distribution = getAssetDistribution()

  const typeDistribution = mockPortfolioAssets.reduce((acc, asset) => {
    const existing = acc.find((item) => item.name === asset.type)
    if (existing) {
      existing.value += asset.totalValueUSD
    } else {
      acc.push({ name: asset.type, value: asset.totalValueUSD })
    }
    return acc
  }, [] as { name: string; value: number }[])

  const change24h = 1250
  const changePercent = (change24h / totalAssets) * 100

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
            <div>
              <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
              <p className="text-muted-foreground">
                Your complete asset overview across BASE protocols
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-4xl font-bold">{formatUSD(totalAssets)}</p>
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
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribution by Protocol</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={distribution}
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
                        {distribution.map((entry, index) => (
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribution by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {typeDistribution.map((item, index) => {
                      const percentage = (item.value / totalAssets) * 100
                      return (
                        <div key={item.name} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground">
                              {formatUSD(item.value)} ({formatNumber(percentage, 1)}
                              %)
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Your Assets</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockPortfolioAssets.map((asset, index) => (
                  <AssetCard key={index} asset={asset} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
