'use client'

import type React from 'react'

import { Button } from '@/components/Button'
// import { enovaAddress } from '@/lib/contracts'

const enovaAddress = '0x0000000000000000000000000000000000000000'

interface RewardsCardProps {
  merkleRoot?: string
  currentIpfsHash?: string
  pendingReward?: {
    account: string
    value: string
    proof: string[]
  } | null
  claimedAmount?: string
  rewardBalance?: {
    decimals: number
    formatted: string
    symbol: string
    value: bigint
  }
  merkleData?: {
    metadata: {
      total_value: string
    }
  } | null
  tokenSymbol?: string
  contractAddress?: string
  onClaim?: () => void
  onTriggerUpdate?: () => void
  isLoading?: boolean
  error?: string | null
}

export function RewardsCard({
  merkleRoot,
  currentIpfsHash,
  pendingReward,
  claimedAmount = '0',
  rewardBalance,
  merkleData,
  tokenSymbol = 'TOKEN',
  contractAddress,
  onClaim,
  onTriggerUpdate,
  isLoading = false,
  error,
}: RewardsCardProps) {
  const formatAmount = (amount: string | undefined) => {
    return BigInt(amount || 0).toLocaleString()
  }

  const hasClaimableRewards =
    pendingReward && Number(pendingReward.value) > Number(claimedAmount)

  return (
    <div className="border border-gray-700 bg-black/10 p-6 rounded-sm space-y-4">
      {/* Header */}
      <div className="border-b border-gray-700 pb-3">
        <div className="ascii-art-title text-lg mb-1">REWARD DISTRIBUTION</div>
        <div className="text-sm">
          ◢◤ On-chain reward claims and distribution tracking ◢◤
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="text-sm">◉ LOADING REWARD DATA ◉</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="border border-red-700 bg-red-900/10 p-3 rounded-sm">
          <div className="error-text text-sm">⚠️ {error}</div>
        </div>
      )}

      {/* Contract Info */}
      {!isLoading && (
        <div className="space-y-4">
          {contractAddress && (
            <div className="space-y-2">
              <div className="text-xs">CONTRACT ADDRESS</div>
              <div className="text-sm font-mono break-all">
                {contractAddress}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs">MERKLE ROOT</div>
            <div className="text-sm font-mono break-all">
              {merkleRoot || 'Not set'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs">IPFS DATA HASH</div>
            <div className="text-sm font-mono break-all">
              {currentIpfsHash || 'Not available'}
            </div>
          </div>
        </div>
      )}

      {/* Reward Pool Info */}
      {merkleData && (
        <div className="border-t border-gray-700 pt-4 space-y-3">
          <div className="text-sm">REWARD POOL STATUS</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs">TOTAL REWARDS</div>
              <div className="text-sm">
                {formatAmount(merkleData.metadata.total_value)} {tokenSymbol}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs">REWARD TOKEN</div>
              <div className="text-sm font-mono break-all">{enovaAddress}</div>
            </div>
          </div>
        </div>
      )}

      {/* User Rewards */}
      <div className="border-t border-gray-700 pt-4 space-y-3">
        <div className="text-sm">YOUR REWARDS</div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-xs">TOTAL EARNED</div>
            <div className="text-lg">
              {pendingReward ? formatAmount(pendingReward.value) : '0'}{' '}
              {tokenSymbol}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs">CLAIMABLE</div>
            <div className="text-lg">
              {pendingReward
                ? formatAmount(
                    (
                      BigInt(pendingReward.value) - BigInt(claimedAmount)
                    ).toString()
                  )
                : '0'}{' '}
              {tokenSymbol}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs">ALREADY CLAIMED</div>
            <div className="text-lg">
              {formatAmount(claimedAmount)} {tokenSymbol}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs">BALANCE</div>
            <div className="text-lg">
              {formatAmount(rewardBalance?.value.toString() || '0')}{' '}
              {rewardBalance?.symbol || tokenSymbol}
            </div>
          </div>
        </div>

        {/* Claim Status */}
        {pendingReward && (
          <div className="space-y-2">
            <div className="text-xs">CLAIM STATUS</div>
            <div
              className={`text-sm ${
                hasClaimableRewards ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {hasClaimableRewards
                ? '✓ Rewards available for claim'
                : '◯ No pending rewards'}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-700 pt-4 flex flex-col sm:flex-row gap-3">
        {hasClaimableRewards && onClaim && (
          <Button
            onClick={onClaim}
            disabled={isLoading}
            className="!px-4 !py-2 flex-1"
          >
            <span className="text-xs">
              CLAIM {formatAmount(pendingReward?.value)} {tokenSymbol}
            </span>
          </Button>
        )}

        {onTriggerUpdate && (
          <Button
            onClick={onTriggerUpdate}
            disabled={isLoading}
            variant="outline"
            className="border-gray-700 text-gray-400 hover:bg-gray-900/20 flex-1"
          >
            <span className="text-xs">TRIGGER UPDATE</span>
          </Button>
        )}
      </div>

      {/* No Rewards Message */}
      {!isLoading && !pendingReward && !error && (
        <div className="text-center py-6 border-t border-gray-700">
          <div className="text-sm">NO REWARDS AVAILABLE</div>
          <div className="text-xs mt-2">
            ◆ PARTICIPATE IN ATTESTATIONS TO EARN REWARDS ◆
          </div>
        </div>
      )}
    </div>
  )
}
