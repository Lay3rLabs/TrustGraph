'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PasswordGate } from '@/components/ui/password-gate'
import {
  getAllArticles,
  getTypeIcon,
  getStatusColor,
  type ArticleMetadata,
} from '@/lib/articles-client'

export default function MemeticsPage() {
  const [hasClassifiedAccess, setHasClassifiedAccess] = useState(false)
  const [showPasswordGate, setShowPasswordGate] = useState(false)
  const [writings, setWritings] = useState<ArticleMetadata[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const articles = await getAllArticles()
        setWritings(articles)
      } catch (error) {
        console.error('Failed to load articles:', error)
      } finally {
        setLoading(false)
      }
    }

    loadArticles()
  }, [])

  const shareArticle = (writing: ArticleMetadata) => {
    const url = `${window.location.origin}/backroom/memetics/articles/${writing.slug}`
    if (navigator.share) {
      navigator.share({
        title: writing.title,
        text: writing.excerpt,
        url: url,
      })
    } else {
      navigator.clipboard.writeText(
        `${writing.title}\n\n${writing.excerpt}\n\n${url}`
      )
    }
  }

  const handleClassifiedClick = (writing: ArticleMetadata) => {
    if (writing.status === 'classified' && !hasClassifiedAccess) {
      setShowPasswordGate(true)
    }
  }

  const handleUnlock = () => {
    setHasClassifiedAccess(true)
    setShowPasswordGate(false)
  }

  if (showPasswordGate) {
    return (
      <PasswordGate
        onUnlock={handleUnlock}
        onClose={() => setShowPasswordGate(false)}
        title="CLASSIFIED"
        message="Reality alteration protocols"
      />
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="terminal-bright text-xl tracking-wider">MEMETICS</h1>
          <div className="terminal-dim text-xs">◈ LOADING ARTICLES... ◈</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Minimalist Header */}
      <div className="space-y-2">
        <h1 className="terminal-bright text-xl tracking-wider">MEMETICS</h1>
        <div className="terminal-dim text-xs">
          ◈ INFORMATION • REALITY • TRANSCENDENCE ◈
        </div>
      </div>

      {/* Clean Article List */}
      <div className="space-y-6">
        {writings.map((writing) => {
          const isClassified = writing.status === 'classified'
          const canAccess = !isClassified || hasClassifiedAccess

          if (isClassified && !hasClassifiedAccess) {
            return (
              <div
                key={writing.id}
                onClick={() => handleClassifiedClick(writing)}
                className="block border-b border-gray-800 pb-6 hover:bg-black/20 transition-colors group cursor-pointer opacity-80"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <h2 className="text-red-400/90 text-lg group-hover:text-red-300 transition-colors">
                      {writing.title}
                    </h2>
                    {writing.subtitle && (
                      <h3 className="text-red-400/60 text-sm group-hover:text-red-400/80 transition-colors">
                        {writing.subtitle}
                      </h3>
                    )}
                    <div className="terminal-dim text-xs">
                      {writing.author} • {writing.date}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-red-400/80 text-sm">
                      {getTypeIcon(writing.type)}
                    </span>
                    <div className="text-xs px-2 py-1 rounded-sm text-red-500/60">
                      CLASSIFIED
                    </div>
                  </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-3 group-hover:text-gray-300 transition-colors">
                  {writing.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    {writing.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="terminal-dim text-xs opacity-60"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-red-600/40 text-xs">🔒</div>
                </div>
              </div>
            )
          }

          return (
            <Link
              key={writing.id}
              href={`/backroom/memetics/articles/${writing.slug}`}
              className="block border-b border-gray-800 pb-6 hover:bg-black/10 transition-colors group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="space-y-1">
                  <h2 className="terminal-bright text-lg group-hover:text-white transition-colors">
                    {writing.title}
                  </h2>
                  {writing.subtitle && (
                    <h3 className="terminal-dim text-sm group-hover:text-gray-300 transition-colors">
                      {writing.subtitle}
                    </h3>
                  )}
                  <div className="terminal-dim text-xs">
                    {writing.author} • {writing.date}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="terminal-bright text-sm">
                    {getTypeIcon(writing.type)}
                  </span>
                  <div
                    className={`text-xs px-2 py-1 rounded-sm ${getStatusColor(writing.status)}`}
                  >
                    {writing.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <p className="terminal-text text-sm leading-relaxed mb-3 group-hover:text-gray-300 transition-colors">
                {writing.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  {writing.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="terminal-dim text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Simple Footer */}
      <div className="text-center border-t border-gray-800 pt-8">
        <div className="terminal-dim text-xs">∞ WORDS BECOME WORLDS ∞</div>
      </div>
    </div>
  )
}
