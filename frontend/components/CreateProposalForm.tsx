"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ProposalAction } from "@/hooks/useGovernance";

interface CreateProposalFormProps {
  canCreateProposal: boolean;
  userVotingPower?: string;
  proposalThreshold?: string;
  onCreateProposal?: (actions: ProposalAction[], description: string) => Promise<string | null>;
  isLoading?: boolean;
  formatVotingPower?: (amount: string) => string;
}

export function CreateProposalForm({
  canCreateProposal,
  userVotingPower,
  proposalThreshold,
  onCreateProposal,
  isLoading = false,
  formatVotingPower = (amount) => amount,
}: CreateProposalFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [description, setDescription] = useState("");
  const [actions, setActions] = useState<ProposalAction[]>([
    {
      target: "",
      value: "0",
      data: "0x",
      operation: 0, // Default to Call operation
      description: "",
    },
  ]);

  const addAction = useCallback(() => {
    setActions(prev => [
      ...prev,
      {
        target: "",
        value: "0", 
        data: "0x",
        operation: 0, // Default to Call operation
        description: "",
      },
    ]);
  }, []);

  const removeAction = useCallback((index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateAction = useCallback((index: number, field: keyof ProposalAction, value: string) => {
    setActions(prev => prev.map((action, i) => 
      i === index ? { ...action, [field]: value } : action
    ));
  }, []);

  const validateForm = (): string | null => {
    if (!description.trim()) {
      return "Description is required";
    }

    if (actions.length === 0) {
      return "At least one action is required";
    }

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (!action.target.trim()) {
        return `Action ${i + 1}: Target address is required`;
      }
      if (!action.target.startsWith("0x") || action.target.length !== 42) {
        return `Action ${i + 1}: Invalid target address format`;
      }
      if (!action.description.trim()) {
        return `Action ${i + 1}: Action description is required`;
      }
    }

    return null;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onCreateProposal || !canCreateProposal) {
      setError("Cannot create proposal - insufficient voting power");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log("Submitting proposal with:", { actions, description });
      const hash = await onCreateProposal(actions, description);
      console.log("Received hash from createProposal:", hash);
      
      if (hash && hash !== "undefined") {
        setSuccessMessage(`Proposal created successfully! Transaction: ${hash}`);
        // Reset form
        setDescription("");
        setActions([{
          target: "",
          value: "0",
          data: "0x",
          operation: 0,
          description: "",
        }]);
        setIsExpanded(false);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError("Transaction failed - no hash returned");
      }
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
      setError(`Failed to create proposal: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [onCreateProposal, canCreateProposal, actions, description, validateForm]);

  if (!isExpanded) {
    return (
      <div className="border border-gray-700 bg-black/10 p-6 rounded-sm space-y-4">
        <div className="space-y-2">
          <div className="ascii-art-title text-lg">CREATE NEW PROPOSAL</div>
          <div className="terminal-dim text-sm">
            ◢◤ Submit proposals for community governance ◢◤
          </div>
        </div>

        {successMessage && (
          <div className="border border-green-700 bg-green-900/10 p-3 rounded-sm">
            <div className="text-green-400 text-sm">✓ {successMessage}</div>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="terminal-dim text-xs">YOUR VOTING POWER</div>
              <div className="terminal-text">
                {userVotingPower ? formatVotingPower(userVotingPower) : "0"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="terminal-dim text-xs">REQUIRED THRESHOLD</div>
              <div className="terminal-text">
                {proposalThreshold ? formatVotingPower(proposalThreshold) : "0"}
              </div>
            </div>
          </div>

          {canCreateProposal ? (
            <Button
              onClick={() => setIsExpanded(true)}
              className="w-full sm:w-auto mobile-terminal-btn"
            >
              <span className="terminal-command text-xs">CREATE PROPOSAL</span>
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                disabled
                className="w-full sm:w-auto mobile-terminal-btn opacity-50 cursor-not-allowed"
              >
                <span className="terminal-command text-xs">CREATE PROPOSAL</span>
              </Button>
              <div className="terminal-dim text-xs">
                Governance not initialized. Merkle root required.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-700 bg-black/10 p-6 rounded-sm space-y-4">
      <div className="space-y-2">
        <div className="ascii-art-title text-lg">CREATE NEW PROPOSAL</div>
        <div className="terminal-dim text-sm">
          ◢◤ Submit proposals for community governance ◢◤
        </div>
      </div>

      {error && (
        <div className="border border-red-700 bg-red-900/10 p-3 rounded-sm">
          <div className="text-red-400 text-sm">⚠️ {error}</div>
        </div>
      )}

      {successMessage && (
        <div className="border border-green-700 bg-green-900/10 p-3 rounded-sm">
          <div className="text-green-400 text-sm">✓ {successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Proposal Description */}
        <div className="space-y-2">
          <div className="terminal-bright text-sm">PROPOSAL DESCRIPTION</div>
          <div className="terminal-dim text-xs">
            Provide a clear, comprehensive description of your proposal
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your proposal in detail..."
            className="w-full bg-black/20 border border-gray-700 rounded-sm p-3 text-sm text-gray-300 placeholder-gray-500 min-h-24 focus:border-gray-500 focus:outline-none"
            required
          />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="terminal-bright text-sm">PROPOSAL ACTIONS</div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  setActions([{
                    target: "",
                    value: "0",
                    data: "0x",
                    operation: 0,
                    description: "Send ETH to recipient",
                  }]);
                  setDescription("Send ETH from treasury");
                }}
                variant="outline"
                className="border-blue-700 text-blue-400 hover:bg-blue-900/20 text-xs"
              >
                ETH SEND
              </Button>
              <Button
                type="button"
                onClick={addAction}
                variant="outline"
                className="border-gray-700 text-gray-400 hover:bg-gray-900/20 text-xs"
              >
                ADD ACTION
              </Button>
            </div>
          </div>
          
          <div className="terminal-dim text-xs">
            Define the on-chain actions to execute if proposal passes
          </div>

          {actions.map((action, index) => (
            <div key={index} className="border border-gray-700 p-4 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="terminal-dim text-xs">ACTION #{index + 1}</div>
                {actions.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeAction(index)}
                    variant="outline"
                    className="border-red-700 text-red-400 hover:bg-red-900/20 text-xs px-2 py-1"
                  >
                    REMOVE
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="terminal-dim text-xs">TARGET CONTRACT</div>
                  <input
                    type="text"
                    value={action.target}
                    onChange={(e) => updateAction(index, "target", e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-black/20 border border-gray-700 rounded-sm p-2 text-sm text-gray-300 placeholder-gray-500 font-mono focus:border-gray-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="terminal-dim text-xs">ETH VALUE</div>
                  <input
                    type="text"
                    value={action.value}
                    onChange={(e) => updateAction(index, "value", e.target.value)}
                    placeholder="0"
                    className="w-full bg-black/20 border border-gray-700 rounded-sm p-2 text-sm text-gray-300 placeholder-gray-500 focus:border-gray-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="terminal-dim text-xs">OPERATION TYPE</div>
                  <select
                    value={action.operation || 0}
                    onChange={(e) => updateAction(index, "operation", e.target.value)}
                    className="w-full bg-black/20 border border-gray-700 rounded-sm p-2 text-sm text-gray-300 focus:border-gray-500 focus:outline-none"
                  >
                    <option value={0}>Call</option>
                    <option value={1}>DelegateCall</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="terminal-dim text-xs">ACTION DESCRIPTION</div>
                <input
                  type="text"
                  value={action.description}
                  onChange={(e) => updateAction(index, "description", e.target.value)}
                  placeholder="Describe what this action does"
                  className="w-full bg-black/20 border border-gray-700 rounded-sm p-2 text-sm text-gray-300 placeholder-gray-500 focus:border-gray-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="terminal-dim text-xs">CALLDATA (OPTIONAL)</div>
                <textarea
                  value={action.data}
                  onChange={(e) => updateAction(index, "data", e.target.value)}
                  placeholder="0x"
                  className="w-full bg-black/20 border border-gray-700 rounded-sm p-2 text-sm text-gray-300 placeholder-gray-500 font-mono focus:border-gray-500 focus:outline-none"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit Buttons */}
        <div className="border-t border-gray-700 pt-4 flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || isLoading || !canCreateProposal}
            className="flex-1 mobile-terminal-btn"
          >
            <span className="terminal-command text-xs">
              {isSubmitting ? "SUBMITTING..." : "SUBMIT PROPOSAL"}
            </span>
          </Button>

          <Button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              setError(null);
            }}
            variant="outline"
            className="border-gray-700 text-gray-400 hover:bg-gray-900/20 flex-1"
          >
            <span className="text-xs">CANCEL</span>
          </Button>
        </div>

        {/* Requirements Note */}
        <div className="terminal-dim text-xs text-center">
          Anyone can create proposals when merkle root is set
        </div>
      </form>
    </div>
  );
}