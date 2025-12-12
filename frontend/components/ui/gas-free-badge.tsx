"use client";

import { Fuel } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBatchTransaction } from "@/hooks/useBatchTransaction";

interface GasFreeBadgeProps {
  className?: string;
  showWhenUnavailable?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Badge component to indicate Gas Free (sponsored) transactions
 * Shows when Paymaster is available and enabled
 */
export function GasFreeBadge({
  className,
  showWhenUnavailable = false,
  size = "md",
}: GasFreeBadgeProps) {
  const { isGasFree } = useBatchTransaction();

  // Don't show if Gas Free is not available and showWhenUnavailable is false
  if (!isGasFree && !showWhenUnavailable) return null;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-1",
    md: "text-sm px-2 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (!isGasFree) {
    // Show unavailable state
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
          sizeClasses[size],
          className
        )}
      >
        <Fuel className={iconSizes[size]} />
        <span>Gas Required</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        "animate-pulse",
        sizeClasses[size],
        className
      )}
      title="Transaction gas will be sponsored - No ETH required!"
    >
      <Fuel className={iconSizes[size]} />
      <span>Gas Free</span>
    </span>
  );
}

/**
 * Inline Gas Free indicator for buttons
 */
export function GasFreeIndicator({ className }: { className?: string }) {
  const { isGasFree } = useBatchTransaction();

  if (!isGasFree) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-green-600 dark:text-green-400",
        className
      )}
    >
      <Fuel className="w-3 h-3" />
      <span className="text-xs font-medium">Free</span>
    </span>
  );
}

/**
 * Hook to get Gas Free status text
 */
export function useGasFreeStatus() {
  const { isGasFree, isPaymasterSupported, isSponsoredEnabled } = useBatchTransaction();

  if (isGasFree) {
    return {
      status: "free" as const,
      text: "Gas Free",
      description: "Transaction gas will be sponsored",
    };
  }

  if (!isPaymasterSupported) {
    return {
      status: "unsupported" as const,
      text: "Gas Required",
      description: "Use Coinbase Smart Wallet for gas-free transactions",
    };
  }

  if (!isSponsoredEnabled) {
    return {
      status: "disabled" as const,
      text: "Gas Required",
      description: "Sponsored transactions are disabled",
    };
  }

  return {
    status: "required" as const,
    text: "Gas Required",
    description: "ETH required for transaction fees",
  };
}
