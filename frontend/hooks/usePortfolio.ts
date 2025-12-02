import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { portfolioApi } from '@/services/portfolioApi';
import { usePortfolioStore } from '@/store/portfolioStore';

export function usePortfolio() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { setAssets, setLoading, setError } = usePortfolioStore();

  const query = useQuery({
    queryKey: ['portfolio-assets', address],
    queryFn: () => portfolioApi.getAssets(address!),
    enabled: !!address,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Sync query state to Zustand store
  useEffect(() => {
    if (query.data) {
      setAssets(query.data);
      setLoading(false);
    }
  }, [query.data, setAssets, setLoading]);

  useEffect(() => {
    if (query.error) {
      setError((query.error as Error).message);
      setLoading(false);
    }
  }, [query.error, setError, setLoading]);

  useEffect(() => {
    if (query.isLoading) {
      setLoading(true);
    }
  }, [query.isLoading, setLoading]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['portfolio-assets', address] });
  };

  const refetch = () => {
    setLoading(true);
    return query.refetch();
  };

  return {
    assets: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch,
    invalidate,
  };
}
