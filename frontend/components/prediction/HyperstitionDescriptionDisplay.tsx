import clsx from 'clsx'
import { ArrowUpRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export type HyperstitionDescriptionDisplayProps = {
  description: string
  className?: string
}

export const HyperstitionDescriptionDisplay = ({
  description,
  className,
}: HyperstitionDescriptionDisplayProps) => {
  return (
    <div className={clsx('terminal-text text-sm', className)}>
      <ReactMarkdown
        components={{
          a: StyledLink as any,
        }}
      >
        {description}
      </ReactMarkdown>
    </div>
  )
}

const StyledLink = ({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline"
    >
      {children}
      <ArrowUpRight className="w-4 h-4 inline-block pb-0.5 pl-0.5 -mr-0.5" />
    </a>
  )
}
