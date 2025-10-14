'use client'

import clsx from 'clsx'

interface CRTScanlinesProps {
  className?: string
  opacity?: number
  lineHeight?: number
  flicker?: boolean
  flickerIntensity?: number
}

export const CRTScanlines = ({
  className,
  opacity = 0.15,
  lineHeight = 2,
  flicker = true,
  flickerIntensity = 0.02,
}: CRTScanlinesProps) => {
  return (
    <div
      className={clsx('absolute inset-0 pointer-events-none z-20', className)}
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent ${lineHeight}px,
          rgba(0, 0, 0, ${opacity}) ${lineHeight}px,
          rgba(0, 0, 0, ${opacity}) ${lineHeight * 2}px
        )`,
        animation: flicker
          ? `crt-flicker 0.15s infinite linear alternate`
          : undefined,
      }}
    >
      <style jsx>{`
        @keyframes crt-flicker {
          0% {
            opacity: 1;
          }
          50% {
            opacity: ${1 - flickerIntensity};
          }
          100% {
            opacity: ${1 + flickerIntensity};
          }
        }
      `}</style>
    </div>
  )
}
