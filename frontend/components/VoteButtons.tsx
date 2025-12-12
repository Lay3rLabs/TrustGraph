'use client'

import { Button } from '@/components/Button'
import { VoteType } from '@/hooks/useGovernance'
import { cn } from '@/lib/utils'

type Props = {
  disabled?: boolean
  isLoading?: boolean
  selected?: VoteType | null
  onSelect: (voteType: VoteType) => void
}

export function VoteButtons({
  disabled = false,
  isLoading = false,
  selected = null,
  onSelect,
}: Props) {
  const baseDisabled = disabled || isLoading

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={() => onSelect(VoteType.Yes)}
        disabled={baseDisabled}
        type="button"
        variant="custom"
        className={cn(
          'grow !px-4 !py-2 ring-1',
          selected === VoteType.Yes
            ? '!bg-green-600 ring-green-600 !text-green-100 hover:opacity-90 transition-all'
            : '!bg-green-50 !text-green-700 ring-green-300'
        )}
      >
        <span className="text-xs">VOTE FOR</span>
      </Button>
      <Button
        onClick={() => onSelect(VoteType.No)}
        disabled={baseDisabled}
        type="button"
        variant="custom"
        className={cn(
          'grow !px-4 !py-2 ring-1',
          selected === VoteType.No
            ? '!bg-red-600 ring-red-600 !text-red-100 hover:opacity-90 transition-all'
            : '!bg-red-50 !text-red-700 ring-red-300'
        )}
      >
        <span className="text-xs">VOTE AGAINST</span>
      </Button>
      <Button
        onClick={() => onSelect(VoteType.Abstain)}
        disabled={baseDisabled}
        type="button"
        variant="custom"
        className={cn(
          'grow !px-4 !py-2 ring-1',
          selected === VoteType.Abstain
            ? '!bg-gray-700 ring-gray-700 !text-gray-100 hover:opacity-90 transition-all'
            : '!bg-gray-50 !text-gray-700 ring-gray-300'
        )}
      >
        <span className="text-xs">ABSTAIN</span>
      </Button>
    </div>
  )
}
