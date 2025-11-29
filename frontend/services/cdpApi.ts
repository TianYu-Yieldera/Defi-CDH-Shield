import type { CDPPosition } from '@/types';
import { mockCDPPositions } from '@/lib/mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

interface HealthFactorParams {
  collateralAmount: number;
  debtAmount: number;
  collateralToken: string;
  debtToken: string;
}

interface LiquidationPriceParams {
  positionId: string;
}

interface HistoricalDataPoint {
  timestamp: number;
  healthFactor: number;
  collateralValue: number;
  debtValue: number;
}

interface HistoricalDataParams {
  positionId: string;
  range: '24h' | '7d' | '30d';
}

export const cdpApi = {
  async getPositions(address: string): Promise<CDPPosition[]> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockCDPPositions;
    }

    const response = await fetch(`${API_BASE}/positions/${address}`);
    if (!response.ok) {
      throw new Error('Failed to fetch CDP positions');
    }
    return response.json();
  },

  async calculateHealthFactor(params: HealthFactorParams): Promise<number> {
    const { collateralAmount, debtAmount, collateralToken, debtToken } = params;

    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const collateralPrice = collateralToken === 'ETH' ? 2920 : 1;
      const debtPrice = debtToken === 'USDC' ? 1 : 2920;
      const liquidationThreshold = 0.8;

      const collateralValue = collateralAmount * collateralPrice;
      const debtValue = debtAmount * debtPrice;

      if (debtValue === 0) return Infinity;

      return (collateralValue * liquidationThreshold) / debtValue;
    }

    const response = await fetch(`${API_BASE}/health-factor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate health factor');
    }

    const data = await response.json();
    return data.healthFactor;
  },

  async getLiquidationPrice(params: LiquidationPriceParams): Promise<number> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const position = mockCDPPositions.find((p) => p.id === params.positionId);
      return position?.liquidationPrice || 2200;
    }

    const response = await fetch(
      `${API_BASE}/liquidation-price/${params.positionId}`
    );

    if (!response.ok) {
      throw new Error('Failed to get liquidation price');
    }

    const data = await response.json();
    return data.liquidationPrice;
  },

  async getHistoricalData(
    params: HistoricalDataParams
  ): Promise<HistoricalDataPoint[]> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const now = Date.now();
      const ranges = {
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
      };

      const hours = ranges[params.range];
      const points: HistoricalDataPoint[] = [];

      for (let i = hours; i >= 0; i--) {
        const timestamp = now - i * 60 * 60 * 1000;
        const baseHF = 1.68;
        const variance = 0.15;
        const healthFactor = baseHF + (Math.random() - 0.5) * variance;

        points.push({
          timestamp,
          healthFactor,
          collateralValue: 5000 + (Math.random() - 0.5) * 500,
          debtValue: 2800 + (Math.random() - 0.5) * 200,
        });
      }

      return points;
    }

    const response = await fetch(
      `${API_BASE}/historical/${params.positionId}?range=${params.range}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }

    return response.json();
  },

  async getPosition(positionId: string): Promise<CDPPosition> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const position = mockCDPPositions.find((p) => p.id === positionId);
      if (!position) {
        throw new Error('Position not found');
      }
      return position;
    }

    const response = await fetch(`${API_BASE}/position/${positionId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch position');
    }

    return response.json();
  },
};
