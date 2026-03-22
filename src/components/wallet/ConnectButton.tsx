'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState } from 'react';
import { useAnsName } from '@/hooks/useAnsName';

export function ConnectButton() {
  const { account, connected, connect, disconnect, wallets } = useWallet();
  const [showWallets, setShowWallets] = useState(false);

  const address = account?.address ? String(account.address) : '';
  const ansName = useAnsName(address);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const displayName = ansName || (address ? truncate(address) : '');

  if (connected && account) {
    return (
      <button onClick={disconnect} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 18px',
        border: '1px solid var(--border)',
        borderRadius: '2px',
        background: 'transparent',
        color: 'var(--text-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
        letterSpacing: '0.06em',
        cursor: 'pointer',
        transition: 'all 0.2s',
        maxWidth: '200px',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
        title={address}
      >
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </span>
        {ansName && <span style={{ fontSize: '0.65rem', color: 'var(--accent)', opacity: 0.7 }}>✓</span>}
      </button>
    );
  }

  if (showWallets && wallets && wallets.length > 0) {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '8px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '4px', overflow: 'hidden', minWidth: '180px', zIndex: 100,
        }}>
          {wallets.map(wallet => (
            <button key={wallet.name} onClick={() => { connect(wallet.name); setShowWallets(false); }}
              style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              {wallet.icon && <img src={wallet.icon} alt={wallet.name} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />}
              {wallet.name}
            </button>
          ))}
          <button onClick={() => setShowWallets(false)} style={{ width: '100%', padding: '10px 16px', textAlign: 'center', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        if (wallets && wallets.length === 1) {
          connect(wallets[0].name);
        } else {
          setShowWallets(true);
        }
      }}
      style={{
        padding: '8px 22px',
        border: '1px solid var(--accent-border)',
        borderRadius: '2px',
        background: 'var(--accent-dim)',
        color: 'var(--accent)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,88,140,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-dim)'; }}
    >
      Connect Wallet
    </button>
  );
}
