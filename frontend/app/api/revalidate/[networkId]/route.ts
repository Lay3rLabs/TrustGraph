import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

import { NETWORKS } from '@/lib/config'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ networkId: string }> }
) {
  try {
    const { networkId } = await params

    if (!networkId) {
      return NextResponse.json(
        { error: 'Network ID is required' },
        { status: 400 }
      )
    }

    revalidatePath('/')

    if (networkId.toLowerCase() === 'all') {
      revalidatePath('/network/[id]', 'page')
    } else {
      if (!NETWORKS.find((network) => network.id === networkId)) {
        return NextResponse.json(
          { error: 'Network not found' },
          { status: 404 }
        )
      }

      revalidatePath(`/network/${networkId}`)

      return NextResponse.json({ message: 'Revalidated' })
    }
  } catch (err) {
    console.error('Error revalidating', err)
    // If there was an error, Next.js will continue to show the last
    // successfully generated page.
    return NextResponse.json({ error: 'Error revalidating' }, { status: 500 })
  }
}
