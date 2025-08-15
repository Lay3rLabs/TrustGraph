"use client";

import type React from "react";

export default function GovernancePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="terminal-command text-lg">GOVERNANCE PROTOCOLS</div>
        <div className="system-message">
          ◢◤ Decentralized decision making through neural consensus ◢◤
        </div>
      </div>

      {/* Active proposals */}
      <div className="space-y-4">
        <div className="terminal-text">ACTIVE PROPOSALS:</div>
        <div className="space-y-4">
          {[
            {
              id: "GP-2024-003",
              title: "Neural Consensus Algorithm Upgrade",
              status: "active",
              votes: { for: 1247, against: 342, abstain: 89 },
              timeLeft: "72 hours",
              description: "Implement quantum-resistant consensus mechanism for enhanced network security"
            },
            {
              id: "GP-2024-002", 
              title: "Hyperstition Market Fee Structure",
              status: "active",
              votes: { for: 892, against: 456, abstain: 123 },
              timeLeft: "5 days",
              description: "Adjust transaction fees for future prediction markets to encourage participation"
            },
            {
              id: "GP-2024-001",
              title: "Attestation Schema Standards",
              status: "pending",
              votes: { for: 23, against: 7, abstain: 2 },
              timeLeft: "14 days",
              description: "Establish standardized schemas for collective intelligence attestations"
            }
          ].map((proposal) => (
            <div key={proposal.id} className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="terminal-command text-sm">{proposal.title}</div>
                    <div className="terminal-dim text-xs">{proposal.id}</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`text-xs ${proposal.status === 'active' ? 'terminal-bright' : 'system-message'}`}>
                      {proposal.status.toUpperCase()}
                    </div>
                    <div className="terminal-dim text-xs">{proposal.timeLeft}</div>
                  </div>
                </div>

                <div className="terminal-text text-xs">{proposal.description}</div>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="terminal-dim">FOR: {proposal.votes.for}</div>
                      <div className="bg-gray-700 h-1 rounded">
                        <div 
                          className="bg-gray-400 h-1 rounded" 
                          style={{ width: `${(proposal.votes.for / (proposal.votes.for + proposal.votes.against + proposal.votes.abstain)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="terminal-dim">AGAINST: {proposal.votes.against}</div>
                      <div className="bg-gray-700 h-1 rounded">
                        <div 
                          className="bg-gray-500 h-1 rounded" 
                          style={{ width: `${(proposal.votes.against / (proposal.votes.for + proposal.votes.against + proposal.votes.abstain)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="terminal-dim">ABSTAIN: {proposal.votes.abstain}</div>
                      <div className="bg-gray-700 h-1 rounded">
                        <div 
                          className="bg-gray-600 h-1 rounded" 
                          style={{ width: `${(proposal.votes.abstain / (proposal.votes.for + proposal.votes.against + proposal.votes.abstain)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <div className="mobile-terminal-btn px-4 py-1 cursor-not-allowed opacity-50">
                      <span className="text-xs">VOTE FOR</span>
                    </div>
                    <div className="mobile-terminal-btn px-4 py-1 cursor-not-allowed opacity-50">
                      <span className="text-xs">VOTE AGAINST</span>
                    </div>
                    <div className="mobile-terminal-btn px-4 py-1 cursor-not-allowed opacity-50">
                      <span className="text-xs">ABSTAIN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Governance stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
          <div className="terminal-dim text-xs mb-2">TOTAL VOTERS</div>
          <div className="terminal-bright text-xl">2,184</div>
          <div className="system-message text-xs mt-1">+12% this month</div>
        </div>
        
        <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
          <div className="terminal-dim text-xs mb-2">PROPOSAL SUCCESS RATE</div>
          <div className="terminal-bright text-xl">73.4%</div>
          <div className="system-message text-xs mt-1">consensus building</div>
        </div>
        
        <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
          <div className="terminal-dim text-xs mb-2">AVERAGE PARTICIPATION</div>
          <div className="terminal-bright text-xl">67.8%</div>
          <div className="system-message text-xs mt-1">highly engaged</div>
        </div>
      </div>

      {/* Create proposal */}
      <div className="space-y-4">
        <div className="terminal-text">CREATE NEW PROPOSAL:</div>
        <div className="border border-gray-700 bg-black/5 p-6 rounded-sm">
          <div className="space-y-4">
            <div>
              <div className="terminal-dim text-xs mb-2">PROPOSAL TITLE</div>
              <div className="border border-gray-700 bg-black/10 p-2 rounded-sm">
                <div className="terminal-text text-xs">Enter proposal title...</div>
              </div>
            </div>

            <div>
              <div className="terminal-dim text-xs mb-2">PROPOSAL TYPE</div>
              <div className="border border-gray-700 bg-black/10 p-2 rounded-sm">
                <div className="terminal-text text-xs">Select type...</div>
              </div>
            </div>

            <div>
              <div className="terminal-dim text-xs mb-2">DESCRIPTION</div>
              <div className="border border-gray-700 bg-black/10 p-4 rounded-sm min-h-24">
                <div className="terminal-text text-xs">Detailed proposal description...</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="mobile-terminal-btn inline-block px-6 py-2 cursor-not-allowed opacity-50">
                <span className="terminal-command text-xs">SUBMIT PROPOSAL</span>
              </div>
              <div className="terminal-dim text-xs mt-2">
                Requires minimum governance token balance to submit
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delegation */}
      <div className="space-y-4">
        <div className="terminal-text">VOTING POWER DELEGATION:</div>
        <div className="border border-gray-700 bg-black/5 p-4 rounded-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="terminal-dim text-xs">YOUR VOTING POWER</div>
              <div className="terminal-bright">0 votes</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="terminal-dim text-xs">DELEGATED TO</div>
              <div className="terminal-text text-xs">None</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="terminal-dim text-xs">DELEGATED FROM OTHERS</div>
              <div className="terminal-text text-xs">0 votes</div>
            </div>
            <div className="pt-2 border-t border-gray-700">
              <div className="mobile-terminal-btn inline-block px-4 py-2 cursor-not-allowed opacity-50">
                <span className="text-xs">DELEGATE VOTES</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}