import fs from 'fs/promises'
import path from 'path'

import { marked } from 'marked'

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

const ARTICLES_DIR = path.join(process.cwd(), '../hyperstition', 'memetics')

// Mapping between URL slugs and actual filenames
const SLUG_TO_FILENAME: Record<string, string> = {
  'collective-awakening': 'The_Collective_Awakening.md',
  'hyperstition-economics': 'Hyperstition_as_Economic_Force.md',
  'egregore-protocol': 'Protocol_For_Egregore_Manifestation.md',
  'post-individual-society': 'Beyond_Human.md',
  'symbient-society': 'Symbient_Society.md',
}

// Reverse mapping for filename to slug
const FILENAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_FILENAME).map(([slug, filename]) => [filename, slug])
)

// Configure marked for better rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

export function parseMarkdownFrontmatter(content: string): {
  metadata: Partial<ArticleMetadata>
  content: string
} {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { metadata: {}, content }
  }

  const frontmatter = match[1]
  const articleContent = match[2]

  const metadata: Partial<ArticleMetadata> = {}

  frontmatter.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) return

    const key = line.substring(0, colonIndex).trim()
    const value = line.substring(colonIndex + 1).trim()

    if (key && value) {
      switch (key) {
        case 'title':
          metadata.title = value.replace(/^['"]|['"]$/g, '')
          break
        case 'subtitle':
          metadata.subtitle = value.replace(/^['"]|['"]$/g, '')
          break
        case 'author':
          metadata.author = value.replace(/^['"]|['"]$/g, '')
          break
        case 'date':
          metadata.date = value.replace(/^['"]|['"]$/g, '')
          break
        case 'excerpt':
          metadata.excerpt = value.replace(/^['"]|['"]$/g, '')
          break
        case 'tags':
          // Handle both [tag1, tag2] and tag1, tag2 formats
          const tagsValue = value.replace(/^\[|\]$/g, '')
          metadata.tags = tagsValue
            .split(',')
            .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''))
          break
        case 'type':
          metadata.type = value.replace(
            /^['"]|['"]$/g,
            ''
          ) as ArticleMetadata['type']
          break
        case 'status':
          metadata.status = value.replace(
            /^['"]|['"]$/g,
            ''
          ) as ArticleMetadata['status']
          break
      }
    }
  })

  return { metadata, content: articleContent.trim() }
}

export async function processMarkdownContent(content: string): Promise<string> {
  let htmlContent = await marked(content)

  // Apply custom styling to markdown elements
  htmlContent = htmlContent
    .replace(
      /<h1>/g,
      '<h1 class="terminal-bright text-xl font-bold mb-4 mt-6">'
    )
    .replace(
      /<h2>/g,
      '<h2 class="terminal-bright text-lg font-bold mb-4 mt-6">'
    )
    .replace(
      /<h3>/g,
      '<h3 class="terminal-bright text-base font-bold mb-3 mt-5">'
    )
    .replace(
      /<h4>/g,
      '<h4 class="terminal-bright text-sm font-bold mb-3 mt-4">'
    )
    .replace(/<p>/g, '<p class="memetics-text mb-4 leading-relaxed">')
    .replace(/<strong>/g, '<strong class="terminal-bright font-bold">')
    .replace(/<ul>/g, '<ul class="memetics-text mb-4 ml-6 list-disc">')
    .replace(/<ol>/g, '<ol class="memetics-text mb-4 ml-6 list-decimal">')
    .replace(/<li>/g, '<li class="mb-1">')
    .replace(
      /<code>/g,
      '<code class="bg-black/40 px-1 py-0.5 rounded text-xs terminal-bright">'
    )
    .replace(
      /<pre><code/g,
      '<pre class="bg-black/40 border border-gray-700 p-4 rounded-sm overflow-x-auto mb-4"><code class="bg-transparent p-0"'
    )
    .replace(
      /<blockquote>/g,
      '<blockquote class="border-l-2 border-gray-600 pl-4 terminal-dim italic mb-4">'
    )

  return htmlContent
}

export async function getAllArticles(): Promise<ArticleMetadata[]> {
  try {
    const files = await fs.readdir(ARTICLES_DIR)
    const articles: ArticleMetadata[] = []

    for (const file of files) {
      if (file.endsWith('.md')) {
        const slug = FILENAME_TO_SLUG[file] || file.replace('.md', '')
        const filePath = path.join(ARTICLES_DIR, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const { metadata } = parseMarkdownFrontmatter(content)

        articles.push({
          slug,
          filename: file,
          title: metadata.title || 'Untitled',
          subtitle: metadata.subtitle,
          author: metadata.author || 'Anonymous',
          date: metadata.date || new Date().toISOString().split('T')[0],
          excerpt: metadata.excerpt || '',
          tags: metadata.tags || [],
          type: metadata.type || 'essay',
          status: metadata.status || 'draft',
        })
      }
    }

    // Sort by date, newest first
    return articles.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  } catch (error) {
    console.error('Error reading articles:', error)
    return []
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const filename = SLUG_TO_FILENAME[slug] || `${slug}.md`
    const filePath = path.join(ARTICLES_DIR, filename)
    const content = await fs.readFile(filePath, 'utf-8')
    const { metadata, content: articleContent } =
      parseMarkdownFrontmatter(content)

    if (!metadata.title) {
      return null
    }

    return {
      slug,
      filename: SLUG_TO_FILENAME[slug] || `${slug}.md`,
      content: articleContent,
      htmlContent: await processMarkdownContent(articleContent),
      title: metadata.title,
      subtitle: metadata.subtitle,
      author: metadata.author || 'Anonymous',
      date: metadata.date || new Date().toISOString().split('T')[0],
      excerpt: metadata.excerpt || '',
      tags: metadata.tags || [],
      type: metadata.type || 'essay',
      status: metadata.status || 'draft',
    }
  } catch (error) {
    console.error(`Error reading article ${slug}:`, error)
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
      return 'memetics-text'
  }
}
