'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { CONTRACT_ADDRESS } from '@/lib/aptos/contracts';

interface Publication {
  address: string;
  issue_count: string;
  total_earnings: string;
  issues: any[];
}

function shortAddr(addr: string) {
  return addr.slice(0, 8) + '...' + addr.slice(-6);
}

function timeAgo(unixSeconds: number) {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

export default function ExplorePage() {
  const { account } = useWallet();
  const [lookupAddr, setLookupAddr] = useState('');
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState('');
  const [txResult, setTxResult] = useState<any>(null);
  const [txLoading, setTxLoading] = useState(false);

  const lookupPublication = async (addr?: string) => {
    const target = addr || lookupAddr.trim();
    if (!target) return;
    setLoading(true);
    setError(null);
    setPublication(null);
    try {
      const config = new AptosConfig({ network: Network.TESTNET });
      const aptos = new Aptos(config);
      const resource = await aptos.getAccountResource({
        accountAddress: target,
        resourceType: `${CONTRACT_ADDRESS}::newsletter::Publication`,
      }) as any;
      setPublication({
        address: target,
        issue_count: resource?.issue_count || '0',
        total_earnings: resource?.total_earnings || '0',
        issues: resource?.issues || [],
      });
    } catch {
      setError('No publication found at this address');
    } finally {
      setLoading(false);
    }
  };

  const lookupTx = async () => {
    if (!txHash.trim()) return;
    setTxLoading(true);
    setTxResult(null);
    try {
      const config = new AptosConfig({ network: Network.TESTNET });
      const aptos = new Aptos(config);
      const tx = await aptos.getTransactionByHash({ transactionHash: txHash.trim() });
      setTxResult(tx);
    } catch {
      setTxResult({ error: 'Transaction not found' });
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text)', marginBottom: '8px' }}>
          Explore On-Chain
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-3)', letterSpacing: '0.05em' }}>
          Look up publications, profiles, and transactions on Aptos testnet
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* My Publication — if connected */}
        {account && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: '4px', padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>My Publication</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-2)' }}>{shortAddr(String(account.address))}</p>
              </div>
              <button onClick={() => lookupPublication(String(account.address))} className="btn-primary" style={{ fontSize: '0.75rem', padding: '10px 20px' }}>
                View My Stats →
              </button>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/publish" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'none', letterSpacing: '0.06em' }}>
                ✍️ Write Article
              </Link>
              <Link href="/profile" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'none', letterSpacing: '0.06em' }}>
                📊 Revenue Dashboard
              </Link>
              <a href={`https://explorer.aptoslabs.com/account/${account.address}?network=testnet`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'none', letterSpacing: '0.06em' }}>
                🔗 View on Aptos Explorer ↗
              </a>
            </div>
          </div>
        )}

        {/* Lookup Publication by Address */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '28px 32px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            🔍 Lookup Publication by Address
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Enter Aptos wallet address 0x..."
              value={lookupAddr}
              onChange={e => setLookupAddr(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookupPublication()}
              className="input"
              style={{ flex: 1, fontSize: '0.9rem' }}
            />
            <button onClick={() => lookupPublication()} disabled={loading} className="btn-primary" style={{ fontSize: '0.75rem', padding: '10px 20px', flexShrink: 0 }}>
              {loading ? '...' : 'Lookup →'}
            </button>
          </div>

          {error && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#ef4444', marginTop: '12px' }}>{error}</p>}

          {/* Publication result */}
          {publication && (
            <div style={{ marginTop: '24px', padding: '20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '3px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {[
                  { label: 'Address', value: shortAddr(publication.address) },
                  { label: 'Articles', value: publication.issue_count },
                  { label: 'Earnings', value: (parseInt(publication.total_earnings) / 1e8).toFixed(4) + ' APT' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {publication.issues.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Articles</p>
                  {publication.issues.slice(0, 5).map((issue: any, i: number) => (
                    <Link key={i} href={`/read/${encodeURIComponent(issue.blob_id)}?author=${publication.address}`}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', textDecoration: 'none', transition: 'border-color 0.15s' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-2)', fontWeight: 400 }}>{issue.title || 'Untitled'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-4)' }}>
                          {parseInt(issue.published_at) > 0 ? timeAgo(parseInt(issue.published_at)) : ''}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)' }}>Read →</span>
                      </div>
                    </Link>
                  ))}
                  {publication.issues.length > 5 && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', textAlign: 'center', marginTop: '4px' }}>
                      +{publication.issues.length - 5} more articles
                    </p>
                  )}
                </div>
              )}

              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <a href={`https://explorer.aptoslabs.com/account/${publication.address}?network=testnet`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none' }}>
                  View on Aptos Explorer ↗
                </a>
                <a href={`https://explorer.shelby.xyz/testnet/account/${publication.address}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none' }}>
                  View on Shelby Explorer ↗
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Lookup Transaction */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '28px 32px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            🔗 Lookup Transaction
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Enter transaction hash 0x..."
              value={txHash}
              onChange={e => setTxHash(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookupTx()}
              className="input"
              style={{ flex: 1, fontSize: '0.9rem' }}
            />
            <button onClick={lookupTx} disabled={txLoading} className="btn-primary" style={{ fontSize: '0.75rem', padding: '10px 20px', flexShrink: 0 }}>
              {txLoading ? '...' : 'Lookup →'}
            </button>
          </div>

          {txResult && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '3px' }}>
              {txResult.error ? (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#ef4444' }}>{txResult.error}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Status', value: (txResult as any).success ? '✅ Success' : '❌ Failed' },
                    { label: 'Hash', value: String((txResult as any).hash || '').slice(0, 20) + '...' },
                    { label: 'Gas Used', value: String((txResult as any).gas_used || '') },
                    { label: 'Sender', value: shortAddr(String((txResult as any).sender || '')) },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-4)', letterSpacing: '0.08em' }}>{row.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-2)' }}>{row.value}</span>
                    </div>
                  ))}
                  <a href={`https://explorer.aptoslabs.com/txn/${(txResult as any).hash}?network=testnet`} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none', marginTop: '8px' }}>
                    View full transaction ↗
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '28px 32px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>
            🌐 Network Resources
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Aptos Testnet Explorer', url: 'https://explorer.aptoslabs.com/?network=testnet', icon: '🔗' },
              { label: 'Shelby Explorer', url: 'https://explorer.shelby.xyz/testnet', icon: '📦' },
              { label: 'Aptos Faucet', url: 'https://aptos.dev/network/faucet', icon: '💧' },
              { label: 'Contract Source', url: 'https://github.com/Legitbosz/shelby-newsletter', icon: '📄' },
            ].map(link => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: '3px', textDecoration: 'none', transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              >
                <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-2)' }}>{link.label}</span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
