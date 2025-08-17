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
          description="Your consciousness has been integrated into the EN0VA collective intelligence system. Use the navigation menu to explore and participate in active experiments."
        />

        <div className="border border-gray-700 bg-black/5 p-8 rounded-sm text-center">
          <div className="space-y-4">
            <div className="terminal-bright text-xl">∞ INTEGRATION COMPLETE ∞</div>
            <div className="terminal-text">
              Your digital identity has been successfully registered in the collective network.
            </div>
            <div className="system-message">
              Navigate to experiment sections using the menu above to begin participation.
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
                    <div className="ml-auto text-xs terminal-dim">ACTIVE</div>
                  </div>
                );
              })}
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