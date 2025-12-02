"use client"

import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCDPStore } from '@/store/cdpStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { HealthFactorChart } from '@/components/charts/HealthFactorChart';
import { CollateralDebtChart } from '@/components/charts/CollateralDebtChart';
import { RiskGauge } from '@/components/charts/RiskGauge';
import { PositionActions } from '@/components/position/PositionActions';
import { formatUSD, formatNumber } from '@/lib/utils';
import { ArrowLeft, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PositionDetailPage() {
  const params = useParams();
  const positionId = params?.id as string;

  const position = useCDPStore((state) =>
    state.positions.find((p) => p.id === positionId)
  );

  const { isConnected: wsConnected } = useWebSocket();

  // Mock historical data - in production, this would come from an API
  const [historicalData, setHistoricalData] = useState(() => {
    const now = Date.now();
    return Array.from({ length: 24 }, (_, i) => ({
      timestamp: now - (23 - i) * 60 * 60 * 1000,
      healthFactor: 1.68 + (Math.random() - 0.5) * 0.3,
      collateralValue: 5000 + (Math.random() - 0.5) * 500,
      debtValue: 2800 + (Math.random() - 0.5) * 200,
    }));
  });

  useEffect(() => {
    // Simulate real-time updates
    if (wsConnected && position) {
      const interval = setInterval(() => {
        setHistoricalData((prev) => [
          ...prev.slice(1),
          {
            timestamp: Date.now(),
            healthFactor: position.healthFactor + (Math.random() - 0.5) * 0.1,
            collateralValue: position.collateralValueUSD,
            debtValue: position.borrowedValueUSD,
          },
        ]);
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [wsConnected, position]);

  if (!position) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Position Not Found</h1>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const utilizationRate = (position.borrowedValueUSD / position.collateralValueUSD) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{position.protocol} Position</h1>
                <p className="text-muted-foreground">
                  {position.collateralToken} / {position.borrowedToken}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {wsConnected && (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span>Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Collateral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(position.collateralAmount, 4)} {position.collateralToken}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatUSD(position.collateralValueUSD)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Debt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(position.borrowedAmount, 2)} {position.borrowedToken}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatUSD(position.borrowedValueUSD)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(utilizationRate, 1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Collateral usage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Liquidation Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {formatUSD(position.liquidationPrice)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {formatUSD(position.currentPrice)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 md:grid-cols-2">
            <RiskGauge healthFactor={position.healthFactor} />
            <HealthFactorChart data={historicalData} />
          </div>

          {/* Charts Row 2 */}
          <CollateralDebtChart data={historicalData} />

          {/* Actions */}
          <PositionActions position={position} />

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Position Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Protocol
                  </p>
                  <p className="text-lg font-semibold">{position.protocol}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Position ID
                  </p>
                  <p className="text-sm font-mono">{position.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Collateral Asset
                  </p>
                  <p className="text-lg font-semibold">{position.collateralToken}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Debt Asset
                  </p>
                  <p className="text-lg font-semibold">{position.borrowedToken}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Current Price
                  </p>
                  <p className="text-lg font-semibold">{formatUSD(position.currentPrice)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Health Factor
                  </p>
                  <p className={`text-lg font-semibold ${
                    position.healthFactor < 1.5 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {formatNumber(position.healthFactor, 2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
