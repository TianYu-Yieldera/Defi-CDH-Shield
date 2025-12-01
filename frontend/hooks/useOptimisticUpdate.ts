import { useState, useCallback } from 'react';
import { useCDPStore } from '@/store/cdpStore';
import { useQueryClient } from '@tanstack/react-query';
import type { CDPPosition } from '@/types';

interface OptimisticUpdateOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  rollbackOnError?: boolean;
}

export function useOptimisticPositionUpdate() {
  const [isPending, setIsPending] = useState(false);
  const { updatePosition, positions } = useCDPStore();
  const queryClient = useQueryClient();

  const updatePositionOptimistic = useCallback(
    async (
      positionId: string,
      updates: Partial<CDPPosition>,
      apiCall: () => Promise<CDPPosition>,
      options: OptimisticUpdateOptions = {}
    ) => {
      const { onSuccess, onError, rollbackOnError = true } = options;

      // Find the current position for potential rollback
      const currentPosition = positions.find((p) => p.id === positionId);
      if (!currentPosition) {
        console.error('Position not found for optimistic update');
        return;
      }

      // Store original state for rollback
      const originalState = { ...currentPosition };

      setIsPending(true);

      // Optimistically update the UI
      updatePosition(positionId, updates);

      try {
        // Make the actual API call
        const result = await apiCall();

        // Update with the real data from the server
        updatePosition(positionId, result);

        // Invalidate and refetch queries
        queryClient.invalidateQueries({ queryKey: ['cdp-positions'] });

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Optimistic update failed:', error);

        // Rollback to original state if configured
        if (rollbackOnError) {
          updatePosition(positionId, originalState);
        }

        if (onError) {
          onError(error as Error);
        }
      } finally {
        setIsPending(false);
      }
    },
    [positions, updatePosition, queryClient]
  );

  return {
    updatePositionOptimistic,
    isPending,
  };
}

export function useOptimisticCollateralChange() {
  const { updatePositionOptimistic, isPending } = useOptimisticPositionUpdate();

  const addCollateral = useCallback(
    async (
      positionId: string,
      amount: number,
      apiCall: () => Promise<CDPPosition>
    ) => {
      // Calculate optimistic updates
      const optimisticUpdates: Partial<CDPPosition> = {
        // These would be calculated based on current values
        // For now, we'll let the API provide the real values
      };

      await updatePositionOptimistic(
        positionId,
        optimisticUpdates,
        apiCall,
        {
          onSuccess: () => console.log('Collateral added successfully'),
          onError: (error) => console.error('Failed to add collateral:', error),
        }
      );
    },
    [updatePositionOptimistic]
  );

  const removeCollateral = useCallback(
    async (
      positionId: string,
      amount: number,
      apiCall: () => Promise<CDPPosition>
    ) => {
      const optimisticUpdates: Partial<CDPPosition> = {
        // Optimistic calculations here
      };

      await updatePositionOptimistic(
        positionId,
        optimisticUpdates,
        apiCall,
        {
          onSuccess: () => console.log('Collateral removed successfully'),
          onError: (error) => console.error('Failed to remove collateral:', error),
        }
      );
    },
    [updatePositionOptimistic]
  );

  return {
    addCollateral,
    removeCollateral,
    isPending,
  };
}

export function useOptimisticBorrowChange() {
  const { updatePositionOptimistic, isPending } = useOptimisticPositionUpdate();

  const borrow = useCallback(
    async (
      positionId: string,
      amount: number,
      apiCall: () => Promise<CDPPosition>
    ) => {
      const optimisticUpdates: Partial<CDPPosition> = {
        // Optimistic calculations here
      };

      await updatePositionOptimistic(
        positionId,
        optimisticUpdates,
        apiCall,
        {
          onSuccess: () => console.log('Borrow successful'),
          onError: (error) => console.error('Failed to borrow:', error),
        }
      );
    },
    [updatePositionOptimistic]
  );

  const repay = useCallback(
    async (
      positionId: string,
      amount: number,
      apiCall: () => Promise<CDPPosition>
    ) => {
      const optimisticUpdates: Partial<CDPPosition> = {
        // Optimistic calculations here
      };

      await updatePositionOptimistic(
        positionId,
        optimisticUpdates,
        apiCall,
        {
          onSuccess: () => console.log('Repayment successful'),
          onError: (error) => console.error('Failed to repay:', error),
        }
      );
    },
    [updatePositionOptimistic]
  );

  return {
    borrow,
    repay,
    isPending,
  };
}
