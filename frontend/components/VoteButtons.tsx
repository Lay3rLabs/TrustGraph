'use client'

import { Button } from '@/components/Button'
import { VoteType } from '@/hooks/useGovernance'

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
        variant="outline"
        className={[
          'flex-1 border-green-600 text-green-700 hover:bg-green-50 !px-4 !py-2',
          selected === VoteType.Yes ? 'bg-green-50 ring-1 ring-green-300' : '',
        ].join(' ')}
      >
        <span className="text-xs">VOTE FOR</span>
      </Button>
      <Button
        onClick={() => onSelect(VoteType.No)}
        disabled={baseDisabled}
        variant="outline"
        className={[
          'flex-1 border-red-600 text-red-700 hover:bg-red-50 !px-4 !py-2',
          selected === VoteType.No ? 'bg-red-50 ring-1 ring-red-300' : '',
        ].join(' ')}
      >
        <span className="text-xs">VOTE AGAINST</span>
      </Button>
      <Button
        onClick={() => onSelect(VoteType.Abstain)}
        disabled={baseDisabled}
        variant="outline"
        className={[
          'flex-1 border-gray-500 text-gray-700 hover:bg-gray-50 !px-4 !py-2',
          selected === VoteType.Abstain ? 'bg-gray-50 ring-1 ring-gray-300' : '',
        ].join(' ')}
      >
        <span className="text-xs">ABSTAIN</span>
      </Button>
    </div>
  )
}

