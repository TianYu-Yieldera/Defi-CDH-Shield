import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { cdpApi } from '@/services/cdpApi';
import { useCDPStore } from '@/store/cdpStore';

export function useCDPPositions() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { setPositions, setLoading, setError } = useCDPStore();

  const query = useQuery({
    queryKey: ['cdp-positions', address],
    queryFn: () => cdpApi.getPositions(address!),
    enabled: !!address,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Sync query state to Zustand store
  useEffect(() => {
    if (query.data) {
      setPositions(query.data);
      setLoading(false);
    }
  }, [query.data, setPositions, setLoading]);

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
    queryClient.invalidateQueries({ queryKey: ['cdp-positions', address] });
  };

  const refetch = () => {
    setLoading(true);
    return query.refetch();
  };

  return {
    positions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch,
    invalidate,
  };
}
