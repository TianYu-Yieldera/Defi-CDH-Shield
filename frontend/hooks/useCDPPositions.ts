import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
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
    onSuccess: (data) => {
      setPositions(data);
      setLoading(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
    },
  });

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
