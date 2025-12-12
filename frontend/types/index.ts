export interface CDPPosition {
  id: string
  protocol: string
  collateralAmount: number
  collateralToken: string
  collateralValueUSD: number
  borrowedAmount: number
  borrowedToken: string
  borrowedValueUSD: number
  healthFactor: number
  liquidationPrice: number
  currentPrice: number
  apy: number
  timestamp: number
}

export interface Position {
  id: string
  protocol: string
  type: "CDP" | "LP" | "Staking" | "Wallet"
  totalValue: number
  totalValueUSD: number
  assets: {
    token: string
    amount: number
    valueUSD: number
  }[]
  apy?: number
  healthFactor?: number
}

export interface PortfolioAsset {
  id?: string
  protocol: string
  type: "CDP" | "LP" | "Staking" | "Wallet"
  assets: {
    token: string
    amount: number
    valueUSD: number
  }[]
  totalValue?: number
  totalValueUSD: number
  apy?: number
  healthFactor?: number
}

export interface PriceData {
  token: string
  price: number
  change24h: number
  timestamp: number
}

export interface AlertConfig {
  enabled: boolean
  healthFactorThreshold: number
  priceChangeThreshold: number
  email?: string
}
