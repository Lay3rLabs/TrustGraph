import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, isAddress } from 'viem'

// import { enovaAbi } from '@/lib/contracts'
import { getCurrentChainConfig } from '@/lib/wagmi'

// Create a public client for reading contract data
const publicClient = createPublicClient({
  chain: getCurrentChainConfig(),
  transport: http(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    if (!address || !isAddress(address)) {
      return NextResponse.json(
        { error: 'Valid contract address is required' },
        { status: 400 }
      )
    }

    // Read token symbol from contract
    // const symbol = await publicClient.readContract({
    //   address: address as `0x${string}`,
    //   abi: enovaAbi,
    //   functionName: 'symbol',
    // })
    const symbol = 'EN0'

    return NextResponse.json({ symbol })
  } catch (error: any) {
    console.error('Token symbol fetch error:', error)
    return NextResponse.json(
      { error: `Failed to fetch token symbol: ${error.message}` },
      { status: 500 }
    )
  }
}
