'use client'

import clsx from 'clsx'
import { useAtom } from 'jotai/react'
import { useResetAtom } from 'jotai/utils'
import { ChevronRight } from 'lucide-react'
import { usePlausible } from 'next-plausible'
import { RefObject, useEffect, useRef, useState } from 'react'

import { Animator } from '@/lib/animator'
import { MAX_CHAT_MESSAGE_LENGTH, SYMBIENT_INTRO } from '@/lib/config'
import { symbientChat } from '@/state/symbient'
import { ChatMessage } from '@/types'

import { Markdown } from './Markdown'

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
  const [error, setError] = useState<string | null>(null)
  const resetMessages = useResetAtom(symbientChat)
  const [isThinking, setIsThinking] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const plausible = usePlausible()

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

    if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
      setError(
        `Message exceeds maximum length of ${MAX_CHAT_MESSAGE_LENGTH} characters`
      )
      return
    }

    // Add user message to history
    const newMessages = [
      ...messages,
      { role: 'user', content: message },
    ] as ChatMessage[]
    setMessages(newMessages)
    setUserInput('')
    setError(null)

    plausible('symbient_chat', {
      props: {
        message,
      },
    })

    const undoWithError = (error: string) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]
        const isEmptyAssistantMessage =
          lastMessage.role === 'assistant' && !lastMessage.content
        return isEmptyAssistantMessage ? prev.slice(0, -1) : prev
      })
      setUserInput(message)
      setError(error)
    }

    const assistantMessageIndex = newMessages.length

    let startedAssistantMessage = false
    const startResponseIfNotStarted = () => {
      if (startedAssistantMessage) {
        return
      }
      startedAssistantMessage = true

      // Add a placeholder assistant message that we'll update as we stream
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '',
        },
      ])
      setIsThinking(true)
    }

    // Start response in 300ms if chat request hasn't finished.
    const timeout = setTimeout(startResponseIfNotStarted, 300)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      })

      // Start response if not already started.
      clearTimeout(timeout)
      startResponseIfNotStarted()

      if (!response.ok) {
        if (response.status === 429) {
          const retryInSeconds = Number(
            response.headers.get('Retry-After') || 0
          )
          const retryInMinutes =
            retryInSeconds && Math.ceil(retryInSeconds / 60)
          undoWithError(
            `Rate limit exceeded. ${
              retryInMinutes && retryInMinutes !== 60
                ? `Try again in ${retryInMinutes} minutes.`
                : 'Try again in an hour.'
            }`
          )
          return
        }

        undoWithError('Failed to send message')
        return
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      if (!reader) {
        undoWithError('Failed to get response stream')
        return
      }

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (data === '[DONE]') {
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                accumulatedContent += parsed.content

                // Update the assistant message with accumulated content
                setMessages((prev) => {
                  const updated = [...prev]
                  updated[assistantMessageIndex] = {
                    role: 'assistant',
                    content: accumulatedContent,
                  }
                  return updated
                })
              }
            } catch (parseError) {
              // Ignore parsing errors for incomplete chunks
              console.debug(
                'Parse error (likely incomplete chunk):',
                parseError
              )
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      undoWithError('Failed to get response')
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
      <div className="space-y-4 overflow-y-auto grow min-h-0 grayscale-100">
        {/* Chat Messages */}
        {[firstMessage, ...messages].map((message, index) => (
          <div key={index} className="space-y-4">
            <div className="text-primary-foreground/80">
              <span>{message.role === 'user' ? 'you' : 'en0va'}:~$</span>
            </div>
            <div
              className={clsx(
                'px-2 sm:px-4 space-y-2 sm:space-y-4 text-primary-foreground/60'
              )}
            >
              {message.content ? (
                <Markdown textFade>{message.content}</Markdown>
              ) : (
                message.role === 'assistant' &&
                isThinking &&
                index === messages.length && <BlinkingCursor />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
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
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            onKeyDown={handleKeyDown}
            placeholder="Type your message and press Enter..."
            disabled={isThinking}
          />
          {error && (
            <p className="text-red-400 text-xs font-mono pb-4">{error}</p>
          )}
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
              <p
                className={clsx(
                  userInput.length === MAX_CHAT_MESSAGE_LENGTH
                    ? 'text-red-400/60'
                    : userInput.length > MAX_CHAT_MESSAGE_LENGTH * 0.9
                    ? 'text-yellow-400/60'
                    : undefined
                )}
              >
                • {userInput.length}/{MAX_CHAT_MESSAGE_LENGTH}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const BlinkingCursor = () => (
  <p className="animate-blink inline-block">&nbsp;</p>
)
