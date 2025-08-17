import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  try {
    const { cid } = params;
    
    if (!cid) {
      return NextResponse.json(
        { error: 'CID parameter is required' },
        { status: 400 }
      );
    }

    // Make POST request to local IPFS node
    const ipfsUrl = `http://localhost:5001/api/v0/cat?arg=${cid}`;
    
    const response = await fetch(ipfsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`IPFS fetch failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch from IPFS: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('IPFS proxy error:', error);
    return NextResponse.json(
      { error: `IPFS request failed: ${error.message}` },
      { status: 500 }
    );
  }
}