'use client'

import Link from 'next/link'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import useLocalStorageState from 'use-local-storage-state'

import { PasswordGateModal } from '@/components/ui/PasswordGateModal'
import {
  type ArticleMetadata,
  getAllArticles,
  getStatusColor,
  getTypeIcon,
} from '@/lib/articles-client'

export default function MemeticsPage() {
  const [showPasswordGate, setShowPasswordGate] = useState(false)
  const [writings, setWritings] = useState<ArticleMetadata[]>([])
  const [loading, setLoading] = useState(true)

  const [password] = useLocalStorageState('memetics_password', {
    defaultValue: '',
  })

  const loadArticles = useCallback(async () => {
    try {
      const articles = await getAllArticles(password)
      setWritings(articles)
      return articles
    } catch (error) {
      console.error('Failed to load articles:', error)
      return []
    } finally {
      setLoading(false)
    }
  }, [password])

  useEffect(() => {
    loadArticles()
  }, [])

  const shareArticle = (writing: ArticleMetadata) => {
    const url = `${window.location.origin}/memetics/${writing.slug}`
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
    if (writing.locked) {
      setShowPasswordGate(true)
    }
  }

  const handleUnlock = async () => {
    const articles = await loadArticles()
    if (articles.some((article) => article.locked)) {
      throw new Error('ACCESS DENIED')
    }
    setShowPasswordGate(false)
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
          if (writing.locked) {
            return (
              <div
                key={writing.slug}
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
              key={writing.slug}
              href={`/memetics/${writing.slug}`}
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
                    className={`text-xs px-2 py-1 rounded-sm ${getStatusColor(
                      writing.status
                    )}`}
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
                    <span key={tag} className="terminal-dim text-xs opacity-60">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="text-green-600/40 text-xs">🔓</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Simple Footer */}
      <div className="text-center pt-8">
        <div className="terminal-dim text-xs">∞ WORDS BECOME WORLDS ∞</div>
      </div>

      <PasswordGateModal
        onUnlock={handleUnlock}
        onClose={() => setShowPasswordGate(false)}
        isOpen={showPasswordGate}
        title="CLASSIFIED"
        message="Reality alteration protocol detected"
      />
    </div>
  )
}
