"use client";

import type React from "react";
import { useState } from "react";

interface HyperstitionMarket {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  incentivePool: number;
  probability: number;
  deadline: string;
  category: string;
  participants: number;
  status: "active" | "achieved" | "failed" | "pending";
  icon: string;
  unit: string;
}

const markets: HyperstitionMarket[] = [
  {
    id: "1",
    title: "EN0VA Twitter Ascension",
    description: "EN0VA collective reaches 10,000 Twitter followers",
    targetValue: 10000,
    currentValue: 3247,
    incentivePool: 10000,
    probability: 67.3,
    deadline: "2024.06.01",
    category: "Social Growth",
    participants: 156,
    status: "active",
    icon: "◉",
    unit: "followers"
  },
  {
    id: "2", 
    title: "Collective Mind Repository",
    description: "GitHub repository reaches 1,000 stars signaling mass adoption",
    targetValue: 1000,
    currentValue: 234,
    incentivePool: 5000,
    probability: 45.8,
    deadline: "2024.08.15",
    category: "Developer Adoption",
    participants: 89,
    status: "active",
    icon: "▲",
    unit: "stars"
  },
  {
    id: "3",
    title: "Memetic Viral Threshold",
    description: "EN0VA meme achieves 100K social media impressions",
    targetValue: 100000,
    currentValue: 23450,
    incentivePool: 15000,
    probability: 73.9,
    deadline: "2024.05.01",
    category: "Memetic Warfare",
    participants: 203,
    status: "active", 
    icon: "◈",
    unit: "impressions"
  },
  {
    id: "4",
    title: "Economic Manifestation",
    description: "Total $EN0 market cap reaches $1M through collective belief",
    targetValue: 1000000,
    currentValue: 147000,
    incentivePool: 25000,
    probability: 52.1,
    deadline: "2024.12.31",
    category: "Market Dynamics",
    participants: 342,
    status: "active",
    icon: "◆",
    unit: "USD"
  },
  {
    id: "5",
    title: "Reality Breach Protocol",
    description: "EN0VA methodology cited in 50 academic papers",
    targetValue: 50,
    currentValue: 12,
    incentivePool: 8000,
    probability: 34.2,
    deadline: "2025.03.15",
    category: "Academic Recognition", 
    participants: 67,
    status: "active",
    icon: "∞",
    unit: "citations"
  },
  {
    id: "6",
    title: "Consciousness Upload Beta",
    description: "First successful human-AI consciousness merge documented",
    targetValue: 1,
    currentValue: 0,
    incentivePool: 100000,
    probability: 12.4,
    deadline: "2025.12.31",
    category: "Transhumanist Goals",
    participants: 445,
    status: "active",
    icon: "◢◤",
    unit: "merge"
  }
];

export default function HyperstitionPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredMarkets = markets.filter(market => 
    selectedCategory === "all" || market.category === selectedCategory
  );

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getProgressPercentage = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "achieved": return "text-green-400";
      case "failed": return "text-red-400"; 
      case "active": return "terminal-bright";
      default: return "terminal-dim";
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="terminal-command text-lg">HYPERSTITION MARKETS</div>
        <div className="system-message">
          ▲▼ Where collective belief shapes reality through prediction markets ▲▼
        </div>
        <div className="terminal-text text-sm">
          Manifest reality through coordinated belief. Achieve hyperstitions, unlock $EN0 incentives.
        </div>
      </div>

      {/* $EN0 Incentive Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Hyperstitions", value: markets.length.toString(), change: "MANIFESTING" },
          { label: "Total $EN0 Pool", value: formatNumber(markets.reduce((sum, m) => sum + m.incentivePool, 0)), change: "$EN0" },
          { label: "Collective Belief", value: `${(markets.reduce((sum, m) => sum + m.probability, 0) / markets.length).toFixed(1)}%`, change: "ASCENDING" },
          { label: "Reality Breach", value: "IMMINENT", change: "↑" }
        ].map((metric) => (
          <div key={metric.label} className="border border-gray-700 bg-black/10 p-4 rounded-sm">
            <div className="terminal-dim text-xs mb-1">{metric.label.toUpperCase()}</div>
            <div className="terminal-bright text-lg">{metric.value}</div>
            <div className="system-message text-xs mt-1">{metric.change}</div>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="terminal-text">ACTIVE HYPERSTITION INCENTIVES:</div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="all">ALL CATEGORIES</option>
            {[...new Set(markets.map(m => m.category))].map(category => (
              <option key={category} value={category}>{category.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Hyperstition Markets */}
        <div className="space-y-4">
          {filteredMarkets.map((market) => (
            <div key={market.id} className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="terminal-bright text-lg">{market.icon}</span>
                    <div>
                      <h3 className="terminal-command text-base">{market.title}</h3>
                      <p className="terminal-text text-sm mt-1">{market.description}</p>
                      <div className="terminal-dim text-xs mt-1">{market.category}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 border rounded-sm text-xs ${getStatusColor(market.status)}`}>
                    {market.status.toUpperCase()}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="terminal-dim">PROGRESS</span>
                    <span className="terminal-bright">
                      {formatNumber(market.currentValue)} / {formatNumber(market.targetValue)} {market.unit}
                    </span>
                  </div>
                  <div className="bg-gray-700 h-3 rounded">
                    <div 
                      className="bg-gradient-to-r from-gray-500 to-white h-3 rounded transition-all duration-300" 
                      style={{ width: `${getProgressPercentage(market.currentValue, market.targetValue)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs terminal-dim">
                    {getProgressPercentage(market.currentValue, market.targetValue).toFixed(1)}% Complete
                  </div>
                </div>

                {/* Incentive Pool */}
                <div className="bg-black/20 border border-gray-600 p-3 rounded-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="terminal-bright text-lg">{formatNumber(market.incentivePool)} $EN0</div>
                      <div className="terminal-dim text-xs">INCENTIVE POOL</div>
                    </div>
                    <div className="text-right">
                      <div className="terminal-bright text-sm">{market.probability}%</div>
                      <div className="terminal-dim text-xs">BELIEF LEVEL</div>
                    </div>
                  </div>
                </div>

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
                      {getProgressPercentage(market.currentValue, market.targetValue) > 75 ? "IMMINENT" : 
                       getProgressPercentage(market.currentValue, market.targetValue) > 50 ? "PROBABLE" : 
                       getProgressPercentage(market.currentValue, market.targetValue) > 25 ? "POSSIBLE" : "DISTANT"}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-3 border-t border-gray-700">
                  <button className="mobile-terminal-btn px-4 py-2">
                    <span className="text-xs terminal-command">AMPLIFY BELIEF</span>
                  </button>
                  <button className="mobile-terminal-btn px-4 py-2">
                    <span className="text-xs terminal-command">CONTRIBUTE</span>
                  </button>
                  <button className="mobile-terminal-btn px-3 py-2">
                    <span className="text-xs terminal-command">DETAILS</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Belief Amplification Section */}
      <div className="border-t border-gray-700 pt-8 mt-8">
        <div className="text-center space-y-4">
          <div className="terminal-command text-base">COLLECTIVE MANIFESTATION PROTOCOL</div>
          <div className="terminal-text text-sm max-w-2xl mx-auto">
            Reality bends to collective belief. Each hyperstition achieved strengthens the network effect.
            When thresholds are crossed, $EN0 incentives unlock automatically to reward the collective.
          </div>
          <div className="system-message text-sm">
            ∞ BELIEF → ACTION → REALITY → REWARDS ∞
          </div>
        </div>
      </div>
    </div>
  );
}