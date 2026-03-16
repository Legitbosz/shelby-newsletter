'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function WalletProvider({ children }: Props) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      onError={(error) => console.error('Wallet error:', error)}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}