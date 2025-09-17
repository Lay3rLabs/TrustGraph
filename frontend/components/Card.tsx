import clsx from 'clsx'
import { ComponentProps, forwardRef } from 'react'

export type CardProps = ComponentProps<'div'> & {
  type: 'primary' | 'accent' | 'detail' | 'popover'
  size: 'sm' | 'md' | 'lg'
}

const baseClasses = 'rounded-sm'
const typeClassesMap = {
  primary:
    'bg-card-foreground/60 rounded-md transition-shadow shadow-lg hover:shadow-xl',
  accent: 'bg-accent-foreground',
  detail: 'bg-card-foreground/30 shadow-md',
  popover: 'bg-popover-foreground shadow-2xl',
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
      className={clsx(baseClasses, typeClasses, sizeClasses, className)}
      ref={ref}
    />
  )
})
