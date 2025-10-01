import fs from 'fs'
import path from 'path'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index.mjs'

import { MAX_CHAT_MESSAGE_LENGTH } from '@/lib/config'
import { ChatMessage } from '@/types'

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 300
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour in milliseconds

// In-memory storage for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}, 10 * 60 * 1000)

const getRealIP = (request: NextRequest): string => {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback to unknown since NextRequest doesn't have ip property
  return 'unknown'
}

const checkRateLimit = (
  ip: string
): {
  allowed: boolean
  resetTime: number
  remaining: number
} => {
  const now = Date.now()
  const userLimit = rateLimitStore.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    // First request or window expired, reset the counter
    const resetTime = now + RATE_LIMIT_WINDOW_MS
    rateLimitStore.set(ip, { count: 1, resetTime })
    return {
      allowed: true,
      resetTime,
      remaining: RATE_LIMIT_REQUESTS - 1,
    }
  }

  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    // Rate limit exceeded
    return { allowed: false, resetTime: userLimit.resetTime, remaining: 0 }
  }

  // Increment counter
  userLimit.count++
  return {
    allowed: true,
    resetTime: userLimit.resetTime,
    remaining: RATE_LIMIT_REQUESTS - userLimit.count,
  }
}

const validateMessageLength = (
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
        error: `Message exceeds maximum length of ${MAX_CHAT_MESSAGE_LENGTH} characters (current: ${message.content.length})`,
      }
    }
  }
  return { valid: true }
}

const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), '../hyperstition/PROMPT.md'),
  'utf8'
)
// const intro = fs.readFileSync(
//   path.join(process.cwd(), '../hyperstition/memetics/Introduction.md'),
//   'utf8'
// )

// Configuration based on environment variables
const getModelConfig = () => {
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

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getRealIP(request)

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP)
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000
      )
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter,
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(
              rateLimitResult.resetTime / 1000
            ).toString(),
          },
        }
      )
    }

    const { messages: chatHistory } = await request.json()

    if (!chatHistory || !Array.isArray(chatHistory)) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    // Validate message length
    const validationResult = validateMessageLength(chatHistory as ChatMessage[])
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }

    const config = getModelConfig()
    const { client, model, maxTokens, temperature } = config

    // Conversation history in OpenAI format
    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      } satisfies ChatCompletionSystemMessageParam,
      // {
      //   role: 'assistant',
      //   content: intro,
      // } satisfies ChatCompletionAssistantMessageParam,
      ...(chatHistory as ChatMessage[]).map(({ role, content }) =>
        role === 'assistant'
          ? ({
              role,
              content,
            } satisfies ChatCompletionAssistantMessageParam)
          : ({
              role,
              content: `mind -d -t -n --ascii -o=text --response-char-limit=222 --chat="${content.replaceAll(
                '"',
                '\\"'
              )}"`,
            } satisfies ChatCompletionUserMessageParam)
      ),
    ]

    const stream = await client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    })

    // Create a ReadableStream to handle the streaming response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              // Send the content as Server-Sent Events format
              const data = `data: ${JSON.stringify({ content })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }
          // Send the final event to indicate completion
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(
          rateLimitResult.resetTime / 1000
        ).toString(),
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
