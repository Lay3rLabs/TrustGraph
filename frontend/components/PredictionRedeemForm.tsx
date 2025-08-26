"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { 
  conditionalTokensAbi,
  conditionalTokensAddress,
  predictionMarketFactoryAddress,
  mockUsdcAddress
} from '@/lib/contracts';
import { formatUnits } from 'viem';
import { HyperstitionMarket } from './PredictionMarketDetail';

interface PredictionRedeemFormProps {
  market: HyperstitionMarket;
  onSuccess?: () => void;
}

const PredictionRedeemForm: React.FC<PredictionRedeemFormProps> = ({ 
  market, 
  onSuccess 
}) => {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expectedPayout, setExpectedPayout] = useState<string | null>(null);

  // Use the factory address as the oracle (as seen in the deployment scripts)
  // This matches how the contracts are actually set up
  const factoryAddress = predictionMarketFactoryAddress;
  
  // Get the condition ID - using the factory as oracle (as in the scripts)
  const { data: conditionId } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'getConditionId',
    args: [
      factoryAddress, // oracle (factory, not market maker)
      "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // questionId (bytes32(0))
      BigInt(2) // outcomeSlotCount (YES/NO = 2 outcomes)
    ],
    query: { enabled: !!address },
  });

  // Get collection IDs for YES/NO positions
  const { data: yesCollectionId } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'getCollectionId',
    args: conditionId ? [
      "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // parentCollectionId
      conditionId,
      BigInt(2) // indexSet for YES (binary 10 = decimal 2)
    ] : undefined,
    query: { enabled: !!conditionId },
  });

  const { data: noCollectionId } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'getCollectionId',
    args: conditionId ? [
      "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // parentCollectionId
      conditionId,
      BigInt(1) // indexSet for NO (binary 01 = decimal 1)
    ] : undefined,
    query: { enabled: !!conditionId },
  });

  // Get position IDs for YES/NO tokens
  const { data: yesPositionId } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'getPositionId',
    args: yesCollectionId ? [
      mockUsdcAddress, // collateralToken
      yesCollectionId
    ] : undefined,
    query: { enabled: !!yesCollectionId },
  });

  const { data: noPositionId } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'getPositionId',
    args: noCollectionId ? [
      mockUsdcAddress, // collateralToken
      noCollectionId
    ] : undefined,
    query: { enabled: !!noCollectionId },
  });

  // Get user's token balances
  const { data: yesBalance, refetch: refetchYesBalance } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'balanceOf',
    args: [
      address || "0x0000000000000000000000000000000000000000" as `0x${string}`,
      yesPositionId || BigInt(0)
    ],
    query: { enabled: !!address && !!yesPositionId },
  });

  const { data: noBalance, refetch: refetchNoBalance } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'balanceOf',
    args: [
      address || "0x0000000000000000000000000000000000000000" as `0x${string}`,
      noPositionId || BigInt(0)
    ],
    query: { enabled: !!address && !!noPositionId },
  });

  // Determine which position the user has (if any)
  const userPosition = React.useMemo(() => {
    if (!yesBalance && !noBalance) return null;
    
    const yesAmount = yesBalance || BigInt(0);
    const noAmount = noBalance || BigInt(0);
    
    if (yesAmount > BigInt(0)) {
      return {
        outcome: 'YES' as const,
        amount: yesAmount,
        canRedeem: market.isResolved || false,
      };
    } else if (noAmount > BigInt(0)) {
      return {
        outcome: 'NO' as const,
        amount: noAmount,
        canRedeem: market.isResolved || false,
      };
    }
    
    return null;
  }, [yesBalance, noBalance, market.isResolved]);

  // Get payout denominator
  const { data: payoutDenominator } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'payoutDenominator',
    args: conditionId ? [conditionId] : undefined,
    query: { enabled: !!conditionId && !!market.isResolved },
  });

  // Get payout numerators for YES outcome (index 1)
  const { data: yesPayoutNumerator } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'payoutNumerators',
    args: conditionId ? [conditionId, BigInt(1)] : undefined,
    query: { enabled: !!conditionId && !!market.isResolved },
  });

  // Get payout numerators for NO outcome (index 0)
  const { data: noPayoutNumerator } = useReadContract({
    address: conditionalTokensAddress,
    abi: conditionalTokensAbi,
    functionName: 'payoutNumerators',
    args: conditionId ? [conditionId, BigInt(0)] : undefined,
    query: { enabled: !!conditionId && !!market.isResolved },
  });

  // Calculate expected payout
  useEffect(() => {
    if (!userPosition || !payoutDenominator || (!yesPayoutNumerator && !noPayoutNumerator)) {
      return;
    }

    try {
      const payoutNumerator = userPosition.outcome === 'YES' ? yesPayoutNumerator : noPayoutNumerator;
      if (!payoutNumerator) return;

      // Calculate payout: (position.amount * payoutNumerator) / payoutDenominator
      const payoutAmount = (userPosition.amount * payoutNumerator) / payoutDenominator;
      setExpectedPayout(formatUnits(payoutAmount, 18));
    } catch (err) {
      console.error('Error calculating expected payout:', err);
    }
  }, [userPosition, payoutDenominator, yesPayoutNumerator, noPayoutNumerator]);

  const handleRedeem = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return;
    }
    
    if (!userPosition) {
      setError('No position found to redeem');
      return;
    }
    
    if (!market.isResolved) {
      setError('Market must be resolved before redeeming');
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      // Create index sets for redemption
      // Index set 1 = binary 01 = decimal 1 (represents NO)
      // Index set 2 = binary 10 = decimal 2 (represents YES)
      const indexSets = [userPosition.outcome === 'YES' ? BigInt(2) : BigInt(1)];
      
      // Redeem position
      // Make sure we have a condition ID
      if (!conditionId) {
        throw new Error('Condition ID not found');
      }

      await writeContractAsync({
        address: conditionalTokensAddress,
        abi: conditionalTokensAbi,
        functionName: 'redeemPositions',
        args: [
          mockUsdcAddress, // collateralToken
          "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // parentCollectionId
          conditionId,
          indexSets
        ],
      });
      
      setSuccess(`Successfully redeemed ${formatUnits(userPosition.amount, 18)} ${userPosition.outcome} tokens!`);
      
      // Refresh balances
      refetchYesBalance();
      refetchNoBalance();
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error redeeming position:', err);
      setError(err.message || 'Failed to redeem position');
    }
  };

  const isWinningPosition = userPosition && market.result === (userPosition.outcome === 'YES');

  // Show loading state while fetching position data
  if (!address || !isConnected) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="terminal-command text-lg">Redeem Your Position</h3>
          <p className="terminal-text text-sm">{market.title}</p>
        </div>
        <div className="text-center py-8">
          <div className="terminal-dim text-sm">Please connect your wallet to view positions</div>
        </div>
      </div>
    );
  }

  // Show no position message if user has no tokens
  if (userPosition === null && yesBalance !== undefined && noBalance !== undefined) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="terminal-command text-lg">Redeem Your Position</h3>
          <p className="terminal-text text-sm">{market.title}</p>
        </div>
        
        <div className="text-center py-8">
          <div className="terminal-dim text-sm">You have no positions in this market</div>
          <div className="terminal-dim text-xs mt-2">Buy some tokens first to participate</div>
        </div>
      </div>
    );
  }

  // Show loading while position data is being fetched
  if (!userPosition) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="terminal-command text-lg">Redeem Your Position</h3>
          <p className="terminal-text text-sm">{market.title}</p>
        </div>
        <div className="text-center py-8">
          <div className="terminal-bright text-sm">◉ LOADING POSITION ◉</div>
          <div className="terminal-dim text-xs mt-2">Fetching your token balances...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="terminal-command text-lg">Redeem Your Position</h3>
        <p className="terminal-text text-sm">{market.title}</p>
      </div>

      <div className="bg-black/20 border border-gray-600 p-4 rounded-sm">
        <div className="flex justify-between items-center">
          <div>
            <div className="terminal-dim text-xs">YOUR POSITION</div>
            <div className="terminal-bright text-base">
              {formatUnits(userPosition.amount, 18)} {userPosition.outcome} TOKENS
            </div>
          </div>
          
          <div className={`text-sm font-bold px-3 py-1 rounded ${
            isWinningPosition 
              ? 'text-green-400 bg-green-900/30 border border-green-500' 
              : 'text-red-400 bg-red-900/30 border border-red-500'
          }`}>
            {isWinningPosition ? 'WINNING' : 'LOSING'}
          </div>
        </div>
        
        {expectedPayout !== null && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="terminal-dim text-xs">EXPECTED REDEMPTION AMOUNT</div>
            <div className="terminal-bright text-base text-green-400">
              {expectedPayout} USDC
            </div>
          </div>
        )}
      </div>

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

      <Button
        onClick={handleRedeem}
        disabled={!isConnected || !market.isResolved || !userPosition.canRedeem || isWriting}
        className="w-full mobile-terminal-btn"
      >
        {isWriting ? (
          <span className="terminal-dim">Processing...</span>
        ) : expectedPayout ? (
          <span className="terminal-command">REDEEM FOR {expectedPayout} USDC</span>
        ) : (
          <span className="terminal-command">REDEEM POSITION</span>
        )}
      </Button>

      <div className="terminal-dim text-xs">
        When you redeem your position, you'll receive collateral tokens based on the market outcome.
        {isWinningPosition 
          ? ' Since you bet on the correct outcome, you can redeem your tokens for collateral.' 
          : ' Since you bet on the incorrect outcome, your tokens are now worthless.'}
      </div>
    </div>
  );
};

export default PredictionRedeemForm;