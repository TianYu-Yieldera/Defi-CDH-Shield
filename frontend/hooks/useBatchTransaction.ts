"use client";

import { useState, useMemo } from "react";
import { useWalletClient, useChainId } from "wagmi";
import {
  executeBatchTransaction,
  BatchCall,
  BatchTransactionOptions,
  supportsBatchTransactions,
  supportsPaymaster,
  isSponsoredEnabled,
} from "@/lib/batchTransactions";
import { useToast } from "@/components/ui/toast";
import { baseSepolia } from "wagmi/chains";

export interface UseBatchTransactionResult {
  executeBatch: (calls: BatchCall[], options?: BatchTransactionOptions) => Promise<{ success: boolean; hash?: `0x${string}`; sponsored?: boolean }>;
  isExecuting: boolean;
  isBatchSupported: boolean;
  isPaymasterSupported: boolean;
  isSponsoredEnabled: boolean;
  isGasFree: boolean;
}

export function useBatchTransaction(): UseBatchTransactionResult {
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { addToast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);

  // Check if current chain is BASE Sepolia (free Paymaster)
  const isTestnet = chainId === baseSepolia.id;

  // Determine if Gas Free is available
  const isBatchSupported = useMemo(
    () => supportsBatchTransactions(walletClient),
    [walletClient]
  );
  const isPaymasterSupported = useMemo(
    () => supportsPaymaster(walletClient),
    [walletClient]
  );
  const sponsoredEnabled = isSponsoredEnabled();

  // Gas Free is available when:
  // 1. Wallet supports Paymaster (Coinbase Smart Wallet)
  // 2. Sponsored transactions are enabled
  // 3. On testnet (free) or has Paymaster URL configured (mainnet)
  const isGasFree = useMemo(() => {
    if (!isPaymasterSupported || !sponsoredEnabled) return false;
    // Testnet always has free Paymaster
    if (isTestnet) return true;
    // Mainnet needs Paymaster URL
    return !!process.env.NEXT_PUBLIC_PAYMASTER_URL;
  }, [isPaymasterSupported, sponsoredEnabled, isTestnet]);

  const executeBatch = async (calls: BatchCall[], options: BatchTransactionOptions = {}) => {
    if (!walletClient) {
      addToast({
        type: "error",
        title: "Wallet not connected",
        description: "Please connect your wallet first",
      });
      return { success: false };
    }

    setIsExecuting(true);

    try {
      // Determine if this transaction will be sponsored
      // isGasFree already includes sponsoredEnabled check
      const willBeSponsored = options.sponsored ?? isGasFree;

      addToast({
        type: "info",
        title: willBeSponsored ? "Gas Free Transaction" : "Executing transaction",
        description: willBeSponsored
          ? `Processing ${calls.length} operation(s) - No gas fee required!`
          : `Processing ${calls.length} operation(s)...`,
        duration: 3000,
      });

      const result = await executeBatchTransaction(walletClient, calls, {
        sponsored: willBeSponsored,
        ...options,
      });

      if (result.success) {
        addToast({
          type: "success",
          title: result.sponsored ? "Gas Free Success" : "Transaction successful",
          description: result.sequential
            ? "Transactions executed sequentially"
            : result.sponsored
            ? "All operations completed - Gas was sponsored!"
            : "All operations completed in one transaction",
        });
      } else {
        throw result.error;
      }

      return {
        success: result.success,
        hash: result.hash,
        sponsored: result.sponsored,
      };
    } catch (error: unknown) {
      console.error("Batch transaction error:", error);

      const errorMessage = error instanceof Error ? error.message : "Failed to execute transaction";

      addToast({
        type: "error",
        title: "Transaction failed",
        description: errorMessage,
      });

      return { success: false };
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    executeBatch,
    isExecuting,
    isBatchSupported,
    isPaymasterSupported,
    isSponsoredEnabled: sponsoredEnabled,
    isGasFree,
  };
}
