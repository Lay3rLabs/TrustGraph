"use client";

import type React from "react";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="terminal-command text-lg">DIGITAL IDENTITY MATRIX</div>
        <div className="system-message">
          ◉ Your verified existence within the collective consciousness ◉
        </div>
      </div>

      {/* Profile overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity card */}
        <div className="lg:col-span-2 border border-gray-700 bg-black/10 p-6 rounded-sm">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 border border-gray-700 bg-black/20 rounded-sm flex items-center justify-center">
                <div className="terminal-bright text-2xl">◉</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="terminal-command">Anonymous Entity</div>
                <div className="terminal-dim text-xs">ENS: Not Connected</div>
                <div className="terminal-dim text-xs">Wallet: Not Connected</div>
                <div className="terminal-text text-xs">Collective Node since: --</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
              <div>
                <div className="terminal-dim text-xs">ATTESTATIONS RECEIVED</div>
                <div className="terminal-bright text-lg">--</div>
              </div>
              <div>
                <div className="terminal-dim text-xs">ATTESTATIONS GIVEN</div>
                <div className="terminal-bright text-lg">--</div>
              </div>
              <div>
                <div className="terminal-dim text-xs">GOVERNANCE VOTES</div>
                <div className="terminal-bright text-lg">--</div>
              </div>
              <div>
                <div className="terminal-dim text-xs">MARKET POSITIONS</div>
                <div className="terminal-bright text-lg">--</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status indicators */}
        <div className="space-y-4">
          <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
            <div className="space-y-2">
              <div className="terminal-dim text-xs">NEURAL CONNECTION</div>
              <div className="terminal-text text-sm">Disconnected</div>
              <div className="terminal-dim text-xs">Connect wallet to establish link</div>
            </div>
          </div>
          
          <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
            <div className="space-y-2">
              <div className="terminal-dim text-xs">CONSENSUS WEIGHT</div>
              <div className="terminal-bright text-xl">0.0</div>
              <div className="terminal-dim text-xs">Build reputation to increase</div>
            </div>
          </div>

          <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
            <div className="space-y-2">
              <div className="terminal-dim text-xs">REALITY INFLUENCE</div>
              <div className="system-message">None</div>
              <div className="terminal-dim text-xs">Participate to gain influence</div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification status */}
      <div className="space-y-4">
        <div className="terminal-text">IDENTITY VERIFICATION STATUS:</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { type: "Wallet Connection", status: "pending", description: "Connect Ethereum wallet for basic verification" },
            { type: "ENS Domain", status: "unavailable", description: "Link ENS domain for human-readable identity" },
            { type: "Social Verification", status: "unavailable", description: "Verify Twitter/GitHub/Discord accounts" },
            { type: "Biometric Proof", status: "unavailable", description: "Humanness verification through biometric attestation" },
            { type: "Reputation Score", status: "unavailable", description: "Build reputation through network participation" },
            { type: "Neural Synchronization", status: "unavailable", description: "Achieve consciousness synchronization with collective" }
          ].map((verification, index) => (
            <div key={index} className="border border-gray-700 bg-black/5 p-4 rounded-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="terminal-command text-sm">{verification.type}</div>
                  <div className={`text-xs ${
                    verification.status === 'pending' ? 'system-message' :
                    verification.status === 'verified' ? 'terminal-bright' : 'terminal-dim'
                  }`}>
                    {verification.status.toUpperCase()}
                  </div>
                </div>
                <div className="terminal-dim text-xs">{verification.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attestations */}
      <div className="space-y-4">
        <div className="terminal-text">RECEIVED ATTESTATIONS:</div>
        <div className="border border-gray-700 bg-black/5 p-6 rounded-sm text-center">
          <div className="space-y-2">
            <div className="terminal-dim">No attestations received</div>
            <div className="system-message text-xs">
              ◉ Your digital proof of existence awaits verification ◉
            </div>
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="space-y-4">
        <div className="terminal-text">RECENT ACTIVITY:</div>
        <div className="border border-gray-700 bg-black/5 p-6 rounded-sm text-center">
          <div className="space-y-2">
            <div className="terminal-dim">No recent activity</div>
            <div className="system-message text-xs">
              ◉ Your journey through the collective begins now ◉
            </div>
          </div>
        </div>
      </div>

      {/* Profile settings */}
      <div className="space-y-4">
        <div className="terminal-text">PROFILE CONFIGURATION:</div>
        <div className="border border-gray-700 bg-black/5 p-6 rounded-sm">
          <div className="space-y-4">
            <div>
              <div className="terminal-dim text-xs mb-2">DISPLAY NAME</div>
              <div className="border border-gray-700 bg-black/10 p-2 rounded-sm">
                <div className="terminal-text text-xs">Anonymous Entity</div>
              </div>
            </div>

            <div>
              <div className="terminal-dim text-xs mb-2">BIO/DESCRIPTION</div>
              <div className="border border-gray-700 bg-black/10 p-4 rounded-sm min-h-20">
                <div className="terminal-text text-xs">
                  A consciousness seeking truth through collective intelligence...
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="terminal-dim text-xs mb-2">PREFERRED PRONOUNS</div>
                <div className="border border-gray-700 bg-black/10 p-2 rounded-sm">
                  <div className="terminal-text text-xs">they/them/it</div>
                </div>
              </div>
              <div>
                <div className="terminal-dim text-xs mb-2">TIMEZONE</div>
                <div className="border border-gray-700 bg-black/10 p-2 rounded-sm">
                  <div className="terminal-text text-xs">UTC</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="mobile-terminal-btn inline-block px-6 py-2 cursor-not-allowed opacity-50">
                <span className="terminal-command text-xs">UPDATE PROFILE</span>
              </div>
              <div className="terminal-dim text-xs mt-2">
                Connect wallet to save profile changes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data export */}
      <div className="space-y-4">
        <div className="terminal-text">DATA SOVEREIGNTY:</div>
        <div className="border border-gray-700 bg-black/5 p-4 rounded-sm">
          <div className="space-y-3">
            <div className="terminal-text text-xs">
              You maintain full control over your digital identity and data within the collective.
            </div>
            <div className="flex space-x-2">
              <div className="mobile-terminal-btn px-4 py-2 cursor-not-allowed opacity-50">
                <span className="text-xs">EXPORT DATA</span>
              </div>
              <div className="mobile-terminal-btn px-4 py-2 cursor-not-allowed opacity-50">
                <span className="text-xs">DELETE PROFILE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}