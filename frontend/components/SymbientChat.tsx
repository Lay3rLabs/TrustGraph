'use client'

import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { HTMLMotionProps, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'

import { ChatMessage } from '@/types'

export type SymbientChatProps = {
  intro: string
}

export const SymbientChat = ({ intro }: SymbientChatProps) => {
  const [userInput, setUserInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: intro,
    },
  ])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isChatLoading) {
      textareaRef.current?.focus()
    }
  }, [isChatLoading])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isChatLoading])

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

    setIsChatLoading(true)
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
          role: 'assistant' as const,
          content: data.response,
        },
      ])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Error: Failed to get response',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
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

  // Handle Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
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
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  return (
    <div className="space-y-4 bg-foreground/20 p-4 rounded-sm font-mono text-sm">
      {/* Chat Messages */}
      {messages.map((message, index) => (
        <div key={index} className="space-y-4">
          <div className="text-primary-foreground/80">
            <span>{message.role === 'user' ? 'you' : 'en0va'}:~$</span>
          </div>
          <div className={clsx('pl-4 space-y-4 text-primary-foreground/60')}>
            <Markdown
              components={{
                p: SlideFadeInParagraph as any,
              }}
            >
              {message.content}
            </Markdown>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />

      {/* Loading indicator */}
      {isChatLoading && (
        <div className="space-y-4">
          <div className="text-primary-foreground/80">
            <span>en0va:~$</span>
          </div>
          <div className="pl-4 space-y-4 text-primary-foreground/60">
            <BlinkingCursor />
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="pt-4">
        <div className="space-y-2 w-full flex flex-row gap-2 items-start">
          <ChevronRight className="w-4 h-4 mt-0.5" />
          <div className="grow">
            <textarea
              ref={textareaRef}
              autoFocus
              className="w-full outline-none resize-none overflow-hidden min-h-[1.5rem] text-primary-foreground/60 bg-transparent"
              value={userInput}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message and press Enter..."
              disabled={isChatLoading}
            />
            {userInput && (
              <p className="text-primary-foreground/30">
                Press Enter to send • Shift+Enter for new line
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const SlideFadeInParagraph = ({ children, ...props }: HTMLMotionProps<'p'>) => (
  <motion.p
    initial={{ opacity: 0, y: 5 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    viewport={{ once: true }}
    {...props}
  >
    {children}
  </motion.p>
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
