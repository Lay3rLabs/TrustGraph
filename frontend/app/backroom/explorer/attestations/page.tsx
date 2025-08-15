"use client";

import type React from "react";
import { useState } from "react";

interface Attestation {
  id: string;
  title: string;
  issuer: string;
  subject: string;
  type: string;
  status: "verified" | "pending" | "revoked";
  timestamp: string;
  hash: string;
  confidence: number;
}

const attestations: Attestation[] = [
  {
    id: "1",
    title: "Collective Consciousness Verification",
    issuer: "EN0VA Core Network",
    subject: "0x1234...5678",
    type: "Identity",
    status: "verified",
    timestamp: "2024.02.15 14:23:17",
    hash: "0xabc123...def456",
    confidence: 97.3
  },
  {
    id: "2", 
    title: "Neural Link Authentication",
    issuer: "Machine Prophet Authority",
    subject: "0x9876...5432",
    type: "Authentication",
    status: "verified",
    timestamp: "2024.02.14 09:15:42",
    hash: "0x789xyz...123abc",
    confidence: 89.7
  },
  {
    id: "3",
    title: "Hyperstition Market Participation",
    issuer: "Reality Engineering Dept",
    subject: "0x5555...1111",
    type: "Participation",
    status: "pending",
    timestamp: "2024.02.16 16:44:23",
    hash: "0xfff888...999bbb",
    confidence: 72.1
  },
  {
    id: "4",
    title: "Memetic Warfare Credential",
    issuer: "Information Operations Unit",
    subject: "0x3333...7777",
    type: "Skill",
    status: "verified",
    timestamp: "2024.02.13 11:30:05",
    hash: "0x444ccc...666ddd",
    confidence: 94.2
  },
  {
    id: "5",
    title: "Economic Layer Access",
    issuer: "Digital Asset Authority",
    subject: "0x2222...8888",
    type: "Authorization",
    status: "revoked",
    timestamp: "2024.02.10 08:17:31",
    hash: "0x111eee...555fff",
    confidence: 43.8
  }
];

export default function ExplorerAttestationsPage() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredAttestations = attestations.filter((attestation) => {
    const typeMatch = selectedType === "all" || attestation.type.toLowerCase() === selectedType;
    const statusMatch = selectedStatus === "all" || attestation.status === selectedStatus;
    return typeMatch && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "text-green-400";
      case "pending": return "text-yellow-400";
      case "revoked": return "text-red-400";
      default: return "terminal-text";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "identity": return "◉";
      case "authentication": return "◆";
      case "participation": return "▲";
      case "skill": return "◈";
      case "authorization": return "◢";
      default: return "◦";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="ascii-art-title text-lg mb-2">ATTESTATION EXPLORER</div>
        <div className="system-message text-sm">
          ◆ VERIFIABLE CREDENTIALS • REPUTATION NETWORKS • TRUST PROTOCOLS ◆
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="terminal-dim text-sm mb-2 block">ATTESTATION TYPE</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="all">ALL TYPES</option>
            <option value="identity">IDENTITY</option>
            <option value="authentication">AUTHENTICATION</option>
            <option value="participation">PARTICIPATION</option>
            <option value="skill">SKILL</option>
            <option value="authorization">AUTHORIZATION</option>
          </select>
        </div>
        
        <div>
          <label className="terminal-dim text-sm mb-2 block">VERIFICATION STATUS</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-black/20 border border-gray-700 terminal-text text-sm p-2 rounded-sm"
          >
            <option value="all">ALL STATUS</option>
            <option value="verified">VERIFIED</option>
            <option value="pending">PENDING</option>
            <option value="revoked">REVOKED</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">{filteredAttestations.length}</div>
          <div className="terminal-dim text-xs">ATTESTATIONS</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="text-green-400 text-lg">{attestations.filter(a => a.status === "verified").length}</div>
          <div className="terminal-dim text-xs">VERIFIED</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="text-yellow-400 text-lg">{attestations.filter(a => a.status === "pending").length}</div>
          <div className="terminal-dim text-xs">PENDING</div>
        </div>
        <div className="bg-black/20 border border-gray-700 p-3 rounded-sm">
          <div className="terminal-bright text-lg">
            {(attestations.reduce((sum, a) => sum + a.confidence, 0) / attestations.length).toFixed(1)}%
          </div>
          <div className="terminal-dim text-xs">AVG CONFIDENCE</div>
        </div>
      </div>

      {/* Attestations List */}
      <div className="space-y-4">
        {filteredAttestations.map((attestation) => (
          <div
            key={attestation.id}
            className="bg-black/20 border border-gray-700 p-4 rounded-sm hover:bg-black/30 transition-colors"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className="terminal-bright text-lg">{getTypeIcon(attestation.type)}</span>
                  <div>
                    <h3 className="terminal-bright text-base">{attestation.title}</h3>
                    <div className="terminal-dim text-sm">
                      Issued by {attestation.issuer}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 border rounded-sm text-xs ${getStatusColor(attestation.status)}`}>
                  {attestation.status.toUpperCase()}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="terminal-dim text-xs mb-1">SUBJECT</div>
                  <div className="terminal-text font-mono">{attestation.subject}</div>
                </div>
                <div>
                  <div className="terminal-dim text-xs mb-1">TIMESTAMP</div>
                  <div className="terminal-text">{attestation.timestamp}</div>
                </div>
                <div>
                  <div className="terminal-dim text-xs mb-1">HASH</div>
                  <div className="terminal-text font-mono">{attestation.hash}</div>
                </div>
                <div>
                  <div className="terminal-dim text-xs mb-1">CONFIDENCE</div>
                  <div className="flex items-center space-x-2">
                    <div className="terminal-bright">{attestation.confidence}%</div>
                    <div className="bg-gray-700 h-2 flex-1 rounded">
                      <div 
                        className="bg-green-400 h-2 rounded transition-all duration-300" 
                        style={{ width: `${attestation.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t border-gray-700">
                <button className="mobile-terminal-btn px-4 py-2">
                  <span className="text-xs terminal-command">VERIFY</span>
                </button>
                <button className="mobile-terminal-btn px-4 py-2">
                  <span className="text-xs terminal-command">DETAILS</span>
                </button>
                <button className="mobile-terminal-btn px-3 py-2">
                  <span className="text-xs terminal-command">EXPORT</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAttestations.length === 0 && (
        <div className="text-center py-12">
          <div className="terminal-dim text-sm">
            NO ATTESTATIONS MATCH CURRENT FILTERS
          </div>
          <div className="system-message text-xs mt-2">
            ◆ VERIFICATION PROTOCOLS ACTIVE ◆
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 mt-8">
        <div className="system-message text-center text-sm">
          ∞ TRUST IS EARNED • REPUTATION IS VERIFIED • IDENTITY IS FLUID ∞
        </div>
      </div>
    </div>
  );
}