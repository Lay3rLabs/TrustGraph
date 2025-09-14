'use client'

import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

import { CreateProposalForm } from '@/components/CreateProposalForm'
import { ProposalCard } from '@/components/ProposalCard'
import { Button } from '@/components/ui/button'
import { VotingPowerCard } from '@/components/VotingPowerCard'
import {
  ProposalAction,
  ProposalCore,
  useGovernance,
} from '@/hooks/useGovernance'

export default function GovernancePage() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const [proposals, setProposals] = useState<
    { core: ProposalCore; actions: ProposalAction[] }[]
  >([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    isLoading,
    error,
    proposalCounter,
    proposalThreshold,
    votingDelay,
    votingPeriod,
    quorumBasisPoints,
    userVotingPower,
    merkleData,
    canCreateProposal,
    createProposal,
    castVote,
    queueProposal,
    executeProposal,
    getAllProposals,
    formatVotingPower,
    getProposalStateText,
    merkleGovAddress,
    merkleVoteAddress,
    safeBalance,
    safeAddress,
  } = useGovernance()

  const handleConnect = useCallback(() => {
    try {
      connect({ connector: injected() })
    } catch (err) {
      console.error('Failed to connect wallet:', err)
    }
  }, [connect])

  // Load proposals when connected
  useEffect(() => {
    const loadProposals = async () => {
      if (isConnected && proposalCounter > 0) {
        const allProposals = await getAllProposals()
        setProposals(allProposals)
      }
    }

    loadProposals()
  }, [isConnected, proposalCounter, getAllProposals])

  const handleCreateProposal = useCallback(
    async (actions: ProposalAction[], description: string) => {
      setSuccessMessage(null)
      const hash = await createProposal(actions, description)
      if (hash) {
        setSuccessMessage(`Proposal created successfully! Transaction: ${hash}`)
        setTimeout(() => setSuccessMessage(null), 5000)
        // Reload proposals
        const allProposals = await getAllProposals()
        setProposals(allProposals)
      }
      return hash
    },
    [createProposal, getAllProposals]
  )

  const handleVote = useCallback(
    async (proposalId: number, support: number) => {
      setSuccessMessage(null)
      const hash = await castVote(proposalId, support)
      if (hash) {
        const voteText =
          support === 1 ? 'FOR' : support === 0 ? 'AGAINST' : 'ABSTAIN'
        setSuccessMessage(`Vote cast ${voteText}! Transaction: ${hash}`)
        setTimeout(() => setSuccessMessage(null), 5000)
        // Reload proposals to update vote counts
        const allProposals = await getAllProposals()
        setProposals(allProposals)
      }
      return hash
    },
    [castVote, getAllProposals]
  )

  const handleQueue = useCallback(
    async (proposalId: number) => {
      setSuccessMessage(null)
      const hash = await queueProposal(proposalId)
      if (hash) {
        setSuccessMessage(`Proposal queued! Transaction: ${hash}`)
        setTimeout(() => setSuccessMessage(null), 5000)
        // Reload proposals
        const allProposals = await getAllProposals()
        setProposals(allProposals)
      }
      return hash
    },
    [queueProposal, getAllProposals]
  )

  const handleExecute = useCallback(
    async (proposalId: number) => {
      setSuccessMessage(null)
      const hash = await executeProposal(proposalId)
      if (hash) {
        setSuccessMessage(`Proposal executed! Transaction: ${hash}`)
        setTimeout(() => setSuccessMessage(null), 5000)
        // Reload proposals
        const allProposals = await getAllProposals()
        setProposals(allProposals)
      }
      return hash
    },
    [executeProposal, getAllProposals]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="terminal-command text-lg">MERKLE GOVERNANCE SYSTEM</div>
        <div className="system-message">
          ◢◤ Decentralized decision making with merkle proof verification ◢◤
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="border border-green-700 bg-green-900/10 p-3 rounded-sm">
          <div className="text-green-400 text-sm">✓ {successMessage}</div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="border border-red-700 bg-red-900/10 p-3 rounded-sm">
          <div className="text-red-400 text-sm">⚠️ {error}</div>
        </div>
      )}

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="border border-gray-700 bg-black/10 p-6 rounded-sm text-center space-y-4">
          <div className="terminal-text text-lg">
            WALLET CONNECTION REQUIRED
          </div>
          <div className="terminal-dim text-sm">
            Connect your wallet to participate in governance
          </div>
          <Button
            onClick={handleConnect}
            className="mobile-terminal-btn !px-6 !py-2"
          >
            <span className="terminal-command text-xs">CONNECT WALLET</span>
          </Button>
        </div>
      )}

      {/* Debug Info */}
      {isConnected && (
        <div className="border border-yellow-700 bg-yellow-900/10 p-3 rounded-sm">
          <div className="text-yellow-400 text-sm">
            DEBUG: merkleData={merkleData ? 'present' : 'null'},
            userVotingPower={userVotingPower ? 'present' : 'null'},
            canCreateProposal={canCreateProposal.toString()}
          </div>
        </div>
      )}

      {/* Connected Content */}
      {isConnected && (
        <>
          {/* Voting Power Card */}
          <VotingPowerCard
            userVotingPower={userVotingPower?.value}
            proposalThreshold={proposalThreshold}
            canCreateProposal={canCreateProposal}
            merkleData={merkleData}
            formatVotingPower={formatVotingPower}
            isLoading={isLoading}
          />

          {/* Safe Info Card */}
          <div className="border border-blue-700 bg-blue-900/10 p-4 rounded-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="terminal-bright text-lg">
                GNOSIS SAFE TREASURY
              </div>
              <Button
                onClick={() =>
                  window.open(
                    `https://app.safe.global/home?safe=eth:${safeAddress}`,
                    '_blank'
                  )
                }
                className="mobile-terminal-btn !px-3 !py-1 text-xs"
                disabled={!safeAddress}
              >
                <span className="terminal-command">OPEN SAFE →</span>
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="terminal-dim text-xs">ETH BALANCE:</span>
                <span className="terminal-bright text-sm">
                  {safeBalance ? `${Number(safeBalance) / 1e18} ETH` : '0 ETH'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="terminal-dim text-xs">SAFE ADDRESS:</span>
                <span className="terminal-text text-xs font-mono break-all">
                  {safeAddress || 'N/A'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="terminal-dim text-xs">MERKLE GOV MODULE:</span>
                <span className="terminal-text text-xs font-mono break-all">
                  {merkleGovAddress}
                </span>
              </div>
            </div>
            <div className="system-message text-xs mt-2">
              ◆ MULTI-SIG TREASURY ◆
            </div>
          </div>

          {/* Governance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="terminal-dim text-xs mb-2">TOTAL PROPOSALS</div>
              <div className="terminal-bright text-xl">{proposalCounter}</div>
              <div className="system-message text-xs mt-1">
                on-chain governance
              </div>
            </div>

            <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="terminal-dim text-xs mb-2">VOTING DELAY</div>
              <div className="terminal-bright text-xl">
                {Math.floor(votingDelay / 3600)}h
              </div>
              <div className="system-message text-xs mt-1">
                before voting starts
              </div>
            </div>

            <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="terminal-dim text-xs mb-2">VOTING PERIOD</div>
              <div className="terminal-bright text-xl">
                {Math.floor(votingPeriod / 3600)}h
              </div>
              <div className="system-message text-xs mt-1">to cast votes</div>
            </div>

            <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="terminal-dim text-xs mb-2">QUORUM REQUIRED</div>
              <div className="terminal-bright text-xl">
                {formatVotingPower(quorumBasisPoints.toString())}
              </div>
              <div className="system-message text-xs mt-1">
                voting power tokens
              </div>
            </div>
          </div>

          {/* Create Proposal Form */}
          <CreateProposalForm
            canCreateProposal={canCreateProposal}
            userVotingPower={userVotingPower?.value}
            proposalThreshold={proposalThreshold}
            onCreateProposal={handleCreateProposal}
            isLoading={isLoading}
            formatVotingPower={formatVotingPower}
          />

          {/* Proposals List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="terminal-text text-lg">PROPOSALS</div>
              <div className="terminal-dim text-sm">
                {proposals.length} of {proposalCounter} loaded
              </div>
            </div>

            {isLoading && proposals.length === 0 && (
              <div className="text-center py-8">
                <div className="terminal-bright text-sm">
                  ◉ LOADING PROPOSALS ◉
                </div>
              </div>
            )}

            {proposals.length === 0 && !isLoading && (
              <div className="border border-gray-700 bg-black/10 p-8 rounded-sm text-center">
                <div className="terminal-dim text-sm">NO PROPOSALS FOUND</div>
                <div className="system-message text-xs mt-2">
                  ◆ BE THE FIRST TO CREATE A GOVERNANCE PROPOSAL ◆
                </div>
              </div>
            )}

            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.core.id.toString()}
                proposal={proposal.core}
                actions={proposal.actions}
                userVotingPower={userVotingPower?.value}
                onVote={handleVote}
                onQueue={handleQueue}
                onExecute={handleExecute}
                isLoading={isLoading}
                formatVotingPower={formatVotingPower}
                getProposalStateText={getProposalStateText}
              />
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 mt-8">
        <div className="system-message text-center text-sm">
          ∞ MERKLE PROOFS • DECENTRALIZED GOVERNANCE • COLLECTIVE INTELLIGENCE ∞
        </div>
      </div>
    </div>
  )
}
