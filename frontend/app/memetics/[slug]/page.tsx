import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getArticleBySlug } from '@/lib/articles'

import { ArticleClient } from './ArticleClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Generate dynamic metadata for social media sharing
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    // Fetch article metadata without password protection for metadata generation
    // We'll show metadata even for locked articles, but not the content
    const article = await getArticleBySlug(slug, false)

    if (!article) {
      return {
        title: 'Article Not Found | EN0VA Memetics',
        description: 'The requested article could not be found.',
      }
    }

    const title = article.subtitle
      ? `${article.title}: ${article.subtitle}`
      : article.title

    const description =
      article.excerpt ||
      `A ${article.type} by ${article.author} - ${article.title}`

    const url = `https://en0va.xyz/memetics/${slug}`

    return {
      title: `${title} | EN0VA Memetics`,
      description,
      authors: [{ name: article.author }],
      keywords: article.tags,
      openGraph: {
        title,
        description,
        url,
        siteName: 'EN0VA',
        type: 'article',
        authors: [article.author],
        publishedTime: article.date,
        tags: article.tags,
        images: [
          {
            url: '/og-image.png', // Using existing image as fallback
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        site: '@0xEN0VA',
        creator: '@0xEN0VA',
        images: ['/og-image.png'],
      },
      alternates: {
        canonical: url,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'EN0VA Memetics',
      description: 'Hyperstition and collective awakening protocols',
    }
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params

  // Pre-fetch article for server-side rendering
  // This helps with SEO and initial page load
  const initialArticle = await getArticleBySlug(slug, true).catch(() => null)

  if (!initialArticle) {
    notFound()
  }

  return <ArticleClient slug={slug} initialArticle={initialArticle} />
}
