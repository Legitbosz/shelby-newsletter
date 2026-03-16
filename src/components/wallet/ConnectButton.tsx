'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export function ConnectButton() {
  const { account, connected, connect, disconnect, wallets } = useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (connected && account) {
    return (
      <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
        {/* Connected button */}
        <button
          onClick={() => setShowMenu(v => !v)}
          style={{
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
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          {truncate(account.address?.toString() ?? '')}
          <span style={{ fontSize: '0.6rem', opacity: 0.4, marginLeft: '2px' }}>▾</span>
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: '#111118',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            minWidth: '180px',
            zIndex: 100,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {/* Address row */}
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--text-3)',
              letterSpacing: '0.05em',
            }}>
              {truncate(account.address?.toString() ?? '')}
            </div>

            {/* Disconnect button */}
            <button
              onClick={() => { disconnect(); setShowMenu(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span>⏻</span> Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        const petra = wallets?.find(w => w.name === 'Petra');
        if (petra) connect(petra.name);
        else if (wallets && wallets.length > 0) connect(wallets[0].name);
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
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,88,140,0.18)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(240,88,140,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      Connect Wallet
    </button>
  );
}
