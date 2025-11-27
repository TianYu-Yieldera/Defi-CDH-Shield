import { CDPPosition, PortfolioData, LendingPosition, WalletBalance } from '../types';

// Mock CDP Positions
export const mockCDPPositions: CDPPosition[] = [
  {
    id: 'cdp-1',
    protocol: 'moonwell',
    owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    collateral: {
      symbol: 'ETH',
      amount: '2.5',
      valueUSD: 8750,
    },
    debt: {
      symbol: 'USDC',
      amount: '5000',
      valueUSD: 5000,
    },
    healthFactor: 1.28,
    liquidationPrice: 2780,
    collateralRatio: 175,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    lastUpdated: Date.now(),
  },
  {
    id: 'cdp-2',
    protocol: 'moonwell',
    owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    collateral: {
      symbol: 'WETH',
      amount: '1.2',
      valueUSD: 4200,
    },
    debt: {
      symbol: 'USDC',
      amount: '1800',
      valueUSD: 1800,
    },
    healthFactor: 2.1,
    liquidationPrice: 2100,
    collateralRatio: 233,
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    lastUpdated: Date.now(),
  },
];

// Mock Lending Positions
export const mockLendingPositions: LendingPosition[] = [
  {
    id: 'lending-1',
    protocol: 'moonwell',
    symbol: 'USDC',
    amount: '3000',
    value: 3000,
    apy: 4.2,
  },
  {
    id: 'lending-2',
    protocol: 'moonwell',
    symbol: 'ETH',
    amount: '0.5',
    value: 1750,
    apy: 2.1,
  },
];

// Mock Wallet Balances
export const mockWalletBalances: WalletBalance[] = [
  {
    symbol: 'USDC',
    amount: '2340',
    value: 2340,
  },
  {
    symbol: 'ETH',
    amount: '0.15',
    value: 525,
  },
];

// Mock Market Data
export const mockMarketData = {
  ETH: {
    price: 3500,
    change24h: 2.5,
    volatility: 0.05,
  },
  USDC: {
    price: 1.0,
    change24h: 0.01,
    volatility: 0.001,
  },
  WETH: {
    price: 3500,
    change24h: 2.5,
    volatility: 0.05,
  },
};

// Mock Portfolio Data
export function getMockPortfolioData(userId: string): PortfolioData {
  const cdpPositions = mockCDPPositions;
  const lendingPositions = mockLendingPositions;
  const walletBalances = mockWalletBalances;

  const totalValue =
    cdpPositions.reduce((sum, p) => sum + p.collateral.valueUSD, 0) +
    lendingPositions.reduce((sum, p) => sum + p.value, 0) +
    walletBalances.reduce((sum, b) => sum + b.value, 0);

  const positions = [
    ...cdpPositions.map(p => ({
      id: p.id,
      type: 'cdp' as const,
      protocol: p.protocol,
      value: p.collateral.valueUSD,
    })),
    ...lendingPositions.map(p => ({
      id: p.id,
      type: 'lending' as const,
      protocol: p.protocol,
      value: p.value,
    })),
  ];

  return {
    userId,
    totalValue,
    positions,
    cdpPositions,
    lendingPositions,
    walletBalances,
    marketData: mockMarketData,
    hasComplexPositions: cdpPositions.length > 3,
  };
}

// Mock API delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API Functions
export const mockAPI = {
  async getPortfolio(userId: string): Promise<PortfolioData> {
    await delay(500);
    return getMockPortfolioData(userId);
  },

  async getCDPPositions(userId: string): Promise<CDPPosition[]> {
    await delay(300);
    return mockCDPPositions;
  },

  async getLendingPositions(userId: string): Promise<LendingPosition[]> {
    await delay(300);
    return mockLendingPositions;
  },
};
