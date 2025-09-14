'use client'

import type React from 'react'
import { useState } from 'react'
import { useAccount } from 'wagmi'

interface PointsData {
  totalPoints: number
  attestationPoints: number
  governancePoints: number
  hyperstitionPoints: number
  collectivePoints: number
  rank: number
  recentActivities: Activity[]
}

interface Activity {
  id: string
  type: string
  description: string
  points: number
  timestamp: Date
  icon: string
}

const mockPointsData: PointsData = {
  totalPoints: 2847,
  attestationPoints: 1230,
  governancePoints: 680,
  hyperstitionPoints: 537,
  collectivePoints: 400,
  rank: 27,
  recentActivities: [
    {
      id: '1',
      type: 'attestation',
      description: 'Verified truth statement in hyperstition market',
      points: 125,
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      icon: '◆',
    },
    {
      id: '2',
      type: 'governance',
      description: 'Participated in collective decision #0x4a7b',
      points: 85,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      icon: '◢◤',
    },
    {
      id: '3',
      type: 'hyperstition',
      description: 'Created successful prediction market',
      points: 200,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      icon: '▲▼',
    },
    {
      id: '4',
      type: 'collective',
      description: 'Contributed to EN0VA network consensus',
      points: 65,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      icon: '∞',
    },
  ],
}

export default function PointsPage() {
  const { address, isConnected } = useAccount()
  const [selectedPeriod, setSelectedPeriod] = useState('all-time')

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

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">
            ◢◤◢◤◢◤ POINTS SYSTEM ◢◤◢◤◢◤
          </h1>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          ◢◤◢◤◢◤ POINTS DASHBOARD ◢◤◢◤◢◤
        </h1>
        <p className="text-gray-300 mb-6">
          Track your contributions and influence within the EN0VA collective
          intelligence network.
        </p>
        <div className="system-message">
          ∞ PARTICIPATION METRICS ACTIVATED ∞
        </div>
      </div>

      {/* Total Points Card */}
      <div className="border border-green-600 p-8 bg-green-900/20 backdrop-blur-sm text-center">
        <div className="terminal-dim text-xs mb-2">TOTAL COLLECTIVE POINTS</div>
        <div className="terminal-bright text-4xl font-bold text-green-400 mb-2">
          {mockPointsData.totalPoints.toLocaleString()}
        </div>
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="system-message">RANK #{mockPointsData.rank}</div>
          <div className="terminal-dim">|</div>
          <div className="text-gray-400">of 893 nodes</div>
        </div>
      </div>

      {/* Points Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-gray-700 bg-black/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-400 text-lg">◆</span>
            <span className="terminal-bright text-xl">
              {mockPointsData.attestationPoints}
            </span>
          </div>
          <div className="terminal-dim text-xs mb-2">ATTESTATION POINTS</div>
          <div className="system-message text-xs">truth verification</div>
        </div>

        <div className="border border-gray-700 bg-black/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-purple-400 text-lg">◢◤</span>
            <span className="terminal-bright text-xl">
              {mockPointsData.governancePoints}
            </span>
          </div>
          <div className="terminal-dim text-xs mb-2">GOVERNANCE POINTS</div>
          <div className="system-message text-xs">collective decisions</div>
        </div>

        <div className="border border-gray-700 bg-black/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-yellow-400 text-lg">▲▼</span>
            <span className="terminal-bright text-xl">
              {mockPointsData.hyperstitionPoints}
            </span>
          </div>
          <div className="terminal-dim text-xs mb-2">HYPERSTITION POINTS</div>
          <div className="system-message text-xs">prediction markets</div>
        </div>

        <div className="border border-gray-700 bg-black/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-cyan-400 text-lg">∞</span>
            <span className="terminal-bright text-xl">
              {mockPointsData.collectivePoints}
            </span>
          </div>
          <div className="terminal-dim text-xs mb-2">COLLECTIVE POINTS</div>
          <div className="system-message text-xs">network consensus</div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">RECENT ACTIVITIES</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-black border border-gray-600 text-white font-mono text-xs px-3 py-2 focus:border-blue-400 focus:outline-none"
          >
            <option value="all-time">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="space-y-3">
          {mockPointsData.recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4 border border-gray-700 rounded-sm bg-gray-900/10 hover:bg-gray-900/20 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <span className="text-green-400 text-lg">{activity.icon}</span>
                <div>
                  <div className="text-white font-medium text-sm">
                    {activity.description}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {activity.type.toUpperCase()} •{' '}
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold">
                  +{activity.points}
                </div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Points Multipliers */}
      <div className="border border-yellow-600 p-6 bg-yellow-900/10 backdrop-blur-sm">
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
      </div>

      {/* How to Earn Points */}
      <div className="border border-blue-600 p-6 bg-blue-900/10 backdrop-blur-sm">
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
      </div>
    </div>
  )
}
