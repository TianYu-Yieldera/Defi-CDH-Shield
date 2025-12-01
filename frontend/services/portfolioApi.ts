import type { Position } from '@/types';
import { mockPortfolioAssets } from '@/lib/mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

export const portfolioApi = {
  async getAssets(address: string): Promise<Position[]> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockPortfolioAssets;
    }

    const response = await fetch(`${API_BASE}/portfolio/${address}`);
    if (!response.ok) {
      throw new Error('Failed to fetch portfolio assets');
    }
    return response.json();
  },

  async getAsset(assetId: string): Promise<Position> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const asset = mockPortfolioAssets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error('Asset not found');
      }
      return asset;
    }

    const response = await fetch(`${API_BASE}/portfolio/asset/${assetId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch asset');
    }

    return response.json();
  },
};
