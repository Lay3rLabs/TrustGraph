import { NextRequest, NextResponse } from 'next/server'

import { CLASSIFIED_PASSWORD, getArticleBySlug } from '@/lib/articles'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')

    const article = await getArticleBySlug(
      slug,
      password !== CLASSIFIED_PASSWORD
    )

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}
