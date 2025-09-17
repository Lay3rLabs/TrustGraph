import clsx from 'clsx'
import { ComponentProps, forwardRef } from 'react'

export type CardProps = ComponentProps<'div'> & {
  type: 'primary' | 'accent' | 'detail' | 'popover'
}

const baseClasses = ''
const typeClassesMap = {
  primary:
    'bg-card-foreground/60 rounded-md transition-shadow shadow-lg hover:shadow-xl p-6 rounded-sm',
  accent: 'bg-accent-foreground p-3 rounded-sm',
  detail: 'bg-card-foreground/30 p-3 rounded-sm shadow-md',
  popover: 'bg-popover-foreground p-4 shadow-2xl rounded-sm',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, type, ...props }: CardProps,
  ref
) {
  const typeClasses = typeClassesMap[type]

  return (
    <div
      {...props}
      className={clsx(baseClasses, typeClasses, className)}
      ref={ref}
    />
  )
})
