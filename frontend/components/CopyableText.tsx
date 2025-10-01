'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

interface CopyableTextProps {
  text: string
  displayText?: string
  className?: string
  truncate?: boolean
  truncateOnMobile?: boolean
}

export function CopyableText({
  text,
  displayText,
  className = '',
  truncate = false,
  truncateOnMobile = true,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent parent click handlers
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const display = displayText || text
  const truncatedDisplay = `${display.slice(0, 6)}...${display.slice(-4)}`

  return (
    <button
      onClick={handleCopy}
      className={`group inline-flex items-center gap-2 font-mono text-xs hover:text-foreground transition-colors ${className}`}
      title="Click to copy"
    >
      {truncate ? (
        <span className="break-all">{truncatedDisplay}</span>
      ) : truncateOnMobile ? (
        <>
          <span className="hidden md:inline break-all">{display}</span>
          <span className="md:hidden break-all">{truncatedDisplay}</span>
        </>
      ) : (
        <span className="break-all">{display}</span>
      )}
      {copied ? (
        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
      ) : (
        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </button>
  )
}
