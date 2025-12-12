'use client'

import { ExternalLink } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { Address } from '@/components/Address'
import { Button } from '@/components/Button'
import { CreateProposalForm } from '@/components/CreateProposalForm'
import { ProposalCard } from '@/components/ProposalCard'
import { StatisticCard } from '@/components/StatisticCard'
import { useOpenWalletConnector } from '@/components/WalletConnectionProvider'
import {
  ProposalAction,
  ProposalCore,
  VoteType,
  useGovernance,
} from '@/hooks/useGovernance'
import { formatBigNumber } from '@/lib/utils'

export default function GovernancePage() {
  const { isConnected } = useAccount()
  const openConnectWallet = useOpenWalletConnector()
  const [proposals, setProposals] = useState<
    { core: ProposalCore; actions: ProposalAction[] }[]
  >([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    isAnyActionLoading,
    isLoadingProposals,
    isLoadingUserVotingPower,
    isLoadingModule,
    isLoadingSafeBalance,
    error,
    proposalCounter,
    votingDelay,
    votingPeriod,
    quorum,
    userVotingPower,
    totalVotingPower,
    canCreateProposal,
    createProposal,
    castVote,
    queueProposal,
    executeProposal,
    getAllProposals,
    getProposalStateText,
    merkleGovAddress,
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
    async (
      title: string,
      description: string,
      actions: ProposalAction[],
      voteType?: VoteType | null
    ) => {
      setSuccessMessage(null)
      const hash = await createProposal(title, description, actions, voteType)
      if (hash) {
        setSuccessMessage(
          voteType === undefined || voteType === null
            ? `Proposal created successfully! Transaction: ${hash}`
            : `Proposal created & vote cast! Transaction: ${hash}`
        )
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
    async (proposalId: number, voteType: number) => {
      setSuccessMessage(null)
      const hash = await castVote(proposalId, voteType)
      if (hash) {
        const voteText =
          voteType === VoteType.Yes
            ? 'FOR'
            : voteType === VoteType.No
              ? 'AGAINST'
              : 'ABSTAIN'
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

  const isLoading = isLoadingModule || isLoadingSafeBalance

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Governance</h1>
          <p className="text-muted-foreground text-sm">
            Decentralized decision making with merkle proof verification
          </p>
        </div>

        {/* Key Statistics - Right under header */}
        {isConnected && (
          <div className="flex flex-row gap-4 flex-wrap">
            <StatisticCard
              title="TREASURY BALANCE"
              tooltip="The total ETH balance held in the governance treasury (Safe). This can be distributed through governance proposals."
              value={
                isLoading
                  ? '...'
                  : safeBalance
                    ? `${(Number(safeBalance) / 1e18).toFixed(2)} ETH`
                    : '0.00 ETH'
              }
            />
            <StatisticCard
              title="TOTAL PROPOSALS"
              tooltip="The total number of governance proposals that have been created."
              value={isLoadingModule ? '...' : String(proposalCounter)}
            />
            <StatisticCard
              title="YOUR VOTING POWER"
              tooltip="Your voting power as a percentage of total voting power. This is based on your Trust Score in the network."
              value={
                isLoadingUserVotingPower || isLoadingModule
                  ? '...'
                  : userVotingPower && totalVotingPower
                    ? formatBigNumber(
                        (Number(userVotingPower.value) /
                          Number(totalVotingPower)) *
                          100
                      ) + '%'
                    : '0%'
              }
            />
          </div>
        )}
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
          {/* Parameters & Contracts */}
          <div className="border-y border-border py-6 space-y-4">
            <h2 className="font-bold">PARAMETERS</h2>
            <div className="flex flex-row gap-4 flex-wrap">
              <StatisticCard
                title="VOTING DELAY"
                tooltip="The number of blocks that must pass after a proposal is created before voting can begin."
                value={
                  isLoadingModule
                    ? '...'
                    : `${formatBigNumber(votingDelay)} blocks`
                }
              />
              <StatisticCard
                title="VOTING PERIOD"
                tooltip="The number of blocks during which voting is open."
                value={
                  isLoadingModule
                    ? '...'
                    : `${formatBigNumber(votingPeriod, undefined, true)} blocks`
                }
              />
              <StatisticCard
                title="QUORUM"
                tooltip="The minimum percentage of total voting power that must participate for a proposal to be valid."
                value={
                  isLoadingModule ? '...' : `${formatBigNumber(quorum * 100)}%`
                }
              />
            </div>

            <h2 className="font-bold mt-6">CONTRACTS</h2>

            {/* Contract Addresses */}
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-bold">Zodiac Module:</span>
                {merkleGovAddress ? (
                  <Address
                    address={merkleGovAddress}
                    displayMode="truncated"
                    showCopyIcon
                    link={false}
                    noHighlight
                  />
                ) : (
                  <span>Not available</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Treasury Safe:</span>
                {isLoadingModule ? (
                  <span>...</span>
                ) : safeAddress ? (
                  <>
                    <Address
                      address={safeAddress}
                      displayMode="truncated"
                      showCopyIcon
                      link={false}
                      noHighlight
                    />
                    <a
                      href={`https://app.safe.global/home?safe=eth:${safeAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:text-brand/80 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <span>Not available</span>
                )}
              </div>
            </div>
          </div>

          {/* Proposals Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">PROPOSALS</h2>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                size="sm"
              >
                {showCreateForm ? 'Cancel' : '+ New Proposal'}
              </Button>
            </div>

            {/* Create Proposal Form - Conditional */}
            {showCreateForm && (
              <CreateProposalForm
                canCreateProposal={canCreateProposal}
                userVotingPower={userVotingPower?.value}
                onCreateProposal={async (
                  title,
                  description,
                  actions,
                  voteType
                ) => {
                  const result = await handleCreateProposal(
                    title,
                    description,
                    actions,
                    voteType
                  )
                  if (result) {
                    setShowCreateForm(false)
                  }
                  return result
                }}
                isLoading={isAnyActionLoading}
              />
            )}

            {/* Proposals List */}
            {!isLoadingProposals && (
              <div className="text-muted-foreground text-sm">
                {formatBigNumber(proposals.length)}{' '}
                {proposals.length === 1 ? 'proposal' : 'proposals'}
              </div>
            )}

            {isLoadingProposals && proposals.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-sm">
                  Loading proposals...
                </div>
              </div>
            )}

            {proposals.length === 0 && !isLoadingProposals && (
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
                isLoading={isAnyActionLoading}
                getProposalStateText={getProposalStateText}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
