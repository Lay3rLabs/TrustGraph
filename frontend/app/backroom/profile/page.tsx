"use client";

import type React from "react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProfileCreationForm } from "@/components/ui/ProfileCreationForm";

export default function BackroomProfileSetup() {
  const [profileData, setProfileData] = useState<{
    name: string;
    futureVision: string;
    selectedGoals: string[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { address, isConnected } = useAccount();

  const handleProfileSubmit = async (data: {
    name: string;
    futureVision: string;
    selectedGoals: string[];
  }) => {
    setIsSubmitting(true);
    
    // Simulate profile creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProfileData(data);
    setIsSubmitting(false);
  };

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <SectionHeader 
          title="CONNECTION REQUIRED"
          subtitle="░█ Neural link initialization protocol ░█"
          description="Connect your wallet to access the collective intelligence network and begin profile creation."
        />
        
        <div className="border border-gray-700 bg-black/5 p-8 rounded-sm text-center">
          <div className="space-y-4">
            <div className="terminal-command text-red-400 text-lg">⚠️ WALLET NOT CONNECTED</div>
            <div className="terminal-text">
              Collective participation requires authenticated neural link.
            </div>
            <div className="system-message">
              Connect wallet to proceed with consciousness integration.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profileData) {
    return (
      <div className="space-y-8">
        <SectionHeader 
          title="PROFILE CREATED"
          subtitle={`◢◤ Welcome to the network, ${profileData.name} ◢◤`}
          description="Your consciousness has been integrated into the EN0VA collective intelligence system. Explore your digital identity below and use the navigation menu to participate in active experiments."
        />

        {/* Profile Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity Card */}
          <div className="lg:col-span-2 border border-gray-700 bg-black/10 p-6 rounded-sm">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 border border-gray-700 bg-black/20 rounded-sm flex items-center justify-center">
                  <div className="terminal-bright text-2xl">◉</div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="terminal-command">{profileData.name}</div>
                  <div className="terminal-dim text-xs">ENS: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}</div>
                  <div className="terminal-dim text-xs">Wallet: {isConnected ? 'Connected' : 'Not Connected'}</div>
                  <div className="terminal-text text-xs">Collective Node since: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
                <div className="terminal-dim text-xs mb-2">FUTURE VISION</div>
                <div className="terminal-text text-sm">{profileData.futureVision}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <div className="terminal-dim text-xs">ATTESTATIONS RECEIVED</div>
                  <div className="terminal-bright text-lg">0</div>
                </div>
                <div>
                  <div className="terminal-dim text-xs">ATTESTATIONS GIVEN</div>
                  <div className="terminal-bright text-lg">0</div>
                </div>
                <div>
                  <div className="terminal-dim text-xs">GOVERNANCE VOTES</div>
                  <div className="terminal-bright text-lg">0</div>
                </div>
                <div>
                  <div className="terminal-dim text-xs">EXPERIMENT DOMAINS</div>
                  <div className="terminal-bright text-lg">{profileData.selectedGoals.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="space-y-4">
            <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="space-y-2">
                <div className="terminal-dim text-xs">NEURAL CONNECTION</div>
                <div className="terminal-bright text-sm">{isConnected ? 'Connected' : 'Disconnected'}</div>
                <div className="terminal-dim text-xs">{isConnected ? 'Neural link established' : 'Connect wallet to establish link'}</div>
              </div>
            </div>
            
            <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="space-y-2">
                <div className="terminal-dim text-xs">CONSENSUS WEIGHT</div>
                <div className="terminal-bright text-xl">0.0</div>
                <div className="terminal-dim text-xs">Participate to increase weight</div>
              </div>
            </div>

            <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
              <div className="space-y-2">
                <div className="terminal-dim text-xs">REALITY INFLUENCE</div>
                <div className="system-message">Nascent</div>
                <div className="terminal-dim text-xs">New collective member</div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Experiment Domains */}
        <div className="space-y-4">
          <div className="terminal-text">YOUR EXPERIMENT PARTICIPATION:</div>
          <div className="border border-gray-700 bg-black/5 p-6 rounded-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "hyperstition", "governance", "attestations", "ico", 
                "memetics", "systems", "vault", "consciousness"
              ].filter(id => profileData.selectedGoals.includes(id)).map(id => {
                const goalMap: Record<string, { label: string; icon: string }> = {
                  hyperstition: { label: "Hyperstition Markets", icon: "▲▼" },
                  governance: { label: "Collective Governance", icon: "◢◤" },
                  attestations: { label: "Truth Verification", icon: "◆" },
                  ico: { label: "Initial Collective Offering", icon: "◊" },
                  memetics: { label: "Memetic Engineering", icon: "◈" },
                  systems: { label: "Infrastructure Building", icon: "░█" },
                  vault: { label: "Multi-Chain Deposits", icon: "◢◤" },
                  consciousness: { label: "Consciousness Exploration", icon: "∞" }
                };
                
                const goal = goalMap[id];
                return (
                  <div key={id} className="flex items-center space-x-3 p-3 border border-gray-700 bg-black/10 rounded-sm">
                    <span className="terminal-bright text-lg">{goal.icon}</span>
                    <div className="terminal-text text-sm">{goal.label}</div>
                    <div className="ml-auto text-xs terminal-bright">ENROLLED</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Initial Verification Status */}
        <div className="space-y-4">
          <div className="terminal-text">IDENTITY VERIFICATION STATUS:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { type: "Profile Creation", status: "verified", description: "Basic identity profile established" },
              { type: "Wallet Connection", status: isConnected ? "verified" : "pending", description: "Ethereum wallet linked for authentication" },
              { type: "Experiment Enrollment", status: "verified", description: `Enrolled in ${profileData.selectedGoals.length} experiment domains` },
              { type: "Reputation Building", status: "pending", description: "Participate in experiments to build reputation" },
              { type: "Attestation Network", status: "pending", description: "Give and receive attestations to expand network" },
              { type: "Governance Participation", status: "pending", description: "Vote on collective decisions to increase influence" }
            ].map((verification, index) => (
              <div key={index} className="border border-gray-700 bg-black/5 p-4 rounded-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="terminal-command text-sm">{verification.type}</div>
                    <div className={`text-xs ${
                      verification.status === 'verified' ? 'terminal-bright' :
                      verification.status === 'pending' ? 'system-message' : 'terminal-dim'
                    }`}>
                      {verification.status === 'verified' ? '✓ VERIFIED' : verification.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="terminal-dim text-xs">{verification.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="border border-gray-700 bg-black/5 p-6 rounded-sm">
          <div className="space-y-4">
            <div className="terminal-bright text-sm">RECOMMENDED NEXT STEPS:</div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="terminal-bright">1.</span>
                <div className="terminal-text text-sm">Navigate to Attestations to verify your identity and build reputation</div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="terminal-bright">2.</span>
                <div className="terminal-text text-sm">Explore Governance to participate in collective decision-making</div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="terminal-bright">3.</span>
                <div className="terminal-text text-sm">Visit Hyperstition Markets to engage with prediction markets</div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="terminal-bright">4.</span>
                <div className="terminal-text text-sm">Check Rewards to track your participation incentives</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile creation form
  return (
    <div className="space-y-8">
      <SectionHeader 
        title="PROFILE CREATION PROTOCOL"
        subtitle="∞ CONSCIOUSNESS INITIALIZATION SEQUENCE ∞"
        description="Create your digital identity to join the collective intelligence network. All three sections must be completed for full integration."
      />
      
      <ProfileCreationForm 
        onSubmit={handleProfileSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}