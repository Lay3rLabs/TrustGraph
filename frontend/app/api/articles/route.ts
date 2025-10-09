import { NextResponse } from 'next/server'

import { CLASSIFIED_PASSWORD, getAllArticles } from '@/lib/articles'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')

    const articles = await getAllArticles(password !== CLASSIFIED_PASSWORD)
    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}
