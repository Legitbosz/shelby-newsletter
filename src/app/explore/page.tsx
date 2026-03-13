'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { CONTRACT_ADDRESS } from '@/lib/aptos/contracts';

interface OnChainIssue {
  blob_id: string;
  title: string;
  preview: string;
  access_tier: string;
  price: string;
  issue_number: string;
  published_at: string;
  tags: string[];
}

interface Publication {
  address: string;
  issues: OnChainIssue[];
  issue_count: string;
  total_earnings: string;
}

const KNOWN_AUTHORS = [
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x059302e333eb4300c4a9c656bcb848beb05cdcdfe2345c3c159a3aa16ccd591c',
];

function timeAgo(unixSeconds: number) {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export default function ExplorePage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchAddr, setSearchAddr] = useState('');

  const fetchPublication = async (aptos: Aptos, address: string): Promise<Publication | null> => {
    try {
      const resource = await aptos.getAccountResource({
        accountAddress: address,
        resourceType: `${CONTRACT_ADDRESS}::newsletter::Publication`,
      });
      const data = resource as any;
      return {
        address,
        issues: data.issues || [],
        issue_count: data.issue_count || '0',
        total_earnings: data.total_earnings || '0',
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const config = new AptosConfig({ network: Network.TESTNET });
        const aptos = new Aptos(config);
        const results = await Promise.all(KNOWN_AUTHORS.map(addr => fetchPublication(aptos, addr)));
        setPublications(results.filter(Boolean) as Publication[]);
      } catch (err) {
        setError('Failed to load publications from chain');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearchAddr = async () => {
    if (!searchAddr.trim()) return;
    setLoading(true);
    try {
      const config = new AptosConfig({ network: Network.TESTNET });
      const aptos = new Aptos(config);
      const pub = await fetchPublication(aptos, searchAddr.trim());
      if (pub) {
        setPublications(prev => {
          const exists = prev.find(p => p.address === pub.address);
          return exists ? prev : [pub, ...prev];
        });
      } else {
        setError('No publication found at that address');
      }
    } catch {
      setError('Invalid address or not found');
    } finally {
      setLoading(false);
    }
  };

  const allIssues = publications.flatMap(pub =>
    pub.issues.map(issue => ({ ...issue, authorAddress: pub.address }))
  ).sort((a, b) => parseInt(b.published_at) - parseInt(a.published_at));

  const filtered = allIssues.filter(issue =>
    !search ||
    issue.title.toLowerCase().includes(search.toLowerCase()) ||
    issue.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Explore</h1>
        <p className="text-white/30 text-sm font-mono">
          Articles stored on Shelby Protocol, recorded on Aptos
        </p>
      </div>

      {/* Search + Address lookup */}
      <div className="flex flex-col gap-3 mb-8">
        <input
          type="text"
          placeholder="Search by title or tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded px-4 py-2.5 text-sm text-white/70 font-mono placeholder:text-white/20 outline-none focus:border-pink-500/30 transition-colors"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Lookup publication by Aptos address..."
            value={searchAddr}
            onChange={e => setSearchAddr(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchAddr()}
            className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-2.5 text-sm text-white/70 font-mono placeholder:text-white/20 outline-none focus:border-pink-500/30 transition-colors"
          />
          <button onClick={handleSearchAddr}
            className="px-4 py-2.5 text-xs font-mono text-black bg-pink-500 hover:bg-pink-400 rounded transition-colors whitespace-nowrap">
            Lookup →
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && publications.length > 0 && (
        <div className="flex gap-6 mb-6 text-xs font-mono text-white/25 border-b border-white/5 pb-4">
          <span>{publications.length} publication{publications.length !== 1 ? 's' : ''}</span>
          <span>{allIssues.length} article{allIssues.length !== 1 ? 's' : ''}</span>
          <span className="text-pink-500/40">● live on Aptos testnet</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-white/5 rounded p-5 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-1/3 mb-3" />
              <div className="h-3 bg-white/5 rounded w-2/3 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <p className="text-xs text-red-400 font-mono mb-4">{error}</p>
      )}

      {/* No results */}
      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-20">
          <p className="text-white/20 font-mono text-sm">No articles found on chain yet.</p>
          <Link href="/publish" className="text-pink-400 text-xs font-mono mt-2 block hover:underline">
            Be the first to publish →
          </Link>
        </div>
      )}

      {/* Articles */}
      <div className="flex flex-col gap-3">
        {filtered.map((issue, i) => (
          <Link
            key={issue.blob_id + i}
            href={`/read/${encodeURIComponent(issue.blob_id)}?author=${issue.authorAddress}`}
            className="block border border-white/5 bg-white/[0.02] hover:border-pink-500/20 rounded p-5 transition-colors group"
          >
            <div className="flex items-start justify-between mb-2 gap-4">
              <h3 className="text-white font-semibold group-hover:text-pink-300 transition-colors">
                {issue.title || 'Untitled'}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                {issue.access_tier === 'free' ? (
                  <span className="text-xs font-mono text-green-400/60 bg-green-500/5 border border-green-500/10 px-2 py-0.5 rounded-sm">FREE</span>
                ) : issue.access_tier === 'paid' ? (
                  <span className="text-xs font-mono text-pink-400/60 bg-pink-500/5 border border-pink-500/10 px-2 py-0.5 rounded-sm">
                    {parseInt(issue.price) > 0 ? (parseInt(issue.price) / 1e8).toFixed(2) + ' APT' : 'PAID'}
                  </span>
                ) : (
                  <span className="text-xs font-mono text-purple-400/60 bg-purple-500/5 border border-purple-500/10 px-2 py-0.5 rounded-sm">
                    {issue.access_tier.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {issue.preview && (
              <p className="text-white/40 text-sm mb-3 line-clamp-2">{issue.preview}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {issue.tags?.map(t => (
                  <span key={t} className="text-xs font-mono text-pink-400/50 bg-pink-500/5 border border-pink-500/10 px-2 py-0.5 rounded-sm">
                    #{t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-white/20">
                <span>{shortAddr(issue.authorAddress)}</span>
                {issue.published_at && parseInt(issue.published_at) > 0 && (
                  <span>{timeAgo(parseInt(issue.published_at))}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
