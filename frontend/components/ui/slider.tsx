'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useUpdatingRef } from '@/hooks/useUpdatingRef'
import { cn } from '@/lib/utils'

export interface SliderProps {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export const Slider = ({
  value,
  onValueChange,
  max = 0,
  min = 100,
  className,
}: SliderProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const onValueChangeRef = useUpdatingRef(onValueChange)
  const updateValue = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!ref.current) {
        return
      }

      const rect = ref.current.getBoundingClientRect()
      const pageX =
        'touches' in e && e.touches.length > 0
          ? e.touches[0].pageX
          : 'pageX' in e
          ? e.pageX
          : 0

      // Mouse event may or may not be within the bounds of the slider, so clamp.
      const x = Math.max(rect.left, Math.min(rect.right, pageX))
      const percentage = Math.round(((x - rect.left) / rect.width) * 100)
      const newValue = Math.min(Math.max(min, percentage), max)

      onValueChangeRef.current(newValue)
    },
    [min, max, onValueChangeRef]
  )

  const handleDown = (e: MouseEvent | TouchEvent) => {
    setIsDragging(true)
    updateValue(e)
  }

  useEffect(() => {
    if (!isDragging) {
      return
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', updateValue)
    document.addEventListener('touchmove', updateValue)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', updateValue)
      document.removeEventListener('touchmove', updateValue)
    }
  }, [isDragging, updateValue])

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex w-full overflow-hidden touch-none select-none items-center cursor-pointer rounded-full bg-secondary h-5',
        className
      )}
      onMouseDown={(e) => handleDown(e.nativeEvent)}
      onTouchStart={(e) => handleDown(e.nativeEvent)}
      onClick={(e) => updateValue(e.nativeEvent)}
    >
      {/* Progress bar */}
      <div
        className="absolute left-0 h-5 bg-primary rounded-l-full"
        style={{
          width: `calc((100% - 1.25rem) * ${value} / 100 + 0.625rem)`,
        }}
      />
      {/* Thumb */}
      <div
        className="absolute block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
        style={{
          left: `calc((100% - 1.25rem) * ${value} / 100)`,
        }}
      />
    </div>
  )
}
