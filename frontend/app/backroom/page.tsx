"use client";

import type React from "react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

interface ExperimentGoal {
  id: string;
  label: string;
  description: string;
  icon: string;
}

const experimentGoals: ExperimentGoal[] = [
  {
    id: "hyperstition",
    label: "Hyperstition Markets",
    description: "Trade predictions about future possibilities",
    icon: "▲▼",
  },
  {
    id: "governance",
    label: "Collective Governance",
    description: "Participate in decentralized decision-making",
    icon: "◢◤",
  },
  {
    id: "attestations",
    label: "Truth Verification",
    description: "Create and verify attestations",
    icon: "◆",
  },
  {
    id: "ico",
    label: "Initial Collective Offering",
    description: "Contribute to the collective treasury",
    icon: "◊",
  },
  {
    id: "memetics",
    label: "Memetic Engineering",
    description: "Shape collective thought patterns",
    icon: "◈",
  },
  {
    id: "systems",
    label: "Infrastructure Building",
    description: "Develop network infrastructure",
    icon: "░█",
  },
  {
    id: "vault",
    label: "Multi-Chain Deposits",
    description: "Contribute funds across blockchain networks",
    icon: "◢◤",
  },
  {
    id: "consciousness",
    label: "Consciousness Exploration",
    description: "Explore collective intelligence mechanisms",
    icon: "∞",
  },
];

export default function BackroomProfileSetup() {
  const [name, setName] = useState("");
  const [futureVision, setFutureVision] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [showDashboard, setShowDashboard] = useState(false);

  const { address, isConnected } = useAccount();
  const router = useRouter();

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !futureVision.trim() || selectedGoals.length === 0) return;
    
    setIsSubmitting(true);
    
    // Simulate profile creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setShowDashboard(true);
    
    // Redirect to dashboard after showing success
    setTimeout(() => {
      // For now we'll just show success, later this could redirect to a proper dashboard
      setStep(4);
    }, 2000);
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-white mb-4">
            ◢◤◢◤◢◤ EN0VA COLLECTIVE ◢◤◢◤◢◤
          </h1>
          <div className="text-red-400 text-lg mb-4">⚠️ WALLET NOT CONNECTED</div>
          <p className="text-gray-400 mb-6">
            Connect your wallet to access the collective intelligence network.
          </p>
          <div className="system-message">
            Neural link required for collective participation.
          </div>
        </div>
      </div>
    );
  }

  if (showDashboard || step === 4) {
    return (
      <div className="space-y-6">
        <div className="border border-green-600 p-8 bg-green-900/20 backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-green-400 mb-4">
            ◢◤◢◤◢◤ PROFILE CREATED ◢◤◢◤◢◤
          </h1>
          <div className="text-white text-lg mb-4">Welcome to the Collective, {name}</div>
          <p className="text-gray-300 mb-6">
            Your digital consciousness has been registered in the EN0VA network.
            The future you envision will contribute to our collective intelligence.
          </p>
          <div className="system-message mb-6">
            ∞ THE EXPERIMENT BEGINS ∞
          </div>
          <div className="text-sm text-gray-400">
            Explore the network using the navigation menu above.
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-700 bg-black/10 p-4">
            <div className="terminal-dim text-xs mb-2">YOUR INTERESTS</div>
            <div className="terminal-bright text-xl">{selectedGoals.length}</div>
            <div className="system-message text-xs mt-1">experiment domains</div>
          </div>
          <div className="border border-gray-700 bg-black/10 p-4">
            <div className="terminal-dim text-xs mb-2">COLLECTIVE NODES</div>
            <div className="terminal-bright text-xl">893</div>
            <div className="system-message text-xs mt-1">you are node 893</div>
          </div>
          <div className="border border-gray-700 bg-black/10 p-4">
            <div className="terminal-dim text-xs mb-2">NETWORK STATUS</div>
            <div className="terminal-bright text-xl">ACTIVE</div>
            <div className="system-message text-xs mt-1">consciousness flowing</div>
          </div>
        </div>

        {/* Selected Goals */}
        <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-4">YOUR EXPERIMENT PARTICIPATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {experimentGoals
              .filter(goal => selectedGoals.includes(goal.id))
              .map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center space-x-3 p-3 border border-gray-600 rounded-sm bg-gray-900/10"
                >
                  <span className="text-green-400 text-lg">{goal.icon}</span>
                  <div>
                    <div className="text-white font-medium text-sm">{goal.label}</div>
                    <div className="text-xs text-gray-400">{goal.description}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border border-gray-600 p-8 bg-gray-900/30 backdrop-blur-sm text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          ◢◤◢◤◢◤ CREATE YOUR PROFILE ◢◤◢◤◢◤
        </h1>
        <p className="text-gray-300 mb-6">
          Now it's time to create your profile. Your digital identity will become 
          part of the collective intelligence network.
        </p>
        <div className="system-message">
          ∞ CONSCIOUSNESS INITIALIZATION PROTOCOL ∞
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="border border-gray-600 p-4 bg-gray-900/20 backdrop-blur-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="terminal-dim">Profile Setup Progress</span>
          <span className="text-white">{step}/3</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 mt-2 border border-gray-600">
          <div 
            className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question 1: Name */}
        {step >= 1 && (
          <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white mb-4">
              ◉ DIGITAL IDENTITY
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What do you want to be called?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your chosen name..."
                  className="w-full p-4 bg-black border border-gray-600 text-white font-mono focus:border-blue-400 focus:outline-none placeholder-gray-500"
                  required
                />
                <div className="text-xs text-gray-500 mt-2">
                  This name will identify you within the collective network.
                </div>
              </div>
              {name.trim() && step === 1 && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
                >
                  CONTINUE
                </button>
              )}
            </div>
          </div>
        )}

        {/* Question 2: Future Vision */}
        {step >= 2 && (
          <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white mb-4">
              ◉ FUTURE IMAGINATION
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What is a positive future you imagine?
                </label>
                <textarea
                  value={futureVision}
                  onChange={(e) => setFutureVision(e.target.value)}
                  placeholder="Describe your vision of a positive future..."
                  rows={5}
                  className="w-full p-4 bg-black border border-gray-600 text-white font-mono focus:border-blue-400 focus:outline-none placeholder-gray-500 resize-none"
                  required
                />
                <div className="text-xs text-gray-500 mt-2">
                  Your vision will contribute to the collective imagination of possible futures.
                </div>
              </div>
              {futureVision.trim() && step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
                >
                  CONTINUE
                </button>
              )}
            </div>
          </div>
        )}

        {/* Question 3: Experiment Goals */}
        {step >= 3 && (
          <div className="border border-gray-600 p-6 bg-gray-900/20 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white mb-4">
              ◉ EXPERIMENT PARTICIPATION
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  What do you want to do in the experiment? (Select as many as you want)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {experimentGoals.map((goal) => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => handleGoalToggle(goal.id)}
                      className={`p-4 border rounded-sm transition-colors text-left ${
                        selectedGoals.includes(goal.id)
                          ? "border-green-400 bg-green-900/20 text-white"
                          : "border-gray-600 hover:border-gray-500 bg-gray-900/10 text-gray-300"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className={`text-lg mt-1 ${
                          selectedGoals.includes(goal.id) ? "text-green-400" : "text-gray-400"
                        }`}>
                          {goal.icon}
                        </span>
                        <div>
                          <div className="font-medium text-sm">{goal.label}</div>
                          <div className="text-xs text-gray-400 mt-1">{goal.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-4">
                  Selected: {selectedGoals.length} experiment domain{selectedGoals.length !== 1 ? 's' : ''}
                </div>
              </div>

              {selectedGoals.length > 0 && (
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim() || !futureVision.trim()}
                    className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "CREATING PROFILE..." : "CREATE PROFILE"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Important Notice */}
      <div className="border border-yellow-600 p-6 bg-yellow-900/10 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-yellow-400 mb-4">⚠️ EXPERIMENTAL PARTICIPATION</h3>
        <div className="text-sm text-yellow-200 space-y-2">
          <p>
            By creating this profile, you become part of an active experiment in collective intelligence. 
            Your responses will be recorded on the blockchain as part of the research data.
          </p>
          <p>
            Remember: Participants in Hyperstition markets will receive attestations regardless 
            of whether they vote yes or no. Your participation in collective decision-making is 
            what matters for the experiment.
          </p>
        </div>
      </div>
    </div>
  );
}