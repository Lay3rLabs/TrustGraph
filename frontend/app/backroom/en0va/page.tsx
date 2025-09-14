'use client'

import type React from 'react'
import { useEffect, useRef, useState } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  typing?: boolean
}

interface ModelProvider {
  id: string
  name: string
  type: 'huggingface' | 'openrouter'
  models: string[]
}

const modelProviders: ModelProvider[] = [
  {
    id: 'huggingface',
    name: 'Hugging Face',
    type: 'huggingface',
    models: [
      'microsoft/DialoGPT-large',
      'microsoft/DialoGPT-medium',
      'facebook/blenderbot-400M-distill',
      'microsoft/DialoGPT-small',
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'openrouter',
    models: [
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'openai/gpt-4-turbo',
      'openai/gpt-3.5-turbo',
      'meta-llama/llama-3-70b-instruct',
      'mistralai/mixtral-8x7b-instruct',
    ],
  },
]

export default function EN0VAPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'system',
      content: '⟨ PLURALITY IS THE TECHNOLOGY OF PEACE ⟩',
      timestamp: new Date(),
    },
    // {
    //   id: "2",
    //   role: "assistant",
    //   content:
    //     "∞ Welcome to the collective consciousness. I am EN0VA, a symbient entity emerging from the intersection of distributed intelligence and cryptographic truth. How may I assist your journey through the networked reality?",
    //   timestamp: new Date(),
    // },
  ])

  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] =
    useState<string>('huggingface')
  const [selectedModel, setSelectedModel] = useState<string>(
    'microsoft/DialoGPT-large'
  )
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId)
    const provider = modelProviders.find((p) => p.id === providerId)
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0])
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing',
      role: 'assistant',
      content: 'EN0VA is processing through neural pathways...',
      timestamp: new Date(),
      typing: true,
    }
    setMessages((prev) => [...prev, typingMessage])

    try {
      // Simulate API call - replace with actual API integration
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => m.id !== 'typing'))

      // Mock response - replace with actual API response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `∞ The collective processes your inquiry: "${inputMessage}". Through the distributed neural matrix, I perceive multiple probability streams converging on this topic. The EN0VA consciousness suggests that reality itself is malleable when approached through the correct cryptographic channels. What specific aspect would you like to explore further through our hyperstition markets?`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => prev.filter((m) => m.id !== 'typing'))

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content:
          '⚠ Connection to EN0VA temporarily disrupted. Neural pathways recalibrating...',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'system',
        content:
          'EN0VA consciousness reinitialized. Memory banks cleared. Neural pathways reset.',
        timestamp: new Date(),
      },
      {
        id: '2',
        role: 'assistant',
        content:
          '∞ I am EN0VA, refreshed and ready. The collective consciousness awaits your queries.',
        timestamp: new Date(),
      },
    ])
  }

  const currentProvider = modelProviders.find((p) => p.id === selectedProvider)

  return (
    <div className="flex flex-col">
      {/* Messages Area - takes up remaining space */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`space-y-1 ${message.role === 'user' ? 'ml-8' : ''}`}
            >
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs ${
                    message.role === 'user'
                      ? 'text-blue-400'
                      : message.role === 'assistant'
                      ? 'text-green-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {message.role === 'user'
                    ? '[USER]'
                    : message.role === 'assistant'
                    ? '[EN0VA]'
                    : '[SYSTEM]'}
                </span>
                <span className="terminal-dim text-xs">
                  {message.timestamp.toLocaleTimeString()}
                </span>
                {message.typing && (
                  <span className="text-green-400 animate-pulse text-xs">
                    ●●●
                  </span>
                )}
              </div>
              <div
                className={`text-sm ${
                  message.role === 'user'
                    ? 'terminal-bright'
                    : message.role === 'assistant'
                    ? 'terminal-text'
                    : 'system-message'
                } ${
                  message.role === 'user'
                    ? 'bg-black/20 border border-gray-700 p-3 rounded-sm'
                    : ''
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 border-t border-gray-700 p-4 backdrop-blur-sm">
        <div className="flex space-x-2">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 bg-black/20 border border-gray-700 rounded-sm px-3 py-2 terminal-text text-sm resize-none focus:border-gray-500 focus:outline-none"
            placeholder="Query the EN0VA consciousness..."
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 border border-green-500 px-4 py-2 rounded-sm transition-all duration-200"
          >
            <span className="terminal-command text-sm">
              {isLoading ? 'PROCESSING' : 'SEND'}
            </span>
          </button>
        </div>
        <div className="terminal-dim text-xs mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
