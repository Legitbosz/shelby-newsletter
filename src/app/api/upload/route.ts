import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), '.blob-cache.json');

function readCache(): Record<string, string> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function readAttachCache(): Record<string, any[]> {
  try {
    const f = path.join(process.cwd(), '.blob-attachments.json');
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf-8'));
  } catch {}
  return {};
}

function writeAttachCache(cache: Record<string, any[]>) {
  try {
    fs.writeFileSync(path.join(process.cwd(), '.blob-attachments.json'), JSON.stringify(cache));
  } catch {}
}

function writeCache(cache: Record<string, string>) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // FETCH mode
    if (body.fetch && body.blobId) {
      const blobId = body.blobId;

      // Check file cache first
      const cache = readCache();
      if (cache[blobId]) {
        const ac = readAttachCache();
        return NextResponse.json({ content: cache[blobId], attachments: ac[blobId] || [] });
      }

      // Try Shelby for real blobs
      if (!blobId.startsWith('mock-')) {
        const apiKey = process.env.SHELBY_API_KEY;
        const rpcUrl = process.env.NEXT_PUBLIC_SHELBY_RPC_URL || 'https://api.testnet.shelby.xyz/shelby';
        try {
          const res = await fetch(`${rpcUrl}/v1/blobs/${blobId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
          });
          if (res.ok) {
            const data = await res.json();
            return NextResponse.json({ content: data.content || JSON.stringify(data, null, 2) });
          }
        } catch { /* unavailable */ }
      }

      return NextResponse.json({
        content: `Content for blob \`${blobId}\` is unavailable.\n\nThis may be because Shelby network is temporarily down. Try again later.`,
      });
    }

    // UPLOAD mode
    const { content, title, tags } = body;
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    const apiKey = process.env.SHELBY_API_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_SHELBY_RPC_URL || 'https://api.testnet.shelby.xyz/shelby';
    const payload = JSON.stringify({ content, title, tags, timestamp: Date.now() });

    try {
      const shelbyRes = await fetch(`${rpcUrl}/v1/blobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: payload,
      });
      if (shelbyRes.ok) {
        const blob = await shelbyRes.json();
        // Cache real blob content too
        const cache = readCache();
        cache[blob.blobId] = content;
        writeCache(cache);
        return NextResponse.json(blob);
      }
    } catch { /* fall through */ }

    // Mock fallback — save to file cache
    const mockBlobId = `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const cache = readCache();
    cache[mockBlobId] = content;
    writeCache(cache);

    // Store attachments if provided
    if (body.attachments?.length) {
      const ac = readAttachCache();
      ac[mockBlobId] = body.attachments;
      writeAttachCache(ac);
    }

    return NextResponse.json({
      blobId: mockBlobId,
      size: payload.length,
      contentType: 'application/json',
      createdAt: Date.now(),
      mock: true,
    });

  } catch (err) {
    console.error('Upload route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
