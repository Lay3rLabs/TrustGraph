import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { Card } from './Card'
import { InfoTooltip } from './InfoTooltip'

const textClassNames = 'text-3xl font-bold'

export const StatisticCard = ({
  title,
  tooltip,
  value,
  children,
  href,
}: {
  title: string
  tooltip: string
  value?: string
  children?: ReactNode
  href?: string
}) => {
  return (
    <Card type="accent" size="md" className="flex flex-col gap-2">
      <div className="flex flex-row items-center gap-2">
        <p className="text-sm">{title}</p>
        <InfoTooltip title={tooltip} />
      </div>
      {children ? (
        children
      ) : href ? (
        <a
          href={href}
          className={cn(
            textClassNames,
            'inline-flex items-center gap-2 transition-colors hover:text-brand'
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          {value}
          <ArrowUpRight className="w-6 h-6 shrink-0" />
        </a>
      ) : (
        <p className={textClassNames}>{value}</p>
      )}
    </Card>
  )
}
