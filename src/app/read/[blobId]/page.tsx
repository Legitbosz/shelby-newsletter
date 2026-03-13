'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { CONTRACT_ADDRESS } from '@/lib/aptos/contracts';

interface Issue {
  blob_id: string;
  title: string;
  preview: string;
  access_tier: string;
  price: string;
  issue_number: string;
  published_at: string;
  tags: string[];
}

function renderMarkdown(md: string) {
  return md
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:6px;margin:16px 0;" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#f472b6;text-decoration:underline;" target="_blank">$1</a>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1.1rem;font-weight:bold;color:white;margin:24px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.3rem;font-weight:bold;color:white;margin:32px 0 12px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.6rem;font-weight:bold;color:white;margin:40px 0 16px;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:3px;color:#f9a8d4;font-size:0.85em;">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:2px solid #ec4899;padding-left:16px;color:rgba(255,255,255,0.5);font-style:italic;margin:12px 0;">$1</blockquote>')
    .replace(/\n/g, '<br />');
}

function timeAgo(unixSeconds: number) {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

export default function ReadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { account, signAndSubmitTransaction } = useWallet();

  const blobId = decodeURIComponent(params.blobId as string);
  const authorAddress = searchParams.get('author') || '';

  const [issue, setIssue] = useState<Issue | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async (id: string) => {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_SHELBY_RPC_URL || 'https://api.testnet.shelby.xyz/shelby';
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fetch: true, blobId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || 'Content blob ID: ' + id);
      } else {
        setContent('This article is stored on Shelby Protocol.\n\nBlob ID: ' + id);
      }
    } catch {
      setContent('This article is stored on Shelby Protocol.\n\nBlob ID: ' + id);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const config = new AptosConfig({ network: Network.TESTNET });
        const aptos = new Aptos(config);
        const resource = await aptos.getAccountResource({
          accountAddress: authorAddress,
          resourceType: `${CONTRACT_ADDRESS}::newsletter::Publication`,
        }) as any;

        const found = resource?.issues?.find((i: Issue) => i.blob_id === blobId);
        if (found) setIssue(found);

        const isFree = found?.access_tier === 'free';
        const isAuthor = account?.address === authorAddress;
        if (isFree || isAuthor) {
          setHasAccess(true);
          await fetchContent(blobId);
        }
      } catch (err) {
        setError('Failed to load article from chain');
      } finally {
        setLoading(false);
      }
    };
    if (authorAddress) load();
  }, [blobId, authorAddress, account]);

  const handlePayAndRead = async () => {
    if (!account || !issue) return;
    setPaying(true);
    try {
      const tx = {
        data: {
          function: `${CONTRACT_ADDRESS}::subscription::pay_per_read` as `${string}::${string}::${string}`,
          functionArguments: [authorAddress, issue.blob_id, parseInt(issue.price)],
        },
      };
      await signAndSubmitTransaction(tx);
      setHasAccess(true);
      await fetchContent(blobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 flex flex-col gap-4 animate-pulse">
        <div className="h-8 bg-white/5 rounded w-2/3" />
        <div className="h-4 bg-white/5 rounded w-1/3" />
        <div className="h-4 bg-white/5 rounded w-full mt-6" />
        <div className="h-4 bg-white/5 rounded w-5/6" />
        <div className="h-4 bg-white/5 rounded w-4/6" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link href="/explore" className="text-xs font-mono text-white/25 hover:text-white/50 transition-colors mb-8 block">
        back to explore
      </Link>

      {error && <p className="text-red-400 text-xs font-mono mb-4">{error}</p>}

      {issue && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {issue.access_tier === 'free' ? (
              <span className="text-xs font-mono text-green-400/60 bg-green-500/5 border border-green-500/10 px-2 py-0.5 rounded-sm">FREE</span>
            ) : (
              <span className="text-xs font-mono text-pink-400/60 bg-pink-500/5 border border-pink-500/10 px-2 py-0.5 rounded-sm">
                {parseInt(issue.price) > 0 ? (parseInt(issue.price) / 1e8).toFixed(2) + ' APT' : 'PAID'}
              </span>
            )}
            <span className="text-xs font-mono text-white/20">Issue #{issue.issue_number}</span>
            {parseInt(issue.published_at) > 0 && (
              <span className="text-xs font-mono text-white/20">{timeAgo(parseInt(issue.published_at))}</span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">{issue.title || 'Untitled'}</h1>
          <p className="text-xs font-mono text-white/25 mb-4">by {authorAddress.slice(0, 8)}...{authorAddress.slice(-6)}</p>

          <div className="flex gap-2 flex-wrap">
            {issue.tags?.map(t => (
              <span key={t} className="text-xs font-mono text-pink-400/50 bg-pink-500/5 border border-pink-500/10 px-2 py-0.5 rounded-sm">#{t}</span>
            ))}
          </div>
        </div>
      )}

      {hasAccess ? (
        <div className="text-white/75 text-base leading-relaxed">
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          ) : (
            <p className="text-white/30 font-mono text-sm animate-pulse">Loading from Shelby...</p>
          )}
          <div className="mt-12 pt-6 border-t border-white/5 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-white/15">Stored on Shelby Protocol</span>
            <span className="text-xs font-mono text-white/10">·</span>
            <span className="text-xs font-mono text-pink-400/30 truncate max-w-xs">{blobId}</span>
          </div>
        </div>
      ) : (
        <div className="border border-white/10 rounded p-8 text-center flex flex-col items-center gap-5">
          <div className="text-3xl">🔒</div>
          <div>
            <h3 className="text-white font-semibold mb-2">Premium Content</h3>
            {issue?.preview && <p className="text-white/40 text-sm max-w-sm">{issue.preview}</p>}
          </div>
          {account ? (
            <button onClick={handlePayAndRead} disabled={paying}
              className="px-8 py-3 bg-pink-500 text-black font-bold text-sm tracking-widest uppercase rounded-sm hover:bg-pink-400 disabled:opacity-30 transition-colors">
              {paying ? 'Processing...' : `Unlock for ${issue ? (parseInt(issue.price) / 1e8).toFixed(2) : '?'} APT`}
            </button>
          ) : (
            <p className="text-white/30 text-sm font-mono">Connect wallet to unlock</p>
          )}
        </div>
      )}
    </div>
  );
}
