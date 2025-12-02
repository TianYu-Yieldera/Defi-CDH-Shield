import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface PriceData {
  token: string;
  price: number;
  change24h: number;
  timestamp: number;
}

interface PriceState {
  prices: Map<string, PriceData>;
  lastUpdate: number;
  isSubscribed: boolean;

  updatePrice: (token: string, price: number, change24h: number) => void;
  updatePrices: (priceUpdates: PriceData[]) => void;
  getPriceByToken: (token: string) => PriceData | undefined;
  setSubscribed: (subscribed: boolean) => void;
  clearStale: (maxAge: number) => void;
  reset: () => void;
}

const initialState = {
  prices: new Map<string, PriceData>(),
  lastUpdate: 0,
  isSubscribed: false,
};

export const usePriceStore = create<PriceState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      updatePrice: (token, price, change24h) => {
        const timestamp = Date.now();
        set(
          (state) => {
            const newPrices = new Map(state.prices);
            newPrices.set(token, {
              token,
              price,
              change24h,
              timestamp,
            });
            return {
              prices: newPrices,
              lastUpdate: timestamp,
            };
          },
          false,
          'updatePrice'
        );
      },

      updatePrices: (priceUpdates) => {
        const timestamp = Date.now();
        set(
          (state) => {
            const newPrices = new Map(state.prices);
            priceUpdates.forEach((update) => {
              newPrices.set(update.token, {
                ...update,
                timestamp,
              });
            });
            return {
              prices: newPrices,
              lastUpdate: timestamp,
            };
          },
          false,
          'updatePrices'
        );
      },

      getPriceByToken: (token) => {
        return get().prices.get(token);
      },

      setSubscribed: (isSubscribed) => {
        set({ isSubscribed }, false, 'setSubscribed');
      },

      clearStale: (maxAge) => {
        const now = Date.now();
        set(
          (state) => {
            const newPrices = new Map(state.prices);
            let hasChanges = false;

            state.prices.forEach((data, token) => {
              if (now - data.timestamp > maxAge) {
                newPrices.delete(token);
                hasChanges = true;
              }
            });

            return hasChanges ? { prices: newPrices } : state;
          },
          false,
          'clearStale'
        );
      },

      reset: () => {
        set(
          {
            prices: new Map<string, PriceData>(),
            lastUpdate: 0,
            isSubscribed: false,
          },
          false,
          'reset'
        );
      },
    }),
    {
      name: 'PriceStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
