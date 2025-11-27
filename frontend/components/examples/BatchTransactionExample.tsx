"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useBatchTransaction } from "@/hooks/useBatchTransaction";
import { Zap, AlertCircle } from "lucide-react";

/**
 * Example component demonstrating batch transaction functionality
 * This can be integrated into the main app when needed
 */
export function BatchTransactionExample() {
  const { executeBatch, isExecuting, isBatchSupported } = useBatchTransaction();

  const handleTestBatch = async () => {
    // Example: Create mock batch calls
    const calls = [
      {
        to: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        data: "0x" as `0x${string}`,
        value: 0n,
      },
      {
        to: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        data: "0x" as `0x${string}`,
        value: 0n,
      },
    ];

    await executeBatch(calls);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Batch Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Smart Wallet supports batch transactions for improved UX:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>Multiple operations in one transaction</li>
            <li>Reduced gas costs</li>
            <li>Better user experience (one approval)</li>
            <li>Atomic execution (all or nothing)</li>
          </ul>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-1">Status:</p>
          <p className="text-sm flex items-center gap-2">
            {isBatchSupported ? (
              <>
                <span className="h-2 w-2 bg-green-500 rounded-full" />
                Batch transactions supported
              </>
            ) : (
              <>
                <span className="h-2 w-2 bg-yellow-500 rounded-full" />
                Sequential mode (fallback)
              </>
            )}
          </p>
        </div>

        {!isBatchSupported && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200">
              Your wallet doesn't support batch transactions. Transactions will be sent
              sequentially. Consider using Coinbase Smart Wallet for the best experience.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Example Use Cases:</p>
          <div className="space-y-2">
            <div className="p-3 bg-card rounded-lg border">
              <p className="text-sm font-medium">1. Emergency CDP Protection</p>
              <p className="text-xs text-muted-foreground mt-1">
                Approve + Repay Debt + Withdraw Collateral (3 actions → 1 tx)
              </p>
            </div>
            <div className="p-3 bg-card rounded-lg border">
              <p className="text-sm font-medium">2. Portfolio Rebalancing</p>
              <p className="text-xs text-muted-foreground mt-1">
                Swap + Deposit + Stake (3 actions → 1 tx)
              </p>
            </div>
            <div className="p-3 bg-card rounded-lg border">
              <p className="text-sm font-medium">3. Multi-Protocol Actions</p>
              <p className="text-xs text-muted-foreground mt-1">
                Close position on Protocol A + Open on Protocol B (2 actions → 1 tx)
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleTestBatch}
          disabled={isExecuting}
          className="w-full"
        >
          {isExecuting ? "Executing..." : "Test Batch Transaction"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Note: This is a test button. In production, batch transactions will be used
          automatically for multi-step operations.
        </p>
      </CardContent>
    </Card>
  );
}
