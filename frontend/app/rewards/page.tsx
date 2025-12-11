'use client'

import type React from 'react'
import { useCallback, useState } from 'react'
import { useAccount } from 'wagmi'

import { Button } from '@/components/Button'
import { RewardsCard } from '@/components/RewardsCard'
import { useOpenWalletConnector } from '@/components/WalletConnectionProvider'
import { useRewards } from '@/hooks/useRewards'

export default function RewardsPage() {
  const { isConnected } = useAccount()
  const openConnectWallet = useOpenWalletConnector()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    isLoading,
    error,
    merkleRoot,
    currentIpfsHash,
    merkleData,
    pendingReward,
    claimedAmount,
    claimHistory,
    tokenSymbol,
    rewardBalance,
    claim,
    triggerUpdate,
    contractAddress,
  } = useRewards()

  const handleClaim = useCallback(async () => {
    setSuccessMessage(null)
    const hash = await claim()
    if (hash) {
      setSuccessMessage(`Rewards claimed successfully! Transaction: ${hash}`)
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }, [claim])

  const handleTriggerUpdate = useCallback(async () => {
    setSuccessMessage(null)
    const hash = await triggerUpdate()
    if (hash) {
      setSuccessMessage(
        `Update triggered! Check back in a few minutes to see if there are any updates. Transaction: ${hash}`
      )
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }, [triggerUpdate])

  return (
    <div className="space-y-6">
      {/* Header */}
      {/*<div className="border-b border-gray-700 pb-4">
        <div className="text-lg mb-2">REWARD DISTRIBUTION SYSTEM</div>
        <div className="text-sm">
          ◆ EARN REWARDS • CLAIM TOKENS • TRACK PARTICIPATION ◆
        </div>
      </div>*/}

      {/* Success Message */}
      {successMessage && (
        <div className="border border-green-700 bg-green-900/10 p-3 rounded-sm">
          <div className="text-green-400 text-sm">✓ {successMessage}</div>
        </div>
      )}

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="border border-gray-700 bg-black/10 p-6 rounded-sm text-center space-y-4">
          <div className="text-lg">WALLET CONNECTION REQUIRED</div>
          <div className="text-sm">
            Connect your wallet to view and claim rewards
          </div>
          <Button onClick={openConnectWallet} className="!px-6 !py-2">
            <span className="text-xs">CONNECT WALLET</span>
          </Button>
        </div>
      )}

      {/* Rewards Card */}
      {isConnected && (
        <RewardsCard
          merkleRoot={merkleRoot}
          currentIpfsHash={currentIpfsHash}
          pendingReward={pendingReward}
          claimedAmount={claimedAmount}
          merkleData={merkleData}
          tokenSymbol={tokenSymbol}
          rewardBalance={rewardBalance}
          contractAddress={contractAddress}
          onClaim={handleClaim}
          onTriggerUpdate={handleTriggerUpdate}
          isLoading={isLoading}
          error={error}
        />
      )}

      {/* Claim History */}
      {isConnected && claimHistory.length > 0 && (
        <div className="border border-gray-700 bg-black/10 p-6 rounded-sm space-y-4">
          <div className="border-b border-gray-700 pb-3">
            <div className="text-lg mb-1">CLAIM HISTORY</div>
            <div className="text-sm">◢◤ Your reward claim transactions ◢◤</div>
          </div>

          <div className="space-y-3">
            {claimHistory.map((claim, index) => (
              <div
                key={claim.transactionHash}
                className="border border-gray-700 p-4 rounded-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs">CLAIM #{index + 1}</div>
                    <div className="text-sm">
                      {new Date(claim.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs">AMOUNT CLAIMED</div>
                    <div className="text-sm">
                      {(
                        Number(claim.claimed) /
                        Math.pow(10, rewardBalance?.decimals || 0)
                      ).toFixed(6)}{' '}
                      {tokenSymbol}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs">TRANSACTION</div>
                    <div className="text-sm font-mono break-all">
                      {claim.transactionHash}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs">STATUS</div>
                    <div className="text-green-400 text-sm">✓ CONFIRMED</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {isConnected && (
        <div className="border border-gray-700 bg-black/10 p-6 rounded-sm">
          <div className="text-sm mb-3">HOW REWARDS WORK</div>
          <div className="space-y-2 text-sm">
            <div>
              • Rewards are calculated based on your attestation activity
            </div>
            <div>
              • Merkle tree data is stored on IPFS and updated periodically
            </div>
            <div>• Trigger updates to refresh the reward calculations</div>
            <div>
              • Claims are processed on-chain through the MerkleFundDistributor
              contract
            </div>
            <div>
              • You can only claim rewards that haven't been claimed yet
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
