'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@/components/wallet/WalletProvider';
import { CONTRACT_ADDRESS } from '@/lib/aptos/contracts';
import { ConnectButton } from '@/components/wallet/ConnectButton';

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
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--accent);text-decoration:underline;" target="_blank">$1</a>')
    .replace(/^### (.+)$/gm, '<h3 style="font-family:var(--font-display);font-size:1.3rem;font-weight:700;color:var(--text);margin:24px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-family:var(--font-display);font-size:1.6rem;font-weight:700;color:var(--text);margin:32px 0 12px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-family:var(--font-display);font-size:2rem;font-weight:700;color:var(--text);margin:40px 0 16px;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text);font-weight:500;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:var(--surface);padding:2px 7px;border-radius:3px;color:var(--accent);font-family:var(--font-mono);font-size:0.85em;">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:2px solid var(--accent);padding-left:16px;color:var(--text-3);font-style:italic;font-family:var(--font-display);margin:16px 0;">$1</blockquote>')
    .replace(/\n/g, '<br />');
}

function timeAgo(unixSeconds: number) {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

const MONTHLY_PRICE = 5;
const ANNUAL_PRICE = 50;

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
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchContent = async (id: string) => {
    try {
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
        } else if (account?.address) {
          // Check if reader has active subscription
          try {
            const [hasSub] = await aptos.view({
              payload: {
                function: `${CONTRACT_ADDRESS}::subscription::check_subscription` as `${string}::${string}::${string}`,
                functionArguments: [account.address, authorAddress],
              },
            });
            if (hasSub) {
              setHasAccess(true);
              await fetchContent(blobId);
            }
          } catch { /* no subscription */ }
        }
      } catch (err) {
        setError('Failed to load article from chain');
      } finally {
        setLoading(false);
      }
    };
    if (authorAddress) load();
  }, [blobId, authorAddress, account]);

  const handlePayPerRead = async () => {
    if (!account || !issue) return;
    setPaying(true);
    setPayingPlan('single');
    setError(null);
    try {
      const tx = {
        data: {
          function: `${CONTRACT_ADDRESS}::subscription::pay_per_read` as `${string}::${string}::${string}`,
          functionArguments: [authorAddress, issue.blob_id, parseInt(issue.price)],
        },
      };
      await signAndSubmitTransaction(tx);
      setHasAccess(true);
      setSuccessMsg('Access granted! Enjoy the article.');
      await fetchContent(blobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
      setPayingPlan(null);
    }
  };

  const handleSubscribe = async (tier: 'monthly' | 'annual') => {
    if (!account) return;
    setPaying(true);
    setPayingPlan(tier);
    setError(null);
    try {
      const tx = {
        data: {
          function: `${CONTRACT_ADDRESS}::subscription::subscribe` as `${string}::${string}::${string}`,
          functionArguments: [authorAddress, tier],
        },
      };
      await signAndSubmitTransaction(tx);
      setHasAccess(true);
      setSuccessMsg(tier === 'monthly' ? 'Monthly subscription active!' : 'Annual subscription active!');
      await fetchContent(blobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setPaying(false);
      setPayingPlan(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: i === 1 ? '48px' : '20px', width: i === 2 ? '40%' : '100%' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 32px' }}>

      {/* Back */}
      <Link href="/explore" style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)',
        textDecoration: 'none', letterSpacing: '0.08em', display: 'inline-flex',
        alignItems: 'center', gap: '6px', marginBottom: '40px',
        transition: 'color 0.2s',
      }}>
        ← Back to Explore
      </Link>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '3px', padding: '12px 16px', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '3px', padding: '12px 16px', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#4ade80' }}>✓ {successMsg}</p>
        </div>
      )}

      {/* Article header */}
      {issue && (
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span className={issue.access_tier === 'free' ? 'tag' : 'tag tag-accent'} style={{ fontSize: '0.7rem' }}>
              {issue.access_tier === 'free' ? 'FREE' : issue.access_tier === 'paid' ? `${parseInt(issue.price) > 0 ? (parseInt(issue.price) / 1e8).toFixed(2) + ' APT' : 'PAID'}` : issue.access_tier.toUpperCase()}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-4)' }}>Issue #{issue.issue_number}</span>
            {parseInt(issue.published_at) > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-4)' }}>{timeAgo(parseInt(issue.published_at))}</span>
            )}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginBottom: '16px' }}>
            {issue.title || 'Untitled'}
          </h1>

          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '16px' }}>
            by {authorAddress.slice(0, 8)}...{authorAddress.slice(-6)}
          </p>

          {issue.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {issue.tags.map(t => (
                <span key={t} className="tag" style={{ fontSize: '0.68rem' }}>#{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content or Paywall */}
      {hasAccess ? (
        <div>
          <div className="prose-article" dangerouslySetInnerHTML={{ __html: content ? renderMarkdown(content) : '<p style="color:var(--text-3);font-family:var(--font-mono);font-size:0.85rem;">Loading from Shelby...</p>' }} />
          <div style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-4)' }}>Stored on Shelby Protocol</span>
            <span style={{ color: 'var(--text-4)', fontSize: '0.7rem' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)', opacity: 0.5, wordBreak: 'break-all' }}>{blobId}</span>
          </div>
        </div>
      ) : (
        <div>
          {/* Preview fade */}
          {issue?.preview && (
            <div style={{ position: 'relative', marginBottom: '48px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: 'var(--text-2)', lineHeight: 1.8, fontWeight: 300 }}>
                {issue.preview}
              </p>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
                background: 'linear-gradient(transparent, var(--bg))',
                pointerEvents: 'none',
              }} />
            </div>
          )}

          {/* Paywall */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔒</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text)', marginBottom: '8px' }}>
                This article is behind a paywall
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-3)', fontWeight: 300 }}>
                Choose how you want to access this content
              </p>
            </div>

            {!account ? (
              <div style={{ padding: '40px 32px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-3)', marginBottom: '24px', fontWeight: 300 }}>
                  Connect your wallet to unlock this article
                </p>
                <ConnectButton />
              </div>
            ) : (
              <div style={{ padding: '32px' }}>

                {/* Plans grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>

                  {/* Pay per read */}
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Single Article</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                      {issue ? (parseInt(issue.price) / 1e8).toFixed(2) : '?'}
                      <span style={{ fontSize: '1rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontWeight: 400 }}> APT</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.6, fontWeight: 300, flex: 1 }}>
                      One-time access to this article only
                    </p>
                    <button
                      onClick={handlePayPerRead}
                      disabled={paying}
                      className="btn-secondary"
                      style={{ width: '100%', textAlign: 'center', justifyContent: 'center', fontSize: '0.75rem' }}
                    >
                      {paying && payingPlan === 'single' ? 'Processing...' : 'Buy Access'}
                    </button>
                  </div>

                  {/* Monthly */}
                  <div style={{
                    background: 'var(--surface)',
                    border: '2px solid var(--accent-border)',
                    borderRadius: '4px',
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', top: '-1px', right: '16px',
                      background: 'var(--accent)', color: 'white',
                      fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
                      textTransform: 'uppercase', padding: '3px 10px', borderRadius: '0 0 4px 4px',
                    }}>Popular</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Monthly</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                      {MONTHLY_PRICE}
                      <span style={{ fontSize: '1rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontWeight: 400 }}> APT/mo</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.6, fontWeight: 300, flex: 1 }}>
                      Unlimited access to all articles for 30 days
                    </p>
                    <button
                      onClick={() => handleSubscribe('monthly')}
                      disabled={paying}
                      className="btn-primary"
                      style={{ width: '100%', textAlign: 'center', justifyContent: 'center', fontSize: '0.75rem' }}
                    >
                      {paying && payingPlan === 'monthly' ? 'Processing...' : 'Subscribe Monthly'}
                    </button>
                  </div>

                  {/* Annual */}
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Annual</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                      {ANNUAL_PRICE}
                      <span style={{ fontSize: '1rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontWeight: 400 }}> APT/yr</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.6, fontWeight: 300, flex: 1 }}>
                      Full year access — save 2 months vs monthly
                    </p>
                    <button
                      onClick={() => handleSubscribe('annual')}
                      disabled={paying}
                      className="btn-secondary"
                      style={{ width: '100%', textAlign: 'center', justifyContent: 'center', fontSize: '0.75rem' }}
                    >
                      {paying && payingPlan === 'annual' ? 'Processing...' : 'Subscribe Annual'}
                    </button>
                  </div>
                </div>

                {/* Footer note */}
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', textAlign: 'center', letterSpacing: '0.05em' }}>
                  Payments go directly to the writer · No platform fee · Powered by Aptos
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
