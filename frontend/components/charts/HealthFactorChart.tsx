"use client"

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface HealthFactorDataPoint {
  timestamp: number;
  healthFactor: number;
}

interface HealthFactorChartProps {
  data: HealthFactorDataPoint[];
  title?: string;
}

export function HealthFactorChart({ data, title = 'Health Factor History' }: HealthFactorChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      time: new Date(point.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
      }),
      timestamp: point.timestamp,
      healthFactor: point.healthFactor,
    }));
  }, [data]);

  const minHealthFactor = useMemo(() => {
    return Math.min(...data.map(d => d.healthFactor));
  }, [data]);

  const maxHealthFactor = useMemo(() => {
    return Math.max(...data.map(d => d.healthFactor));
  }, [data]);

  const getLineColor = () => {
    if (minHealthFactor < 1.2) return '#ef4444'; // red
    if (minHealthFactor < 1.5) return '#f59e0b'; // orange
    return '#10b981'; // green
  };

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
            <LineChart data={chartData}>
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
                domain={[0, Math.max(maxHealthFactor * 1.1, 3)]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number) => [formatNumber(value, 2), 'Health Factor']}
              />
              {/* Liquidation threshold line */}
              <ReferenceLine
                y={1.0}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: 'Liquidation', position: 'insideTopRight', fill: '#ef4444' }}
              />
              {/* Warning threshold line */}
              <ReferenceLine
                y={1.5}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{ value: 'Warning', position: 'insideTopRight', fill: '#f59e0b' }}
              />
              {/* Safe threshold line */}
              <ReferenceLine
                y={2.0}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{ value: 'Safe', position: 'insideTopRight', fill: '#10b981' }}
              />
              <Line
                type="monotone"
                dataKey="healthFactor"
                stroke={getLineColor()}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
