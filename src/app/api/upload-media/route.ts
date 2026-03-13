import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const apiKey = process.env.SHELBY_API_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_SHELBY_RPC_URL || 'https://api.testnet.shelby.xyz/shelby';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try uploading to Shelby
    const shelbyRes = await fetch(`${rpcUrl}/v1/blobs`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Authorization': `Bearer ${apiKey}`,
        'X-Blob-Name': `media/${Date.now()}-${file.name}`,
      },
      body: buffer,
    });

    if (!shelbyRes.ok) {
      // Fallback: convert to base64 data URL for local preview
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      const mockBlobId = `mock-media-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      return NextResponse.json({
        blobId: mockBlobId,
        url: dataUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        mock: true,
      });
    }

    const blob = await shelbyRes.json();
    return NextResponse.json({
      ...blob,
      url: `${rpcUrl}/v1/blobs/${blob.blobId}`,
      name: file.name,
      type: file.type,
    });

  } catch (err) {
    console.error('Media upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
