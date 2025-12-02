import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type AlertType = 'health_factor' | 'liquidation_price' | 'collateral_ratio';
export type AlertSeverity = 'info' | 'warning' | 'critical';

interface AlertConfig {
  id: string;
  positionId: string;
  type: AlertType;
  threshold: number;
  enabled: boolean;
  createdAt: number;
}

interface Alert {
  id: string;
  configId: string;
  positionId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  triggeredAt: number;
  acknowledged: boolean;
}

interface AlertState {
  configs: AlertConfig[];
  activeAlerts: Alert[];
  isLoading: boolean;
  error: string | null;

  addConfig: (config: Omit<AlertConfig, 'id' | 'createdAt'>) => void;
  updateConfig: (id: string, updates: Partial<AlertConfig>) => void;
  removeConfig: (id: string) => void;
  toggleConfig: (id: string) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'triggeredAt' | 'acknowledged'>) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlert: (id: string) => void;
  clearActiveAlerts: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  configs: [],
  activeAlerts: [],
  isLoading: false,
  error: null,
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useAlertStore = create<AlertState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addConfig: (config) => {
          const newConfig: AlertConfig = {
            ...config,
            id: generateId(),
            createdAt: Date.now(),
          };
          set(
            (state) => ({
              configs: [...state.configs, newConfig],
              error: null,
            }),
            false,
            'addConfig'
          );
        },

        updateConfig: (id, updates) => {
          set(
            (state) => ({
              configs: state.configs.map((c) =>
                c.id === id ? { ...c, ...updates } : c
              ),
              error: null,
            }),
            false,
            'updateConfig'
          );
        },

        removeConfig: (id) => {
          set(
            (state) => ({
              configs: state.configs.filter((c) => c.id !== id),
              activeAlerts: state.activeAlerts.filter((a) => a.configId !== id),
              error: null,
            }),
            false,
            'removeConfig'
          );
        },

        toggleConfig: (id) => {
          set(
            (state) => ({
              configs: state.configs.map((c) =>
                c.id === id ? { ...c, enabled: !c.enabled } : c
              ),
              error: null,
            }),
            false,
            'toggleConfig'
          );
        },

        addAlert: (alert) => {
          const newAlert: Alert = {
            ...alert,
            id: generateId(),
            triggeredAt: Date.now(),
            acknowledged: false,
          };
          set(
            (state) => ({
              activeAlerts: [...state.activeAlerts, newAlert],
              error: null,
            }),
            false,
            'addAlert'
          );
        },

        acknowledgeAlert: (id) => {
          set(
            (state) => ({
              activeAlerts: state.activeAlerts.map((a) =>
                a.id === id ? { ...a, acknowledged: true } : a
              ),
            }),
            false,
            'acknowledgeAlert'
          );
        },

        clearAlert: (id) => {
          set(
            (state) => ({
              activeAlerts: state.activeAlerts.filter((a) => a.id !== id),
            }),
            false,
            'clearAlert'
          );
        },

        clearActiveAlerts: () => {
          set({ activeAlerts: [] }, false, 'clearActiveAlerts');
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
        name: 'alert-storage',
        partialize: (state) => ({
          configs: state.configs,
        }),
      }
    ),
    {
      name: 'AlertStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
