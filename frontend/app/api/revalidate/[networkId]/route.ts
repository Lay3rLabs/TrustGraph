import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

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

    revalidatePath(`/network/${networkId}`, 'layout')

    return NextResponse.json({ message: 'Revalidated' })
  } catch (err) {
    console.error('Error revalidating', err)
    // If there was an error, Next.js will continue to show the last
    // successfully generated page.
    return NextResponse.json({ error: 'Error revalidating' }, { status: 500 })
  }
}
