/**
 * Batch Transaction Utilities for Smart Wallet
 * Coinbase Smart Wallet supports batch transactions for improved UX
 */

import { Account, Chain, Transport, WalletClient } from "viem";

export interface BatchCall {
  to: `0x${string}`;
  value?: bigint;
  data: `0x${string}`;
}

/**
 * Execute multiple transactions in a single batch
 * This reduces user interactions and gas costs
 */
export async function executeBatchTransaction(
  walletClient: WalletClient<Transport, Chain, Account>,
  calls: BatchCall[]
) {
  try {
    // Check if wallet supports batch transactions
    // Coinbase Smart Wallet supports this via ERC-4337 UserOp
    const account = walletClient.account;

    if (!account) {
      throw new Error("No account connected");
    }

    // For Smart Wallet, we can use sendCalls (if available)
    // Otherwise, fall back to sequential transactions
    if ("sendCalls" in walletClient && typeof walletClient.sendCalls === "function") {
      // @ts-ignore - sendCalls is not in standard type but available in Coinbase Smart Wallet
      const hash = await walletClient.sendCalls({
        calls: calls.map((call) => ({
          to: call.to,
          value: call.value || 0n,
          data: call.data,
        })),
      });

      return { hash, success: true };
    } else {
      // Fallback: send transactions sequentially
      console.warn("Batch transactions not supported, sending sequentially");

      const hashes: `0x${string}`[] = [];

      for (const call of calls) {
        const hash = await walletClient.sendTransaction({
          to: call.to,
          value: call.value || 0n,
          data: call.data,
          account,
          chain: walletClient.chain,
        });

        hashes.push(hash);
      }

      return { hash: hashes[hashes.length - 1], success: true, sequential: true };
    }
  } catch (error) {
    console.error("Batch transaction failed:", error);
    return { success: false, error };
  }
}

/**
 * Example: Batch approve and deposit
 */
export async function batchApproveAndDeposit(
  walletClient: WalletClient<Transport, Chain, Account>,
  tokenAddress: `0x${string}`,
  spenderAddress: `0x${string}`,
  amount: bigint,
  depositData: `0x${string}`
) {
  // ERC20 approve function signature
  const approveData = encodeFunctionData({
    functionName: "approve",
    args: [spenderAddress, amount],
  });

  const calls: BatchCall[] = [
    {
      to: tokenAddress,
      data: approveData,
    },
    {
      to: spenderAddress,
      data: depositData,
    },
  ];

  return executeBatchTransaction(walletClient, calls);
}

/**
 * Example: Batch CDP protection actions
 */
export async function batchCDPProtection(
  walletClient: WalletClient<Transport, Chain, Account>,
  cdpShieldAddress: `0x${string}`,
  actions: {
    positionId: bigint;
    actionData: `0x${string}`;
  }[]
) {
  const calls: BatchCall[] = actions.map((action) => ({
    to: cdpShieldAddress,
    data: action.actionData,
  }));

  return executeBatchTransaction(walletClient, calls);
}

/**
 * Encode function data helper (simplified)
 * In production, use viem's encodeFunctionData
 */
function encodeFunctionData({
  functionName,
  args,
}: {
  functionName: string;
  args: any[];
}): `0x${string}` {
  // This is a placeholder - use viem's encodeFunctionData in production
  return "0x" as `0x${string}`;
}

/**
 * Check if connected wallet supports batch transactions
 */
export function supportsBatchTransactions(
  walletClient: WalletClient<Transport, Chain, Account> | undefined
): boolean {
  if (!walletClient) return false;

  // Check if sendCalls method exists (Coinbase Smart Wallet)
  return "sendCalls" in walletClient && typeof walletClient.sendCalls === "function";
}
