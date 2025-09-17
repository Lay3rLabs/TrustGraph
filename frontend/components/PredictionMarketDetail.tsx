'use client'

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
import type React from 'react'
import { useState } from 'react'
import { Line } from 'react-chartjs-2'

import PredictionBuyForm from '@/components/PredictionBuyForm'
import PredictionRedeemForm from '@/components/PredictionRedeemForm'
import { formatNumber } from '@/lib/utils'

import 'chartjs-adapter-luxon'
import { Card } from './Card'

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
  currentValue: number
  incentivePool: number
  probability: number
  deadline: string
  category?: string
  participants: number
  status: 'active' | 'achieved' | 'failed' | 'pending'
  icon: string
  unit: string
  marketMakerAddress?: `0x${string}`
  collateralTokenAddress?: `0x${string}`
  conditionId?: `0x${string}`
  isResolved?: boolean
  result?: boolean
}

export type PredictionMarketDetailProps = {
  market: HyperstitionMarket
}

const historyPoints = 100
const historyData: {
  timestamp: number
  value: number
  followers: number
}[] = [...Array(historyPoints)].reduce(
  (acc, _, index) => [
    ...acc,
    {
      timestamp:
        index > 0
          ? acc[acc.length - 1].timestamp + 1000 * 60 * 60 * 24
          : Date.now() - 1000 * 60 * 60 * 24 * historyPoints,
      value:
        index > 0
          ? Math.max(
              0,
              Math.min(
                acc[acc.length - 1].value +
                  Math.random() * (Math.random() > 0.5 ? 0.2 : -0.2),
                1
              )
            )
          : Math.random(),
      followers:
        index > 0
          ? acc[acc.length - 1].followers +
            Math.floor(Math.random() * (Math.random() > 0.2 ? 100 : -100))
          : 0,
    },
  ],
  [] as {
    timestamp: number
    value: number
    followers: number
  }[]
)

export const PredictionMarketDetail: React.FC<PredictionMarketDetailProps> = ({
  market,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'redeem'>('buy')

  const getProgressPercentage = (current: number, target: number): number => {
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

  const chartData: ChartData<'line'> = {
    datasets: [
      {
        label: 'Market Value',
        data: historyData.map((point) => ({
          x: point.timestamp,
          y: point.value,
        })),
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
        data: historyData.map((point) => ({
          x: point.timestamp,
          y: point.followers,
        })),
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
        max: 10_000,
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

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row gap-y-4 gap-x-8 items-stretch">
          <div className="space-y-4 grow">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div>
                  <h3 className="terminal-command text-base">{market.title}</h3>
                  <p className="terminal-text text-sm mt-1">
                    {market.description}
                  </p>
                  {/* <div className="terminal-dim text-xs mt-1">
                  {market.category}
                </div> */}
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
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Progress Bar */}
            {/* <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="terminal-dim">PROGRESS</span>
                <span className="terminal-bright">
                  {formatNumber(market.currentValue)} /{" "}
                  {formatNumber(market.targetValue)} {market.unit}
                </span>
              </div>
              <div className="bg-gray-700 h-3 rounded">
                <div
                  className="bg-gradient-to-r from-gray-500 to-white h-3 rounded transition-all duration-300"
                  style={{
                    width: `${getProgressPercentage(market.currentValue, market.targetValue)}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs terminal-dim">
                {getProgressPercentage(
                  market.currentValue,
                  market.targetValue
                ).toFixed(1)}
                % Complete
              </div>
            </div> */}

            {/* Incentive Pool */}
            <Card type="detail">
              <div className="flex items-center justify-between">
                <div>
                  <div className="terminal-bright text-lg">
                    {formatNumber(market.incentivePool)} $EN0
                  </div>
                  <div className="terminal-dim text-xs">INCENTIVE POOL</div>
                </div>
                <div className="text-right">
                  <div className="terminal-bright text-sm">
                    {market.probability}%
                  </div>
                  <div className="terminal-dim text-xs">BELIEF LEVEL</div>
                </div>
              </div>
            </Card>

            {/* Market Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="terminal-dim">PARTICIPANTS</div>
                <div className="terminal-text">{market.participants}</div>
              </div>
              <div>
                <div className="terminal-dim">DEADLINE</div>
                <div className="terminal-text">{market.deadline}</div>
              </div>
              <div className="hidden md:block">
                <div className="terminal-dim">MANIFESTATION</div>
                <div className="terminal-bright">
                  {getProgressPercentage(
                    market.currentValue,
                    market.targetValue
                  ) > 75
                    ? 'IMMINENT'
                    : getProgressPercentage(
                        market.currentValue,
                        market.targetValue
                      ) > 50
                    ? 'PROBABLE'
                    : getProgressPercentage(
                        market.currentValue,
                        market.targetValue
                      ) > 25
                    ? 'POSSIBLE'
                    : 'DISTANT'}
                </div>
              </div>
            </div>
          </div>

          <Card type="primary" className="max-w-full lg:max-w-sm grow">
            {/* Tab Navigation */}
            <div className="border-b border-gray-700 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex space-x-6">
                  <button
                    onClick={() => setActiveTab('buy')}
                    className={`text-xs font-mono transition-colors ${
                      activeTab === 'buy'
                        ? 'terminal-command'
                        : 'terminal-dim hover:terminal-bright'
                    }`}
                  >
                    BUY POSITION
                  </button>
                  <button
                    onClick={() => setActiveTab('redeem')}
                    className={`text-xs font-mono transition-colors ${
                      activeTab === 'redeem'
                        ? 'terminal-command'
                        : 'terminal-dim hover:terminal-bright'
                    }`}
                  >
                    REDEEM
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              {activeTab === 'buy' && <PredictionBuyForm market={market} />}

              {activeTab === 'redeem' && (
                <PredictionRedeemForm market={market} />
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
