'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import useLocalStorageState from 'use-local-storage-state'

import { PasswordGateModal } from '@/components/ui/PasswordGateModal'
import { type Article, getArticleBySlug } from '@/lib/articles-client'

interface ArticleClientProps {
  slug: string
  initialArticle: Article
}

export function ArticleClient({ slug, initialArticle }: ArticleClientProps) {
  const router = useRouter()
  const [article, setArticle] = useState<Article>(initialArticle)
  const [loading, setLoading] = useState(false)
  const [showPasswordGate, setShowPasswordGate] = useState(
    initialArticle.locked
  )

  const [password] = useLocalStorageState('memetics_password', {
    defaultValue: '',
  })

  const loadArticle = useCallback(async () => {
    try {
      setLoading(true)
      const loadedArticle = await getArticleBySlug(slug, password)
      if (loadedArticle) {
        setArticle(loadedArticle)

        // Check if article is locked and needs password
        if (loadedArticle.locked) {
          setShowPasswordGate(true)
        } else {
          setShowPasswordGate(false)
        }

        return loadedArticle
      } else {
        router.push('/memetics')
        return null
      }
    } catch (error) {
      console.error('Failed to load article:', error)
      router.push('/memetics')
      return null
    } finally {
      setLoading(false)
    }
  }, [slug, password, router])

  // Load article with password if password changes
  useEffect(() => {
    if (password && article.locked) {
      loadArticle()
    }
  }, [password, article.locked, loadArticle])

  const handleUnlock = async () => {
    const updatedArticle = await loadArticle()
    if (updatedArticle?.locked) {
      throw new Error('ACCESS DENIED')
    }
  }

  const shareArticle = (writing: Article) => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: writing.title,
        text: writing.subtitle || writing.excerpt,
        url: url,
      })
    } else {
      const shareText = writing.subtitle
        ? `${writing.title}: ${writing.subtitle}\n\n${writing.excerpt}\n\n${url}`
        : `${writing.title}\n\n${writing.excerpt}\n\n${url}`

      navigator.clipboard.writeText(shareText)
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href="/memetics"
          className="terminal-command text-sm hover:terminal-bright flex items-center space-x-2"
        >
          <span>←</span>
          <span>BACK TO ARCHIVE</span>
        </Link>

        {/* Article Header */}
        <div className="pb-2">
          <div className="flex items-center space-x-3 mb-3">
            <div>
              <h1 className="terminal-bright text-2xl">{article.title}</h1>
              {article.subtitle && (
                <h2 className="terminal-dim text-lg mb-2">
                  {article.subtitle}
                </h2>
              )}
              <div className="terminal-dim text-xs">
                by {article.author} • {article.date}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
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
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="terminal-dim text-center py-8">AUTHENTICATING...</div>
        )}

        {/* Article Content */}
        {!loading && !article.locked && (
          <div
            className="max-w-none font-mono"
            dangerouslySetInnerHTML={{ __html: article.htmlContent }}
          />
        )}

        {/* Locked Content Placeholder */}
        {!loading && article.locked && (
          <div className="text-center py-12 border border-gray-700 bg-black/20 rounded">
            <div className="terminal-bright text-xl mb-2">🔒 CLASSIFIED</div>
            <div className="terminal-dim text-sm">
              This document contains sensitive information.
              <br />
              Access requires proper authentication.
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t border-gray-700 pt-8">
          <Link
            href="/memetics"
            className="terminal-dim text-xs hover:terminal-bright"
          >
            ∞ RETURN TO ARCHIVE ∞
          </Link>
        </div>
      </div>

      <PasswordGateModal
        onUnlock={handleUnlock}
        onClose={() => {
          router.push('/memetics')
          setShowPasswordGate(false)
        }}
        isOpen={showPasswordGate}
        title="CLASSIFIED"
        message="Reality alteration protocol detected"
      />
    </>
  )
}
