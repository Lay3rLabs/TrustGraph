'use client'

import type React from 'react'
import { useState } from 'react'

interface IncentiveMetric {
  id: string
  name: string
  description: string
  reward: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  currentValue: number
  targetValue: number
  unit: string
  status: 'active' | 'completed' | 'locked'
}

interface IncentiveCategory {
  id: string
  title: string
  description: string
  icon: string
  color: string
  totalRewards: number
  metrics: IncentiveMetric[]
}

const incentiveCategories: IncentiveCategory[] = [
  {
    id: 'apps',
    title: 'App Builders',
    description: 'Launch and grow applications on our platform',
    icon: '◊',
    color: 'text-blue-400',
    totalRewards: 150000,
    metrics: [
      {
        id: 'app-price',
        name: 'Token Price Growth',
        description: 'Achieve sustained token price increases',
        reward: '5000 $EN0',
        tier: 'gold',
        currentValue: 0.85,
        targetValue: 1.0,
        unit: 'USD',
        status: 'active',
      },
      {
        id: 'app-tvl',
        name: 'Total Value Locked',
        description: 'Reach TVL milestones in your application',
        reward: '10000 $EN0',
        tier: 'platinum',
        currentValue: 2.3,
        targetValue: 5.0,
        unit: 'M USD',
        status: 'active',
      },
      {
        id: 'app-revenue',
        name: 'Protocol Revenue',
        description: 'Generate monthly protocol revenue',
        reward: '7500 $EN0',
        tier: 'gold',
        currentValue: 45000,
        targetValue: 100000,
        unit: 'USD/month',
        status: 'active',
      },
      {
        id: 'app-growth',
        name: 'Revenue Growth Rate',
        description: 'Maintain consistent month-over-month growth',
        reward: '3000 $EN0',
        tier: 'silver',
        currentValue: 12.5,
        targetValue: 20.0,
        unit: '%/month',
        status: 'active',
      },
    ],
  },
  {
    id: 'contributors',
    title: 'Contributors',
    description: 'Build, create, and improve the ecosystem',
    icon: '◈',
    color: 'text-green-400',
    totalRewards: 75000,
    metrics: [
      {
        id: 'opensource',
        name: 'Open Source Contributions',
        description: 'Contribute code to core repositories',
        reward: '2500 $EN0',
        tier: 'silver',
        currentValue: 8,
        targetValue: 15,
        unit: 'PRs merged',
        status: 'active',
      },
      {
        id: 'bounties',
        name: 'Bounty Completion',
        description: 'Complete development bounties successfully',
        reward: '5000 $EN0',
        tier: 'gold',
        currentValue: 3,
        targetValue: 5,
        unit: 'bounties',
        status: 'active',
      },
      {
        id: 'wavs-builds',
        name: 'EN0VA Integration',
        description: 'Build innovative applications using EN0VA',
        reward: '7500 $EN0',
        tier: 'gold',
        currentValue: 1,
        targetValue: 3,
        unit: 'apps',
        status: 'active',
      },
      {
        id: 'security',
        name: 'Security Research',
        description: 'Discover and report security vulnerabilities',
        reward: '10000 $EN0',
        tier: 'platinum',
        currentValue: 0,
        targetValue: 1,
        unit: 'critical bugs',
        status: 'active',
      },
    ],
  },
  {
    id: 'operators',
    title: 'Node Operators',
    description: 'Maintain and secure the network infrastructure',
    icon: '◉',
    color: 'text-purple-400',
    totalRewards: 100000,
    metrics: [
      {
        id: 'node-running',
        name: 'Node Operation',
        description: 'Successfully run a EN0VA node for extended periods',
        reward: '3000 $EN0',
        tier: 'silver',
        currentValue: 67,
        targetValue: 90,
        unit: 'days',
        status: 'active',
      },
      {
        id: 'node-uptime',
        name: 'High Uptime & Performance',
        description: 'Maintain excellent node uptime and response times',
        reward: '8000 $EN0',
        tier: 'gold',
        currentValue: 96.7,
        targetValue: 99.0,
        unit: '% uptime',
        status: 'active',
      },
    ],
  },
  {
    id: 'community',
    title: 'Community Members',
    description: 'Engage, educate, and grow the community',
    icon: '◇',
    color: 'text-yellow-400',
    totalRewards: 50000,
    metrics: [
      {
        id: 'events',
        name: 'Event Participation',
        description: 'Attend webinars, AMAs, and community events',
        reward: '1000 $EN0',
        tier: 'bronze',
        currentValue: 3,
        targetValue: 5,
        unit: 'events',
        status: 'active',
      },
      {
        id: 'content',
        name: 'Content Creation',
        description: 'Write articles, tutorials, or blog posts about EN0VA',
        reward: '2500 $EN0',
        tier: 'silver',
        currentValue: 1,
        targetValue: 3,
        unit: 'articles',
        status: 'active',
      },
      {
        id: 'feedback',
        name: 'Quality Feedback',
        description: 'Provide valuable suggestions and improvement ideas',
        reward: '1500 $EN0',
        tier: 'bronze',
        currentValue: 7,
        targetValue: 10,
        unit: 'submissions',
        status: 'active',
      },
      {
        id: 'vouching',
        name: 'Community Vouching',
        description: 'Get vouched for by trusted community members',
        reward: '5000 $EN0',
        tier: 'gold',
        currentValue: 2,
        targetValue: 5,
        unit: 'vouches',
        status: 'active',
      },
    ],
  },
]

export default function IncentivesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredCategories = incentiveCategories.filter(
    (category) => selectedCategory === 'all' || category.id === selectedCategory
  )

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'text-amber-600'
      case 'silver':
        return 'text-gray-400'
      case 'gold':
        return 'text-yellow-400'
      case 'platinum':
        return 'text-purple-400'
      default:
        return 'terminal-text'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return '◦'
      case 'silver':
        return '◆'
      case 'gold':
        return '◈'
      case 'platinum':
        return '◉'
      default:
        return '○'
    }
  }

  const getProgressPercentage = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'active':
        return 'terminal-bright'
      case 'locked':
        return 'text-red-400'
      default:
        return 'terminal-text'
    }
  }

  const totalPossibleRewards = incentiveCategories.reduce(
    (sum, cat) => sum + cat.totalRewards,
    0
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="terminal-command text-lg">INCENTIVE PROGRAMS</div>
        <div className="system-message">
          ◇◆ Metric-Based Rewards • Performance Incentives • Community Growth ◇◆
        </div>
        <div className="terminal-text text-sm">
          Earn $EN0 tokens by contributing to ecosystem growth across key
          performance metrics.
        </div>
      </div>

      {/* Total Rewards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/20 border border-gray-700 p-4 rounded-sm">
          <div className="terminal-bright text-lg">
            {totalPossibleRewards.toLocaleString()}
          </div>
          <div className="terminal-dim text-xs">TOTAL $EN0 POOL</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-4 rounded-sm">
          <div className="terminal-bright text-lg">
            {incentiveCategories.length}
          </div>
          <div className="terminal-dim text-xs">PROGRAM TRACKS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-4 rounded-sm">
          <div className="terminal-bright text-lg">
            {incentiveCategories.reduce(
              (sum, cat) => sum + cat.metrics.length,
              0
            )}
          </div>
          <div className="terminal-dim text-xs">ACTIVE METRICS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-4 rounded-sm">
          <div className="terminal-bright text-lg">LIVE</div>
          <div className="terminal-dim text-xs">PROGRAM STATUS</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center justify-between">
        <div className="terminal-text">INCENTIVE CATEGORIES:</div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
        >
          <option value="all">ALL CATEGORIES</option>
          {incentiveCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Incentive Categories */}
      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="border border-gray-700 bg-black/10 rounded-sm"
          >
            {/* Category Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`text-2xl ${category.color}`}>
                    {category.icon}
                  </span>
                  <div>
                    <h2 className="terminal-command text-xl">
                      {category.title}
                    </h2>
                    <p className="terminal-text text-sm mt-1">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl ${category.color}`}>
                    {category.totalRewards.toLocaleString()} $EN0
                  </div>
                  <div className="terminal-dim text-xs">TOTAL REWARDS</div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="p-6 space-y-4">
              {category.metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="bg-black/20 border border-gray-700 p-4 rounded-sm"
                >
                  <div className="space-y-4">
                    {/* Metric Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`text-lg ${getTierColor(metric.tier)}`}
                        >
                          {getTierIcon(metric.tier)}
                        </span>
                        <div>
                          <h3 className="terminal-bright text-base">
                            {metric.name}
                          </h3>
                          <p className="terminal-text text-sm">
                            {metric.description}
                          </p>
                          <div
                            className={`text-xs mt-1 ${getTierColor(
                              metric.tier
                            )}`}
                          >
                            {metric.tier.toUpperCase()} TIER
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="terminal-bright text-lg">
                          {metric.reward}
                        </div>
                        <div
                          className={`text-xs ${getStatusColor(metric.status)}`}
                        >
                          {metric.status.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="terminal-dim">PROGRESS</span>
                        <span className="terminal-bright">
                          {metric.currentValue} / {metric.targetValue}{' '}
                          {metric.unit}
                        </span>
                      </div>
                      <div className="bg-gray-700 h-3 rounded">
                        <div
                          className="bg-gradient-to-r from-gray-500 to-white h-3 rounded transition-all duration-300"
                          style={{
                            width: `${getProgressPercentage(
                              metric.currentValue,
                              metric.targetValue
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="terminal-dim">
                          {getProgressPercentage(
                            metric.currentValue,
                            metric.targetValue
                          ).toFixed(1)}
                          % Complete
                        </span>
                        <span className="terminal-dim">
                          {metric.targetValue - metric.currentValue > 0
                            ? `${(
                                metric.targetValue - metric.currentValue
                              ).toFixed(metric.unit === '%' ? 1 : 0)} ${
                                metric.unit
                              } remaining`
                            : 'Target achieved!'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2 border-t border-gray-700">
                      <button className="mobile-terminal-btn !px-4 !py-2">
                        <span className="text-xs terminal-command">
                          START EARNING
                        </span>
                      </button>
                      <button className="mobile-terminal-btn !px-4 !py-2">
                        <span className="text-xs terminal-command">
                          LEARN MORE
                        </span>
                      </button>
                      <button className="mobile-terminal-btn !px-3 !py-2">
                        <span className="text-xs terminal-command">TRACK</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Getting Started */}
      <div className="border-t border-gray-700 pt-8">
        <div className="bg-black/20 border border-gray-700 p-6 rounded-sm">
          <div className="text-center space-y-4">
            <div className="terminal-command text-lg">START EARNING TODAY</div>
            <div className="terminal-text text-sm max-w-2xl mx-auto">
              Choose your path and begin earning $EN0 tokens. Each metric is
              tracked automatically, and rewards are distributed when targets
              are achieved. The more you contribute, the more you earn.
            </div>
            <div className="flex justify-center space-x-4">
              <button className="mobile-terminal-btn !px-6 !py-3">
                <span className="terminal-command">VIEW MY PROGRESS</span>
              </button>
              <button className="mobile-terminal-btn !px-6 !py-3">
                <span className="terminal-command">PROGRAM DETAILS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4">
        <div className="system-message text-center text-sm">
          ∞ PERFORMANCE • CONTRIBUTION • REWARDS • GROWTH ∞
        </div>
      </div>
    </div>
  )
}
