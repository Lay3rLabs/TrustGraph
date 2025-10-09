import OpenAI from 'openai'

import { ChatMessage } from '@/types'

import { MAX_CHAT_MESSAGE_LENGTH } from './config'

export const validateMessageLength = (
  messages: ChatMessage[]
): {
  valid: boolean
  error?: string
} => {
  for (const message of messages) {
    if (
      message.role === 'user' &&
      message.content.length > MAX_CHAT_MESSAGE_LENGTH
    ) {
      return {
        valid: false,
        error: `Message exceeds maximum length of ${MAX_CHAT_MESSAGE_LENGTH} characters (length: ${message.content.length.toLocaleString()})`,
      }
    }
  }
  return { valid: true }
}

// Configuration based on environment variables
export const getModelConfig = () => {
  const provider = process.env.MODEL_PROVIDER?.toLowerCase() || 'anthropic'

  switch (provider) {
    case 'helicone':
      return {
        client: new OpenAI({
          baseURL: 'https://ai-gateway.helicone.ai',
          apiKey: process.env.HELICONE_API_KEY,
        }),
        model: process.env.HELICONE_MODEL || 'claude-sonnet-4',
        maxTokens: 300,
        temperature: 0.7,
      }
    case 'huggingface':
    case 'hf':
      return {
        client: new OpenAI({
          baseURL: 'https://router.huggingface.co/v1',
          apiKey: process.env.HF_TOKEN,
        }),
        model:
          process.env.HF_MODEL || 'Qwen/Qwen3-Next-80B-A3B-Instruct:together',
        maxTokens: 300,
        temperature: 0.7,
      }
    case 'anthropic':
    default:
      return {
        client: new OpenAI({
          baseURL: 'https://api.anthropic.com/v1',
          apiKey: process.env.ANTHROPIC_API_KEY,
          defaultHeaders: {
            'anthropic-version': '2023-06-01',
          },
        }),
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        maxTokens: 300,
        temperature: 0.7,
      }
  }
}
