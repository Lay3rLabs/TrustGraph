'use client'

import type React from 'react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  ProposalAction,
  ProposalCore,
  ProposalState,
  VoteType,
} from '@/hooks/useGovernance'

interface ProposalCardProps {
  proposal: ProposalCore
  actions: ProposalAction[]
  userVotingPower?: string
  onVote?: (proposalId: number, support: VoteType) => Promise<string | null>
  onQueue?: (proposalId: number) => Promise<string | null>
  onExecute?: (proposalId: number) => Promise<string | null>
  isLoading?: boolean
  formatVotingPower?: (amount: string) => string
  getProposalStateText?: (state: number) => string
}

export function ProposalCard({
  proposal,
  actions,
  userVotingPower,
  onVote,
  onQueue,
  onExecute,
  isLoading = false,
  formatVotingPower = (amount) => amount,
  getProposalStateText = (state) => `State ${state}`,
}: ProposalCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const proposalId = Number(proposal.id)
  const state = proposal.state
  const isActive = state === ProposalState.Active
  const isSucceeded = state === ProposalState.Succeeded
  const isQueued = state === ProposalState.Queued
  const canVote = isActive && userVotingPower && Number(userVotingPower) > 0

  // Calculate total votes and percentages
  const totalVotes =
    Number(proposal.forVotes) +
    Number(proposal.againstVotes) +
    Number(proposal.abstainVotes)
  const forPercentage =
    totalVotes > 0 ? (Number(proposal.forVotes) / totalVotes) * 100 : 0
  const againstPercentage =
    totalVotes > 0 ? (Number(proposal.againstVotes) / totalVotes) * 100 : 0
  const abstainPercentage =
    totalVotes > 0 ? (Number(proposal.abstainVotes) / totalVotes) * 100 : 0

  // Block-based timing for MerkleGovModule
  // Note: In a real app, you'd want to get current block number and estimate block times
  const startBlock = Number(proposal.startBlock || 0)
  const endBlock = Number(proposal.endBlock || 0)

  const getTimeLeft = () => {
    // Since we don't have current block number easily available in the frontend,
    // we'll show block numbers instead of estimated time
    if (state === ProposalState.Pending) {
      return `Starts at block ${startBlock}`
    } else if (isActive) {
      return `Ends at block ${endBlock}`
    }
    return null
  }

  const handleVote = useCallback(
    async (support: VoteType) => {
      if (!onVote || !canVote) return

      setIsVoting(true)
      setSuccessMessage(null)

      try {
        const hash = await onVote(proposalId, support)
        if (hash) {
          const voteText =
            support === VoteType.For
              ? 'FOR'
              : support === VoteType.Against
              ? 'AGAINST'
              : 'ABSTAIN'
          setSuccessMessage(`Vote cast ${voteText}! Transaction: ${hash}`)
          setTimeout(() => setSuccessMessage(null), 5000)
        }
      } catch (err) {
        console.error('Error voting:', err)
      } finally {
        setIsVoting(false)
      }
    },
    [onVote, canVote, proposalId]
  )

  const handleQueue = useCallback(async () => {
    if (!onQueue) return

    const hash = await onQueue(proposalId)
    if (hash) {
      setSuccessMessage(`Proposal queued! Transaction: ${hash}`)
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }, [onQueue, proposalId])

  const handleExecute = useCallback(async () => {
    if (!onExecute) return

    const hash = await onExecute(proposalId)
    if (hash) {
      setSuccessMessage(`Proposal executed! Transaction: ${hash}`)
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }, [onExecute, proposalId])

  return (
    <div className="border border-gray-700 bg-black/10 p-6 rounded-sm space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="ascii-art-title text-lg">
              PROPOSAL #{proposalId}
            </div>
            <div className="terminal-dim text-xs">
              Proposer: {proposal.proposer.slice(0, 10)}...
              {proposal.proposer.slice(-8)}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`text-xs px-2 py-1 rounded border ${
                isActive
                  ? 'border-green-700 bg-green-900/20 text-green-400'
                  : state === ProposalState.Succeeded
                  ? 'border-blue-700 bg-blue-900/20 text-blue-400'
                  : state === ProposalState.Executed
                  ? 'border-purple-700 bg-purple-900/20 text-purple-400'
                  : 'border-gray-700 bg-gray-900/20 text-gray-400'
              }`}
            >
              {getProposalStateText(state)}
            </div>
            {getTimeLeft() && (
              <div className="terminal-dim text-xs">{getTimeLeft()}</div>
            )}
          </div>
        </div>

        <div className="terminal-text text-sm">{proposal.description}</div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="border border-green-700 bg-green-900/10 p-3 rounded-sm">
          <div className="text-green-400 text-sm">✓ {successMessage}</div>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="border-t border-gray-700 pt-4 space-y-3">
          <div className="terminal-bright text-sm">PROPOSED ACTIONS</div>
          {actions.map((action, index) => (
            <div
              key={index}
              className="border border-gray-700 p-3 rounded-sm space-y-2"
            >
              <div className="flex justify-between items-start">
                <div className="terminal-dim text-xs">ACTION #{index + 1}</div>
                {action.value !== '0' && (
                  <div className="terminal-text text-xs">
                    {formatVotingPower(action.value)} ETH
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="terminal-dim text-xs">TARGET</div>
                <div className="terminal-text text-sm font-mono break-all">
                  {action.target}
                </div>
              </div>
              {action.description && (
                <div className="space-y-1">
                  <div className="terminal-dim text-xs">DESCRIPTION</div>
                  <div className="terminal-text text-sm">
                    {action.description}
                  </div>
                </div>
              )}
              {action.data !== '0x' && (
                <div className="space-y-1">
                  <div className="terminal-dim text-xs">CALLDATA</div>
                  <div className="terminal-text text-xs font-mono break-all">
                    {action.data.slice(0, 100)}...
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vote Results */}
      <div className="border-t border-gray-700 pt-4 space-y-3">
        <div className="terminal-bright text-sm">VOTING RESULTS</div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="terminal-dim">FOR</span>
              <span className="terminal-text">
                {formatVotingPower(proposal.forVotes.toString())}
              </span>
            </div>
            <div className="bg-gray-700 h-2 rounded">
              <div
                className="bg-green-500 h-2 rounded transition-all"
                style={{ width: `${forPercentage}%` }}
              />
            </div>
            <div className="terminal-dim text-center">
              {forPercentage.toFixed(1)}%
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="terminal-dim">AGAINST</span>
              <span className="terminal-text">
                {formatVotingPower(proposal.againstVotes.toString())}
              </span>
            </div>
            <div className="bg-gray-700 h-2 rounded">
              <div
                className="bg-red-500 h-2 rounded transition-all"
                style={{ width: `${againstPercentage}%` }}
              />
            </div>
            <div className="terminal-dim text-center">
              {againstPercentage.toFixed(1)}%
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="terminal-dim">ABSTAIN</span>
              <span className="terminal-text">
                {formatVotingPower(proposal.abstainVotes.toString())}
              </span>
            </div>
            <div className="bg-gray-700 h-2 rounded">
              <div
                className="bg-yellow-500 h-2 rounded transition-all"
                style={{ width: `${abstainPercentage}%` }}
              />
            </div>
            <div className="terminal-dim text-center">
              {abstainPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="terminal-dim text-xs text-center">
          Total: {formatVotingPower(totalVotes.toString())} votes
        </div>
      </div>

      {/* Voting Buttons */}
      {canVote && (
        <div className="border-t border-gray-700 pt-4 space-y-3">
          <div className="terminal-bright text-sm">CAST YOUR VOTE</div>
          <div className="terminal-dim text-xs">
            Your voting power: {formatVotingPower(userVotingPower!)}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleVote(VoteType.For)}
              disabled={isVoting || isLoading}
              variant="outline"
              className="flex-1 border-green-700 text-green-400 hover:bg-green-900/20 mobile-terminal-btn !px-4 !py-2"
            >
              <span className="terminal-command text-xs">VOTE FOR</span>
            </Button>
            <Button
              onClick={() => handleVote(VoteType.Against)}
              disabled={isVoting || isLoading}
              variant="outline"
              className="flex-1 border-red-700 text-red-400 hover:bg-red-900/20 mobile-terminal-btn !px-4 !py-2"
            >
              <span className="terminal-command text-xs">VOTE AGAINST</span>
            </Button>
            <Button
              onClick={() => handleVote(VoteType.Abstain)}
              disabled={isVoting || isLoading}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-400 hover:bg-gray-900/20 mobile-terminal-btn !px-4 !py-2"
            >
              <span className="terminal-command text-xs">ABSTAIN</span>
            </Button>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      {isSucceeded && (
        <div className="border-t border-gray-700 pt-4 space-y-3">
          <div className="terminal-bright text-sm">PROPOSAL EXECUTION</div>
          <div className="terminal-dim text-xs mb-3">
            Succeeded proposals can be executed immediately
          </div>
          <div className="flex gap-3">
            {onExecute && (
              <Button
                onClick={handleExecute}
                disabled={isLoading}
                variant="outline"
                className="border-purple-700 text-purple-400 hover:bg-purple-900/20 mobile-terminal-btn !px-4 !py-2"
              >
                <span className="terminal-command text-xs">
                  EXECUTE PROPOSAL
                </span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* No Voting Power Message */}
      {isActive && (!userVotingPower || Number(userVotingPower) === 0) && (
        <div className="border-t border-gray-700 pt-4 text-center">
          <div className="terminal-dim text-sm">NO VOTING POWER</div>
          <div className="system-message text-xs mt-2">
            ◆ YOU NEED VOTING POWER TO PARTICIPATE IN GOVERNANCE ◆
          </div>
        </div>
      )}
    </div>
  )
}
