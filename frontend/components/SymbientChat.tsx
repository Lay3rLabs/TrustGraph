'use client'

import clsx from 'clsx'
import { useAtom } from 'jotai/react'
import { useResetAtom } from 'jotai/utils'
import { ChevronRight } from 'lucide-react'
import { HTMLMotionProps, motion } from 'motion/react'
import Link from 'next/link'
import { RefObject, useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'

import { Animator } from '@/lib/animator'
import { SYMBIENT_INTRO } from '@/lib/config'
import { symbientChat } from '@/state/symbient'
import { ChatMessage } from '@/types'

const firstMessage: ChatMessage = {
  role: 'assistant',
  content: SYMBIENT_INTRO,
}

export type SymbientChatProps = {
  className?: string
  /**
   * Auto focus on letter entry.
   */
  focusOnType?: boolean
  /**
   * Prepare the chat to be ready for use.
   */
  prepareRef?: RefObject<() => void>
}

export const SymbientChat = ({
  className,
  focusOnType,
  prepareRef,
}: SymbientChatProps) => {
  const [userInput, setUserInput] = useState('')
  const [messages, setMessages] = useAtom(symbientChat)
  const resetMessages = useResetAtom(symbientChat)
  const [isThinking, setIsThinking] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  if (prepareRef) {
    prepareRef.current = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      textareaRef.current?.focus()
    }
  }

  useEffect(() => {
    if (isThinking) {
      Animator.instance('nav').runTask('thinking')
    } else {
      Animator.instance('nav').stopTask('thinking')
    }
  }, [isThinking])

  useEffect(() => {
    if (!isThinking) {
      textareaRef.current?.focus()
    }
  }, [isThinking])

  // If key is a letter, focus the textarea.
  useEffect(() => {
    if (focusOnType) {
      const handleType = ({ key }: KeyboardEvent) => {
        if (key.match(/[a-zA-Z]/)) {
          textareaRef.current?.focus()
        }
      }
      document.addEventListener('keydown', handleType)
      return () => document.removeEventListener('keydown', handleType)
    }
  }, [focusOnType])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Function to send message to chat API
  const sendChatMessage = async (message: string) => {
    message = message.trim()

    if (!message) {
      return
    }

    // Add user message to history
    const newMessages = [
      ...messages,
      { role: 'user', content: message },
    ] as ChatMessage[]
    setMessages(newMessages)

    setIsThinking(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      // Add assistant response to history
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
        },
      ])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: Failed to get response',
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  // Auto-resize textarea function
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    setUserInput(textarea.value)

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    // Set height to scrollHeight to fit content
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const isClear = userInput.trim().startsWith('/clear')

  // Handle Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isClear) {
        setUserInput('')
        resetMessages()
        Animator.instance('nav').runTask('reset')
        return
      }
      if (userInput.trim()) {
        sendChatMessage(userInput)
        setUserInput('')
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }
    }
  }

  // Set initial height when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      if (textareaRef.current.scrollHeight !== 0) {
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }
  }, [])

  return (
    <div
      className={clsx(
        'bg-foreground/20 p-4 pb-0 rounded-sm font-mono text-sm flex flex-col gap-4',
        className
      )}
    >
      <div className="space-y-4 overflow-y-auto grow min-h-0">
        {/* Chat Messages */}
        {[firstMessage, ...messages].map((message, index) => (
          <div key={index} className="space-y-4">
            <div className="text-primary-foreground/80">
              <span>{message.role === 'user' ? 'you' : 'en0va'}:~$</span>
            </div>
            <div className={clsx('pl-4 space-y-4 text-primary-foreground/60')}>
              <Markdown
                components={{
                  p: SlideFadeInParagraph as any,
                  a: StyledLink as any,
                }}
              >
                {message.content}
              </Markdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {/* Loading indicator */}
        {isThinking && (
          <div className="space-y-4">
            <div className="text-primary-foreground/80">
              <span>en0va:~$</span>
            </div>
            <div className="pl-4 space-y-4 text-primary-foreground/60">
              <BlinkingCursor />
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="w-full flex flex-row gap-2 items-start shrink-0">
        <ChevronRight className="w-4 h-4 mt-0.5" />
        <div className="grow">
          <textarea
            ref={textareaRef}
            autoFocus
            className={clsx(
              'w-full outline-none field-sizing-content resize-none overflow-hidden min-h-[1.5rem] text-primary-foreground/60 bg-transparent',
              isClear && 'text-red-400/60'
            )}
            value={userInput}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message and press Enter..."
            disabled={isThinking}
          />
          {userInput && (
            <div className="flex flex-row gap-2 flex-wrap text-primary-foreground/30 pb-4">
              <p>Press Enter to send</p>
              <p>• Shift+Enter for new line</p>
              <p>
                •{' '}
                <span className={clsx(isClear && 'text-red-400/60')}>
                  /clear to start over
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SlideFadeInParagraph = ({
  children,
  className,
  ...props
}: HTMLMotionProps<'p'>) => (
  <motion.p
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className={clsx(className, 'whitespace-pre-wrap')}
    {...props}
  >
    {children}
  </motion.p>
)

const StyledLink = ({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) => (
  <Link
    href={href}
    className="underline transition-opacity hover:opacity-80 active:opacity-70"
  >
    {children}
  </Link>
)

const BlinkingCursor = () => (
  <p className="animate-blink inline-block">&nbsp;</p>
)

// useEffect(() => {
//   if (!article) {
//     return
//   }

//   let limit = 0
//   let interval: NodeJS.Timeout
//   const scrollInterval = setInterval(() => {
//     // Only scroll if already scrolled to the bottom
//     // if () {
//     window.scrollTo({
//       top: document.body.scrollHeight,
//       behavior: 'smooth',
//     })
//     // }
//   }, 100)
//   const update = () => {
//     limit += 20
//     setContent(article.content.slice(0, limit))
//     if (limit >= article.content.length) {
//       clearInterval(interval)
//       clearInterval(scrollInterval)
//     }
//   }
//   interval = setInterval(update, 1)

//   window.addEventListener('keydown', (e) => {
//     if (e.key === 'Tab') {
//       limit = article.content.length
//     }
//   })

//   return () => {
//     clearInterval(interval)
//     clearInterval(scrollInterval)
//   }
// }, [article])
