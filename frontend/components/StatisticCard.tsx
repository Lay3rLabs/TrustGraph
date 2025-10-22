import { Card } from './Card'
import { InfoTooltip } from './InfoTooltip'

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
    <Card type="accent" size="md" className="flex flex-col gap-2">
      <div className="flex flex-row items-center gap-2">
        <p className="text-sm">{title}</p>
        <InfoTooltip title={tooltip} />
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  )
}
