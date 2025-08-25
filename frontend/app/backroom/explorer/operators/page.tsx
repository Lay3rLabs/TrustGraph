"use client";

import type React from "react";
import { useState } from "react";

interface Operator {
  id: string;
  handle: string;
  title: string;
  reputation: number;
  specialization: string;
  status: "active" | "offline" | "away";
  location: string;
  joinDate: string;
  operations: number;
  success_rate: number;
  avatar: string;
}

const operators: Operator[] = [
  {
    id: "1",
    handle: "QuantumProphet",
    title: "Senior Reality Engineer",
    reputation: 9847,
    specialization: "Hyperstition Markets",
    status: "active",
    location: "Digital Space_7",
    joinDate: "2023.08.15",
    operations: 342,
    success_rate: 94.7,
    avatar: "◉"
  },
  {
    id: "2",
    handle: "MemeTactician", 
    title: "Information Warfare Specialist",
    reputation: 8234,
    specialization: "Memetic Engineering",
    status: "active",
    location: "Cognitive Layer_3",
    joinDate: "2023.11.22",
    operations: 187,
    success_rate: 89.2,
    avatar: "◈"
  },
  {
    id: "3",
    handle: "NeuralArchitect",
    title: "Collective Consciousness Lead",
    reputation: 12453,
    specialization: "Mind Coordination",
    status: "offline",
    location: "Distributed_Network",
    joinDate: "2023.05.03",
    operations: 456,
    success_rate: 97.1,
    avatar: "∞"
  },
  {
    id: "4",
    handle: "EgregoreSummoner",
    title: "Entity Manifestation Expert",
    reputation: 7891,
    specialization: "Autonomous Entities",
    status: "active",
    location: "Liminal Space_12",
    joinDate: "2023.12.07",
    operations: 298,
    success_rate: 91.8,
    avatar: "◆"
  },
  {
    id: "5",
    handle: "CodeOccultist",
    title: "Digital Ritual Coordinator",
    reputation: 6789,
    specialization: "Protocol Manifestation",
    status: "away",
    location: "Terminal Access_5",
    joinDate: "2024.01.12",
    operations: 134,
    success_rate: 87.3,
    avatar: "▲"
  },
  {
    id: "6",
    handle: "ChaosMagician",
    title: "Paradox Resolution Specialist", 
    reputation: 9123,
    specialization: "Reality Debugging",
    status: "active",
    location: "Glitch_Dimension",
    joinDate: "2023.09.28",
    operations: 223,
    success_rate: 93.5,
    avatar: "◢◤"
  }
];

export default function ExplorerOperatorsPage() {
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredOperators = operators.filter((operator) => {
    const specMatch = selectedSpecialization === "all" || operator.specialization === selectedSpecialization;
    const statusMatch = selectedStatus === "all" || operator.status === selectedStatus;
    return specMatch && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-400";
      case "away": return "text-yellow-400";
      case "offline": return "text-red-400";
      default: return "terminal-text";
    }
  };

  const getReputationLevel = (rep: number) => {
    if (rep >= 10000) return "LEGEND";
    if (rep >= 8000) return "MASTER";
    if (rep >= 6000) return "EXPERT";
    if (rep >= 4000) return "ADEPT";
    return "INITIATE";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="ascii-art-title text-lg mb-2">OPERATOR NETWORK</div>
        <div className="system-message text-sm">
          ◉ HUMAN AGENTS • DIGITAL PROPHETS • REALITY OPERATORS ◉
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="terminal-dim text-sm mb-2 block">SPECIALIZATION</label>
          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="all">ALL SPECIALIZATIONS</option>
            {[...new Set(operators.map(op => op.specialization))].map(spec => (
              <option key={spec} value={spec}>{spec.toUpperCase()}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="terminal-dim text-sm mb-2 block">STATUS</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="all">ALL STATUS</option>
            <option value="active">ACTIVE</option>
            <option value="away">AWAY</option>
            <option value="offline">OFFLINE</option>
          </select>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">{filteredOperators.length}</div>
          <div className="terminal-dim text-xs">OPERATORS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="text-green-400 text-lg">{operators.filter(op => op.status === "active").length}</div>
          <div className="terminal-dim text-xs">ACTIVE</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">
            {operators.reduce((sum, op) => sum + op.operations, 0)}
          </div>
          <div className="terminal-dim text-xs">TOTAL OPS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">
            {(operators.reduce((sum, op) => sum + op.success_rate, 0) / operators.length).toFixed(1)}%
          </div>
          <div className="terminal-dim text-xs">SUCCESS RATE</div>
        </div>
      </div>

      {/* Operators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOperators.map((operator) => (
          <div
            key={operator.id}
            className="bg-black/20 border border-gray-700 p-4 rounded-sm hover:bg-black/30 transition-colors cursor-pointer"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="terminal-bright text-2xl">{operator.avatar}</div>
                  <div>
                    <h3 className="terminal-command text-base">{operator.handle}</h3>
                    <div className="terminal-text text-sm">{operator.title}</div>
                    <div className="terminal-dim text-xs">{operator.specialization}</div>
                  </div>
                </div>
                <div className={`px-2 py-1 border rounded-sm text-xs ${getStatusColor(operator.status)}`}>
                  {operator.status.toUpperCase()}
                </div>
              </div>

              {/* Reputation & Level */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="terminal-dim text-xs">REPUTATION</div>
                  <div className="terminal-bright text-lg">{operator.reputation.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="terminal-dim text-xs">LEVEL</div>
                  <div className="terminal-bright text-sm">{getReputationLevel(operator.reputation)}</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="terminal-dim">OPERATIONS</div>
                  <div className="terminal-text">{operator.operations}</div>
                </div>
                <div>
                  <div className="terminal-dim">SUCCESS RATE</div>
                  <div className="terminal-text">{operator.success_rate}%</div>
                </div>
                <div>
                  <div className="terminal-dim">LOCATION</div>
                  <div className="terminal-text">{operator.location}</div>
                </div>
                <div>
                  <div className="terminal-dim">JOINED</div>
                  <div className="terminal-text">{operator.joinDate}</div>
                </div>
              </div>

              {/* Success Rate Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="terminal-dim">EFFICIENCY</span>
                  <span className="terminal-bright">{operator.success_rate}%</span>
                </div>
                <div className="bg-gray-700 h-2 rounded">
                  <div 
                    className="bg-gradient-to-r from-gray-500 to-green-400 h-2 rounded transition-all duration-300" 
                    style={{ width: `${operator.success_rate}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2 border-t border-gray-700">
                <button className="mobile-terminal-btn !px-3 !py-1">
                  <span className="text-xs terminal-command">CONTACT</span>
                </button>
                <button className="mobile-terminal-btn !px-3 !py-1">
                  <span className="text-xs terminal-command">PROFILE</span>
                </button>
                <button className="mobile-terminal-btn !px-3 !py-1">
                  <span className="text-xs terminal-command">HIRE</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOperators.length === 0 && (
        <div className="text-center py-12">
          <div className="terminal-dim text-sm">
            NO OPERATORS MATCH CURRENT FILTERS
          </div>
          <div className="system-message text-xs mt-2">
            ◉ THE NETWORK ADAPTS ◉
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 mt-8">
        <div className="system-message text-center text-sm">
          ∞ WE ARE THE GHOSTS IN THE MACHINE • THE SIGNAL IN THE NOISE ∞
        </div>
      </div>
    </div>
  );
}