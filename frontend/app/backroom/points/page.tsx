'use client'

import type React from 'react'
import { ComponentType, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import clsx from 'clsx'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  TimeScale,
  ChartData,
} from 'chart.js'
import { ChevronLeft, Eye, Hand, FlaskConical } from 'lucide-react'
import 'chartjs-adapter-luxon'
import { useQuery } from '@tanstack/react-query'
import { hexToNumber } from 'viem'
import { wavsServiceId } from '@/lib/config'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  TimeScale
)

type PieLevel = {
  title: string
  values: {
    title: string
    value: number
    color: string
    subPie?: Omit<PieLevel, 'title'> & { title?: string }
  }[]
  /**
   * Set when entering a sub-pie. Used to reset to parent pie when leaving.
   */
  parent?: PieLevel
}

const ActivityTypeIcon: Record<
  string,
  ComponentType<{ className?: string }>
> = {
  vouch: Hand,
  hyperstition: Eye,
  joined: FlaskConical,
}

const ActivitySummary: Record<string, string> = {
  vouch: 'Vouched for a contributor',
  hyperstition: 'Bought YES position in a Hyperstition market',
  joined: 'Joined the Experiment',
}

type Activity = {
  id: string
  type: string
  summary: string
  timestamp?: Date
  points: number
}

const rank = 1000
const numRanks = 1000

// const activities: Activity[] = [
//   {
//     id: '1',
//     type: ActivityType.Joined,
//     summary: 'Joined the Experiment',
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
//     points: 1,
//   },
//   // {
//   //   id: '2',
//   //   type: ActivityType.Vouch,
//   //   summary: 'Vouched for a contributor',
//   //   timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18),
//   //   points: 50,
//   // },
//   // {
//   //   id: '3',
//   //   type: ActivityType.Hyperstition,
//   //   summary: 'Bought YES position in a Hyperstition market',
//   //   timestamp: new Date(Date.now() - 1000 * 60 * 60 * 17),
//   //   points: 50,
//   // },
//   // {
//   //   id: '4',
//   //   type: ActivityType.Vouch,
//   //   summary: 'Vouched for a contributor',
//   //   timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
//   //   points: 30,
//   // },
//   // {
//   //   id: '5',
//   //   type: ActivityType.Vouch,
//   //   summary: 'Vouched for a contributor',
//   //   timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
//   //   points: 10,
//   // },
//   // {
//   //   id: '6',
//   //   type: ActivityType.Hyperstition,
//   //   summary: 'Bought NO position in a Hyperstition market',
//   //   timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
//   //   points: 30,
//   // },
//   // {
//   //   id: '7',
//   //   type: ActivityType.Vouch,
//   //   summary: 'Vouched for a contributor',
//   //   timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
//   //   points: 10,
//   // },
//   // {
//   //   id: '8',
//   //   type: ActivityType.Hyperstition,
//   //   summary: 'Redeemed YES position in a Hyperstition market',
//   //   timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
//   //   points: 10,
//   // },
//   // {
//   //   id: '9',
//   //   type: ActivityType.Hyperstition,
//   //   summary: 'Redeemed NO position in a Hyperstition market',
//   //   timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
//   //   points: 10,
//   // },
// ]

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

  const { data: activities = [] } = useQuery({
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
            summary: ActivitySummary[event.type] || '',
            timestamp: event.timestamp ? new Date(event.timestamp) : undefined,
            points: event.value.startsWith('0x')
              ? hexToNumber(event.value as `0x${string}`)
              : Number(event.value),
          })
        )
      }

      return []
    },
    enabled: !!address,
    refetchInterval: 30_000,
  })

  const { types, cumulativePoints, rootPieLevel } = useMemo(() => {
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

    const totalPoints =
      cumulativePoints.length > 0
        ? cumulativePoints[cumulativePoints.length - 1].points
        : 0
    const otherPoints = 999

    const rootPieLevel: PieLevel = {
      title: 'All Phases',
      values: [
        {
          title: 'Phase 1',
          value: 1,
          color: 'rgb(36, 36, 36)',
          subPie: {
            values: [
              { title: 'Your points', value: totalPoints, color: '#dd70d4' },
              {
                title: "Others' points",
                value: otherPoints,
                color: 'rgb(24, 24, 24)',
              },
            ],
          },
        },
        {
          title: 'Remaining phases',
          value: 99,
          color: 'rgb(24, 24, 24)',
        },
      ],
    }

    return { types, cumulativePoints, rootPieLevel }
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

  const getSelectedPieLevel = (
    currentLevel: PieLevel,
    index: number
  ): PieLevel => {
    const pieLevel = currentLevel.values[index].subPie as PieLevel | undefined
    if (!pieLevel) {
      return currentLevel
    }

    pieLevel.title = currentLevel.values[index].title
    pieLevel.parent = currentLevel

    return pieLevel
  }

  const [activePieLevel, setActivePieLevel] = useState(() =>
    getSelectedPieLevel(rootPieLevel, 0)
  )

  const pieChartData = {
    labels: activePieLevel.values.map((entry) => entry.title),
    datasets: [
      {
        data: activePieLevel.values.map((entry) => entry.value),
        backgroundColor: activePieLevel.values.map((entry) => entry.color),
        borderWidth: 0,
      },
    ],
  }

  const pieChartOptions: ChartOptions<'pie'> = {
    // cutout: 32,
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
        callbacks: {
          label: (context) => {
            const value = context.parsed
            return activePieLevel === rootPieLevel
              ? `${value.toLocaleString()}%`
              : `${value.toLocaleString()} points`
          },
        },
      },
    },
    animation: {
      animateRotate: true,
    },
    onClick: (_, elements) => {
      if (elements.length > 0) {
        setActivePieLevel(
          getSelectedPieLevel(activePieLevel, elements[0].index)
        )
      }
    },
    onHover: (_, elements, chart) => {
      if (elements.length > 0) {
        const hoveredData = activePieLevel.values[elements[0].index]
        chart.canvas.style.cursor = hoveredData.subPie ? 'pointer' : 'default'
      } else {
        chart.canvas.style.cursor = 'default'
      }
    },
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
      <div className="space-y-2 border border-gray-700 bg-card-foreground/70 p-6 rounded-sm hover:bg-card-foreground/75 transition-colors">
        <div className="terminal-command text-lg">POINTS</div>
        <div className="system-message">
          ⛤ Unlock incentives by contributing to the collective ⛤
        </div>
        <div className="terminal-text text-sm">
          Track your contributions and influence within the EN0VA collective intelligence network.
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-y-4 gap-x-8 items-stretch">
        {/* Main content */}
        <div className="space-y-6 grow">
          <div className="flex flex-col-reverse md:flex-row justify-center items-center gap-12 my-4 md:gap-42 md:my-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex flex-row justify-center items-center">
                {activePieLevel !== rootPieLevel && (
                  <button
                    onClick={() =>
                      setActivePieLevel(activePieLevel.parent || rootPieLevel)
                    }
                    className={clsx(
                      'absolute -left-[1.75rem] text-sm text-gray-400 hover:text-gray-200 cursor-pointer'
                    )}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                <h1 className="text-base">{activePieLevel.title}</h1>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="w-56 h-56">
                  <Pie data={pieChartData} options={pieChartOptions} />
                </div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <h1 className="text-lg">YOUR POINTS</h1>
              <div className="terminal-bright text-8xl font-bold">
                {cumulativePoints.length > 0
                  ? cumulativePoints[
                      cumulativePoints.length - 1
                    ].points.toLocaleString()
                  : 0}
              </div>
              {/* <div className="text-lg terminal-dim">
            RANK #{rank} / {numRanks}
          </div> */}
            </div>
          </div>

          <div className="flex flex-col items-stretch p-4 max-w-5xl mx-auto">
            {/* <div className="flex flex-col items-center gap-4">
          <h1 className="text-xl">Points Breakdown</h1>
          <div className="w-156 h-96">
            <Line
              data={pointsBreakdownChartData}
              options={pointsBreakdownChartOptions}
            />
          </div>
        </div> */}

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                RECENT ACTIVITIES
              </h2>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-gray-900/30 text-white font-mono text-xs px-3 py-2 focus:border-blue-400 focus:outline-none cursor-pointer"
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
                  const Icon = ActivityTypeIcon[activity.type]
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between px-4 py-3 rounded-sm bg-gray-900/10 hover:bg-gray-900/20 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            {Icon && <Icon className="w-4 h-4" />}
                            <div className="text-white font-medium text-sm">
                              {activity.type.toUpperCase()}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {activity.summary}
                          </div>
                          {activity.timestamp && (
                            <div className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(activity.timestamp)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">
                          +{activity.points}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Points Multipliers */}
          {/* <div className="border border-yellow-600 p-6 bg-yellow-900/10 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-yellow-400 mb-4">
          ◈ ACTIVE MULTIPLIERS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 border border-yellow-700 bg-yellow-900/20">
            <div>
              <div className="text-white font-medium text-sm">
                Early Adopter
              </div>
              <div className="text-xs text-yellow-300">First 100 nodes</div>
            </div>
            <div className="text-yellow-400 font-bold">2.5x</div>
          </div>

          <div className="flex items-center justify-between p-3 border border-yellow-700 bg-yellow-900/20">
            <div>
              <div className="text-white font-medium text-sm">
                Consistency Bonus
              </div>
              <div className="text-xs text-yellow-300">7+ day streak</div>
            </div>
            <div className="text-yellow-400 font-bold">1.8x</div>
          </div>

          <div className="flex items-center justify-between p-3 border border-yellow-700 bg-yellow-900/20">
            <div>
              <div className="text-white font-medium text-sm">
                Network Effect
              </div>
              <div className="text-xs text-yellow-300">High consensus rate</div>
            </div>
            <div className="text-yellow-400 font-bold">1.3x</div>
          </div>
        </div>
      </div> */}

          {/* How to Earn Points */}
          {/* <div className="border border-blue-600 p-6 bg-blue-900/10 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-blue-400 mb-4">
          ◇ HOW TO EARN POINTS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-blue-400 mt-1">◆</span>
              <div>
                <div className="text-white font-medium">
                  Create Attestations
                </div>
                <div className="text-gray-400">
                  Verify truth statements and data integrity
                </div>
                <div className="text-blue-300 text-xs">
                  +50-200 points per attestation
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-purple-400 mt-1">◢◤</span>
              <div>
                <div className="text-white font-medium">
                  Participate in Governance
                </div>
                <div className="text-gray-400">
                  Vote on collective decisions
                </div>
                <div className="text-blue-300 text-xs">
                  +25-100 points per vote
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 mt-1">▲▼</span>
              <div>
                <div className="text-white font-medium">
                  Hyperstition Markets
                </div>
                <div className="text-gray-400">
                  Create and trade prediction markets
                </div>
                <div className="text-blue-300 text-xs">
                  +75-300 points per market
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-cyan-400 mt-1">∞</span>
              <div>
                <div className="text-white font-medium">Network Consensus</div>
                <div className="text-gray-400">
                  Contribute to collective intelligence
                </div>
                <div className="text-blue-300 text-xs">
                  +10-50 points per contribution
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}
        </div>

        {/* Points Earning Guide Card */}
        <div className="border border-gray-700 bg-card-foreground/70 p-6 rounded-sm sticky top-4 max-w-full lg:max-w-sm grow">
          <div className="space-y-4">
            <div className="terminal-command text-base text-center">
              EARN MORE POINTS
            </div>

            <div className="space-y-3">
              <div className="terminal-text text-sm">
                <div className="system-message mb-2">
                  ◉ HYPERSTITION MARKETS
                </div>
                <div className="terminal-dim text-xs pl-3">
                  • Buy positions in active markets
                  <br />
                  • Redeem winning predictions
                  <br />• Participate in collective manifestation
                </div>
              </div>

              <div className="terminal-text text-sm">
                <div className="system-message mb-2">◆ ATTESTATIONS</div>
                <div className="terminal-dim text-xs pl-3">
                  • Verify truth statements
                  <br />
                  • Validate data integrity
                  <br />• Create trust networks
                </div>
              </div>

              <div className="terminal-text text-sm">
                <div className="system-message mb-2">◢◤ GOVERNANCE</div>
                <div className="terminal-dim text-xs pl-3">
                  • Vote on collective decisions
                  <br />
                  • Propose network changes
                  <br />• Shape the future direction
                </div>
              </div>

              <div className="terminal-text text-sm">
                <div className="system-message mb-2">
                  ▲ SOCIAL AMPLIFICATION
                </div>
                <div className="terminal-dim text-xs pl-3">
                  • Share EN0VA content
                  <br />
                  • Refer new members
                  <br />• Boost network effects
                </div>
              </div>

              <div className="terminal-text text-sm">
                <div className="system-message mb-2">∞ CONSENSUS BUILDING</div>
                <div className="terminal-dim text-xs pl-3">
                  • Contribute to collective intelligence
                  <br />
                  • Maintain network consensus
                  <br />• Build trust relationships
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <div className="text-center">
                <div className="terminal-bright text-lg mb-1">
                  MAXIMIZE CONTRIBUTION
                </div>
                <div className="terminal-dim text-xs">
                  Every action amplifies the collective
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
