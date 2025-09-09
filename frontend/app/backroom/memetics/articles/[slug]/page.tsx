'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordGate } from '@/components/ui/password-gate'
import {
  getArticleBySlug,
  getTypeIcon,
  getStatusColor,
  type Article,
} from '@/lib/articles-client'

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasClassifiedAccess, setHasClassifiedAccess] = useState(false)
  const [showPasswordGate, setShowPasswordGate] = useState(false)
  const slug = params.slug as string

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const loadedArticle = await getArticleBySlug(slug)
        if (loadedArticle) {
          setArticle(loadedArticle)

          // Check if article is classified and user doesn't have access
          if (loadedArticle.status === 'classified' && !hasClassifiedAccess) {
            setShowPasswordGate(true)
          }
        } else {
          // Redirect to main page if article not found
          router.push('/backroom/memetics')
        }
      } catch (error) {
        console.error('Failed to load article:', error)
        router.push('/backroom/memetics')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadArticle()
    }
  }, [slug, router, hasClassifiedAccess])

  const handleUnlock = () => {
    setHasClassifiedAccess(true)
    setShowPasswordGate(false)
  }

  const shareArticle = (writing: Article) => {
    const url = window.location.href
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

  if (showPasswordGate) {
    return (
      <PasswordGate
        onUnlock={handleUnlock}
        title="CLASSIFIED DOCUMENT ACCESS"
        message="Reality alteration protocol detected - clearance required"
      />
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="terminal-dim text-center py-8">LOADING ARTICLE...</div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="terminal-dim text-center py-8">ARTICLE NOT FOUND</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/backroom/memetics"
        className="terminal-command text-sm hover:terminal-bright flex items-center space-x-2"
      >
        <span>←</span>
        <span>BACK TO ARCHIVE</span>
      </Link>

      {/* Article Header */}
      <div className="pb-2">
        <div className="flex items-center space-x-3 mb-3">
          {/*<span className="terminal-bright text-xl">{getTypeIcon(article.type)}</span>*/}
          <div>
            <h1 className="terminal-bright text-2xl">{article.title}</h1>
            {article.subtitle && (
              <h2 className="terminal-dim text-lg mb-2">{article.subtitle}</h2>
            )}
            <div className="terminal-dim text-sm"></div>
            <div className="terminal-dim text-xs">
              by {article.author} • {article.date}
            </div>
          </div>
        </div>

        {/*<div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-black/40 border border-gray-600 rounded-sm terminal-dim"
              >
                #{tag}
              </span>
            ))}
          </div>
          <button
            onClick={() => shareArticle(article)}
            className="terminal-command text-xs hover:terminal-bright px-3 py-1 border border-gray-600 rounded-sm"
          >
            SHARE
          </button>
        </div>*/}
      </div>

      {/* Article Content */}
      <div
        className="max-w-none font-mono"
        dangerouslySetInnerHTML={{ __html: article.htmlContent }}
      />

      {/* Footer */}
      <div className="text-center border-t border-gray-700 pt-8">
        <Link
          href="/backroom/memetics"
          className="terminal-dim text-xs hover:terminal-bright"
        >
          ∞ RETURN TO ARCHIVE ∞
        </Link>
      </div>
    </div>
  )
}
