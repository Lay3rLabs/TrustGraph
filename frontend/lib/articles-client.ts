export interface ArticleMetadata {
  slug: string
  title: string
  subtitle?: string
  author: string
  date: string
  excerpt: string
  tags: string[]
  type: 'essay' | 'manifesto' | 'theory' | 'experiment'
  status: 'published' | 'draft' | 'classified'
  filename: string
}

export interface Article extends ArticleMetadata {
  content: string
  htmlContent: string
}

export async function getAllArticles(): Promise<ArticleMetadata[]> {
  try {
    const response = await fetch('/api/articles')
    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const response = await fetch(`/api/articles/${slug}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch article: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error fetching article ${slug}:`, error)
    return null
  }
}

// Utility functions for UI components
export const getTypeIcon = (type: string) => {
  switch (type) {
    case 'essay':
      return '◆'
    case 'manifesto':
      return '▲'
    case 'theory':
      return '◈'
    case 'experiment':
      return '◉'
    default:
      return '◦'
  }
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'terminal-bright'
    case 'draft':
      return 'terminal-dim'
    case 'classified':
      return 'text-red-400'
    default:
      return 'terminal-text'
  }
}
