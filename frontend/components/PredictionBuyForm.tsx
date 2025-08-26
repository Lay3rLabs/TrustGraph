"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  lmsrMarketMakerAbi,
  conditionalTokensAbi, 
  mockUsdcAbi,
  mockUsdcAddress,
  conditionalTokensAddress, 
  lmsrMarketMakerAddress
} from '@/lib/contracts';
import { parseUnits, formatUnits } from 'viem';

interface HyperstitionMarket {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  incentivePool: number;
  probability: number;
  deadline: string;
  category: string;
  participants: number;
  status: "active" | "achieved" | "failed" | "pending";
  icon: string;
  unit: string;
  marketMakerAddress?: `0x${string}`;
  collateralTokenAddress?: `0x${string}`;
  conditionId?: `0x${string}`;
}

interface PredictionBuyFormProps {
  market: HyperstitionMarket;
  onSuccess?: () => void;
}

const PredictionBuyForm: React.FC<PredictionBuyFormProps> = ({ 
  market, 
  onSuccess 
}) => {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  
  const [formData, setFormData] = useState({
    outcome: 'YES' as 'YES' | 'NO',
    amount: '',
  });
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [costEstimate, setCostEstimate] = useState<string | null>(null);

  // Use mock USDC for collateral balance
  const { data: collateralBalance } = useBalance({
    address: address,
    token: mockUsdcAddress,
  });

  // Use the deployed market maker address
  const marketMakerAddress = market.marketMakerAddress || lmsrMarketMakerAddress;

  // Calculate cost estimate when amount changes
  const { data: netCostData } = useReadContract({
    address: marketMakerAddress,
    abi: lmsrMarketMakerAbi,
    functionName: 'calcNetCost',
    args: formData.amount && !isNaN(Number(formData.amount)) ? [
      formData.outcome === 'YES' 
        ? [BigInt(0), parseUnits(formData.amount, 18)]
        : [parseUnits(formData.amount, 18), BigInt(0)]
    ] : undefined,
    query: {
      enabled: !!formData.amount && !isNaN(Number(formData.amount)) && Number(formData.amount) > 0,
    },
  });

  // Update cost estimate when data changes
  useEffect(() => {
    if (netCostData) {
      setCostEstimate(formatUnits(netCostData, 18));
    } else {
      setCostEstimate(null);
    }
  }, [netCostData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return;
    }

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError(null);
    setSuccess(null);
    
    try {
      const amount = parseUnits(formData.amount, 18);
      const outcomeTokenAmounts = formData.outcome === 'YES' 
        ? [BigInt(0), amount]
        : [amount, BigInt(0)];

      // Calculate collateral limit (add 10% buffer)
      const collateralLimit = netCostData ? (netCostData * BigInt(110)) / BigInt(100) : amount;

      // Execute transactions sequentially and wait for each one
      // Approve market maker to spend collateral
      await writeContractAsync({
        address: mockUsdcAddress,
        abi: mockUsdcAbi,
        functionName: 'approve',
        args: [marketMakerAddress, collateralLimit],
      });

      // Execute trade
      await writeContractAsync({
        address: marketMakerAddress,
        abi: lmsrMarketMakerAbi,
        functionName: 'trade',
        args: [outcomeTokenAmounts, collateralLimit],
      });

      setSuccess(`Successfully bought ${formData.amount} ${formData.outcome} tokens!`);
      setFormData({ outcome: 'YES', amount: '' });
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error buying prediction tokens:', err);
      setError(err.message || 'Failed to buy prediction tokens');
    }
  };

  const hasEnoughCollateral = collateralBalance && netCostData 
    ? collateralBalance.value >= netCostData 
    : true;

  return (
    <div className="border border-gray-700 bg-card-foreground/70 p-6 rounded-sm space-y-6">
      <div className="space-y-2">
        <h3 className="terminal-command text-lg">{market.title}</h3>
        <p className="terminal-text text-sm">{market.description}</p>
      </div>

      {collateralBalance && (
        <div className="bg-black/20 border border-gray-600 p-3 rounded-sm">
          <div className="terminal-dim text-xs">COLLATERAL BALANCE</div>
          <div className="terminal-bright text-sm">
            {formatUnits(collateralBalance.value, 18)} {collateralBalance.symbol}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-500 p-3 rounded-sm">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-500 p-3 rounded-sm">
          <div className="text-green-400 text-sm">{success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="terminal-dim text-xs">PREDICTION OUTCOME</label>
          <Select value={formData.outcome} onValueChange={(value) => handleInputChange('outcome', value)}>
            <SelectTrigger className="bg-black/20 border-gray-700 terminal-text">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-700">
              <SelectItem value="YES" className="terminal-text">YES</SelectItem>
              <SelectItem value="NO" className="terminal-text">NO</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="terminal-dim text-xs">AMOUNT OF OUTCOME TOKENS</label>
          <Input
            type="number"
            step="0.000001"
            min="0.000001"
            placeholder="Enter amount..."
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            className="bg-black/20 border-gray-700 terminal-text"
            required
          />
        </div>

        {costEstimate && (
          <div className="bg-black/20 border border-gray-600 p-3 rounded-sm">
            <div className={`terminal-dim text-xs ${!hasEnoughCollateral ? 'text-red-400' : ''}`}>
              ESTIMATED COST
            </div>
            <div className={`terminal-text text-sm ${!hasEnoughCollateral ? 'text-red-400' : ''}`}>
              {costEstimate} USDC
              {!hasEnoughCollateral && (
                <div className="text-red-400 text-xs mt-1">Insufficient balance</div>
              )}
            </div>
            <div className="terminal-dim text-xs mt-1">
              (Actual cost may vary based on market conditions)
            </div>
            
            {!hasEnoughCollateral && (
              <div className="mt-2 p-2 bg-blue-900/30 border border-blue-500 rounded text-blue-400 text-xs">
                <span className="font-bold">Demo Mode:</span> Collateral tokens will be automatically minted for you when you make a purchase.
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={!isConnected || isWriting || !formData.amount}
          className="w-full mobile-terminal-btn"
        >
          {isWriting ? (
            <span className="terminal-dim">Processing...</span>
          ) : (
            <span className="terminal-command">BUY {formData.outcome} TOKENS</span>
          )}
        </Button>

        <div className="terminal-dim text-xs">
          By buying prediction tokens, you're getting exposure to the outcome of this market.
          If your prediction is correct, you'll be able to redeem your tokens for collateral when the market resolves.
        </div>
      </form>
    </div>
  );
};

export default PredictionBuyForm;