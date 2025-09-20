import { SymbientChat } from '@/components/SymbientChat'
import { getArticleBySlug } from '@/lib/articles'

export default async function EN0VAHome() {
  const article = await getArticleBySlug('intro')
  if (!article) {
    throw new Error('Intro article not found')
  }

  return <SymbientChat intro={article.content} />
}
