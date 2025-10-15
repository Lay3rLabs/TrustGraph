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
    <div className="border border-gray-300 bg-white p-6 rounded-sm space-y-4 shadow-sm">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="ascii-art-title text-lg text-gray-900">
              PROPOSAL #{proposalId}
            </div>
            <div className="terminal-dim text-xs text-gray-600">
              Proposer: {proposal.proposer.slice(0, 10)}...
              {proposal.proposer.slice(-8)}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`text-xs px-2 py-1 rounded border ${
                isActive
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : state === ProposalState.Succeeded
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : state === ProposalState.Executed
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-400 bg-gray-50 text-gray-700'
              }`}
            >
              {getProposalStateText(state)}
            </div>
            {getTimeLeft() && (
              <div className="terminal-dim text-xs text-gray-600">
                {getTimeLeft()}
              </div>
            )}
          </div>
        </div>

        <div className="terminal-text text-sm text-gray-800">
          {proposal.description}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="border border-green-500 bg-green-50 p-3 rounded-sm">
          <div className="text-green-700 text-sm">✓ {successMessage}</div>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="border-t border-gray-300 pt-4 space-y-3">
          <div className="terminal-bright text-sm font-semibold text-gray-900">
            PROPOSED ACTIONS
          </div>
          {actions.map((action, index) => (
            <div
              key={index}
              className="border border-gray-300 bg-gray-50 p-3 rounded-sm space-y-2"
            >
              <div className="flex justify-between items-start">
                <div className="terminal-dim text-xs text-gray-600">
                  ACTION #{index + 1}
                </div>
                {action.value !== '0' && (
                  <div className="terminal-text text-xs text-gray-800">
                    {formatVotingPower(action.value)} ETH
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="terminal-dim text-xs text-gray-600">TARGET</div>
                <div className="terminal-text text-sm font-mono break-all text-gray-800">
                  {action.target}
                </div>
              </div>
              {action.description && (
                <div className="space-y-1">
                  <div className="terminal-dim text-xs text-gray-600">
                    DESCRIPTION
                  </div>
                  <div className="terminal-text text-sm text-gray-800">
                    {action.description}
                  </div>
                </div>
              )}
              {action.data !== '0x' && (
                <div className="space-y-1">
                  <div className="terminal-dim text-xs text-gray-600">
                    CALLDATA
                  </div>
                  <div className="terminal-text text-xs font-mono break-all text-gray-800">
                    {action.data.slice(0, 100)}...
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vote Results */}
      <div className="border-t border-gray-300 pt-4 space-y-3">
        <div className="terminal-bright text-sm font-semibold text-gray-900">
          VOTING RESULTS
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="terminal-dim text-gray-600">FOR</span>
              <span className="terminal-text text-gray-800">
                {proposal.forVotes.toString()}
              </span>
            </div>
            <div className="bg-gray-200 h-2 rounded">
              <div
                className="bg-green-600 h-2 rounded transition-all"
                style={{ width: `${forPercentage}%` }}
              />
            </div>
            <div className="terminal-dim text-center text-gray-600">
              {forPercentage.toFixed(1)}%
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="terminal-dim text-gray-600">AGAINST</span>
              <span className="terminal-text text-gray-800">
                {proposal.againstVotes.toString()}
              </span>
            </div>
            <div className="bg-gray-200 h-2 rounded">
              <div
                className="bg-red-600 h-2 rounded transition-all"
                style={{ width: `${againstPercentage}%` }}
              />
            </div>
            <div className="terminal-dim text-center text-gray-600">
              {againstPercentage.toFixed(1)}%
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="terminal-dim text-gray-600">ABSTAIN</span>
              <span className="terminal-text text-gray-800">
                {proposal.abstainVotes.toString()}
              </span>
            </div>
            <div className="bg-gray-200 h-2 rounded">
              <div
                className="bg-yellow-600 h-2 rounded transition-all"
                style={{ width: `${abstainPercentage}%` }}
              />
            </div>
            <div className="terminal-dim text-center text-gray-600">
              {abstainPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="terminal-dim text-xs text-center text-gray-600">
          Total: {totalVotes.toString()} votes
        </div>
      </div>

      {/* Voting Buttons */}
      {canVote && (
        <div className="border-t border-gray-300 pt-4 space-y-3">
          <div className="terminal-bright text-sm font-semibold text-gray-900">
            CAST YOUR VOTE
          </div>
          <div className="terminal-dim text-xs text-gray-600">
            Your voting power: {userVotingPower!}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleVote(VoteType.For)}
              disabled={isVoting || isLoading}
              variant="outline"
              className="flex-1 border-green-600 text-green-700 hover:bg-green-50 mobile-terminal-btn !px-4 !py-2"
            >
              <span className="terminal-command text-xs">VOTE FOR</span>
            </Button>
            <Button
              onClick={() => handleVote(VoteType.Against)}
              disabled={isVoting || isLoading}
              variant="outline"
              className="flex-1 border-red-600 text-red-700 hover:bg-red-50 mobile-terminal-btn !px-4 !py-2"
            >
              <span className="terminal-command text-xs">VOTE AGAINST</span>
            </Button>
            <Button
              onClick={() => handleVote(VoteType.Abstain)}
              disabled={isVoting || isLoading}
              variant="outline"
              className="flex-1 border-gray-500 text-gray-700 hover:bg-gray-50 mobile-terminal-btn !px-4 !py-2"
            >
              <span className="terminal-command text-xs">ABSTAIN</span>
            </Button>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      {isSucceeded && (
        <div className="border-t border-gray-300 pt-4 space-y-3">
          <div className="terminal-bright text-sm font-semibold text-gray-900">
            PROPOSAL EXECUTION
          </div>
          <div className="terminal-dim text-xs mb-3 text-gray-600">
            Succeeded proposals can be executed immediately
          </div>
          <div className="flex gap-3">
            {onExecute && (
              <Button
                onClick={handleExecute}
                disabled={isLoading}
                variant="outline"
                className="border-purple-600 text-purple-700 hover:bg-purple-50 mobile-terminal-btn !px-4 !py-2"
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
        <div className="border-t border-gray-300 pt-4 text-center">
          <div className="terminal-dim text-sm text-gray-600">
            NO VOTING POWER
          </div>
          <div className="system-message text-xs mt-2 text-gray-700">
            ◆ YOU NEED VOTING POWER TO PARTICIPATE IN GOVERNANCE ◆
          </div>
        </div>
      )}
    </div>
  )
}
