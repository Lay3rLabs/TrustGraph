"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Removed Select imports - using custom buttons instead
import { 
  lmsrMarketMakerAbi,
  conditionalTokensAbi, 
  mockUsdcAbi,
  mockUsdcAddress,
  conditionalTokensAddress, 
  lmsrMarketMakerAddress
} from '@/lib/contracts';
import { parseUnits, formatUnits } from 'viem';
import { HyperstitionMarket } from './PredictionMarketDetail';

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
  const [yesCostEstimate, setYesCostEstimate] = useState<string | null>(null);
  const [noCostEstimate, setNoCostEstimate] = useState<string | null>(null);

  // Use mock USDC for collateral balance
  const { data: collateralBalance, refetch: refetchCollateralBalance } = useBalance({
    address: address,
    token: mockUsdcAddress,
    query: {
      refetchInterval: 3_000,
    }
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

  // Calculate YES token cost for 1 token
  const { data: yesCostData, refetch: refetchYesCost } = useReadContract({
    address: marketMakerAddress,
    abi: lmsrMarketMakerAbi,
    functionName: 'calcNetCost',
    args: [[BigInt(0), parseUnits('1', 18)]],
    query: { enabled: true, refetchInterval: 3_000 },
  });

  // Calculate NO token cost for 1 token
  const { data: noCostData, refetch: refetchNoCost } = useReadContract({
    address: marketMakerAddress,
    abi: lmsrMarketMakerAbi,
    functionName: 'calcNetCost',
    args: [[parseUnits('1', 18), BigInt(0)]],
    query: { enabled: true, refetchInterval: 3_000 },
  });

  // Update cost estimates when data changes
  useEffect(() => {
    if (netCostData) {
      setCostEstimate(formatUnits(netCostData, 18));
    } else {
      setCostEstimate(null);
    }
  }, [netCostData]);

  useEffect(() => {
    if (yesCostData) {
      setYesCostEstimate(formatUnits(yesCostData, 18));
    }
  }, [yesCostData]);

  useEffect(() => {
    if (noCostData) {
      setNoCostEstimate(formatUnits(noCostData, 18));
    }
  }, [noCostData]);

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
      
      if (onSuccess) {
        onSuccess();
        refetchCollateralBalance();
        refetchYesCost();
        refetchNoCost();
      }
    } catch (err: any) {
      console.error('Error buying prediction tokens:', err);
      setError(err.message || 'Failed to buy prediction tokens');
    }
  };

  const hasEnoughCollateral = collateralBalance && netCostData 
    ? collateralBalance.value >= netCostData 
    : true;

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('outcome', 'YES')}
              className={`p-4 border rounded-sm transition-all duration-200 flex flex-col items-center space-y-2 ${
                formData.outcome === 'YES'
                  ? 'border-[#05df72] bg-[#05df72]/20 shadow-lg shadow-[#05df72]/20'
                  : 'border-gray-600 bg-black/20 hover:border-[#05df72]/50 hover:bg-[#05df72]/10'
              }`}
            >
              <div className={`text-lg font-bold ${
                formData.outcome === 'YES' ? 'text-[#05df72]' : 'text-white'
              }`}>
                YES
              </div>
              {yesCostEstimate && (
                <div className="text-xs terminal-dim">
                  {Number(yesCostEstimate).toFixed(3)} USDC
                </div>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => handleInputChange('outcome', 'NO')}
              className={`p-4 border rounded-sm transition-all duration-200 flex flex-col items-center space-y-2 ${
                formData.outcome === 'NO'
                  ? 'border-[#dd70d4] bg-[#dd70d4]/20 shadow-lg shadow-[#dd70d4]/20'
                  : 'border-gray-600 bg-black/20 hover:border-[#dd70d4]/50 hover:bg-[#dd70d4]/10'
              }`}
            >
              <div className={`text-lg font-bold ${
                formData.outcome === 'NO' ? 'text-[#dd70d4]' : 'text-white'
              }`}>
                NO
              </div>
              {noCostEstimate && (
                <div className="text-xs terminal-dim">
                  {Number(noCostEstimate).toFixed(3)} USDC
                </div>
              )}
            </button>
          </div>
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