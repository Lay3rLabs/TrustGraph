"use client";

import type React from "react";

export default function AttestationsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="terminal-command text-lg">ATTESTATION PROTOCOLS</div>
        <div className="system-message">
          ◢◤ Truth verification through cryptographic consensus ◢◤
        </div>
      </div>

      {/* Schema selection */}
      <div className="space-y-4">
        <div className="terminal-text">SELECT ATTESTATION SCHEMA:</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            {
              name: "Collective Intelligence Score",
              uid: "0x7f2a8b...",
              fields: ["intelligence_level", "consensus_weight", "network_influence"]
            },
            {
              name: "Digital Identity Verification",
              uid: "0x4c91de...",
              fields: ["identity_hash", "verification_level", "trust_score"]
            },
            {
              name: "Future Prediction Accuracy",
              uid: "0xa3b7f2...",
              fields: ["prediction_id", "accuracy_score", "time_horizon"]
            },
            {
              name: "Neural Consensus Participation",
              uid: "0x1e8f43...",
              fields: ["consensus_rounds", "agreement_ratio", "influence_metric"]
            }
          ].map((schema) => (
            <div key={schema.uid} className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="space-y-2">
                <div className="terminal-command text-sm">{schema.name}</div>
                <div className="terminal-dim text-xs">UID: {schema.uid}</div>
                <div className="space-y-1">
                  <div className="terminal-dim text-xs">Fields:</div>
                  {schema.fields.map((field) => (
                    <div key={field} className="terminal-text text-xs ml-2">• {field}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attestation form placeholder */}
      <div className="space-y-4">
        <div className="terminal-text">CREATE NEW ATTESTATION:</div>
        <div className="border border-gray-700 bg-black/5 p-6 rounded-sm">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="terminal-dim text-xs mb-2">RECIPIENT ADDRESS</div>
                <div className="border border-gray-700 bg-black/10 p-2 rounded-sm">
                  <div className="terminal-text text-xs">0x...</div>
                </div>
              </div>
              <div>
                <div className="terminal-dim text-xs mb-2">SCHEMA UID</div>
                <div className="border border-gray-700 bg-black/10 p-2 rounded-sm">
                  <div className="terminal-text text-xs">Select schema...</div>
                </div>
              </div>
            </div>

            <div>
              <div className="terminal-dim text-xs mb-2">ATTESTATION DATA</div>
              <div className="border border-gray-700 bg-black/10 p-4 rounded-sm min-h-24">
                <div className="terminal-text text-xs">JSON data structure will appear here...</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="mobile-terminal-btn inline-block px-6 py-2 cursor-not-allowed opacity-50">
                <span className="terminal-command text-xs">CREATE ATTESTATION</span>
              </div>
              <div className="terminal-dim text-xs mt-2">
                Connect wallet to enable attestation creation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent attestations */}
      <div className="space-y-4">
        <div className="terminal-text">RECENT ATTESTATIONS:</div>
        <div className="space-y-3">
          {[
            {
              uid: "0xa7f2b8c1...",
              schema: "Collective Intelligence Score", 
              recipient: "0x4d2f...8a1c",
              timestamp: "2 hours ago"
            },
            {
              uid: "0x3e9d4b7f...",
              schema: "Digital Identity Verification",
              recipient: "0x7a8b...3f2d", 
              timestamp: "5 hours ago"
            },
            {
              uid: "0x9c1e5a82...",
              schema: "Future Prediction Accuracy",
              recipient: "0x2f7d...9b4e",
              timestamp: "12 hours ago"
            }
          ].map((attestation) => (
            <div key={attestation.uid} className="border border-gray-700 bg-black/5 p-3 rounded-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="space-y-1">
                  <div className="terminal-command text-xs">{attestation.schema}</div>
                  <div className="terminal-dim text-xs">
                    {attestation.uid} → {attestation.recipient}
                  </div>
                </div>
                <div className="terminal-dim text-xs">{attestation.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}