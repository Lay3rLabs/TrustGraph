'use client'

import type React from 'react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/Button'
import { VoteButtons } from '@/components/VoteButtons'
import { ProposalAction, VoteType } from '@/hooks/useGovernance'

import { Card } from './Card'
import { Switch } from './Switch'

interface CreateProposalFormProps {
  canCreateProposal: boolean
  userVotingPower?: string
  onCreateProposal?: (
    title: string,
    description: string,
    actions: ProposalAction[],
    voteType?: VoteType | null
  ) => Promise<string | null>
  isLoading?: boolean
}

export function CreateProposalForm({
  canCreateProposal,
  userVotingPower,
  onCreateProposal,
  isLoading = false,
}: CreateProposalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [castVoteOnCreate, setCastVoteOnCreate] = useState(false)
  const [voteType, setVoteType] = useState<VoteType>(VoteType.Yes)
  const [actions, setActions] = useState<ProposalAction[]>([])

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

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      if (!action.target.trim()) {
        return `Action ${i + 1}: Target address is required`
      }
      if (!action.target.startsWith('0x') || action.target.length !== 42) {
        return `Action ${i + 1}: Invalid target address format`
      }
      if (!action.description?.trim()) {
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
        const hash = await onCreateProposal(
          title,
          description,
          actions,
          castVoteOnCreate ? voteType : null
        )

        if (hash && hash !== 'undefined') {
          // Reset form
          setTitle('')
          setDescription('')
          setCastVoteOnCreate(false)
          setVoteType(VoteType.Yes)
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
    <Card size="lg" type="primary" className="space-y-4">
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Proposal Title */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">Proposal Title</div>
            <div className="text-muted-foreground text-xs">
              Provide a clear, concise title for your proposal
            </div>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your proposal"
            className="w-full bg-background border border-input rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            required
          />
        </div>

        {/* Proposal Description */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">Proposal Description</div>
            <div className="text-muted-foreground text-xs">
              Provide a clear, comprehensive description of your proposal
            </div>
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Proposal Actions</p>
            <div className="text-muted-foreground text-xs">
              Define the on-chain actions to execute if this proposal passes (if
              any)
            </div>
          </div>

          {actions.map((action, index) => (
            <Card key={index} type="detail" size="md" className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Action #{index + 1}</p>
                <Button
                  type="button"
                  onClick={() => removeAction(index)}
                  variant="destructive"
                  size="xs"
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs font-medium">
                    Target Contract
                  </div>
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
                  <div className="text-muted-foreground text-xs font-medium">
                    ETH Value
                  </div>
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
                  <div className="text-muted-foreground text-xs font-medium">
                    Operation Type
                  </div>
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
                <div className="text-muted-foreground text-xs font-medium">
                  Action Description
                </div>
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
                <div className="text-muted-foreground text-xs font-medium">
                  Calldata (Optional)
                </div>
                <textarea
                  value={action.data}
                  onChange={(e) => updateAction(index, 'data', e.target.value)}
                  placeholder="0x"
                  className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground placeholder:text-muted-foreground font-mono focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                  rows={2}
                />
              </div>
            </Card>
          ))}

          <Button
            className="self-start"
            type="button"
            onClick={addAction}
            variant="brand"
            size="xs"
          >
            Add Action
          </Button>
        </div>

        {/* Optional initial vote */}
        <div className="border border-border bg-muted/20 p-4 rounded-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">CAST YOUR VOTE (OPTIONAL)</div>
            <Switch
              enabled={castVoteOnCreate}
              onClick={() => setCastVoteOnCreate(!castVoteOnCreate)}
              size="md"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Your voting power: {userVotingPower ?? '0'}
          </div>

          <VoteButtons
            isLoading={isSubmitting || isLoading}
            selected={castVoteOnCreate ? voteType : null}
            onSelect={(vt) => {
              setVoteType(vt)
              setCastVoteOnCreate(true)
            }}
          />
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
    </Card>
  )
}
