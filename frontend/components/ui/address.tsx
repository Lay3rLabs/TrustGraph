'use client'

import { Check, Copy } from 'lucide-react'
import React, { useState } from 'react'
import toast from 'react-hot-toast'

import { useEns } from '@/hooks/useEns'
import { cn } from '@/lib/utils'

import { Tooltip } from './Tooltip'

interface AddressProps {
  address: string
  className?: string
  /** Display mode for the address */
  displayMode?: 'full' | 'truncated' | 'auto'
  /** Whether to show ENS name if available */
  showEns?: boolean
  /** Custom display text (overrides ENS and address) */
  displayText?: string
  /** Whether to show copy icon on hover */
  showCopyIcon?: boolean
  /** Whether the component should be clickable */
  clickable?: boolean
  /** Click handler for the address */
  onClick?: (address: string) => void
  /** Whether to use monospace font */
  monospace?: boolean

  /** Custom tooltip content */
  tooltipContent?: string
}

export const Address = React.memo(function Address({
  address,
  className = '',
  displayMode = 'auto',
  showEns = true,
  displayText,
  showCopyIcon = true,
  clickable = true,
  onClick,
  monospace = true,
  tooltipContent,
}: AddressProps) {
  const [copied, setCopied] = useState(false)

  // Use our optimized ENS hook
  const { name: ensName } = useEns(address, {
    enableName: showEns,
    enableAvatar: false, // We don't need avatar for this component
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    persistCache: true,
  })

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      toast.success('Address copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
      toast.error('Failed to copy address')
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onClick && clickable) {
      e.preventDefault()
      onClick(address)
    }
  }

  // Determine what to display
  const getDisplayText = () => {
    if (displayText) return displayText
    if (ensName && showEns) return ensName
    return address
  }

  const getTruncatedText = (text: string) => {
    if (text.length <= 10) return text
    return `${text.slice(0, 6)}...${text.slice(-4)}`
  }

  const displayedText = getDisplayText()
  const truncatedText = getTruncatedText(displayedText)
  const isShowingEns = !!ensName && showEns && !displayText
  const isLoading = false // Don't show loading state, just display address

  const baseClasses = cn(
    'group inline-flex items-center gap-2 transition-colors',
    monospace && !isShowingEns && 'font-mono',
    clickable && onClick && 'cursor-pointer hover:text-foreground',
    !clickable && 'cursor-default',
    className
  )

  const textClasses = cn(
    'break-all text-sm',
    isShowingEns && 'text-brand font-medium' // Highlight ENS names
  )

  const copyIcon = copied ? (
    <Check className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
  ) : (
    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-pointer hover:text-brand" />
  )

  const renderText = () => {
    switch (displayMode) {
      case 'full':
        return <span className={textClasses}>{displayedText}</span>
      case 'truncated':
        return <span className={textClasses}>{truncatedText}</span>
      case 'auto':
      default:
        return (
          <>
            <span className={cn(textClasses, 'hidden md:inline')}>
              {displayedText}
            </span>
            <span className={cn(textClasses, 'md:hidden')}>
              {truncatedText}
            </span>
          </>
        )
    }
  }

  const content = (
    <div
      className={baseClasses}
      onClick={handleClick}
      role={clickable && onClick ? 'button' : 'text'}
      tabIndex={clickable && onClick ? 0 : undefined}
      onKeyDown={
        clickable && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(address)
              }
            }
          : undefined
      }
    >
      {renderText()}

      {/* Copy button */}
      {showCopyIcon && !isLoading && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
          tabIndex={0}
          aria-label={`Copy address ${address}`}
          title={copied ? 'Copied!' : 'Copy address'}
        >
          {copyIcon}
        </button>
      )}
    </div>
  )

  return (
    <Tooltip
      title={
        tooltipContent ||
        (isShowingEns
          ? `${address.slice(0, 10)}...${address.slice(-8)}`
          : undefined)
      }
    >
      {content}
    </Tooltip>
  )
})

Address.displayName = 'Address'

// Export some common preset configurations for convenience
export const AddressShort = React.memo(
  (props: Omit<AddressProps, 'displayMode'>) => (
    <Address {...props} displayMode="truncated" />
  )
)

export const AddressFull = React.memo(
  (props: Omit<AddressProps, 'displayMode'>) => (
    <Address {...props} displayMode="full" />
  )
)

export const AddressWithoutCopy = React.memo(
  (props: Omit<AddressProps, 'showCopyIcon'>) => (
    <Address {...props} showCopyIcon={false} />
  )
)

export const AddressClickable = React.memo(
  (props: AddressProps & { onAddressClick: (address: string) => void }) => {
    const { onAddressClick, ...rest } = props
    return (
      <Address
        {...rest}
        clickable={true}
        onClick={onAddressClick}
        className={cn('hover:underline cursor-pointer', rest.className)}
      />
    )
  }
)

// Utility component for addresses in tables
export const TableAddress = React.memo(
  (props: Omit<AddressProps, 'displayMode' | 'className'>) => (
    <Address
      {...props}
      displayMode="auto"
      className="text-xs"
      monospace={true}
    />
  )
)
