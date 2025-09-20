'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { HTMLMotionProps, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'

import { getArticleBySlug } from '@/lib/articles-client'

export default function EN0VAHome() {
  const {
    data: article,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['articles'],
    queryFn: () => getArticleBySlug('intro'),
  })

  const [content, setContent] = useState('')
  const [userInput, setUserInput] = useState('')
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!article) {
      return
    }

    let limit = 0
    let interval: NodeJS.Timeout
    const scrollInterval = setInterval(() => {
      // Only scroll if already scrolled to the bottom
      // if () {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      })
      // }
    }, 100)
    const update = () => {
      limit += 20
      setContent(article.content.slice(0, limit))
      if (limit >= article.content.length) {
        clearInterval(interval)
        clearInterval(scrollInterval)
      }
    }
    interval = setInterval(update, 1)

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        limit = article.content.length
      }
    })

    return () => {
      clearInterval(interval)
      clearInterval(scrollInterval)
    }
  }, [article])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isChatLoading])

  // Function to send message to chat API
  const sendChatMessage = async (message: string) => {
    if (!message.trim()) return

    // Add user message to history
    const userMessage = { role: 'user' as const, content: message.trim() }
    setMessages((prev) => [...prev, userMessage])

    setIsChatLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      // Add assistant response to history
      const assistantMessage = {
        role: 'assistant' as const,
        content: data.response,
      }
      setMessages((prev) => [...prev, assistantMessage])
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

  if (isError) {
    return <div>Error loading article: {error?.message}</div>
  }

  return (
    <div className="space-y-4 bg-foreground/20 p-4 rounded-sm font-mono">
      <div className="text-primary-foreground/80 text-xs">
        <span>en0va@terminal:~$</span> <span>init</span>
      </div>

      <div className="pl-4 space-y-4 text-primary-foreground/60 text-xs">
        {isLoading ? (
          <BlinkingCursor />
        ) : (
          <Markdown
            components={{
              p: SlideFadeInParagraph as any,
            }}
          >
            {content}
          </Markdown>
        )}
      </div>

      {/* Chat Messages */}
      {messages.map((message, index) => (
        <div key={index} className="space-y-2">
          <div className="text-primary-foreground/80 text-xs">
            <span>{message.role === 'user' ? 'you' : 'en0va'}:~$</span>
          </div>
          <div className="pl-4 space-y-4 text-primary-foreground/60 text-xs">
            <div
              className={`whitespace-pre-wrap ${
                message.role === 'assistant' ? 'font-mono' : ''
              }`}
            >
              {message.content}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />

      {/* Loading indicator */}
      {isChatLoading && (
        <div className="space-y-2">
          <div className="text-primary-foreground/80 text-xs">
            <span>en0va:~$</span>
          </div>
          <div className="pl-4 space-y-4 text-primary-foreground/60 text-xs">
            <BlinkingCursor />
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="pt-4">
        <div className="space-y-2 text-xs w-full flex flex-row gap-2 items-start">
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
              <p className="text-primary-foreground/30 text-xs mt-1">
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
