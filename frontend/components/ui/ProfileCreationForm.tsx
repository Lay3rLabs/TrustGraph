"use client";

import { useState } from "react";

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

interface ProfileCreationFormProps {
  onSubmit: (data: {
    name: string;
    futureVision: string;
    selectedGoals: string[];
  }) => void;
  isSubmitting: boolean;
}

export function ProfileCreationForm({
  onSubmit,
  isSubmitting,
}: ProfileCreationFormProps) {
  const [name, setName] = useState("");
  const [futureVision, setFutureVision] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [agreeToParticipate, setAgreeToParticipate] = useState(false);

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name.trim() ||
      !futureVision.trim() ||
      selectedGoals.length === 0 ||
      !agreeToParticipate
    )
      return;
    onSubmit({
      name: name.trim(),
      futureVision: futureVision.trim(),
      selectedGoals,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question 1: Name */}
      <div className="border border-gray-700 bg-black/5 p-6 rounded-sm">
        <div className="space-y-4">
          <div className="terminal-text">DIGITAL IDENTITY:</div>
          <div>
            <label className="block text-sm terminal-dim mb-2">
              What do you want to be called?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your chosen name..."
              className="w-full p-4 bg-black/10 border border-gray-700 text-white font-mono focus:border-gray-400 focus:outline-none placeholder-gray-500 rounded-sm"
              required
            />
            <div className="text-xs terminal-dim mt-2">
              This name will identify you within the collective network.
            </div>
          </div>
        </div>
      </div>

      {/* Question 2: Future Vision */}
      <div className="border border-gray-700 bg-black/5 p-6 rounded-sm">
        <div className="space-y-4">
          <div className="terminal-text">FUTURE IMAGINATION:</div>
          <div>
            <label className="block text-sm terminal-dim mb-2">
              What is a positive future you imagine?
            </label>
            <textarea
              value={futureVision}
              onChange={(e) => setFutureVision(e.target.value)}
              placeholder="Describe your vision of a positive future..."
              rows={4}
              className="w-full p-4 bg-black/10 border border-gray-700 text-white font-mono focus:border-gray-400 focus:outline-none placeholder-gray-500 resize-none rounded-sm"
              required
            />
            <div className="text-xs terminal-dim mt-2">
              Your vision will contribute to the collective imagination of
              possible futures.
            </div>
          </div>
        </div>
      </div>

      {/* Question 3: Experiment Participation */}
      <div className="border border-gray-700 bg-black/5 p-6 rounded-sm">
        <div className="space-y-4">
          <div className="terminal-text">EXPERIMENT PARTICIPATION:</div>
          <div>
            <label className="block text-sm terminal-dim mb-4">
              What do you want to do in the experiment? (Select as many as you
              want)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {experimentGoals.map((goal) => (
                <label
                  key={goal.id}
                  className={`flex items-start space-x-3 p-4 border rounded-sm cursor-pointer transition-colors ${
                    selectedGoals.includes(goal.id)
                      ? "border-gray-400 bg-black/20"
                      : "border-gray-700 hover:border-gray-600 bg-black/10"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedGoals.includes(goal.id)}
                    onChange={() => handleGoalToggle(goal.id)}
                    className="mt-1 w-4 h-4 accent-gray-400"
                  />
                  <span
                    className={`text-lg mt-0.5 ${
                      selectedGoals.includes(goal.id)
                        ? "terminal-bright"
                        : "terminal-dim"
                    }`}
                  >
                    {goal.icon}
                  </span>
                  <div className="flex-1">
                    <div
                      className={`font-medium text-sm ${
                        selectedGoals.includes(goal.id)
                          ? "terminal-text"
                          : "terminal-dim"
                      }`}
                    >
                      {goal.label}
                    </div>
                    <div className="text-xs terminal-dim mt-1">
                      {goal.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="text-xs terminal-dim mt-4">
              Selected: {selectedGoals.length} experiment domain
              {selectedGoals.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Experimental Participation Notice */}
      <div className="border border-gray-700 bg-black/5 p-6 rounded-sm">
        <div className="space-y-4">
          <div className="terminal-text">
            EXPERIMENTAL PARTICIPATION NOTICE:
          </div>
          <div className="terminal-dim text-sm space-y-2">
            <p>
              By creating this profile, you become part of an active experiment
              in collective intelligence. Your responses will be recorded on the
              blockchain as part of the research data.
            </p>
            <p>
              Participants in Hyperstition markets receive attestations
              regardless of voting outcomes. Your participation in collective
              decision-making contributes to the experiment's success.
            </p>
          </div>
          <div className="system-message text-xs">
            ░█ The collective grows stronger through individual contribution ░█
          </div>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeToParticipate}
              onChange={(e) => setAgreeToParticipate(e.target.checked)}
              className="mt-1 w-4 h-4 accent-gray-400"
              required
            />
            <div className="terminal-text text-sm">
              I understand and agree to participate in this collective
              intelligence experiment
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="border border-gray-700 bg-black/5 p-6 rounded-sm text-center">
        <button
          type="submit"
          disabled={
            isSubmitting ||
            !name.trim() ||
            !futureVision.trim() ||
            selectedGoals.length === 0 ||
            !agreeToParticipate
          }
          className="mobile-terminal-btn !px-8 !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="terminal-command text-sm">
            {isSubmitting ? "CREATING PROFILE..." : "CREATE PROFILE"}
          </span>
        </button>
      </div>
    </form>
  );
}
