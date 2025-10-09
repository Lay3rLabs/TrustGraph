import { useEffect, useRef } from 'react'

interface GlitchyNoiseOverlayProps {
  opacity?: number
  intensity?: number
  speed?: number
}

export const GlitchyNoiseOverlay = ({
  opacity = 0.15,
  intensity = 0.8,
  speed = 60,
}: GlitchyNoiseOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255 * intensity
        const glitch = Math.random() < 0.02 ? Math.random() * 255 : noise

        // Add some color variation for more glitchy effect
        const colorShift = Math.random() < 0.1

        if (colorShift) {
          // Occasional color glitches
          data[i] = Math.random() * 255 // Red
          data[i + 1] = Math.random() * 100 // Green (less)
          data[i + 2] = Math.random() * 255 // Blue
        } else {
          // Regular noise
          data[i] = glitch // Red
          data[i + 1] = glitch // Green
          data[i + 2] = glitch // Blue
        }

        data[i + 3] = Math.random() * 255 * opacity // Alpha
      }

      ctx.putImageData(imageData, 0, 0)
    }

    const animate = () => {
      generateNoise()
      animationRef.current = setTimeout(() => {
        requestAnimationFrame(animate)
      }, 1000 / speed)
    }

    animate()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [opacity, intensity, speed])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        mixBlendMode: 'screen',
        filter: 'contrast(1.2) brightness(0.8)',
      }}
    />
  )
}
