"use client";

import { forwardRef } from "react";
import { Fuel, Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBatchTransaction } from "@/hooks/useBatchTransaction";

interface SponsoredButtonProps extends ButtonProps {
  showGasFree?: boolean;
  loading?: boolean;
  loadingText?: string;
}

/**
 * Button with Gas Free indicator
 * Shows "Gas Free" badge when Paymaster is available
 */
export const SponsoredButton = forwardRef<HTMLButtonElement, SponsoredButtonProps>(
  (
    {
      children,
      className,
      showGasFree = true,
      loading = false,
      loadingText,
      disabled,
      ...props
    },
    ref
  ) => {
    const { isGasFree, isExecuting } = useBatchTransaction();

    const isLoading = loading || isExecuting;
    const showBadge = showGasFree && isGasFree && !isLoading;

    return (
      <Button
        ref={ref}
        className={cn("relative", className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {loadingText || "Processing..."}
          </>
        ) : (
          <>
            {showBadge && (
              <span className="inline-flex items-center gap-1 mr-2 text-green-300">
                <Fuel className="w-3 h-3" />
                <span className="text-xs">Free</span>
              </span>
            )}
            {children}
          </>
        )}
      </Button>
    );
  }
);

SponsoredButton.displayName = "SponsoredButton";

/**
 * Action button specifically for CDP operations
 * Includes Gas Free indicator and loading state
 */
interface CDPActionButtonProps extends Omit<SponsoredButtonProps, "variant"> {
  variant?: "emergency" | "warning" | "default";
  actionType?: "reduce" | "close" | "emergency";
}

export const CDPActionButton = forwardRef<HTMLButtonElement, CDPActionButtonProps>(
  (
    {
      children,
      className,
      variant = "default",
      actionType,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      emergency: "bg-red-600 hover:bg-red-700 text-white",
      warning: "bg-orange-500 hover:bg-orange-600 text-white",
      default: "",
    };

    const actionLabels = {
      reduce: "Reduce Leverage",
      close: "Close Position",
      emergency: "Emergency Close",
    };

    return (
      <SponsoredButton
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      >
        {children || (actionType && actionLabels[actionType])}
      </SponsoredButton>
    );
  }
);

CDPActionButton.displayName = "CDPActionButton";
