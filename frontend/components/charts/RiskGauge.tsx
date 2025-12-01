"use client"

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface RiskGaugeProps {
  healthFactor: number;
  title?: string;
}

export function RiskGauge({ healthFactor, title = 'Risk Level' }: RiskGaugeProps) {
  const { percentage, color, label, bgColor } = useMemo(() => {
    // Cap health factor at 3 for visualization (100%)
    const cappedHF = Math.min(healthFactor, 3);
    const percentage = (cappedHF / 3) * 100;

    let color = '#10b981'; // green
    let label = 'Safe';
    let bgColor = 'bg-emerald-500';

    if (healthFactor < 1.2) {
      color = '#ef4444'; // red
      label = 'Critical';
      bgColor = 'bg-red-500';
    } else if (healthFactor < 1.5) {
      color = '#f59e0b'; // orange
      label = 'Warning';
      bgColor = 'bg-orange-500';
    } else if (healthFactor < 2.0) {
      color = '#eab308'; // yellow
      label = 'Moderate';
      bgColor = 'bg-yellow-500';
    }

    return { percentage, color, label, bgColor };
  }, [healthFactor]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        {/* Circular gauge */}
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
              opacity="0.2"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 2.51327} 251.327`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold" style={{ color }}>
              {formatNumber(healthFactor, 2)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Health Factor</div>
          </div>
        </div>

        {/* Label */}
        <div className="mt-6 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${bgColor}`} />
          <span className="text-lg font-semibold" style={{ color }}>
            {label}
          </span>
        </div>

        {/* Risk scale */}
        <div className="mt-6 w-full">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Critical</span>
            <span>Warning</span>
            <span>Safe</span>
          </div>
          <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>&lt;1.2</span>
            <span>1.5</span>
            <span>&gt;2.0</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
