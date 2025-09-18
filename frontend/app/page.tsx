'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
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
    queryFn: () => getArticleBySlug('hyperstition-economics'),
  })

  const [content, setContent] = useState('')
  const [userInput, setUserInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!article) {
      return
    }

    // const lines = article.content
    //   .split('\n')
    //   .flatMap((line) => line.trim() || [])
    //   .map((line) => `_EN0VA:_ ${line}`)

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
      limit += 3
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

  // Auto-resize textarea function
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    setUserInput(textarea.value)

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    // Set height to scrollHeight to fit content
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  // Set initial height when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  if (isLoading) {
    return
  }

  if (isError) {
    return <div>Error loading article: {error?.message}</div>
  }

  if (!article) {
    return <div>Article not found</div>
  }

  return (
    <div className="space-y-4 bg-foreground/20 p-4 rounded-sm">
      <p>EN0VA:</p>
      <div className="pl-4 space-y-4 text-primary-foreground/60 text-xs">
        <Markdown
          components={{
            p: ({ children }) => (
              <p className="animate-in fade-in-0 duration-1000">{children}</p>
            ),
          }}
        >
          {content}
        </Markdown>
      </div>

      {/* <p>You:</p> */}
      <div className="space-y-4 text-xs w-full flex flex-row gap-2 items-start">
        <ChevronRight className="w-4 h-4" />
        <textarea
          ref={textareaRef}
          autoFocus
          className="grow outline-none resize-none overflow-hidden min-h-[1.5rem] text-primary-foreground/60"
          value={userInput}
          onChange={handleTextareaChange}
          placeholder="Type your message..."
        />
      </div>
      {/* <div className="overflow-y-scroll h-full">{content}</div> */}
    </div>
  )
}
