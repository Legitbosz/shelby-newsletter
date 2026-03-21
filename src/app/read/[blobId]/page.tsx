'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
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
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:6px;margin:24px 0;display:block;" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--accent);text-decoration:underline;text-underline-offset:3px;" target="_blank" rel="noopener">$1</a>')
    .replace(/^### (.+)$/gm, '<h3 style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:var(--text);margin:32px 0 12px;line-height:1.3;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-family:var(--font-display);font-size:1.8rem;font-weight:700;color:var(--text);margin:40px 0 16px;line-height:1.2;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:700;color:var(--text);margin:48px 0 20px;line-height:1.15;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text);font-weight:600;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:var(--text-2);">$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:var(--surface);padding:3px 8px;border-radius:3px;color:var(--accent);font-family:var(--font-mono);font-size:0.85em;border:1px solid var(--border);">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--accent);padding:12px 20px;color:var(--text-2);font-style:italic;font-family:var(--font-display);font-size:1.15em;margin:24px 0;background:var(--surface);border-radius:0 4px 4px 0;">$1</blockquote>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:40px 0;" />')
    .replace(/\n\n/g, '</p><p style="font-family:var(--font-body);font-size:1.1rem;color:var(--text-2);line-height:1.85;font-weight:300;margin:0 0 20px;">')
    .replace(/\n/g, '<br />');
}

function timeAgo(unixSeconds: number) {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return new Date(unixSeconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
  const [estimatedReadTime, setEstimatedReadTime] = useState(0);
  const [attachments, setAttachments] = useState<{name: string; type: string; url: string; size: number}[]>([]);
  const [authorProfile, setAuthorProfile] = useState<{displayName?: string; avatar?: string; bio?: string; twitter?: string; website?: string} | null>(null);

  // Load author profile from localStorage
  useEffect(() => {
    if (!authorAddress) return;
    try {
      const stored = localStorage.getItem(`profile-${authorAddress}`);
      if (stored) setAuthorProfile(JSON.parse(stored));
    } catch {}
  }, [authorAddress]);

  const fetchContent = async (id: string) => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fetch: true, blobId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content || 'Content blob ID: ' + id;
        setContent(text);
        if (data.attachments?.length) setAttachments(data.attachments);
        const words = text.split(/\s+/).length;
        setEstimatedReadTime(Math.max(1, Math.round(words / 200)));
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
        const isAuthor = String(account?.address) === authorAddress;

        if (isFree || isAuthor) {
          setHasAccess(true);
          await fetchContent(blobId);
        } else if (account?.address) {
          try {
            const [hasSub] = await aptos.view({
              payload: {
                function: `${CONTRACT_ADDRESS}::subscription::check_subscription` as `${string}::${string}::${string}`,
                functionArguments: [String(account.address), authorAddress],
              },
            });
            if (hasSub) {
              setHasAccess(true);
              await fetchContent(blobId);
            }
          } catch { /* no subscription */ }
        }
      } catch {
        setError('Failed to load article from chain');
      } finally {
        setLoading(false);
      }
    };
    if (authorAddress) load();
  }, [blobId, authorAddress, account]);

  const handlePayPerRead = async () => {
    if (!account || !issue) return;
    setPaying(true); setPayingPlan('single'); setError(null);
    try {
      await signAndSubmitTransaction({
        data: {
          function: `${CONTRACT_ADDRESS}::subscription::pay_per_read` as `${string}::${string}::${string}`,
          functionArguments: [authorAddress, issue.blob_id, parseInt(issue.price)],
        },
      });
      setHasAccess(true);
      setSuccessMsg('Access granted! Enjoy the article.');
      await fetchContent(blobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally { setPaying(false); setPayingPlan(null); }
  };

  const handleSubscribe = async (tier: 'monthly' | 'annual') => {
    if (!account) return;
    setPaying(true); setPayingPlan(tier); setError(null);
    try {
      await signAndSubmitTransaction({
        data: {
          function: `${CONTRACT_ADDRESS}::subscription::subscribe` as `${string}::${string}::${string}`,
          functionArguments: [authorAddress, tier],
        },
      });
      setHasAccess(true);
      setSuccessMsg(tier === 'monthly' ? 'Monthly subscription active!' : 'Annual subscription active!');
      await fetchContent(blobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally { setPaying(false); setPayingPlan(null); }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="skeleton" style={{ height: '14px', width: '120px' }} />
        <div className="skeleton" style={{ height: '52px', width: '80%', marginTop: '32px' }} />
        <div className="skeleton" style={{ height: '14px', width: '200px' }} />
        <div className="skeleton" style={{ height: '14px', width: '100%', marginTop: '24px' }} />
        <div className="skeleton" style={{ height: '14px', width: '95%' }} />
        <div className="skeleton" style={{ height: '14px', width: '88%' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 32px 96px' }}>

      {/* Back */}
      <Link href="/explore" style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)',
        textDecoration: 'none', letterSpacing: '0.08em', display: 'inline-flex',
        alignItems: 'center', gap: '6px', marginBottom: '48px',
      }}>
        &larr; Back to Explore
      </Link>

      {/* Alerts */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '3px', padding: '12px 16px', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#ef4444' }}>{error}</p>
        </div>
      )}
      {successMsg && (
        <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '3px', padding: '12px 16px', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#4ade80' }}>&#10003; {successMsg}</p>
        </div>
      )}

      {/* Article Header */}
      {issue && (
        <header style={{ marginBottom: '56px' }}>
          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span className={issue.access_tier === 'free' ? 'tag' : 'tag tag-accent'}>
              {issue.access_tier === 'free' ? 'Free' : parseInt(issue.price) > 0 ? (parseInt(issue.price) / 1e8).toFixed(2) + ' APT' : 'Paid'}
            </span>
            <span style={{ color: 'var(--border-hover)', fontSize: '0.8rem' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-4)' }}>
              Issue #{issue.issue_number}
            </span>
            {parseInt(issue.published_at) > 0 && (
              <>
                <span style={{ color: 'var(--border-hover)', fontSize: '0.8rem' }}>·</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-4)' }}>
                  {timeAgo(parseInt(issue.published_at))}
                </span>
              </>
            )}
            {estimatedReadTime > 0 && (
              <>
                <span style={{ color: 'var(--border-hover)', fontSize: '0.8rem' }}>·</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-4)' }}>
                  {estimatedReadTime} min read
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 900,
            color: 'var(--text)',
            lineHeight: 1.15,
            marginBottom: '24px',
            letterSpacing: '-0.02em',
          }}>
            {issue.title || 'Untitled'}
          </h1>

          {/* Author + tags */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--accent)',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {authorProfile?.avatar ? (
                  <img src={authorProfile.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : authorAddress.slice(2, 3).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-2)', fontWeight: 500 }}>
                  {authorProfile?.displayName || authorAddress.slice(0, 8) + '...' + authorAddress.slice(-6)}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-4)' }}>Author</span>
                  {authorProfile?.twitter && (
                    <a href={'https://twitter.com/' + authorProfile.twitter.replace('@','')} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)', textDecoration: 'none' }}>
                      𝕏 @{authorProfile.twitter.replace('@','')}
                    </a>
                  )}
                  {authorProfile?.website && (
                    <a href={authorProfile.website} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)', textDecoration: 'none' }}>
                      🌐 Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {issue.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {issue.tags.map(t => (
                  <span key={t} className="tag" style={{ fontSize: '0.68rem' }}>#{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border)', marginTop: '32px' }} />
        </header>
      )}

      {/* CONTENT or PAYWALL */}
      {hasAccess ? (
        <article>
          {content ? (
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1.1rem',
                color: 'var(--text-2)',
                lineHeight: 1.85,
                fontWeight: 300,
              }}
              dangerouslySetInnerHTML={{
                __html: '<p style="font-family:var(--font-body);font-size:1.1rem;color:var(--text-2);line-height:1.85;font-weight:300;margin:0 0 20px;">' + renderMarkdown(content) + '</p>'
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '32px 0' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-3)' }}>Loading from Shelby...</span>
            </div>
          )}

          {/* Attachments - videos and files */}
          {attachments.length > 0 && (
            <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
              {/* Videos */}
              {attachments.filter(a => a.type.startsWith('video/')).length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Videos
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {attachments.filter(a => a.type.startsWith('video/')).map((v, i) => (
                      <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <video controls style={{ width: '100%', maxHeight: '480px', display: 'block', background: '#000' }} preload="metadata">
                          <source src={v.url} type={v.type} />
                          Your browser does not support video playback.
                        </video>
                        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)' }}>🎬 {v.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Images not in article body */}
              {attachments.filter(a => a.type.startsWith('image/')).length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Images
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {attachments.filter(a => a.type.startsWith('image/')).map((img, i) => (
                      <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                        <img src={img.url} alt={img.name} style={{ height: '120px', width: 'auto', borderRadius: '4px', border: '1px solid var(--border)', objectFit: 'cover' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {/* Other files */}
              {attachments.filter(a => !a.type.startsWith('video/') && !a.type.startsWith('image/')).length > 0 && (
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Files
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {attachments.filter(a => !a.type.startsWith('video/') && !a.type.startsWith('image/')).map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: '3px', textDecoration: 'none', transition: 'border-color 0.15s',
                      }}>
                        <span>📄</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-2)' }}>{f.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Article footer */}
          <div style={{ marginTop: '80px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-4)' }}>Stored on</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)', opacity: 0.6 }}>Shelby Protocol</span>
                <span style={{ color: 'var(--text-4)', fontSize: '0.7rem' }}>·</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-4)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{blobId}</span>
              </div>
              <Link href="/explore" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.06em' }}>
                More articles &rarr;
              </Link>
            </div>
          </div>
        </article>
      ) : (
        <div>
          {/* Preview with fade */}
          {issue?.preview && (
            <div style={{ position: 'relative', marginBottom: '48px', overflow: 'hidden' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.15rem', color: 'var(--text-2)', lineHeight: 1.85, fontWeight: 300 }}>
                {issue.preview}
              </p>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px',
                background: 'linear-gradient(transparent, var(--bg))',
                pointerEvents: 'none',
              }} />
            </div>
          )}

          {/* Paywall box */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>

            {/* Header */}
            <div style={{ padding: '40px 32px 28px', borderBottom: '1px solid var(--border)', textAlign: 'center', background: 'var(--surface)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>&#128274;</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text)', marginBottom: '10px', fontWeight: 700 }}>
                Premium Content
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-3)', fontWeight: 300, maxWidth: '400px', margin: '0 auto' }}>
                Choose a plan to unlock this article and support the writer directly
              </p>
            </div>

            {!account ? (
              <div style={{ padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-3)', fontWeight: 300 }}>
                  Connect your Aptos wallet to access this article
                </p>
                <ConnectButton />
              </div>
            ) : (
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>

                  {/* Single article */}
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Single Article</div>
                    <div>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--text)' }}>
                        {issue ? (parseInt(issue.price) / 1e8).toFixed(2) : '?'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-3)', marginLeft: '6px' }}>APT</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-3)', lineHeight: 1.65, fontWeight: 300, flex: 1 }}>
                      One-time access to this article only
                    </p>
                    <button onClick={handlePayPerRead} disabled={paying} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}>
                      {paying && payingPlan === 'single' ? 'Processing...' : 'Buy Access'}
                    </button>
                  </div>

                  {/* Monthly */}
                  <div style={{ background: 'var(--bg)', border: '2px solid var(--accent-border)', borderRadius: '4px', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-1px', right: '20px', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 12px', borderRadius: '0 0 6px 6px' }}>
                      Popular
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Monthly</div>
                    <div>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--text)' }}>{MONTHLY_PRICE}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-3)', marginLeft: '6px' }}>APT / mo</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-3)', lineHeight: 1.65, fontWeight: 300, flex: 1 }}>
                      Unlimited access to all articles for 30 days
                    </p>
                    <button onClick={() => handleSubscribe('monthly')} disabled={paying} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}>
                      {paying && payingPlan === 'monthly' ? 'Processing...' : 'Subscribe Monthly'}
                    </button>
                  </div>

                  {/* Annual */}
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Annual</div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', padding: '2px 8px', borderRadius: '2px' }}>Save 17%</span>
                    </div>
                    <div>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--text)' }}>{ANNUAL_PRICE}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-3)', marginLeft: '6px' }}>APT / yr</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-3)', lineHeight: 1.65, fontWeight: 300, flex: 1 }}>
                      Full year access — 2 months free vs monthly
                    </p>
                    <button onClick={() => handleSubscribe('annual')} disabled={paying} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}>
                      {paying && payingPlan === 'annual' ? 'Processing...' : 'Subscribe Annual'}
                    </button>
                  </div>
                </div>

                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-4)', textAlign: 'center', letterSpacing: '0.06em' }}>
                  Payments go directly to the writer &middot; No platform fee &middot; Powered by Aptos
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
