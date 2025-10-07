'use client'

import 'chartjs-adapter-luxon'

import { usePonderQuery } from '@ponder/react'
import { useQuery } from '@tanstack/react-query'
import {
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  Tooltip as ChartTooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  ScriptableContext,
  TimeScale,
} from 'chart.js'
import { Info } from 'lucide-react'
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
import { useHyperstitionMarket } from '@/hooks/useHyperstitionMarket'
import { useResponsiveMount } from '@/hooks/useResponsiveMount'
import { formatBigNumber, formatTimeAgo } from '@/lib/utils'
import { ponderQueries } from '@/queries/ponder'
import { HyperstitionMarket, HyperstitionMarketStatus } from '@/types'

import { PredictionMarketForms } from './PredictionMarketForms'
import { PredictionMarketTradeHistory } from './PredictionMarketTradeHistory'
import { Card } from '../Card'
import { HyperstitionDescriptionDisplay } from './HyperstitionDescriptionDisplay'
import { PointsIcon } from '../icons/PointsIcon'
import { Tooltip } from '../Tooltip'

ChartJS.register(
  ChartTooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  TimeScale
)

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

const getProgressPercentage = (current: number, target: number): number => {
  return Math.min((current / target) * 100, 100)
}

const getStatusColor = (status: HyperstitionMarketStatus): string => {
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

  const { data: { followers: followerHistory, max: followerMax = 0 } = {} } =
    useQuery(
      ponderQueries.followerCounts(
        window !== ChartWindow.All
          ? {
              minTimestamp: Math.floor(Date.now() / 1000 - windowAgo[window]),
            }
          : undefined
      )
    )

  const { data: { latestFollowerCount = 0 } = {} } = useQuery({
    ...ponderQueries.latestFollowerCount,
    refetchInterval: 30_000,
  })

  const { status, isMarketResolved, yesPrice } = useHyperstitionMarket(market)

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

  // Synchronize the datasets - extend whichever dataset is shorter
  const { priceData, followerData, numDays } = useMemo(() => {
    if (!priceHistory?.length) {
      return {
        priceData: [],
        followerData: [],
        numDays: 0,
      }
    }

    const pricePoints = priceHistory
      .map(({ timestamp, price }) => ({
        x: Number(timestamp * 1000n),
        y: price,
      }))
      .sort((a, b) => a.x - b.x)

    const followerPoints =
      followerHistory
        ?.map((point) => ({
          x: point.timestamp * 1000,
          y: point.followers,
        }))
        .sort((a, b) => a.x - b.x) || []

    const firstTimestamp = market.startDate.getTime()
    const lastTimestamp = Math.max(
      pricePoints.length > 0
        ? pricePoints[pricePoints.length - 1]?.x ?? 0
        : firstTimestamp,
      followerPoints.length > 0
        ? followerPoints[followerPoints.length - 1]?.x ?? 0
        : firstTimestamp
    )

    const numHours = Math.ceil((lastTimestamp - firstTimestamp) / 1000 / 3600)
    const timestamps = [
      ...new Set([
        // Add a point at every price change.
        ...pricePoints.map((p) => p.x),
        // Add a point at every hour mark between the first and last timestamp.
        ...[...Array(numHours)].map((_, i) => firstTimestamp + i * 3600 * 1000),
      ]),
    ].sort((a, b) => a - b)

    // Create a point per hour between the first and last timestamp.
    const priceData = timestamps
      .map((x) => ({
        x,
        y: pricePoints.filter((p) => p.x <= x).pop()?.y || pricePoints[0]?.y,
      }))
      .filter((p) => p.y !== undefined)
    const followerData = timestamps
      .map((x) => ({
        x,
        y:
          followerPoints.filter((p) => p.x <= x).pop()?.y ||
          followerPoints[0]?.y,
      }))
      .filter((p) => p.y !== undefined)

    // How many days are between the first and last timestamp?
    const numDays = Math.ceil(
      (lastTimestamp - firstTimestamp) / 1000 / 3600 / 24
    )

    return {
      priceData,
      followerData,
      numDays,
    }
  }, [priceHistory, followerHistory])

  const chartData: ChartData<'line'> = {
    datasets: [
      {
        label: 'Market Value',
        data: priceData,
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
        data: followerData,
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
        mode: 'index',
        intersect: false,
        usePointStyle: true,
        callbacks: {
          title: (context) => {
            return new Date(context[0].parsed.x).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              timeZoneName: 'short',
            })
          },
          label: (context) => {
            if (context.datasetIndex === 0) {
              return ` Hyperstition: ${(context.parsed.y * 100).toFixed(1)}%`
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
          unit:
            (window === ChartWindow.All ||
              window === ChartWindow.Week ||
              window === ChartWindow.Month) &&
            numDays > 3
              ? 'day'
              : 'hour',
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
        max: Math.max(market.targetValue, followerMax),
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

  const followerProgress = getProgressPercentage(
    latestFollowerCount,
    market.targetValue
  )

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col items-stretch lg:flex-row lg:items-start gap-y-4 gap-x-8">
          <div className="space-y-4 grow min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div>
                  <h3 className="terminal-command text-base">{market.title}</h3>
                  <HyperstitionDescriptionDisplay
                    description={market.description}
                    className="mt-1"
                  />
                </div>
              </div>
              <div
                className={`px-3 py-1 border rounded-sm text-xs ${getStatusColor(
                  status
                )}`}
              >
                {status.toUpperCase()}
              </div>
            </div>

            {/* Incentive Pool */}
            <Card size="sm" type="detail">
              <div className="flex items-center justify-between">
                <div>
                  <div className="terminal-bright text-base">
                    {yesPrice ? (yesPrice * 100).toFixed(2) + '%' : '...'}
                  </div>
                  <div className="terminal-dim text-xs">BELIEF LEVEL</div>
                </div>
                <div>
                  <div className="terminal-bright text-base flex justify-end items-center gap-2">
                    {formatBigNumber(market.incentivePool)}
                    <PointsIcon className="ml-0.5 -mr-0.5 w-5 h-5" />
                    <span>POINTS</span>
                  </div>
                  <Tooltip title="If the Hyperstition succeeds, these points are distributed proportionally to participants who predicted the YES outcome.">
                    <div className="terminal-dim text-xs flex flex-row gap-1 items-center">
                      <p>HYPERSTITION INCENTIVE POOL</p>
                      <Info className="w-3 h-3" />
                    </div>
                  </Tooltip>
                </div>
              </div>
            </Card>

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

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="terminal-dim">PROGRESS</span>
                <span className="terminal-bright">
                  {latestFollowerCount
                    ? formatBigNumber(latestFollowerCount)
                    : '...'}
                  {' / '}
                  {formatBigNumber(market.targetValue)} followers
                </span>
              </div>
              <div className="bg-gray-600 h-3 rounded">
                <div
                  className="bg-gradient-to-r from-muted-foreground to-white h-3 rounded transition-all duration-300"
                  style={{
                    width: `${followerProgress}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs">
                <div className="text-xs terminal-dim">
                  {followerProgress.toFixed(1)}% Complete
                </div>
                <div className="terminal-dim">
                  {formatTimeAgo(market.endDate)}
                </div>
              </div>
            </div>

            {/* Trade History on larger screens */}
            {isLarge && (
              <div className="flex flex-col gap-4 items-stretch mt-8">
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
            isMarketResolved={isMarketResolved}
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
