'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import useLocalStorageState from 'use-local-storage-state'

import { PasswordGateModal } from '@/components/ui/PasswordGateModal'
import { type Article, getArticleBySlug } from '@/lib/articles-client'

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordGate, setShowPasswordGate] = useState(false)
  const slug = params.slug as string

  const [password] = useLocalStorageState('memetics_password', {
    defaultValue: '',
  })

  const loadArticle = useCallback(async () => {
    try {
      const loadedArticle = await getArticleBySlug(slug, password)
      if (loadedArticle) {
        setArticle(loadedArticle)

        // Check if article is locked and needs password
        if (loadedArticle.locked) {
          setShowPasswordGate(true)
        }

        return loadedArticle
      } else {
        return null
      }
    } catch (error) {
      console.error('Failed to load article:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [slug, password, router])

  useEffect(() => {
    if (slug) {
      loadArticle().then((article) => {
        if (!article) {
          router.push('/memetics')
        }
      })
    }
  }, [slug, router])

  const handleUnlock = async () => {
    const article = await loadArticle()
    if (article?.locked) {
      throw new Error('ACCESS DENIED')
    }
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
        href="/memetics"
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
          href="/memetics"
          className="terminal-dim text-xs hover:terminal-bright"
        >
          ∞ RETURN TO ARCHIVE ∞
        </Link>
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
    </div>
  )
}
