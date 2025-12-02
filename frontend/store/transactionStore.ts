import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';
export type TransactionType =
  | 'register_position'
  | 'reduce_leverage'
  | 'partial_close'
  | 'full_close'
  | 'emergency_close'
  | 'swap';

interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  positionId?: string;
  amount?: string;
  token?: string;
  timestamp: number;
  confirmations?: number;
  error?: string;
}

interface TransactionState {
  transactions: Transaction[];
  pendingTxs: string[];
  isLoading: boolean;
  error: string | null;

  addTransaction: (
    tx: Omit<Transaction, 'id' | 'timestamp' | 'status'>
  ) => string;
  updateTxStatus: (
    hash: string,
    status: TransactionStatus,
    confirmations?: number,
    error?: string
  ) => void;
  removePendingTx: (hash: string) => void;
  clearHistory: (olderThan?: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  transactions: [],
  pendingTxs: [],
  isLoading: false,
  error: null,
};

const generateId = (): string => {
  return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useTransactionStore = create<TransactionState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addTransaction: (tx) => {
          const id = generateId();
          const transaction: Transaction = {
            ...tx,
            id,
            status: 'pending',
            timestamp: Date.now(),
          };

          set(
            (state) => ({
              transactions: [transaction, ...state.transactions],
              pendingTxs: [...state.pendingTxs, tx.hash],
              error: null,
            }),
            false,
            'addTransaction'
          );

          return id;
        },

        updateTxStatus: (hash, status, confirmations, error) => {
          set(
            (state) => ({
              transactions: state.transactions.map((tx) =>
                tx.hash === hash
                  ? {
                      ...tx,
                      status,
                      confirmations,
                      error,
                    }
                  : tx
              ),
              pendingTxs:
                status !== 'pending'
                  ? state.pendingTxs.filter((h) => h !== hash)
                  : state.pendingTxs,
              error: null,
            }),
            false,
            'updateTxStatus'
          );
        },

        removePendingTx: (hash) => {
          set(
            (state) => ({
              pendingTxs: state.pendingTxs.filter((h) => h !== hash),
            }),
            false,
            'removePendingTx'
          );
        },

        clearHistory: (olderThan) => {
          const cutoff = olderThan || Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days default
          set(
            (state) => ({
              transactions: state.transactions.filter(
                (tx) => tx.timestamp >= cutoff || tx.status === 'pending'
              ),
            }),
            false,
            'clearHistory'
          );
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
        name: 'transaction-storage',
        partialize: (state) => ({
          transactions: state.transactions.slice(0, 100), // Keep last 100 transactions
        }),
      }
    ),
    {
      name: 'TransactionStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
