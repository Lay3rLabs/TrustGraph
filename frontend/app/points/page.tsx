'use client'

import { useQuery } from '@tanstack/react-query'
import { DollarSign, Eye, FlaskConical, Hand, Sparkles } from 'lucide-react'
import type React from 'react'
import { ComponentType, useCallback, useMemo, useState } from 'react'
import { Hex } from 'viem'
import { useAccount, useWatchContractEvent } from 'wagmi'

import { Card } from '@/components/Card'
import { merkleSnapshotAddress, merkleSnapshotConfig } from '@/lib/contracts'
import { pointsQueries } from '@/queries/points'

const ActivityLabel: Record<string, string> = {
  joined: 'Joined',
  attestation: 'Attestation',
  hyperstition_realized: 'Hyperstition Realized',
  prediction_market_trade: 'Hyperstition Participation',
  prediction_market_redeem: 'Hyperstition Redemption',
}

const ActivityIcon: Record<string, ComponentType<{ className?: string }>> = {
  joined: FlaskConical,
  attestation: Hand,
  hyperstition_realized: Sparkles,
  prediction_market_trade: Eye,
  prediction_market_redeem: DollarSign,
}

const ActivitySummary: Record<string, string> = {
  joined: 'Joined the experiment',
  attestation: 'Received an attestation',
  hyperstition_realized: 'Collectively realized a Hyperstition',
  prediction_market_trade: 'Participated in a Hyperstition',
  prediction_market_redeem: 'Redeemed a Hyperstition',
}

export default function PointsPage() {
  const { address, isConnected } = useAccount()
  const [selectedType, setSelectedType] = useState<string>('ALL')

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - timestamp.getTime()) / (1000 * 60)
    )

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const { data: activities = [], refetch: refetchActivities } = useQuery({
    ...pointsQueries.events(address as Hex),
    enabled: !!address,
    refetchInterval: 30_000,
  })

  // Watch for MerkleRootUpdated events to trigger data refresh
  const handleMerkleRootUpdated = useCallback(() => {
    console.log(
      '🌳 MerkleRootUpdated event detected - refreshing activities data'
    )
    refetchActivities()
  }, [refetchActivities])

  useWatchContractEvent({
    ...merkleSnapshotConfig,
    eventName: 'MerkleRootUpdated',
    onLogs: handleMerkleRootUpdated,
    enabled: !!merkleSnapshotAddress,
  })

  const { types, totalPoints } = useMemo(() => {
    const types = [...new Set(activities.map((activity) => activity.type))]
    const totalPoints = activities.reduce(
      (acc, activity) => acc + activity.points,
      0
    )

    return { types, totalPoints }
  }, [activities])

  const filteredActivities = activities.filter(
    (activity) => selectedType === 'ALL' || activity.type === selectedType
  )

  return (
    <div className="flex flex-col lg:flex-row gap-y-4 gap-x-8 items-stretch">
      {/* Main content */}
      <div className="space-y-6 grow">
        <div className="flex flex-col justify-center items-center my-4 md:my-18">
          <div className="text-center space-y-3">
            <h1 className="text-lg">YOUR POINTS</h1>
            {isConnected ? (
              <div className="text-8xl font-bold font-mono">
                {totalPoints.toLocaleString()}
              </div>
            ) : (
              <div className="terminal-dim">
                Connect a wallet to view your points
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-stretch p-4 max-w-7xl gap-6 mx-auto">
          {activities.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  RECENT ACTIVITY
                </h2>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="font-mono text-xs px-3 py-2 cursor-pointer bg-card-foreground/30 shadow-md"
                >
                  <option value="ALL">All</option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {filteredActivities.length > 0 ? (
                <div className="space-y-2">
                  {filteredActivities.map((activity) => {
                    const Icon = ActivityIcon[activity.type]
                    const label = ActivityLabel[activity.type] || activity.type
                    const summary =
                      activity.metadata?.summary ||
                      ActivitySummary[activity.type]
                    return (
                      <Card
                        key={activity.id}
                        type="detail"
                        size="sm"
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              {Icon && <Icon className="w-4 h-4" />}
                              <div className="text-white font-medium text-sm">
                                {label.toUpperCase()}
                              </div>
                            </div>
                            {summary && (
                              <div className="text-xs text-gray-400 mt-1">
                                {summary}
                              </div>
                            )}
                            {activity.timestamp && (
                              <div className="text-xs text-gray-400 mt-1">
                                {formatTimeAgo(activity.timestamp)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">
                            +{activity.points.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">points</div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="terminal-dim text-base">
                    NO MATCHING ACTIVITIES FOUND
                  </div>
                </div>
              )}
            </>
          )}

          {/* Points Earning Guide Card */}
          <h2 className="text-lg font-bold text-white mt-8">
            {activities.length > 0 ? 'EARN MORE POINTS' : 'HOW TO EARN POINTS'}
          </h2>
          <Card
            type="detail"
            size="md"
            className="grow grid grid-cols-1 gap-6 md:grid-cols-2 md:justify-center md:gap-8"
          >
            <div className="terminal-text text-sm space-y-2">
              <div className="system-message">◉ HYPERSTITION MARKETS</div>
              <ul className="terminal-dim text-xs pl-4 list-disc">
                <li>Participate in active Hyperstitions</li>
                <li>Redeem winning predictions</li>
                <li>Experience collective manifestation</li>
              </ul>
            </div>

            <div className="terminal-text text-sm space-y-2">
              <div className="system-message">◆ ATTESTATIONS</div>
              <ul className="terminal-dim text-xs pl-4 list-disc">
                <li>Verify statements</li>
                <li>Validate data integrity</li>
                <li>Create trust networks</li>
              </ul>
            </div>

            <div className="terminal-text text-sm space-y-2">
              <div className="system-message">◢◤ GOVERNANCE</div>
              <ul className="terminal-dim text-xs pl-4 list-disc">
                <li>Build consensus</li>
                <li>Shape the future direction</li>
                <li>Vote on collective decisions</li>
              </ul>
            </div>

            <div className="terminal-text text-sm space-y-2">
              <div className="system-message">▲ SOCIAL AMPLIFICATION</div>
              <ul className="terminal-dim text-xs pl-4 list-disc">
                <li>Share EN0VA content</li>
                <li>Refer new members</li>
                <li>Boost network effects</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
