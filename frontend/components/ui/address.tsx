'use client'

import { ArrowUpRight, Check, Copy } from 'lucide-react'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useAccount } from 'wagmi'

import { useEns } from '@/hooks/useEns'
import { cn } from '@/lib/utils'

import { Tooltip } from './Tooltip'

interface AddressProps {
  address: string
  className?: string
  textClassName?: string
  /** Display mode for the address */
  displayMode?: 'full' | 'truncated' | 'auto'
  /** Whether to show ENS name if available */
  showEns?: boolean
  /** Custom display text (overrides ENS and address) */
  displayText?: string
  /** Whether to show navigation icon (always) */
  showNavIcon?: boolean
  /** Whether to show copy icon (on hover) */
  showCopyIcon?: boolean
  /** Whether the component should be clickable */
  clickable?: boolean
  /** Click handler for the address */
  onClick?: (address: string) => void
  /** Whether to use monospace font */
  monospace?: boolean
  /** Whether to not highlight names that conceal the address */
  noHighlight?: boolean

  /** Custom tooltip content */
  tooltipContent?: string
}

export const Address = React.memo(function Address({
  address,
  className = '',
  textClassName = '',
  displayMode = 'auto',
  showEns = true,
  displayText,
  showNavIcon = false,
  showCopyIcon = true,
  clickable = true,
  onClick,
  monospace = true,
  noHighlight = false,
  tooltipContent,
}: AddressProps) {
  const [copied, setCopied] = useState(false)
  const { address: connectedAddress } = useAccount()

  const isYou = connectedAddress?.toLowerCase() === address.toLowerCase()
  if (isYou && !displayText) {
    displayText = 'You'
  }

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
      e.stopPropagation()
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
  const shouldHighlight = !noHighlight && (isShowingEns || isYou)
  const isLoading = false // Don't show loading state, just display address

  const baseClasses = cn(
    'group/address inline-flex items-center gap-2 transition-colors',
    monospace && !shouldHighlight && 'font-mono',
    clickable && onClick && 'cursor-pointer',
    !clickable && 'cursor-default',
    className
  )

  const hoverClasses = cn(
    'transition-colors',
    shouldHighlight
      ? 'text-brand group-hover/address:text-brand/80 peer-hover/copy:!text-brand'
      : 'text-muted-foreground group-hover/address:text-brand peer-hover/copy:text-muted-foreground'
  )

  const textClasses = cn(
    'break-all text-sm transition-colors font-medium',
    hoverClasses,
    textClassName
  )

  const copyIcon = copied ? (
    <Check className="w-3 h-3 text-green-600 dark:text-green-400 shrink-0" />
  ) : (
    <Copy className="w-3 h-3 shrink-0 hover:text-brand" />
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
    >
      {renderText()}

      {showNavIcon && (
        <ArrowUpRight className={cn('-ml-1 w-3 h-3 shrink-0', hoverClasses)} />
      )}

      {/* Copy button */}
      {showCopyIcon && !isLoading && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover/address:opacity-100 transition-opacity focus:opacity-100 focus:outline-none peer/copy"
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
