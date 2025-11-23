"use client"

import { CDPPosition } from "@/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatUSD, formatNumber, getRiskLevel } from "@/lib/utils"
import { AlertTriangle, ArrowUpRight, ShieldCheck, ShieldAlert, Activity } from "lucide-react"

interface CDPCardProps {
  position: CDPPosition
}

export function CDPCard({ position }: CDPCardProps) {
  const risk = getRiskLevel(position.healthFactor)
  
  // Calculate progress percentage for health bar (capped at 100%)
  // Assuming HF 3.0 is "full" safety for visualization
  const healthPercent = Math.min((position.healthFactor / 3.0) * 100, 100)
  
  // Dynamic color for the progress bar based on risk
  const getProgressColor = () => {
    switch (risk.level) {
      case "safe": return "bg-emerald-500"
      case "warning": return "bg-yellow-500"
      case "danger": return "bg-orange-500"
      case "critical": return "bg-red-500"
      default: return "bg-primary"
    }
  }

  return (
    <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold tracking-tight text-lg">{position.protocol}</h3>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {position.collateralToken} / {position.borrowedToken}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 
          ${risk.level === 'safe' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
            risk.level === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
            risk.level === 'danger' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
            'bg-red-500/10 border-red-500/20 text-red-500'}`}>
           {risk.level === 'safe' ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
           {risk.label}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collateral</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-number">{formatNumber(position.collateralAmount, 2)}</span>
              <span className="text-sm font-medium text-muted-foreground">{position.collateralToken}</span>
            </div>
            <p className="text-xs text-muted-foreground text-number">{formatUSD(position.collateralValueUSD)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Debt</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-number text-foreground">{formatNumber(position.borrowedAmount, 2)}</span>
              <span className="text-sm font-medium text-muted-foreground">{position.borrowedToken}</span>
            </div>
            <p className="text-xs text-muted-foreground text-number">{formatUSD(position.borrowedValueUSD)}</p>
          </div>
        </div>

        {/* Health Factor Visualization */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Health Factor</span>
            <span className={`text-xl font-bold text-number ${
              risk.level === 'safe' ? 'text-emerald-500' : 
              risk.level === 'warning' ? 'text-yellow-500' : 
              'text-red-500'
            }`}>
              {formatNumber(position.healthFactor, 2)}
            </span>
          </div>
          <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
            <div 
              className={`h-full transition-all duration-500 ease-out ${getProgressColor()}`} 
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            <span>Liquidation: 1.0</span>
            <span>Safe: &gt;2.0</span>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
           <div>
             <span className="text-xs text-muted-foreground block mb-1">Liq. Price</span>
             <span className="font-mono text-sm font-semibold text-red-500/90">
               {formatUSD(position.liquidationPrice)}
             </span>
           </div>
           <div className="text-right">
             <span className="text-xs text-muted-foreground block mb-1">Current Price</span>
             <span className="font-mono text-sm font-semibold">
               {formatUSD(position.currentPrice)}
             </span>
           </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Manage
          </Button>
          <Button variant="destructive" className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}