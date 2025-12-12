// CDP Position Types
export interface CDPPosition {
  id: string;
  protocol: 'moonwell' | 'aave' | 'compound';
  owner: string;
  collateral: {
    symbol: string;
    amount: string;
    valueUSD: number;
  };
  debt: {
    symbol: string;
    amount: string;
    valueUSD: number;
  };
  healthFactor: number;
  liquidationPrice: number;
  collateralRatio: number;
  createdAt: number;
  lastUpdated: number;
}

// Portfolio Data
export interface PortfolioData {
  userId: string;
  totalValue: number;
  positions: Position[];
  cdpPositions: CDPPosition[];
  lendingPositions: LendingPosition[];
  walletBalances: WalletBalance[];
  marketData: MarketData;
  hasComplexPositions: boolean;
}

export interface Position {
  id: string;
  type: 'cdp' | 'lending' | 'liquidity';
  protocol: string;
  value: number;
}

export interface LendingPosition {
  id: string;
  protocol: string;
  symbol: string;
  amount: string;
  value: number;
  apy: number;
}

export interface WalletBalance {
  symbol: string;
  amount: string;
  value: number;
}

export interface MarketData {
  [token: string]: {
    price: number;
    change24h: number;
    volatility: number;
  };
}

// AI Analysis Types
export interface AnalysisResponse {
  healthScore: HealthScore;
  recommendations: Recommendation[];
  insights: Insights;
  metadata: Metadata;
}

export interface HealthScore {
  overall: number; // 0-100
  breakdown: {
    risk: number;
    efficiency: number;
    diversification: number;
  };
  level: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface Recommendation {
  id: string;
  priority: 'urgent' | 'opportunity' | 'insight';
  title: string;
  description: string;
  impact: {
    type: 'risk_reduction' | 'yield_increase' | 'efficiency';
    value: string;
  };
  action?: {
    label: string;
    link: string;
    params?: any;
  };
}

export interface Insights {
  totalValue: number;
  positionCount: number;
  protocolCount: number;
  compared: {
    percentile: number;
    message: string;
  };
}

export interface Metadata {
  analyzedAt: string;
  cachedUntil: string;
  model: 'mock' | 'rule-based';
  provider: 'mock' | 'local';
}
