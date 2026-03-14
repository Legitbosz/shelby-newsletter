'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';

export function ConnectButton() {
  const { account, connected, connect, disconnect, wallets } = useWallet();

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (connected && account) {
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 px-4 py-2 rounded-sm border border-pink-500/40 bg-pink-500/10 text-pink-300 text-sm font-mono hover:bg-pink-500/20 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        {truncate(account.address)}
      </button>
    );
  }

  return (
    <button
      onClick={() => wallets && wallets.length > 0 ? connect(wallets[0].name) : undefined}
      className="px-4 py-2 rounded-sm border border-pink-500 bg-pink-500/10 text-pink-300 text-sm font-mono hover:bg-pink-500/20 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
