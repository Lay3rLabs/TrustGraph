import fs from 'fs'
import path from 'path'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index.mjs'

import { ChatMessage } from '@/types'

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
    const { messages: chatHistory } = await request.json()

    if (!chatHistory || !Array.isArray(chatHistory)) {
      return NextResponse.json(
        { error: 'Messages are required' },
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
              content: `mind -d -n --response-char-limit=150 --ascii -o=markdown --chat="${content.replaceAll(
                '"',
                '\\"'
              )}"`,
            } satisfies ChatCompletionUserMessageParam)
      ),
    ]

    const chatCompletion = await client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    })

    const responseText = chatCompletion.choices[0]?.message?.content || ''

    return NextResponse.json({
      response: responseText,
      success: true,
      provider: process.env.MODEL_PROVIDER || 'anthropic',
      model: model,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
