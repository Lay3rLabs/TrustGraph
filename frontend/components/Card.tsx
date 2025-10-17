import clsx from 'clsx'
import { ComponentProps, forwardRef } from 'react'

export type CardProps = ComponentProps<'div'> & {
  type: 'primary' | 'accent' | 'detail' | 'popover'
  size: 'sm' | 'md' | 'lg'
}

const baseClasses = 'rounded-md border border-border'
const typeClassesMap = {
  primary: 'bg-card transition-shadow',
  accent: 'bg-accent',
  detail: 'bg-muted',
  popover: 'bg-popover',
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
