"use client"

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUSD } from '@/lib/utils';

interface CollateralDebtDataPoint {
  timestamp: number;
  collateralValue: number;
  debtValue: number;
}

interface CollateralDebtChartProps {
  data: CollateralDebtDataPoint[];
  title?: string;
}

export function CollateralDebtChart({
  data,
  title = 'Collateral vs Debt',
}: CollateralDebtChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      time: new Date(point.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      timestamp: point.timestamp,
      collateral: point.collateralValue,
      debt: point.debtValue,
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No historical data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCollateral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
              <XAxis
                dataKey="time"
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number, name: string) => [
                  formatUSD(value),
                  name === 'collateral' ? 'Collateral' : 'Debt',
                ]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="collateral"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorCollateral)"
                strokeWidth={2}
                name="Collateral"
              />
              <Area
                type="monotone"
                dataKey="debt"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorDebt)"
                strokeWidth={2}
                name="Debt"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
