import { ComponentProps, forwardRef } from 'react'

import { cn } from '@/lib/utils'

export type CardProps = ComponentProps<'div'> & {
  type: 'primary' | 'accent' | 'detail' | 'popover' | 'outline'
  size: 'sm' | 'md' | 'lg'
}

const baseClasses = 'rounded-md'
const typeClassesMap = {
  primary: 'bg-card transition-shadow',
  accent: 'bg-accent',
  detail: 'bg-muted',
  popover: 'bg-popover',
  outline: 'border border-border bg-transparent',
}
const sizeClassesMap = {
  sm: 'px-4 py-3',
  md: 'px-5 py-4',
  lg: 'px-7 py-6',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, type, size, ...props }: CardProps,
  ref
) {
  const typeClasses = typeClassesMap[type]
  const sizeClasses = sizeClassesMap[size]

  return (
    <div
      {...props}
      className={cn(baseClasses, typeClasses, sizeClasses, className)}
      ref={ref}
    />
  )
})
