"use client";

import { useState } from "react";
import { useWalletClient } from "wagmi";
import { executeBatchTransaction, BatchCall, supportsBatchTransactions } from "@/lib/batchTransactions";
import { useToast } from "@/components/ui/toast";

export function useBatchTransaction() {
  const { data: walletClient } = useWalletClient();
  const { addToast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeBatch = async (calls: BatchCall[]) => {
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
      addToast({
        type: "info",
        title: "Executing batch transaction",
        description: `Processing ${calls.length} operations...`,
        duration: 3000,
      });

      const result = await executeBatchTransaction(walletClient, calls);

      if (result.success) {
        addToast({
          type: "success",
          title: "Batch transaction successful",
          description: result.sequential
            ? "Transactions executed sequentially"
            : "All operations completed in one transaction",
        });
      } else {
        throw result.error;
      }

      return result;
    } catch (error: any) {
      console.error("Batch transaction error:", error);

      addToast({
        type: "error",
        title: "Transaction failed",
        description: error.message || "Failed to execute batch transaction",
      });

      return { success: false, error };
    } finally {
      setIsExecuting(false);
    }
  };

  const isBatchSupported = supportsBatchTransactions(walletClient);

  return {
    executeBatch,
    isExecuting,
    isBatchSupported,
  };
}
