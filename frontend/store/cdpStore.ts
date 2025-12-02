import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { CDPPosition } from '@/types';

interface CDPState {
  positions: CDPPosition[];
  selectedPosition: CDPPosition | null;
  isLoading: boolean;
  error: string | null;

  setPositions: (positions: CDPPosition[]) => void;
  addPosition: (position: CDPPosition) => void;
  updatePosition: (id: string, updates: Partial<CDPPosition>) => void;
  removePosition: (id: string) => void;
  selectPosition: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  positions: [],
  selectedPosition: null,
  isLoading: false,
  error: null,
};

export const useCDPStore = create<CDPState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setPositions: (positions) => {
          set({ positions, error: null }, false, 'setPositions');
        },

        addPosition: (position) => {
          set(
            (state) => ({
              positions: [...state.positions, position],
              error: null,
            }),
            false,
            'addPosition'
          );
        },

        updatePosition: (id, updates) => {
          set(
            (state) => ({
              positions: state.positions.map((p) =>
                p.id === id ? { ...p, ...updates } : p
              ),
              selectedPosition:
                state.selectedPosition?.id === id
                  ? { ...state.selectedPosition, ...updates }
                  : state.selectedPosition,
              error: null,
            }),
            false,
            'updatePosition'
          );
        },

        removePosition: (id) => {
          set(
            (state) => ({
              positions: state.positions.filter((p) => p.id !== id),
              selectedPosition:
                state.selectedPosition?.id === id
                  ? null
                  : state.selectedPosition,
              error: null,
            }),
            false,
            'removePosition'
          );
        },

        selectPosition: (id) => {
          const position = id
            ? get().positions.find((p) => p.id === id) || null
            : null;
          set({ selectedPosition: position }, false, 'selectPosition');
        },

        setLoading: (isLoading) => {
          set({ isLoading }, false, 'setLoading');
        },

        setError: (error) => {
          set({ error, isLoading: false }, false, 'setError');
        },

        clearError: () => {
          set({ error: null }, false, 'clearError');
        },

        reset: () => {
          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'cdp-storage',
        partialize: (state) => ({
          positions: state.positions,
          selectedPosition: state.selectedPosition,
        }),
      }
    ),
    {
      name: 'CDPStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
