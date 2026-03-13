import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { content, title, tags } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const apiKey = process.env.SHELBY_API_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_SHELBY_RPC_URL || 'https://api.testnet.shelby.xyz/shelby';

    if (!apiKey) {
      return NextResponse.json({ error: 'Shelby API key not configured' }, { status: 500 });
    }

    const payload = JSON.stringify({
      content,
      title,
      tags,
      timestamp: Date.now(),
    });

    // Try Shelby upload
    const shelbyRes = await fetch(`${rpcUrl}/v1/blobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: payload,
    });

    if (!shelbyRes.ok) {
      const errText = await shelbyRes.text();
      console.error('Shelby upload error:', errText);

      // Fallback: return a mock blob ID so the app flow continues
      const mockBlobId = `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      return NextResponse.json({
        blobId: mockBlobId,
        size: payload.length,
        contentType: 'application/json',
        createdAt: Date.now(),
        mock: true,
        warning: 'Shelby network unavailable, using mock blob ID',
      });
    }

    const blob = await shelbyRes.json();
    return NextResponse.json(blob);

  } catch (err) {
    console.error('Upload route error:', err);
    // Fallback mock blob
    const mockBlobId = `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return NextResponse.json({
      blobId: mockBlobId,
      size: 0,
      contentType: 'application/json',
      createdAt: Date.now(),
      mock: true,
      warning: 'Shelby network unavailable, using mock blob ID',
    });
  }
}
