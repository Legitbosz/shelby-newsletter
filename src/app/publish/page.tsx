'use client';
import { useState } from 'react';
import { useWallet } from '@/components/wallet/WalletProvider';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { uploadArticle } from '@/lib/shelby/upload';
import Link from 'next/link';

export default function PublishPage() {
  const { address, connected } = useWallet();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [done, setDone] = useState<{ blobName: string; uploaderAddress: string } | null>(null);

  if (!connected) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-8">
        <h1 className="text-2xl font-bold">Connect your wallet to publish</h1>
        <ConnectButton />
      </main>
    );
  }

  async function handlePublish() {
    if (!title || !content) return;
    setStatus('Uploading to Shelby...');
    try {
      const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60);
      const result = await uploadArticle(content, slug);
      setDone(result);
      setStatus('');
    } catch (e: unknown) {
      setStatus('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="text-5xl">✓</div>
        <h1 className="text-2xl font-bold">Article published!</h1>
        <div className="text-sm text-zinc-400">
          <div>Blob: <code className="text-indigo-400 font-mono text-xs">{done.blobName}</code></div>
          <div>Author: <code className="text-zinc-500 font-mono text-xs">{done.uploaderAddress.slice(0, 16)}…</code></div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/read/${encodeURIComponent(done.uploaderAddress)}/${encodeURIComponent(done.blobName)}`}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
          >
            Read Article
          </Link>
          <button
            onClick={() => { setTitle(''); setContent(''); setDone(null); }}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
          >
            Write Another
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-100">← Back</Link>
        <span className="text-sm font-medium">New Article</span>
        <ConnectButton />
      </nav>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-8 py-8 gap-6">
        <input
          type="text"
          placeholder="Article title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder-zinc-700 text-zinc-100"
        />

        <textarea
          placeholder="Write your article in Markdown…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 min-h-96 w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none resize-none font-mono leading-relaxed"
        />

        {status && (
          <div className="text-indigo-400 text-sm flex items-center gap-2">
            <span className="inline-block w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            {status}
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={!title || !content || !!status}
          className="self-start px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-colors"
        >
          Publish Article
        </button>
      </div>
    </main>
  );
}