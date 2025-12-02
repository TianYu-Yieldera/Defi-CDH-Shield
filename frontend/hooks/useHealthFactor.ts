import { useQuery } from '@tanstack/react-query';
import { cdpApi } from '@/services/cdpApi';

interface UseHealthFactorParams {
  collateralAmount: number;
  debtAmount: number;
  collateralToken: string;
  debtToken: string;
  enabled?: boolean;
}

export function useHealthFactor(params: UseHealthFactorParams) {
  const { enabled = true, ...apiParams } = params;

  const query = useQuery({
    queryKey: ['health-factor', apiParams],
    queryFn: () => cdpApi.calculateHealthFactor(apiParams),
    enabled:
      enabled &&
      apiParams.collateralAmount > 0 &&
      apiParams.debtAmount > 0 &&
      !!apiParams.collateralToken &&
      !!apiParams.debtToken,
    staleTime: 5000,
    refetchInterval: 10000,
  });

  return {
    healthFactor: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
