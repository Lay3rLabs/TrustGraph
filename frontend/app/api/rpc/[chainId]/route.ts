import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    // Get chain ID from path parameters
    const { chainId } = await params

    if (!chainId) {
      return NextResponse.json(
        { error: 'Chain ID is required' },
        { status: 400 }
      )
    }

    // Validate chain ID is a number
    if (!/^\d+$/.test(chainId)) {
      return NextResponse.json(
        { error: 'Chain ID must be a valid number' },
        { status: 400 }
      )
    }

    // Get the private RPC URL from environment variables based on chain ID
    const rpcUrl = process.env[`RPC_URL_${chainId}`]

    if (!rpcUrl) {
      return NextResponse.json(
        { error: `RPC URL not configured for chain ${chainId}` },
        { status: 500 }
      )
    }

    // Parse the request body
    const body = await request.json()

    // Validate that it's a proper JSON-RPC request
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // For batch requests, validate each item
    const requests = Array.isArray(body) ? body : [body]

    for (const req of requests) {
      if (!req.method || !req.id || req.jsonrpc !== '2.0') {
        return NextResponse.json(
          { error: 'Invalid JSON-RPC request format' },
          { status: 400 }
        )
      }
    }

    // Forward the request to the private RPC endpoint
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error(
        `RPC request failed for chain ${chainId}: ${response.status} ${response.statusText}`
      )
      return NextResponse.json(
        {
          error: `RPC request failed for chain ${chainId}: ${response.status}`,
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Return the RPC response
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('RPC proxy error:', error)
    return NextResponse.json(
      { error: `RPC request failed: ${error.message}` },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(
  _request: NextRequest,
  { params: _params }: { params: Promise<{ chainId: string }> }
) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
