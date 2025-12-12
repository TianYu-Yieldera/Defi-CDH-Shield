/**
 * Batch Transaction Utilities for Smart Wallet with Paymaster Support
 * Coinbase Smart Wallet supports batch transactions and sponsored gas
 */

import { Account, Chain, Transport, WalletClient, encodeFunctionData as viemEncodeFunctionData } from "viem";
import { erc20Abi } from "viem";

export interface BatchCall {
  to: `0x${string}`;
  value?: bigint;
  data: `0x${string}`;
}

export interface BatchTransactionOptions {
  // Enable sponsored (gas-free) transactions via Paymaster
  sponsored?: boolean;
  // Custom Paymaster URL (optional, uses Coinbase default for testnet)
  paymasterUrl?: string;
}

export interface BatchTransactionResult {
  hash?: `0x${string}`;
  success: boolean;
  sequential?: boolean;
  sponsored?: boolean;
  error?: unknown;
}

// Check if sponsored transactions should be enabled
function shouldSponsorGas(): boolean {
  return process.env.NEXT_PUBLIC_SPONSOR_GAS === 'true';
}

// Get Paymaster URL from environment
function getPaymasterUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_PAYMASTER_URL || undefined;
}

/**
 * Execute multiple transactions in a single batch with optional Paymaster
 * This reduces user interactions and can make transactions gas-free
 */
export async function executeBatchTransaction(
  walletClient: WalletClient<Transport, Chain, Account>,
  calls: BatchCall[],
  options: BatchTransactionOptions = {}
): Promise<BatchTransactionResult> {
  try {
    const account = walletClient.account;

    if (!account) {
      throw new Error("No account connected");
    }

    // Determine if we should use sponsored transactions
    const useSponsored = options.sponsored ?? shouldSponsorGas();
    const paymasterUrl = options.paymasterUrl ?? getPaymasterUrl();

    // For Smart Wallet, we can use sendCalls with capabilities
    if ("sendCalls" in walletClient && typeof walletClient.sendCalls === "function") {
      // Build capabilities for Paymaster if sponsored is enabled
      const capabilities: Record<string, unknown> = {};

      if (useSponsored) {
        // Coinbase Smart Wallet Paymaster capabilities
        // For BASE Sepolia, Coinbase provides free Paymaster automatically
        // For mainnet, you need a CDP Paymaster URL
        capabilities.paymasterService = paymasterUrl
          ? { url: paymasterUrl }
          : true; // Use default Coinbase Paymaster
      }

      // @ts-ignore - sendCalls is available in Coinbase Smart Wallet
      const result = await walletClient.sendCalls({
        calls: calls.map((call) => ({
          to: call.to,
          value: call.value || 0n,
          data: call.data,
        })),
        capabilities: Object.keys(capabilities).length > 0 ? capabilities : undefined,
      });

      // sendCalls may return an object with id or directly a hash
      const hash = (
        typeof result === 'string'
          ? result
          : (result as { id?: string })?.id
      ) as `0x${string}` | undefined;

      return {
        hash,
        success: true,
        sponsored: useSponsored,
      };
    } else {
      // Fallback: send transactions sequentially (no Paymaster support)
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

      return {
        hash: hashes[hashes.length - 1],
        success: true,
        sequential: true,
        sponsored: false,
      };
    }
  } catch (error) {
    console.error("Batch transaction failed:", error);
    return { success: false, error };
  }
}

/**
 * Execute a single sponsored transaction
 */
export async function executeSponsoredTransaction(
  walletClient: WalletClient<Transport, Chain, Account>,
  call: BatchCall
): Promise<BatchTransactionResult> {
  return executeBatchTransaction(walletClient, [call], { sponsored: true });
}

/**
 * Example: Batch approve and deposit with Paymaster
 */
export async function batchApproveAndDeposit(
  walletClient: WalletClient<Transport, Chain, Account>,
  tokenAddress: `0x${string}`,
  spenderAddress: `0x${string}`,
  amount: bigint,
  depositData: `0x${string}`,
  options: BatchTransactionOptions = {}
) {
  // Use viem's encodeFunctionData for ERC20 approve
  const approveData = viemEncodeFunctionData({
    abi: erc20Abi,
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

  return executeBatchTransaction(walletClient, calls, options);
}

/**
 * Example: Batch CDP protection actions with Paymaster
 */
export async function batchCDPProtection(
  walletClient: WalletClient<Transport, Chain, Account>,
  cdpShieldAddress: `0x${string}`,
  actions: {
    positionId: bigint;
    actionData: `0x${string}`;
  }[],
  options: BatchTransactionOptions = {}
) {
  const calls: BatchCall[] = actions.map((action) => ({
    to: cdpShieldAddress,
    data: action.actionData,
  }));

  return executeBatchTransaction(walletClient, calls, options);
}

/**
 * Check if connected wallet supports batch transactions
 */
export function supportsBatchTransactions(
  walletClient: WalletClient<Transport, Chain, Account> | undefined
): boolean {
  if (!walletClient) return false;
  return "sendCalls" in walletClient && typeof walletClient.sendCalls === "function";
}

/**
 * Check if sponsored transactions are enabled
 */
export function isSponsoredEnabled(): boolean {
  return shouldSponsorGas();
}

/**
 * Check if wallet supports Paymaster (sponsored transactions)
 * Coinbase Smart Wallet on BASE supports Paymaster
 */
export function supportsPaymaster(
  walletClient: WalletClient<Transport, Chain, Account> | undefined
): boolean {
  // Paymaster is supported if batch transactions are supported
  // (Coinbase Smart Wallet)
  return supportsBatchTransactions(walletClient);
}
