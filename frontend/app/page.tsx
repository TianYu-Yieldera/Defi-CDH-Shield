"use client"

import { Header } from "@/components/Header"
import { CDPCard } from "@/components/dashboard/CDPCard"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { mockCDPPositions } from "@/lib/mockData"
import { formatUSD, formatNumber } from "@/lib/utils"
import {
  Wallet,
  TrendingUp,
  Shield,
  AlertTriangle,
} from "lucide-react"
import { useAccount } from "wagmi"

export default function Home() {
  const { isConnected } = useAccount()

  const totalCollateral = mockCDPPositions.reduce(
    (sum, pos) => sum + pos.collateralValueUSD,
    0
  )
  const totalBorrowed = mockCDPPositions.reduce(
    (sum, pos) => sum + pos.borrowedValueUSD,
    0
  )
  const avgHealthFactor =
    mockCDPPositions.reduce((sum, pos) => sum + pos.healthFactor, 0) /
    mockCDPPositions.length

  const atRiskPositions = mockCDPPositions.filter(
    (pos) => pos.healthFactor < 1.5
  ).length

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Shield className="h-20 w-20 text-muted-foreground mb-4" />
            <h1 className="text-4xl font-bold mb-2">Welcome to CDP Shield</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Monitor and protect your DeFi positions on BASE
            </p>
            <p className="text-muted-foreground">
              Connect your wallet to get started
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor your CDP positions and manage risk
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Collateral"
                value={formatUSD(totalCollateral)}
                change="+$1,250 (2.4%)"
                changeType="positive"
                icon={Wallet}
              />
              <StatsCard
                title="Total Borrowed"
                value={formatUSD(totalBorrowed)}
                change="+$500 (1.2%)"
                changeType="positive"
                icon={TrendingUp}
              />
              <StatsCard
                title="Avg Health Factor"
                value={formatNumber(avgHealthFactor, 2)}
                change={avgHealthFactor >= 1.5 ? "Safe" : "Warning"}
                changeType={avgHealthFactor >= 1.5 ? "positive" : "negative"}
                icon={Shield}
              />
              <StatsCard
                title="At Risk"
                value={atRiskPositions.toString()}
                change={
                  atRiskPositions > 0
                    ? "Attention needed"
                    : "All positions safe"
                }
                changeType={atRiskPositions > 0 ? "negative" : "positive"}
                icon={AlertTriangle}
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Your CDP Positions</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {mockCDPPositions.map((position) => (
                  <CDPCard key={position.id} position={position} />
                ))}
              </div>
            </div>

            {atRiskPositions > 0 && (
              <div className="bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900 dark:text-orange-200">
                      Risk Alert
                    </h3>
                    <p className="text-sm text-orange-800 dark:text-orange-300">
                      You have {atRiskPositions} position(s) at risk of
                      liquidation. Consider reducing leverage or adding more
                      collateral.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
