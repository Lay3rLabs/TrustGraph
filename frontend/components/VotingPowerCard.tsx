'use client'

import type React from 'react'

import { mockUsdcAddress } from '@/lib/contracts'

interface VotingPowerCardProps {
  userVotingPower?: string
  proposalThreshold?: string
  canCreateProposal?: boolean
  formatVotingPower?: (amount: string) => string
  isLoading?: boolean
}

export function VotingPowerCard({
  userVotingPower,
  proposalThreshold,
  canCreateProposal = false,
  formatVotingPower = (amount) => amount,
  isLoading = false,
}: VotingPowerCardProps) {
  const hasVotingPower = userVotingPower && Number(userVotingPower) > 0

  return (
    <div className="border border-gray-700 bg-black/10 p-6 rounded-sm space-y-4">
      {/* Header */}
      <div className="border-b border-gray-700 pb-3">
        <div className="ascii-art-title text-lg mb-1">VOTING POWER</div>
        <div className="terminal-dim text-sm">
          ◢◤ Your participation power in governance decisions ◢◤
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="terminal-bright text-sm">
            ◉ LOADING VOTING POWER ◉
          </div>
        </div>
      )}

      {/* Voting Power Stats */}
      {!isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="terminal-dim text-xs">YOUR VOTING POWER</div>
              <div
                className={`text-2xl ${
                  hasVotingPower ? 'terminal-bright' : 'terminal-dim'
                }`}
              >
                {userVotingPower ? formatVotingPower(userVotingPower) : '0'}
              </div>
              <div
                className={`text-xs ${
                  hasVotingPower ? 'text-green-400' : 'system-message'
                }`}
              >
                {hasVotingPower ? '✓ Eligible to vote' : '◯ No voting power'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="terminal-dim text-xs">PROPOSAL THRESHOLD</div>
              <div className="terminal-text text-2xl">
                {proposalThreshold ? formatVotingPower(proposalThreshold) : '0'}
              </div>
              <div
                className={`text-xs ${
                  canCreateProposal ? 'text-green-400' : 'text-yellow-400'
                }`}
              >
                {canCreateProposal
                  ? '✓ Can create proposals'
                  : '◯ Below proposal threshold'}
              </div>
            </div>
          </div>

          {/* Token Information */}
          <div className="border-t border-gray-700 pt-4 space-y-3">
            <div className="terminal-bright text-sm">GOVERNANCE TOKEN</div>
            <div className="space-y-2">
              <div className="terminal-dim text-xs">TOKEN CONTRACT</div>
              <div className="terminal-text text-sm font-mono break-all">
                {mockUsdcAddress}
              </div>
            </div>
          </div>

          {/* Voting Power Status */}
          <div className="border-t border-gray-700 pt-4 space-y-3">
            <div className="terminal-bright text-sm">
              GOVERNANCE PARTICIPATION
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="terminal-dim text-xs">VOTING ELIGIBILITY</div>
                <div
                  className={`${
                    hasVotingPower ? 'text-green-400' : 'terminal-dim'
                  }`}
                >
                  {hasVotingPower ? '✓ Eligible' : '✗ Not Eligible'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="terminal-dim text-xs">PROPOSAL CREATION</div>
                <div
                  className={`${
                    canCreateProposal ? 'text-green-400' : 'terminal-dim'
                  }`}
                >
                  {canCreateProposal ? '✓ Enabled' : '✗ Disabled'}
                </div>
              </div>
            </div>

            {/* Progress Bar for Proposal Threshold */}
            {userVotingPower && proposalThreshold && (
              <div className="space-y-2">
                <div className="terminal-dim text-xs">
                  PROPOSAL THRESHOLD PROGRESS
                </div>
                <div className="bg-gray-700 h-2 rounded">
                  <div
                    className={`h-2 rounded transition-all ${
                      canCreateProposal ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        (Number(userVotingPower) / Number(proposalThreshold)) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="terminal-dim text-xs text-center">
                  {(
                    (Number(userVotingPower) / Number(proposalThreshold)) *
                    100
                  ).toFixed(1)}
                  %{canCreateProposal ? ' (Threshold met)' : ' of threshold'}
                </div>
              </div>
            )}
          </div>

          {/* How to Get Voting Power */}
          {!hasVotingPower && (
            <div className="border-t border-gray-700 pt-4 space-y-3">
              <div className="terminal-bright text-sm">
                HOW TO GET VOTING POWER
              </div>
              <div className="space-y-2 text-sm terminal-dim">
                <div>
                  • Participate in attestation activities to earn governance
                  tokens
                </div>
                <div>
                  • Claim your rewards from the rewards distribution system
                </div>
                <div>
                  • Voting power is determined by your token balance in the
                  merkle tree
                </div>
                <div>
                  • Check the rewards page to see if you have unclaimed tokens
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Voting Power Message */}
      {!isLoading && !hasVotingPower && (
        <div className="text-center py-6 border-t border-gray-700">
          <div className="terminal-dim text-sm">NO VOTING POWER DETECTED</div>
          <div className="system-message text-xs mt-2">
            ◆ PARTICIPATE IN ATTESTATIONS TO EARN GOVERNANCE RIGHTS ◆
          </div>
        </div>
      )}
    </div>
  )
}
