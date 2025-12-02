"use client"

import { Header } from "@/components/Header"
import { CDPCard } from "@/components/dashboard/CDPCard"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { formatUSD, formatNumber } from "@/lib/utils"
import {
  Wallet,
  TrendingUp,
  Shield,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { useAccount } from "wagmi"
import { useCDPPositions } from "@/hooks/useCDPPositions"
import { useCDPStore } from "@/store/cdpStore"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { isConnected } = useAccount()
  const { positions, isLoading, error, refetch } = useCDPPositions()
  const storePositions = useCDPStore((state) => state.positions)

  // Use store positions if available, fallback to query positions
  const displayPositions = storePositions.length > 0 ? storePositions : positions

  const totalCollateral = displayPositions.reduce(
    (sum, pos) => sum + pos.collateralValueUSD,
    0
  )
  const totalBorrowed = displayPositions.reduce(
    (sum, pos) => sum + pos.borrowedValueUSD,
    0
  )
  const avgHealthFactor = displayPositions.length > 0
    ? displayPositions.reduce((sum, pos) => sum + pos.healthFactor, 0) /
      displayPositions.length
    : 0

  const atRiskPositions = displayPositions.filter(
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                  Monitor your CDP positions and manage risk
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
                      Error Loading Positions
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-300">
                      {(error as Error).message || 'Failed to load CDP positions'}
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

            {isLoading && displayPositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading your positions...</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatsCard
                    title="Total Collateral"
                    value={formatUSD(totalCollateral)}
                    change="+$1,250 (2.4%)"
                    changeType="positive"
                    icon={Wallet}
                    isLoading={isLoading}
                  />
                  <StatsCard
                    title="Total Borrowed"
                    value={formatUSD(totalBorrowed)}
                    change="+$500 (1.2%)"
                    changeType="positive"
                    icon={TrendingUp}
                    isLoading={isLoading}
                  />
                  <StatsCard
                    title="Avg Health Factor"
                    value={displayPositions.length > 0 ? formatNumber(avgHealthFactor, 2) : 'N/A'}
                    change={avgHealthFactor >= 1.5 ? "Safe" : "Warning"}
                    changeType={avgHealthFactor >= 1.5 ? "positive" : "negative"}
                    icon={Shield}
                    isLoading={isLoading}
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
                    isLoading={isLoading}
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Your CDP Positions</h2>
                  {displayPositions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No CDP positions found. Your positions will appear here once you create them.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {displayPositions.map((position) => (
                        <CDPCard key={position.id} position={position} />
                      ))}
                    </div>
                  )}
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
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
