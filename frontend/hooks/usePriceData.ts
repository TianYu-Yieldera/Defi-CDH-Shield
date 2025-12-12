import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { usePriceStore } from '@/store/priceStore';

interface TokenPrice {
  token: string;
  price: number;
  change24h: number;
}

const mockPrices: TokenPrice[] = [
  { token: 'ETH', price: 2920, change24h: 2.3 },
  { token: 'USDC', price: 1.0, change24h: 0.01 },
  { token: 'cbETH', price: 2920, change24h: 2.1 },
  { token: 'WETH', price: 2920, change24h: 2.3 },
  { token: 'DAI', price: 1.0, change24h: -0.02 },
];

async function fetchPrices(): Promise<TokenPrice[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return mockPrices.map((price) => ({
    ...price,
    price: price.price + (Math.random() - 0.5) * price.price * 0.001,
    change24h: price.change24h + (Math.random() - 0.5) * 0.5,
  }));
}

export function usePriceData() {
  const { updatePrices } = usePriceStore();

  const query = useQuery({
    queryKey: ['token-prices'],
    queryFn: fetchPrices,
    refetchInterval: 5000,
    staleTime: 2000,
  });

  // Update price store when data changes
  useEffect(() => {
    if (query.data) {
      updatePrices(
        query.data.map((price) => ({
          ...price,
          timestamp: Date.now(),
        }))
      );
    }
  }, [query.data, updatePrices]);

  return {
    prices: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useTokenPrice(token: string) {
  const { getPriceByToken } = usePriceStore();
  const { prices } = usePriceData();

  const priceData = getPriceByToken(token);

  if (!priceData && prices.length > 0) {
    const freshPrice = prices.find((p) => p.token === token);
    if (freshPrice) {
      return {
        price: freshPrice.price,
        change24h: freshPrice.change24h,
        isLoading: false,
      };
    }
  }

  return {
    price: priceData?.price,
    change24h: priceData?.change24h,
    isLoading: !priceData,
  };
}
