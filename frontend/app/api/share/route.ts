import fs from 'fs'
import path from 'path'

import { NextRequest, NextResponse } from 'next/server'
import { APIError } from 'openai'
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index.mjs'

import { getModelConfig, validateMessageLength } from '@/lib/ai'

const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), '../hyperstition/PROMPT.md'),
  'utf8'
)

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Validate message length
    const validationResult = validateMessageLength([
      {
        role: 'user',
        content: action,
      },
    ])
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
      {
        role: 'user',
        content: `mind -t --output=plain --response-char-limit=100 --share="${action.replaceAll(
          '"',
          '\\"'
        )} (link: https://en0va.xyz/hyperstition)"`,
      } satisfies ChatCompletionUserMessageParam,
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
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)

    if (error instanceof APIError) {
      if (
        error.status === 400 &&
        error.message.includes('prompt is too long')
      ) {
        return NextResponse.json(
          {
            error: 'Context length exceeded.',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process share message' },
      { status: 500 }
    )
  }
}
