import { InfoTooltip } from './ui/info-tooltip'

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
    <div className="flex flex-col gap-2 px-6 py-4 bg-accent rounded-md">
      <div className="flex flex-row items-center gap-2">
        <p className="text-sm">{title}</p>
        <InfoTooltip title={tooltip} />
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
