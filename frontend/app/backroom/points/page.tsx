'use client'

import { useQuery } from '@tanstack/react-query'
import {
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip,
} from 'chart.js'
import { DollarSign, Eye, FlaskConical, Hand } from 'lucide-react'
import type React from 'react'
import { ComponentType, useCallback, useMemo, useState } from 'react'
import { hexToNumber } from 'viem'
import { useAccount, useWatchContractEvent } from 'wagmi'

import { Card } from '@/components/Card'
import { wavsServiceId } from '@/lib/config'
import { merkleSnapshotAddress, merkleSnapshotConfig } from '@/lib/contracts'

import 'chartjs-adapter-luxon'

ChartJS.register(
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  TimeScale
)

const ActivityLabel: Record<string, string> = {
  joined: 'Joined',
  attestation: 'Attestation',
  prediction_market_trade: 'Hyperstition',
  prediction_market_redeem: 'Hyperstition Redemption',
}

const ActivityIcon: Record<string, ComponentType<{ className?: string }>> = {
  joined: FlaskConical,
  attestation: Hand,
  prediction_market_trade: Eye,
  prediction_market_redeem: DollarSign,
}

const ActivitySummary: Record<string, string> = {
  joined: 'Joined the experiment',
  attestation: 'Received an attestation',
  prediction_market_trade: 'Participated in a collective Hyperstition',
  prediction_market_redeem: 'Redeemed successful Hyperstition',
}

type Activity = {
  id: string
  type: string
  timestamp?: Date
  points: number
  metadata?: Record<string, any>
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
    queryKey: ['events', address],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:9090/${wavsServiceId}/events/${address}.json`
      )
      if (response.ok) {
        const events = (await response.json()) as {
          type: string
          timestamp: number
          value: string
          metadata?: Record<string, any>
        }[]

        return events.map(
          (event, index): Activity => ({
            id: index.toString(),
            type: event.type,
            timestamp: event.timestamp ? new Date(event.timestamp) : undefined,
            points: event.value.startsWith('0x')
              ? hexToNumber(event.value as `0x${string}`)
              : Number(event.value),
            metadata: event.metadata,
          })
        )
      }

      return []
    },
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

  const { types, cumulativePoints } = useMemo(() => {
    const types = [...new Set(activities.map((activity) => activity.type))]

    const cumulativePoints = [...activities]
      // Ascending order, with zero timestamps at the beginning.
      .sort(
        (a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
      )
      .reduce(
        (acc, activity, index) => [
          ...acc.filter(
            (point) => point.timestamp !== (activity.timestamp?.getTime() || 0)
          ),
          {
            timestamp: activity.timestamp?.getTime() || 0,
            points:
              index > 0
                ? acc[acc.length - 1].points + activity.points
                : activity.points,
          },
        ],
        [] as {
          timestamp: number
          points: number
        }[]
      )

    // Set all zero timestamps to the first nonzero timestamp.
    const firstNonZeroTimestamp = cumulativePoints.find(
      (point) => point.timestamp !== 0
    )?.timestamp
    if (firstNonZeroTimestamp) {
      cumulativePoints.forEach((point) => {
        if (point.timestamp === 0) {
          point.timestamp = firstNonZeroTimestamp
        }
      })
    }

    return { types, cumulativePoints }
  }, [activities])

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">POINTS</h1>
          <div className="text-red-400 text-lg mb-4">
            ⚠️ WALLET NOT CONNECTED
          </div>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view your points and contributions to the
            collective.
          </p>
          <div className="system-message">
            Neural link required for points tracking.
          </div>
        </div>
      </div>
    )
  }

  const pointsBreakdownChartData: ChartData<'line'> = {
    labels: cumulativePoints.map((point) => point.timestamp),
    datasets: [
      {
        data: cumulativePoints.map((point) => point.points),
        backgroundColor: '#dd70d4',
        borderWidth: 4,
        pointRadius: 1,
        fill: false,
        borderColor: '#dd70d4',
      },
    ],
  }

  const pointsBreakdownChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        intersect: false,
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'DD T',
        },
      },
    },
    spanGaps: true,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      {/* <div className="space-y-2 border border-gray-700 bg-card-foreground/70 p-6 rounded-sm hover:bg-card-foreground/75 transition-colors">
        <div className="terminal-command text-lg">POINTS</div>
        <div className="system-message">
          ⛤ Unlock incentives by contributing to the collective ⛤
        </div>
        <div className="terminal-text text-sm">
          Track your contributions and influence within the EN0VA collective
          intelligence network.
        </div>
      </div> */}

      <div className="flex flex-col lg:flex-row gap-y-4 gap-x-8 items-stretch">
        {/* Main content */}
        <div className="space-y-6 grow">
          <div className="flex flex-col justify-center items-center my-4 md:my-18">
            <div className="text-center space-y-3">
              <h1 className="text-lg">YOUR POINTS</h1>
              <div className="text-8xl font-bold font-mono">
                {cumulativePoints.length > 0
                  ? cumulativePoints[
                      cumulativePoints.length - 1
                    ].points.toLocaleString()
                  : 0}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch p-4 max-w-7xl gap-6 mx-auto">
            {/* <div className="flex flex-col items-center gap-4">
              <h1 className="text-xl">Points Breakdown</h1>
              <div className="w-156 h-96">
                <Line
                  data={pointsBreakdownChartData}
                  options={pointsBreakdownChartOptions}
                />
              </div>
            </div> */}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">RECENT ACTIVITY</h2>
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

            <div className="space-y-2">
              {activities
                .filter(
                  (activity) =>
                    selectedType === 'ALL' || activity.type === selectedType
                )
                .map((activity) => {
                  const Icon = ActivityIcon[activity.type]
                  const label = ActivityLabel[activity.type] || activity.type
                  const summary =
                    activity.metadata?.summary || ActivitySummary[activity.type]
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

            {/* Points Earning Guide Card */}
            <h2 className="text-lg font-bold text-white mt-8">
              EARN MORE POINTS
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
    </div>
  )
}
