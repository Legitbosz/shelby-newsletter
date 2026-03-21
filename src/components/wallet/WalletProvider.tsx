'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
  address: string | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSubmitTransaction: (payload: unknown) => Promise<{ hash: string }>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connected: false,
  connect: async () => {},
  disconnect: () => {},
  signAndSubmitTransaction: async () => ({ hash: '' }),
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('walletAddress');
    if (saved) setAddress(saved);
  }, []);

  async function connect() {
    try {
      // Try Nightly first, then fall back to any AIP-62 wallet
      const nightly = (window as any).nightly?.aptos;
      const anyWallet = nightly || (window as any).aptos || (window as any).petra;
      
      if (!anyWallet) {
        alert('No Aptos wallet found. Please install Nightly wallet from chromewebstore.google.com');
        return;
      }
      
      const response = await anyWallet.connect();
      const addr = response.address || response.publicKey;
      setAddress(addr);
      localStorage.setItem('walletAddress', addr);
    } catch (e: unknown) {
      console.error('Wallet connect error:', e);
      alert('Failed to connect wallet: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  function disconnect() {
    try {
      const nightly = (window as any).nightly?.aptos;
      const anyWallet = nightly || (window as any).aptos || (window as any).petra;
      anyWallet?.disconnect();
    } catch {}
    setAddress(null);
    localStorage.removeItem('walletAddress');
  }

  async function signAndSubmitTransaction(payload: unknown) {
    try {
      const nightly = (window as any).nightly?.aptos;
      if (nightly) {
        const result = await nightly.signAndSubmitTransaction(payload);
        return { hash: result.hash || result };
      }
      throw new Error('Nightly wallet not found. Make sure Nightly is installed and unlocked.');
    } catch (e: unknown) {
      console.error('signAndSubmitTransaction error:', e);
      throw e;
    }
  }

  return (
    <WalletContext.Provider value={{ address, connected: !!address, connect, disconnect, signAndSubmitTransaction }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}