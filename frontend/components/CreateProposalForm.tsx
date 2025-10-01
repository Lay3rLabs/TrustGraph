'use client'

import type React from 'react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ProposalAction } from '@/hooks/useGovernance'

interface CreateProposalFormProps {
  canCreateProposal: boolean
  userVotingPower?: string
  proposalThreshold?: string
  onCreateProposal?: (
    actions: ProposalAction[],
    description: string
  ) => Promise<string | null>
  isLoading?: boolean
  formatVotingPower?: (amount: string) => string
}

export function CreateProposalForm({
  canCreateProposal,
  userVotingPower,
  proposalThreshold,
  onCreateProposal,
  isLoading = false,
  formatVotingPower = (amount) => amount,
}: CreateProposalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [description, setDescription] = useState('')
  const [actions, setActions] = useState<ProposalAction[]>([
    {
      target: '',
      value: '0',
      data: '0x',
      operation: 0, // Default to Call operation
      description: '',
    },
  ])

  const addAction = useCallback(() => {
    setActions((prev) => [
      ...prev,
      {
        target: '',
        value: '0',
        data: '0x',
        operation: 0, // Default to Call operation
        description: '',
      },
    ])
  }, [])

  const removeAction = useCallback((index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateAction = useCallback(
    (index: number, field: keyof ProposalAction, value: string) => {
      setActions((prev) =>
        prev.map((action, i) =>
          i === index ? { ...action, [field]: value } : action
        )
      )
    },
    []
  )

  const validateForm = (): string | null => {
    if (!description.trim()) {
      return 'Description is required'
    }

    if (actions.length === 0) {
      return 'At least one action is required'
    }

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      if (!action.target.trim()) {
        return `Action ${i + 1}: Target address is required`
      }
      if (!action.target.startsWith('0x') || action.target.length !== 42) {
        return `Action ${i + 1}: Invalid target address format`
      }
      if (!action.description.trim()) {
        return `Action ${i + 1}: Action description is required`
      }
    }

    return null
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!onCreateProposal || !canCreateProposal) {
        setError('Cannot create proposal - insufficient voting power')
        return
      }

      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        return
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const hash = await onCreateProposal(actions, description)

        if (hash && hash !== 'undefined') {
          // Reset form
          setDescription('')
          setActions([
            {
              target: '',
              value: '0',
              data: '0x',
              operation: 0,
              description: '',
            },
          ])
        } else {
          setError('Transaction failed - no hash returned')
        }
      } catch (err: any) {
        console.error('Error in handleSubmit:', err)
        setError(`Failed to create proposal: ${err.message || 'Unknown error'}`)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onCreateProposal, canCreateProposal, actions, description, validateForm]
  )

  return (
    <div className="border border-border bg-card p-6 rounded-md space-y-4">
      <div className="space-y-2">
        <div className="text-lg font-semibold">Create Proposal</div>
        <div className="text-muted-foreground text-sm">
          Submit a new proposal for the community to vote on
        </div>
      </div>

      {error && (
        <div className="border border-destructive/50 bg-destructive/10 p-3 rounded-md">
          <div className="text-destructive text-sm font-medium">⚠️ {error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Proposal Description */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Proposal Description</div>
          <div className="text-muted-foreground text-xs">
            Provide a clear, comprehensive description of your proposal
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your proposal in detail..."
            className="w-full bg-background border border-input rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground min-h-24 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            required
          />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Proposal Actions</div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  setActions([
                    {
                      target: '',
                      value: '0',
                      data: '0x',
                      operation: 0,
                      description: 'Send ETH to recipient',
                    },
                  ])
                  setDescription('Send ETH from treasury')
                }}
                variant="outline"
                size="sm"
              >
                ETH Send
              </Button>
              <Button
                type="button"
                onClick={addAction}
                variant="outline"
                size="sm"
              >
                Add Action
              </Button>
            </div>
          </div>

          <div className="text-muted-foreground text-xs">
            Define the on-chain actions to execute if proposal passes
          </div>

          {actions.map((action, index) => (
            <div
              key={index}
              className="border border-border p-4 rounded-md space-y-3 bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-xs font-medium">Action #{index + 1}</div>
                {actions.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeAction(index)}
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs font-medium">Target Contract</div>
                  <input
                    type="text"
                    value={action.target}
                    onChange={(e) =>
                      updateAction(index, 'target', e.target.value)
                    }
                    placeholder="0x..."
                    className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground placeholder:text-muted-foreground font-mono focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs font-medium">ETH Value</div>
                  <input
                    type="text"
                    value={action.value}
                    onChange={(e) =>
                      updateAction(index, 'value', e.target.value)
                    }
                    placeholder="0"
                    className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs font-medium">Operation Type</div>
                  <select
                    value={action.operation || 0}
                    onChange={(e) =>
                      updateAction(index, 'operation', e.target.value)
                    }
                    className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                  >
                    <option value={0}>Call</option>
                    <option value={1}>DelegateCall</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-muted-foreground text-xs font-medium">Action Description</div>
                <input
                  type="text"
                  value={action.description}
                  onChange={(e) =>
                    updateAction(index, 'description', e.target.value)
                  }
                  placeholder="Describe what this action does"
                  className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="text-muted-foreground text-xs font-medium">Calldata (Optional)</div>
                <textarea
                  value={action.data}
                  onChange={(e) => updateAction(index, 'data', e.target.value)}
                  placeholder="0x"
                  className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground placeholder:text-muted-foreground font-mono focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="border-t border-border pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || isLoading || !canCreateProposal}
            className="w-full px-4 py-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
          </Button>
        </div>
      </form>
    </div>
  )
}
