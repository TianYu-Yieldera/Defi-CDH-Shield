"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { useOptimisticCollateralChange, useOptimisticBorrowChange } from '@/hooks/useOptimisticUpdate';
import type { CDPPosition } from '@/types';

interface PositionActionsProps {
  position: CDPPosition;
}

export function PositionActions({ position }: PositionActionsProps) {
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');

  const { addCollateral, removeCollateral, isPending: isCollateralPending } = useOptimisticCollateralChange();
  const { borrow, repay, isPending: isBorrowPending } = useOptimisticBorrowChange();

  const handleAddCollateral = async () => {
    const amount = parseFloat(collateralAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Mock API call - replace with actual API
    const mockApiCall = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        ...position,
        collateralAmount: position.collateralAmount + amount,
        collateralValueUSD: position.collateralValueUSD + amount * position.currentPrice,
      };
    };

    await addCollateral(position.id, amount, mockApiCall);
    setCollateralAmount('');
  };

  const handleRemoveCollateral = async () => {
    const amount = parseFloat(collateralAmount);
    if (isNaN(amount) || amount <= 0 || amount > position.collateralAmount) return;

    const mockApiCall = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        ...position,
        collateralAmount: position.collateralAmount - amount,
        collateralValueUSD: position.collateralValueUSD - amount * position.currentPrice,
      };
    };

    await removeCollateral(position.id, amount, mockApiCall);
    setCollateralAmount('');
  };

  const handleBorrow = async () => {
    const amount = parseFloat(borrowAmount);
    if (isNaN(amount) || amount <= 0) return;

    const mockApiCall = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        ...position,
        borrowedAmount: position.borrowedAmount + amount,
        borrowedValueUSD: position.borrowedValueUSD + amount,
      };
    };

    await borrow(position.id, amount, mockApiCall);
    setBorrowAmount('');
  };

  const handleRepay = async () => {
    const amount = parseFloat(borrowAmount);
    if (isNaN(amount) || amount <= 0 || amount > position.borrowedAmount) return;

    const mockApiCall = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        ...position,
        borrowedAmount: position.borrowedAmount - amount,
        borrowedValueUSD: position.borrowedValueUSD - amount,
      };
    };

    await repay(position.id, amount, mockApiCall);
    setBorrowAmount('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Position Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="collateral" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="collateral">Collateral</TabsTrigger>
            <TabsTrigger value="borrow">Borrow</TabsTrigger>
          </TabsList>

          <TabsContent value="collateral" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ({position.collateralToken})</label>
              <Input
                type="number"
                placeholder="0.0"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                disabled={isCollateralPending}
              />
              <p className="text-xs text-muted-foreground">
                Available: {position.collateralAmount.toFixed(4)} {position.collateralToken}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleAddCollateral}
                disabled={isCollateralPending || !collateralAmount}
                className="w-full"
              >
                {isCollateralPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                )}
                Add
              </Button>
              <Button
                variant="outline"
                onClick={handleRemoveCollateral}
                disabled={isCollateralPending || !collateralAmount}
                className="w-full"
              >
                {isCollateralPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                )}
                Remove
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="borrow" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ({position.borrowedToken})</label>
              <Input
                type="number"
                placeholder="0.0"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                disabled={isBorrowPending}
              />
              <p className="text-xs text-muted-foreground">
                Borrowed: {position.borrowedAmount.toFixed(2)} {position.borrowedToken}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleBorrow}
                disabled={isBorrowPending || !borrowAmount}
                className="w-full"
              >
                {isBorrowPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                )}
                Borrow
              </Button>
              <Button
                variant="outline"
                onClick={handleRepay}
                disabled={isBorrowPending || !borrowAmount}
                className="w-full"
              >
                {isBorrowPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                )}
                Repay
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
