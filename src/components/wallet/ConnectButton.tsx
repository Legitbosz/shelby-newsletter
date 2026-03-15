'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';

export function ConnectButton() {
  const { account, connected, connect, disconnect, wallets } = useWallet();
  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

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
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
      >
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
        {truncate(account.address)}
      </button>
    );
  }

  return (
    <button
      onClick={() => wallets && wallets.length > 0 ? connect(wallets[0].name) : undefined}
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
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,88,140,0.18)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(240,88,140,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      Connect Wallet
    </button>
  );
}
