'use client'

import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { CreateProposalForm } from '@/components/CreateProposalForm'
import { ProposalCard } from '@/components/ProposalCard'
import { Button } from '@/components/ui/button'
import { useOpenWalletConnector } from '@/components/WalletConnectionProvider'
import {
  ProposalAction,
  ProposalCore,
  useGovernance,
} from '@/hooks/useGovernance'

export default function GovernancePage() {
  const { isConnected } = useAccount()
  const openConnectWallet = useOpenWalletConnector()
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
    formatVotingPower,
    queueProposal,
    executeProposal,
    getAllProposals,
    getProposalStateText,
    merkleGovAddress,
    merkleVoteAddress,
    safeBalance,
    safeAddress,
  } = useGovernance()

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

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  console.log('userVotingPower', userVotingPower)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Governance</h1>
        <p className="text-muted-foreground text-sm">
          Decentralized decision making with merkle proof verification
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="border border-green-600 bg-green-50 p-3 rounded-md">
          <div className="text-green-700 text-sm font-medium">
            ✓ {successMessage}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="border border-destructive/50 bg-destructive/10 p-3 rounded-md">
          <div className="text-destructive text-sm font-medium">⚠️ {error}</div>
        </div>
      )}

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="border border-border bg-card p-6 rounded-md text-center space-y-4">
          <div className="text-lg font-medium">Wallet Connection Required</div>
          <div className="text-muted-foreground text-sm">
            Connect your wallet to participate in governance
          </div>
          <Button onClick={openConnectWallet} className="px-6 py-2">
            Connect Wallet
          </Button>
        </div>
      )}

      {/* Connected Content */}
      {isConnected && (
        <>
          {/* Compact Status Bar */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Left: Key Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs">Treasury</div>
                  <div className="font-mono font-semibold">
                    {safeBalance
                      ? `${(Number(safeBalance) / 1e18).toFixed(2)}`
                      : '0.00'}{' '}
                    ETH
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs">
                    Your Power
                  </div>
                  <div className="font-mono font-semibold">
                    {isLoading
                      ? '...'
                      : userVotingPower
                      ? userVotingPower.value
                      : '0'}
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs">Proposals</div>
                  <div className="font-mono font-semibold">
                    {proposalCounter}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showDetails ? '▴ Hide details' : '▾ Show details'}
                </button>
                {canCreateProposal && (
                  <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    size="sm"
                    disabled={
                      !userVotingPower || Number(userVotingPower.value) === 0
                    }
                  >
                    {showCreateForm ? 'Cancel' : '+ New Proposal'}
                  </Button>
                )}
              </div>
            </div>

            {/* Expandable Details */}
            {showDetails && (
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                {/* Voting Power Details */}
                {userVotingPower &&
                  Number(userVotingPower.value) > 0 &&
                  proposalThreshold && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Proposal threshold progress
                        </span>
                        <span
                          className={`font-medium ${
                            canCreateProposal
                              ? 'text-green-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {userVotingPower.value} / {proposalThreshold}
                        </span>
                      </div>
                      <div className="bg-muted h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            canCreateProposal
                              ? 'bg-green-600'
                              : 'bg-muted-foreground/40'
                          }`}
                          style={{
                            width: `${Math.min(
                              (Number(userVotingPower.value) /
                                Number(proposalThreshold)) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                {/* Governance Parameters */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Parameters
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Voting Delay</div>
                      <div className="font-mono">
                        {Math.floor(votingDelay / 3600)}h
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Voting Period</div>
                      <div className="font-mono">
                        {Math.floor(votingPeriod / 3600)}h
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Quorum</div>
                      <div className="font-mono">
                        {formatVotingPower(quorumBasisPoints.toString())}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">
                        Proposal Threshold
                      </div>
                      <div className="font-mono">
                        {proposalThreshold
                          ? formatVotingPower(proposalThreshold)
                          : '0'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract Addresses */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Contracts
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Zodiac Module</div>
                      <div className="font-mono text-xs break-all">
                        {merkleGovAddress || 'Not available'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">
                        Treasury (Safe)
                      </div>
                      <div className="font-mono text-xs break-all">
                        {safeAddress ? (
                          <a
                            href={`https://app.safe.global/home?safe=eth:${safeAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-primary transition-colors underline"
                          >
                            {safeAddress}
                          </a>
                        ) : (
                          'Not available'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Create Proposal Form - Conditional */}
          {showCreateForm && (
            <CreateProposalForm
              canCreateProposal={canCreateProposal}
              userVotingPower={userVotingPower?.value}
              proposalThreshold={proposalThreshold}
              onCreateProposal={async (actions, description) => {
                const result = await handleCreateProposal(actions, description)
                if (result) {
                  setShowCreateForm(false)
                }
                return result
              }}
              isLoading={isLoading}
              formatVotingPower={formatVotingPower}
            />
          )}

          {/* Proposals List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Proposals</h2>
              <div className="text-muted-foreground text-sm">
                {proposals.length}{' '}
                {proposals.length === 1 ? 'proposal' : 'proposals'}
              </div>
            </div>

            {isLoading && proposals.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-sm">
                  Loading proposals...
                </div>
              </div>
            )}

            {proposals.length === 0 && !isLoading && (
              <div className="border border-border bg-muted/30 p-12 rounded-md text-center space-y-3">
                <div className="text-foreground text-sm font-medium">
                  No proposals yet
                </div>
                <div className="text-muted-foreground text-xs">
                  {canCreateProposal
                    ? 'Be the first to create a governance proposal'
                    : 'Participate in attestations to earn proposal creation rights'}
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
    </div>
  )
}
