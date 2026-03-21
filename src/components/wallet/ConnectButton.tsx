'use client';
import { useWallet } from './WalletProvider';

export function ConnectButton() {
  const { address, connected, connect, disconnect } = useWallet();

  if (connected && address) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-400 font-mono">{short}</span>
        <button onClick={disconnect}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm transition-colors">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={connect}
      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
      Connect Wallet
    </button>
  );
}