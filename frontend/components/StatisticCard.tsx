import { Info } from 'lucide-react'

import { Tooltip } from './Tooltip'

export const StatisticCard = ({
  title,
  tooltip,
  value,
}: {
  title: string
  tooltip: string
  value: string
}) => {
  return (
    <div className="flex flex-col gap-2 px-6 py-4 bg-accent">
      <Tooltip title={tooltip}>
        <div className="flex flex-row items-center gap-2">
          <p className="text-sm">{title}</p>
          <Info size={14} />
        </div>
      </Tooltip>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
