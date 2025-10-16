import { cn } from '@/lib/utils'

export type RankRendererProps = {
  rank: number
}

export const RankRenderer = ({ rank }: RankRendererProps) => {
  return (
    <div className="flex items-center space-x-2">
      <span
        className={cn(
          'text-sm font-semibold',
          rank === 1
            ? 'text-yellow-600'
            : rank === 2
            ? 'text-gray-500'
            : rank === 3
            ? 'text-amber-700'
            : 'text-gray-800'
        )}
      >
        #{rank}
      </span>
      {rank <= 3 && (
        <span className="text-base">
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
        </span>
      )}
    </div>
  )
}
