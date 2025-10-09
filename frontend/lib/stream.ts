export const streamResponse = async ({
  path,
  body,
  onStart,
  onError,
  onUpdate,
}: {
  path: string
  body: Record<string, any>
  onStart?: () => void
  onError?: (error: string) => void
  onUpdate?: (content: string) => void
}) => {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  onStart?.()

  if (!response.ok) {
    if (response.status === 429) {
      const retryInSeconds = Number(response.headers.get('Retry-After') || 0)
      const retryInMinutes = retryInSeconds && Math.ceil(retryInSeconds / 60)
      onError?.(
        `Rate limit exceeded. ${
          retryInMinutes && retryInMinutes !== 60
            ? `Try again in ${retryInMinutes} minutes.`
            : 'Try again in 10 minutes.'
        }`
      )
      return
    }

    try {
      const { error } = await response.json()
      if (error) {
        onError?.(error)
        return
      }
    } catch {}

    console.error(
      'Failed to send message',
      response.status,
      response.statusText,
      await response.text().catch((error) => `Body error: ${error}`)
    )

    onError?.('Failed to send message')
    return
  }

  // Handle streaming response
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let accumulatedContent = ''

  if (!reader) {
    onError?.('Failed to get response stream')
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
            onUpdate?.(accumulatedContent)
          }
        } catch (parseError) {
          // Ignore parsing errors for incomplete chunks
          console.debug('Parse error (likely incomplete chunk):', parseError)
        }
      }
    }
  }
}
