'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useAnsName } from '@/hooks/useAnsName';
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
  authorAddress: string;
}

const KNOWN_AUTHORS = [
  '0x059302e333eb4300c4a9c656bcb848beb05cdcdfe2345c3c159a3aa16ccd591c',
];

function timeAgo(unixSeconds: number) {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return new Date(unixSeconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getAuthorName(addr: string): string {
  try {
    const stored = localStorage.getItem(`profile-${addr}`);
    if (stored) {
      const profile = JSON.parse(stored);
      if (profile?.displayName) return profile.displayName;
    }
  } catch {}
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export default function ReaderFeedPage() {
  const { account } = useWallet();
  const [articles, setArticles] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const config = new AptosConfig({ network: Network.TESTNET });
        const aptos = new Aptos(config);

        const authorSet = new Set(KNOWN_AUTHORS);
        if (account?.address) authorSet.add(String(account.address));

        const allIssues: Issue[] = [];
        for (const addr of authorSet) {
          try {
            const resource = await aptos.getAccountResource({
              accountAddress: addr,
              resourceType: `${CONTRACT_ADDRESS}::newsletter::Publication`,
            }) as any;
            const issues = (resource?.issues || []).map((i: any) => ({ ...i, authorAddress: addr }));
            allIssues.push(...issues);
          } catch { /* no publication at this address */ }
        }

        allIssues.sort((a, b) => parseInt(b.published_at) - parseInt(a.published_at));
        setArticles(allIssues);
      } catch {
        setError('Failed to load articles');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [account]);

  const filtered = articles.filter(a => {
    const matchSearch = !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.preview?.toLowerCase().includes(search.toLowerCase()) ||
      a.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'all' || a.access_tier === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text)', marginBottom: '8px' }}>
          Latest Articles
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-3)', letterSpacing: '0.05em' }}>
          Decentralized content stored on Shelby Protocol
        </p>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          style={{ flex: 1, minWidth: '200px', fontSize: '0.95rem' }}
        />
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '4px' }}>
          {(['all', 'free', 'paid'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 16px', borderRadius: '2px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.08em',
              textTransform: 'uppercase', transition: 'all 0.15s',
              background: filter === f ? 'var(--accent)' : 'transparent',
              color: filter === f ? '#fff' : 'var(--text-3)',
            }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {!loading && articles.length > 0 && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)' }}>{articles.length} articles</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)' }}>{articles.filter(a => a.access_tier === 'free').length} free</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)', opacity: 0.6 }}>● live on Aptos</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '28px' }}>
              <div className="skeleton" style={{ height: '22px', width: '55%', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '14px', width: '80%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '14px', width: '60%' }} />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#ef4444' }}>{error}</p>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '3rem' }}>📭</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text)', fontWeight: 700 }}>
            {search ? 'No articles match your search' : 'No articles yet'}
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-3)', fontWeight: 300 }}>
            {search ? 'Try different keywords' : 'Be the first to publish on Shelby'}
          </p>
          {!search && (
            <Link href="/publish" className="btn-primary" style={{ fontSize: '0.8rem', marginTop: '8px' }}>
              Start Writing →
            </Link>
          )}
        </div>
      )}

      {/* Article Feed */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((article, i) => (
            <Link
              key={article.blob_id + i}
              href={`/read/${encodeURIComponent(article.blob_id)}?author=${article.authorAddress}`}
              style={{ textDecoration: 'none' }}
            >
              <article style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '4px', padding: '28px 32px', cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                {/* Title + badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, flex: 1 }}>
                    {article.title || 'Untitled'}
                  </h2>
                  {article.access_tier === 'free' ? (
                    <span className="tag" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.2)', flexShrink: 0 }}>Free</span>
                  ) : (
                    <span className="tag tag-accent" style={{ flexShrink: 0 }}>
                      {parseInt(article.price) > 0 ? (parseInt(article.price) / 1e8).toFixed(2) + ' APT' : 'Paid'}
                    </span>
                  )}
                </div>

                {/* Preview */}
                {article.preview && (
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-3)',
                    lineHeight: 1.7, marginBottom: '16px', fontWeight: 300,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {article.preview}
                  </p>
                )}

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {article.tags?.filter(Boolean).map(t => (
                      <span key={t} className="tag" style={{ fontSize: '0.65rem' }}>#{t}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)' }}>
                      {getAuthorName(article.authorAddress)}
                    </span>
                    {parseInt(article.published_at) > 0 && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)' }}>
                        {timeAgo(parseInt(article.published_at))}
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)' }}>
                      Read →
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
