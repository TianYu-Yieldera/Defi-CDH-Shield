import { useQuery } from '@tanstack/react-query';
import { cdpApi } from '@/services/cdpApi';

export function useLiquidationPrice(positionId: string, enabled = true) {
  const query = useQuery({
    queryKey: ['liquidation-price', positionId],
    queryFn: () => cdpApi.getLiquidationPrice({ positionId }),
    enabled: enabled && !!positionId,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  return {
    liquidationPrice: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
