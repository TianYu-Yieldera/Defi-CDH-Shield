import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Position } from '@/types';

interface ProtocolDistribution {
  protocol: string;
  value: number;
  percentage: number;
}

interface AssetTypeDistribution {
  type: 'lending' | 'lp' | 'staking' | 'wallet';
  value: number;
  percentage: number;
}

interface PortfolioState {
  assets: Position[];
  totalValue: number;
  protocolDistribution: ProtocolDistribution[];
  assetTypeDistribution: AssetTypeDistribution[];
  isLoading: boolean;
  error: string | null;

  setAssets: (assets: Position[]) => void;
  updateAsset: (id: string, updates: Partial<Position>) => void;
  calculateTotalValue: () => void;
  updateDistribution: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  assets: [],
  totalValue: 0,
  protocolDistribution: [],
  assetTypeDistribution: [],
  isLoading: false,
  error: null,
};

const calculateDistributions = (assets: Position[]) => {
  const protocolMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  let total = 0;

  assets.forEach((asset) => {
    const value = asset.totalValue || 0;
    total += value;

    const currentProtocol = protocolMap.get(asset.protocol) || 0;
    protocolMap.set(asset.protocol, currentProtocol + value);

    const currentType = typeMap.get(asset.type) || 0;
    typeMap.set(asset.type, currentType + value);
  });

  const protocolDistribution: ProtocolDistribution[] = Array.from(
    protocolMap.entries()
  ).map(([protocol, value]) => ({
    protocol,
    value,
    percentage: total > 0 ? (value / total) * 100 : 0,
  }));

  const assetTypeDistribution: AssetTypeDistribution[] = Array.from(
    typeMap.entries()
  ).map(([type, value]) => ({
    type: type as AssetTypeDistribution['type'],
    value,
    percentage: total > 0 ? (value / total) * 100 : 0,
  }));

  return {
    totalValue: total,
    protocolDistribution,
    assetTypeDistribution,
  };
};

export const usePortfolioStore = create<PortfolioState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setAssets: (assets) => {
          const distributions = calculateDistributions(assets);
          set(
            {
              assets,
              ...distributions,
              error: null,
            },
            false,
            'setAssets'
          );
        },

        updateAsset: (id, updates) => {
          const updatedAssets = get().assets.map((asset) =>
            asset.id === id ? { ...asset, ...updates } : asset
          );
          const distributions = calculateDistributions(updatedAssets);
          set(
            {
              assets: updatedAssets,
              ...distributions,
              error: null,
            },
            false,
            'updateAsset'
          );
        },

        calculateTotalValue: () => {
          const total = get().assets.reduce(
            (sum, asset) => sum + (asset.totalValue || 0),
            0
          );
          set({ totalValue: total }, false, 'calculateTotalValue');
        },

        updateDistribution: () => {
          const distributions = calculateDistributions(get().assets);
          set(distributions, false, 'updateDistribution');
        },

        setLoading: (isLoading) => {
          set({ isLoading }, false, 'setLoading');
        },

        setError: (error) => {
          set({ error, isLoading: false }, false, 'setError');
        },

        reset: () => {
          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'portfolio-storage',
        partialize: (state) => ({
          assets: state.assets,
          totalValue: state.totalValue,
        }),
      }
    ),
    {
      name: 'PortfolioStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
