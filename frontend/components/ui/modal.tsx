'use client'

import clsx from 'clsx'
import { ReactNode, useEffect, useRef } from 'react'

import { Card } from '../Card'
import { CRTScanlines } from '../CRTScanlines'

interface ModalProps {
  isOpen: boolean
  onClose?: () => void
  children: React.ReactNode
  title?: string
  className?: string
  contentClassName?: string
  footer?: ReactNode
  backgroundContent?: ReactNode
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  className,
  contentClassName,
  footer,
  backgroundContent,
}: ModalProps) {
  useEffect(() => {
    if (!onClose) {
      return
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const openedOnce = useRef(isOpen)
  if (isOpen && !openedOnce.current) {
    openedOnce.current = true
  }

  // Prevent initial flash on page load by hiding until first open.
  if (!openedOnce.current) {
    return null
  }

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center duration-200 backdrop-blur-sm',
        isOpen
          ? 'animate-in fade-in-0'
          : 'animate-out fade-out-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <Card
        type="popover"
        size="md"
        className={clsx(
          'relative z-50 w-full max-w-md max-h-[90vh] mx-4 !p-0 flex flex-col overflow-hidden',
          isOpen ? 'animate-in zoom-in-95' : 'animate-out zoom-out-95',
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink09">
            <h2 className="terminal-bright text-sm">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="terminal-dim hover:terminal-bright transition-colors text-lg"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={clsx('p-4 overflow-y-auto grow min-h-0', contentClassName)}
        >
          {children}
        </div>

        {footer && (
          <div className="p-4 border-t border-gray-700 shrink-0">{footer}</div>
        )}
      </Card>

      {backgroundContent && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          {backgroundContent}
        </div>
      )}

      <CRTScanlines opacity={0.12} lineHeight={3} />
    </div>
  )
}
