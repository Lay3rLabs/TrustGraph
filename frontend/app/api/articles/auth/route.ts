import { CLASSIFIED_PASSWORD } from '@/lib/articles'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')

  if (password === CLASSIFIED_PASSWORD) {
    return new Response('true', { status: 200 })
  }

  return new Response('false', { status: 401 })
}
