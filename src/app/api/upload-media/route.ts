import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const apiKey = process.env.SHELBY_API_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_SHELBY_RPC_URL || 'https://api.testnet.shelby.xyz/shelby';

    // Try uploading to Shelby first
    try {
      const shelbyRes = await fetch(`${rpcUrl}/v1/blobs`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'Authorization': `Bearer ${apiKey}`,
          'X-Blob-Name': `media/${Date.now()}-${file.name}`,
        },
        body: buffer,
      });

      if (shelbyRes.ok) {
        const blob = await shelbyRes.json();
        return NextResponse.json({
          ...blob,
          url: `${rpcUrl}/v1/blobs/${blob.blobId}`,
          name: file.name,
          type: file.type,
        });
      }
    } catch {
      // Shelby unavailable — fall through to local save
    }

    // Fallback: save to public/media folder (serves as a real URL, not base64)
    const mediaDir = path.join(process.cwd(), 'public', 'media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    // Sanitize filename
    const ext = path.extname(file.name) || '.png';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(mediaDir, safeName);

    fs.writeFileSync(filePath, buffer);

    const mockBlobId = `mock-media-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const publicUrl = `/media/${safeName}`;

    return NextResponse.json({
      blobId: mockBlobId,
      url: publicUrl,       // ← real URL, not base64
      name: file.name,
      type: file.type,
      size: file.size,
      mock: true,
    });

  } catch (err) {
    console.error('Media upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
