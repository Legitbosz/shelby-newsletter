'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { CONTRACT_ADDRESS, FUNCTIONS } from '@/lib/aptos/contracts';
import Link from 'next/link';

type AccessTier = 'free' | 'paid';

export const dynamic = 'force-dynamic';

export default function PublishPage() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [accessTier, setAccessTier] = useState<AccessTier>('paid');
  const [price, setPrice] = useState('1');
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [blobId, setBlobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!connected) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '120px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontSize: '3rem' }}>✍️</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text)', fontWeight: 700 }}>Ready to write?</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-3)', fontWeight: 300 }}>Connect your wallet to start publishing on Shelby.</p>
        <ConnectButton />
      </div>
    );
  }

  async function handlePublish() {
    if (!title.trim() || !content.trim() || !account) return;
    setError(null);
    setTxHash(null);
    setBlobId(null);

    try {
      // Step 1: Upload to Shelby
      setStatus('Uploading to Shelby...');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }),
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const blob = await uploadRes.json();
      setBlobId(blob.blobId);

      // Step 2: Init publication if needed
      setStatus('Checking publication...');
      const config = new AptosConfig({ network: Network.TESTNET });
      const aptos = new Aptos(config);
      const pubExists = await aptos.getAccountResource({
        accountAddress: account.address,
        resourceType: `${CONTRACT_ADDRESS}::newsletter::Publication`,
      }).catch(() => null);

      if (!pubExists) {
        setStatus('Initializing publication...');
        await signAndSubmitTransaction({
          data: {
            function: FUNCTIONS.INIT_PUBLICATION as `${string}::${string}::${string}`,
            functionArguments: [],
          },
        });
        await new Promise(r => setTimeout(r, 2000));
      }

      // Step 3: Publish on-chain
      setStatus('Publishing on Aptos...');
      const preview = content.slice(0, 200).replace(/[#*`]/g, '');
      const result = await signAndSubmitTransaction({
        data: {
          function: FUNCTIONS.PUBLISH_ISSUE as `${string}::${string}::${string}`,
          functionArguments: [
            blob.blobId,
            title.trim(),
            preview,
            accessTier,
            accessTier === 'paid' ? Math.round(parseFloat(price) * 1e8) : 0,
            tags.split(',').map(t => t.trim()).filter(Boolean),
          ],
        },
      });
      setTxHash((result as any).hash);
      setStatus('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('');
    }
  }

  if (txHash) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '80px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontSize: '3rem' }}>🎉</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text)', fontWeight: 700 }}>Published!</h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-3)', fontWeight: 300 }}>Your article is live on Shelby Protocol.</p>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px 24px', width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {blobId && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Shelby Blob ID</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)', wordBreak: 'break-all' }}>{blobId}</div>
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Aptos Tx Hash</div>
            <a href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)', wordBreak: 'break-all', textDecoration: 'underline' }}>
              {txHash}
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/explore" className="btn-primary" style={{ fontSize: '0.8rem' }}>View in Explore →</Link>
          <button onClick={() => { setTitle(''); setContent(''); setTags(''); setTxHash(null); setBlobId(null); }} className="btn-secondary" style={{ fontSize: '0.8rem' }}>Write Another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text)', fontWeight: 700, marginBottom: '6px' }}>New Issue</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)', letterSpacing: '0.05em' }}>
          Your content will be stored on Shelby Protocol
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Title */}
        <input
          type="text"
          placeholder="Article title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{
            width: '100%', background: 'transparent', border: 'none',
            borderBottom: '1px solid var(--border)', paddingBottom: '12px',
            fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700,
            color: 'var(--text)', outline: 'none',
          }}
        />

        {/* Content */}
        <textarea
          placeholder="Write your article in markdown..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={20}
          style={{
            width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '3px', padding: '16px', fontSize: '0.95rem',
            fontFamily: 'var(--font-mono)', color: 'var(--text-2)', outline: 'none',
            resize: 'none', lineHeight: 1.7,
          }}
        />

        {/* Settings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tags</label>
            <input type="text" placeholder="defi, web3, aptos" value={tags} onChange={e => setTags(e.target.value)} className="input" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Access</label>
            <select value={accessTier} onChange={e => setAccessTier(e.target.value as AccessTier)} className="input" style={{ cursor: 'pointer' }}>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          {accessTier === 'paid' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Price (APT)</label>
              <input type="number" min="0.1" step="0.1" value={price} onChange={e => setPrice(e.target.value)} className="input" />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '3px', padding: '12px 16px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#ef4444' }}>{error}</p>
          </div>
        )}

        {/* Status */}
        {status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '14px', height: '14px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-3)' }}>{status}</span>
          </div>
        )}

        {/* Publish button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handlePublish}
            disabled={!title.trim() || !content.trim() || !!status}
            className="btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            {status ? 'Publishing...' : 'Publish to Shelby →'}
          </button>
        </div>
      </div>
    </div>
  );
}
