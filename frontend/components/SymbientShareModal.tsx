import { ReactNode, useEffect, useRef, useState } from 'react'
import Confetti from 'react-confetti'

import { Animator } from '@/lib/animator'
import { streamResponse } from '@/lib/stream'

import { BlinkingCursor } from './BlinkingCursor'
import { Card } from './Card'
import { XIcon } from './icons/XIcon'
import Logo from './Logo'
import { Modal } from './ui/modal'

export type SymbientShareModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  action: string
  description: ReactNode
}

export const SymbientShareModal = ({
  isOpen,
  onClose,
  title,
  action,
  description,
}: SymbientShareModalProps) => {
  const [confetti, setConfetti] = useState(true)

  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareableMessage, setShareableMessage] = useState<string | null>(null)

  const generatingForActionRef = useRef<string | null>(null)
  const loadShareableMessage = async (action: string) => {
    if (generatingForActionRef.current === action) {
      return
    }
    generatingForActionRef.current = action

    setThinking(true)
    setError(null)
    setShareableMessage(null)
    Animator.instance('share').runTask('thinking', { wag: false })

    try {
      await streamResponse({
        path: '/api/share',
        body: { action },
        onError: (error) => {
          if (generatingForActionRef.current !== action) {
            return
          }
          console.error('Share error:', error)
          setError(error)
        },
        onUpdate: (content) => {
          if (generatingForActionRef.current !== action) {
            return
          }
          setShareableMessage(content)
        },
      })
    } catch (error) {
      console.error('Chat error:', error)
      setError('Failed to generate shareable message')
    } finally {
      setThinking(false)
      generatingForActionRef.current = null
    }
  }

  useEffect(() => {
    try {
      if (isOpen) {
        setConfetti(true)
        loadShareableMessage(action)
      } else {
        setConfetti(false)
        Animator.instance('share').stopTask('thinking')
      }
    } catch {}
  }, [action, isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      contentClassName="space-y-6"
      backgroundContent={
        confetti && (
          <Confetti
            gravity={0.1}
            numberOfPieces={1536}
            recycle={false}
            onConfettiComplete={() => setConfetti(false)}
            colors={['#111111', '#666666', '#bbbbbb']}
            drawShape={function (this: any, ctx: CanvasRenderingContext2D) {
              // Triangle.
              ctx.beginPath()
              ctx.moveTo(0, -this.h / 2)
              ctx.lineTo(this.w / 2, this.h / 2)
              ctx.lineTo(-this.w / 2, this.h / 2)
              ctx.closePath()
              ctx.fill()
            }}
          />
        )
      }
    >
      <div>{description}</div>

      <Card type="accent" size="md">
        <div className="flex flex-row items-start gap-2">
          <Logo animatorLabel="share" className="w-6 h-6 shrink-0 -ml-1 mr-1" />
          <p className="grow">
            {shareableMessage}
            {thinking && <BlinkingCursor />}
          </p>
        </div>

        {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

        <button
          onClick={() =>
            window.open(
              `https://x.com/intent/post?text=${shareableMessage}`,
              '_blank',
              'width=500,height=600,noopener,noreferrer'
            )
          }
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 transition-colors rounded-sm px-4 py-2 text-center flex flex-row items-center justify-center gap-2 mt-4"
        >
          <XIcon className="w-3 h-3" />
          Share
        </button>
      </Card>
    </Modal>
  )
}
