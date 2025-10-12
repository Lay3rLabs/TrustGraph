'use client'

import { Info } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { Tooltip } from './tooltip'

interface InfoTooltipProps {
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
  iconClassName?: string
  variant?: 'default' | 'terminal' | 'info' | 'warning' | 'error'
  size?: 'sm' | 'default' | 'lg'
}

export const InfoTooltip = ({
  content,
  side = 'top',
  align = 'center',
  className,
  iconClassName,
  variant = 'default',
  size = 'default',
}: InfoTooltipProps) => {
  return (
    <Tooltip
      content={content}
      side={side}
      align={align}
      variant={variant}
      size={size}
      delayDuration={300}
    >
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-full p-0.5 transition-colors',
          'text-gray-400 hover:text-gray-600 focus:text-gray-600',
          'focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1',
          className
        )}
      >
        <Info size={14} className={cn('shrink-0', iconClassName)} />
        <span className="sr-only">More information</span>
      </button>
    </Tooltip>
  )
}
