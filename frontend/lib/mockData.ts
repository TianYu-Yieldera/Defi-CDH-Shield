import { CDPPosition, PortfolioAsset } from "@/types"

export const mockCDPPositions: CDPPosition[] = [
  {
    id: "1",
    protocol: "Moonwell",
    collateralAmount: 10.5,
    collateralToken: "ETH",
    collateralValueUSD: 30660,
    borrowedAmount: 15000,
    borrowedToken: "USDC",
    borrowedValueUSD: 15000,
    healthFactor: 1.68,
    liquidationPrice: 2200,
    currentPrice: 2920,
    apy: 3.5,
    timestamp: Date.now(),
  },
  {
    id: "2",
    protocol: "Compound",
    collateralAmount: 5.2,
    collateralToken: "cbETH",
    collateralValueUSD: 15184,
    borrowedAmount: 8000,
    borrowedToken: "USDC",
    borrowedValueUSD: 8000,
    healthFactor: 1.45,
    liquidationPrice: 2300,
    currentPrice: 2920,
    apy: 4.2,
    timestamp: Date.now(),
  },
]

export const mockPortfolioAssets: PortfolioAsset[] = [
  {
    protocol: "Moonwell",
    type: "CDP",
    assets: [
      { token: "ETH", amount: 10.5, valueUSD: 30660 },
      { token: "USDC", amount: -15000, valueUSD: -15000 },
    ],
    totalValueUSD: 15660,
    healthFactor: 1.68,
  },
  {
    protocol: "Aerodrome",
    type: "LP",
    assets: [
      { token: "ETH", amount: 3.5, valueUSD: 10220 },
      { token: "USDC", amount: 10000, valueUSD: 10000 },
    ],
    totalValueUSD: 20220,
    apy: 8.2,
  },
  {
    protocol: "Uniswap V3",
    type: "LP",
    assets: [
      { token: "cbETH", amount: 1.5, valueUSD: 4380 },
      { token: "WETH", amount: 1.8, valueUSD: 5256 },
    ],
    totalValueUSD: 9636,
    apy: 12.5,
  },
  {
    protocol: "BaseSwap",
    type: "Staking",
    assets: [{ token: "BSWAP", amount: 10000, valueUSD: 2000 }],
    totalValueUSD: 2000,
    apy: 25.0,
  },
  {
    protocol: "Wallet",
    type: "Wallet",
    assets: [
      { token: "ETH", amount: 0.12, valueUSD: 350.4 },
      { token: "USDC", amount: 500, valueUSD: 500 },
    ],
    totalValueUSD: 850.4,
  },
]

export function calculateTotalAssets(): number {
  return mockPortfolioAssets.reduce((sum, asset) => sum + asset.totalValueUSD, 0)
}

export function getAssetDistribution() {
  const total = calculateTotalAssets()
  return mockPortfolioAssets.map((asset) => ({
    protocol: asset.protocol,
    type: asset.type,
    value: asset.totalValueUSD,
    percentage: (asset.totalValueUSD / total) * 100,
  }))
}
