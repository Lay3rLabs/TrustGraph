'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const tooltipContentVariants = cva(
  'z-50 overflow-hidden rounded-sm border border-gray-400 bg-gray-900 px-3 py-1.5 text-xs text-gray-100 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      variant: {
        default: 'bg-gray-900 text-gray-100 border-gray-400',
        terminal: 'bg-black text-green-400 border-green-400 font-mono',
        info: 'bg-blue-900 text-blue-100 border-blue-400',
        warning: 'bg-yellow-900 text-yellow-100 border-yellow-400',
        error: 'bg-red-900 text-red-100 border-red-400',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        default: 'px-3 py-1.5 text-xs',
        lg: 'px-4 py-2 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> &
    VariantProps<typeof tooltipContentVariants>
>(({ className, sideOffset = 4, variant, size, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(tooltipContentVariants({ variant, size, className }))}
    {...props}
  >
    {props.children}
    <TooltipPrimitive.Arrow
      className={cn(
        'fill-current',
        variant === 'terminal' && 'text-green-400',
        variant === 'info' && 'text-blue-400',
        variant === 'warning' && 'text-yellow-400',
        variant === 'error' && 'text-red-400',
        (!variant || variant === 'default') && 'text-gray-400'
      )}
    />
  </TooltipPrimitive.Content>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Compound component for easier usage
interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  variant?: VariantProps<typeof tooltipContentVariants>['variant']
  size?: VariantProps<typeof tooltipContentVariants>['size']
  delayDuration?: number
  className?: string
}

const Tooltip = ({
  children,
  content,
  side = 'top',
  align = 'center',
  variant = 'default',
  size = 'default',
  delayDuration = 400,
  className,
}: TooltipProps) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          variant={variant}
          size={size}
          className={className}
        >
          {content}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

export {
  Tooltip,
  TooltipProvider,
  TooltipRoot as TooltipRoot,
  TooltipTrigger,
  TooltipContent,
}
