'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const wallets = [new PetraWallet()];

export function WalletProvider({ children }: Props) {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={false}
      onError={(error) => console.error('Wallet error:', error)}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
