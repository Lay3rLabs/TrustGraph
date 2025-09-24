'use client'

import 'chartjs-adapter-luxon'

import { usePonderQuery } from '@ponder/react'
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
  ScriptableContext,
  TimeScale,
  Tooltip,
} from 'chart.js'
import { useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { useAccount } from 'wagmi'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePredictionMarket } from '@/hooks/usePredictionMarket'
import { useResponsiveMount } from '@/hooks/useResponsiveMount'
import { formatBigNumber } from '@/lib/utils'
import { ponderQueries } from '@/queries/ponder'

import { PredictionMarketForms } from './PredictionMarketForms'
import { PredictionMarketTradeHistory } from './PredictionMarketTradeHistory'
import { Card } from '../Card'

ChartJS.register(
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  TimeScale
)

export interface HyperstitionMarket {
  id: string
  title: string
  description: string
  targetValue: number
  incentivePool: number
  deadline: string
  status: 'active' | 'achieved' | 'failed' | 'pending'
  marketMakerAddress: `0x${string}`
}

export type PredictionMarketDetailProps = {
  market: HyperstitionMarket
}

enum ChartWindow {
  Day = 'day',
  Week = 'week',
  Month = 'month',
  All = 'all',
}

const windowAgo: Record<ChartWindow, number> = {
  [ChartWindow.Day]: 60 * 60 * 24,
  [ChartWindow.Week]: 60 * 60 * 24 * 7,
  [ChartWindow.Month]: 60 * 60 * 24 * 30,
  [ChartWindow.All]: Infinity,
}

const _getProgressPercentage = (current: number, target: number): number => {
  return Math.min((current / target) * 100, 100)
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'achieved':
      return 'text-green'
    case 'failed':
      return 'text-pink'
    case 'active':
      return 'terminal-bright'
    default:
      return 'terminal-dim'
  }
}

export const PredictionMarketDetail = ({
  market,
}: PredictionMarketDetailProps) => {
  const { address } = useAccount()
  const [_activeTab, _setActiveTab] = useState<'buy' | 'redeem'>('buy')
  const [window, setWindow] = useState<ChartWindow>(ChartWindow.All)
  const [tradeFilter, setTradeFilter] = useState<'all' | 'my'>('all')

  // Keep the start timestamp for the window constant when it changes, to prevent re-fetching on every re-render.
  const windowStartTimestamp = useMemo(
    () =>
      window === ChartWindow.All
        ? 0n
        : BigInt(Math.floor(Date.now() / 1000 - windowAgo[window])),
    [window]
  )
  const {
    data: priceHistory,
    isLoading: isLoadingPriceHistory,
    isError: isErrorPriceHistory,
    error: errorPriceHistory,
  } = usePonderQuery({
    queryFn: (db) =>
      db.query.predictionMarketPrice.findMany({
        orderBy: (t, { desc }) => desc(t.timestamp),
        where: (t, { and, eq, gte }) =>
          and(
            eq(t.marketAddress, market.marketMakerAddress),
            ...(windowStartTimestamp > 0n
              ? [gte(t.timestamp, windowStartTimestamp)]
              : [])
          ),
      }),
  })

  const { data: followerHistory } = useQuery(
    ponderQueries.followerCounts(
      window !== ChartWindow.All
        ? {
            minTimestamp: Math.floor(Date.now() / 1000 - windowAgo[window]),
          }
        : undefined
    )
  )

  const { yesCost } = usePredictionMarket(market)

  const greenColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--green')
    .trim()
  const pinkColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--pink')
    .trim()

  const gradientColor = (context: ScriptableContext<'line'>) => {
    const chart = context.chart
    const { ctx, chartArea } = chart

    if (!chartArea) {
      return pinkColor
    }

    // Create gradient based on chart area
    const gradient = ctx.createLinearGradient(
      0,
      chartArea.bottom,
      0,
      chartArea.top
    )
    gradient.addColorStop(0, pinkColor) // Pink at bottom (value 0)
    gradient.addColorStop(1, greenColor) // Green at top (value 1)

    return gradient
  }

  // Synchronize the datasets - show all price data and extend follower data
  const syncedData = useMemo(() => {
    if (!priceHistory?.length) {
      return {
        priceData: [],
        followerData: [],
      }
    }

    // Convert price timestamps to milliseconds for chart (show ALL price data)
    const priceData = priceHistory.map(({ timestamp, price }) => ({
      timestamp: Number(timestamp), // Convert BigInt to number (seconds)
      x: Number(timestamp * 1000n), // Convert to milliseconds for chart
      y: price,
    }))

    // If no follower history, return empty follower data
    if (!followerHistory?.followers?.length) {
      return {
        priceData: priceData.map(({ x, y }) => ({ x, y })),
        followerData: [],
      }
    }

    const followerPoints = followerHistory.followers.map((point) => ({
      timestamp: point.timestamp, // Already in seconds
      x: point.timestamp * 1000, // Convert to milliseconds for chart
      y: point.followers,
    }))

    // Extend follower data to match the full price timeline
    const extendedFollowerData: { x: number; y: number }[] = []

    // Find the last known follower count before or at each price timestamp
    for (const pricePoint of priceData) {
      // Find the most recent follower count at or before this price timestamp
      const relevantFollowerPoint = followerPoints
        .filter((f) => f.timestamp <= pricePoint.timestamp)
        .pop() // Get the last (most recent) one

      if (relevantFollowerPoint) {
        extendedFollowerData.push({
          x: pricePoint.x, // Use the same x timestamp as price
          y: relevantFollowerPoint.y, // Use the last known follower count
        })
      }
    }

    return {
      priceData: priceData.map(({ x, y }) => ({ x, y })),
      followerData: extendedFollowerData,
    }
  }, [priceHistory, followerHistory])

  const chartData: ChartData<'line'> = {
    datasets: [
      {
        label: 'Market Value',
        data: syncedData.priceData,
        borderWidth: 4,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        yAxisID: 'yMarket',
        borderColor: gradientColor,
        backgroundColor: gradientColor,
        tension: 0.1,
        segment: {
          borderColor: (ctx) => {
            // Get the current and previous data points
            const current = ctx.p1.parsed.y
            const previous = ctx.p0.parsed.y

            // Calculate the average value for this segment
            const avgValue = (current + previous) / 2

            // Interpolate between pink and green based on average value
            const red1 = 221,
              green1 = 112,
              blue1 = 212 // #dd70d4 (pink)
            const red2 = 5,
              green2 = 223,
              blue2 = 114 // #05df72 (green)

            const red = Math.round(red1 + (red2 - red1) * avgValue)
            const green = Math.round(green1 + (green2 - green1) * avgValue)
            const blue = Math.round(blue1 + (blue2 - blue1) * avgValue)

            return `rgb(${red}, ${green}, ${blue})`
          },
        },
      },
      {
        label: 'Followers',
        data: syncedData.followerData,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: '#666',
        fill: false,
        yAxisID: 'yFollowers',
        borderColor: '#666',
        backgroundColor: '#666',
        borderDash: [5, 5],
        tension: 0.1,
      },
    ],
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 0,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        intersect: false,
        usePointStyle: true,
        callbacks: {
          title: (context) => {
            return new Date(context[0].parsed.x).toLocaleDateString()
          },
          label: (context) => {
            if (context.datasetIndex === 0) {
              return ` ${(context.parsed.y * 100).toFixed(1)}%`
            } else {
              return ` Followers: ${context.parsed.y.toLocaleString()}`
            }
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'DD T',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      yMarket: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0,
        max: 1,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          stepSize: 0.1,
          includeBounds: true,
          callback: function (value) {
            const numValue = Number(value)
            return `${Math.round(numValue * 100)}%`
          },
        },
      },
      yFollowers: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: Math.max(market.targetValue, followerHistory?.max || 0),
        grid: {
          drawOnChartArea: false, // Only want the grid lines for one axis to show up
        },
        ticks: {
          color: '#666',
          callback: function (value) {
            return Number(value).toLocaleString()
          },
        },
      },
    },
    spanGaps: true,
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  }

  const tradeHistoryFilter = (
    <Select
      value={tradeFilter}
      onValueChange={(value: 'all' | 'my') => setTradeFilter(value)}
    >
      <SelectTrigger className="w-auto border-gray-600 bg-black/10 terminal-text text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-gray-700 bg-black terminal-text">
        <SelectItem value="all">ALL TRADES</SelectItem>
        <SelectItem value="my" disabled={!address}>
          MY TRADES
        </SelectItem>
      </SelectContent>
    </Select>
  )

  const timeWindowFilter = (
    <Select
      value={window}
      onValueChange={(value: ChartWindow) => setWindow(value)}
    >
      <SelectTrigger className="w-auto border-gray-600 bg-black/10 terminal-text text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-gray-700 bg-black terminal-text">
        {Object.values(ChartWindow).map((w) => (
          <SelectItem key={w} value={w}>
            {w === ChartWindow.All ? 'ALL TIME' : w.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const isLarge = useResponsiveMount('lg')

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col items-stretch lg:flex-row lg:items-start gap-y-4 gap-x-8">
          <div className="space-y-4 grow min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div>
                  <h3 className="terminal-command text-base">{market.title}</h3>
                  <p className="terminal-text text-sm mt-1">
                    {market.description}
                  </p>
                </div>
              </div>
              <div
                className={`px-3 py-1 border rounded-sm text-xs ${getStatusColor(
                  market.status
                )}`}
              >
                {market.status.toUpperCase()}
              </div>
            </div>
            {/* Chart */}
            <div className="w-full h-96 relative">
              <div className="absolute inset-0">
                {isLoadingPriceHistory ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="terminal-bright text-lg">
                      ◉ LOADING HYPERSTITION ◉
                    </div>
                  </div>
                ) : isErrorPriceHistory ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="terminal-bright text-lg">
                      ◉ ERROR LOADING HYPERSTITION HISTORY ◉
                    </div>
                    <div className="terminal-dim text-sm">
                      {errorPriceHistory?.message}
                    </div>
                  </div>
                ) : (
                  <Line data={chartData} options={chartOptions} />
                )}
              </div>
            </div>

            {!isLarge && (
              <div className="flex flex-row justify-end">
                {timeWindowFilter}
              </div>
            )}

            {/* Incentive Pool */}
            <Card size="sm" type="detail">
              <div className="flex items-center justify-between">
                <div>
                  <div className="terminal-bright text-lg flex items-center gap-2">
                    {formatBigNumber(market.incentivePool)}
                    <img
                      src="/points.svg"
                      alt="Points"
                      className="ml-1 w-5 h-5 -mr-1"
                    />
                    <span>POINTS</span>
                  </div>
                  <div className="terminal-dim text-xs">
                    YES OUTCOME INCENTIVE POOL
                  </div>
                </div>
                <div className="text-right">
                  <div className="terminal-bright text-sm">
                    {yesCost ? (yesCost * 100).toFixed(2) + '%' : '...'}
                  </div>
                  <div className="terminal-dim text-xs">BELIEF LEVEL</div>
                </div>
              </div>
            </Card>

            {/* Trade History on larger screens */}
            {isLarge && (
              <div className="flex flex-col gap-4 items-stretch">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h4 className="terminal-command text-sm">TRADE HISTORY</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Trade Filter */}
                    {tradeHistoryFilter}

                    {/* Time Window Filter */}
                    {timeWindowFilter}
                  </div>
                </div>

                <PredictionMarketTradeHistory
                  market={market}
                  windowStartTimestamp={windowStartTimestamp}
                  onlyMyTrades={tradeFilter === 'my'}
                />
              </div>
            )}
          </div>

          <PredictionMarketForms
            className="max-w-full lg:max-w-sm grow shrink-0"
            market={market}
          />
        </div>

        {/* Trade History on smaller screens */}
        {!isLarge && (
          <div className="space-y-4">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4">
              <h4 className="terminal-command text-sm">TRADE HISTORY</h4>
              {tradeHistoryFilter}
            </div>

            <PredictionMarketTradeHistory
              market={market}
              windowStartTimestamp={windowStartTimestamp}
              onlyMyTrades={tradeFilter === 'my'}
            />
          </div>
        )}
      </div>
    </>
  )
}

// /* Progress Bar */
// <div className="space-y-2">
//   <div className="flex justify-between text-sm">
//     <span className="terminal-dim">PROGRESS</span>
//     <span className="terminal-bright">
//       {formatNumber(market.currentValue)} /{" "}
//       {formatNumber(market.targetValue)} {market.unit}
//     </span>
//   </div>
//   <div className="bg-gray-700 h-3 rounded">
//     <div
//       className="bg-gradient-to-r from-gray-500 to-white h-3 rounded transition-all duration-300"
//       style={{
//         width: `${getProgressPercentage(market.currentValue, market.targetValue)}%`,
//       }}
//     ></div>
//   </div>
//   <div className="text-xs terminal-dim">
//     {getProgressPercentage(
//       market.currentValue,
//       market.targetValue
//     ).toFixed(1)}
//     % Complete
//   </div>
// </div>

// /* Market Stats */
// <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
//   <div>
//     <div className="terminal-dim">PARTICIPANTS</div>
//     <div className="terminal-text">{market.participants}</div>
//   </div>
//   <div>
//     <div className="terminal-dim">DEADLINE</div>
//     <div className="terminal-text">{market.deadline}</div>
//   </div>
//   <div className="hidden md:block">
//     <div className="terminal-dim">MANIFESTATION</div>
//     <div className="terminal-bright">
//       {getProgressPercentage(
//         market.currentValue,
//         market.targetValue
//       ) > 75
//         ? 'IMMINENT'
//         : getProgressPercentage(
//             market.currentValue,
//             market.targetValue
//           ) > 50
//         ? 'PROBABLE'
//         : getProgressPercentage(
//             market.currentValue,
//             market.targetValue
//           ) > 25
//         ? 'POSSIBLE'
//         : 'DISTANT'}
//     </div>
//   </div>
// </div>
