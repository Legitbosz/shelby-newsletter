'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useSubscription } from '@/hooks/useSubscription';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import type { Article } from '@/types/article';

interface PaywallGateProps {
  article: Article;
  onAccessGranted: () => void;
}

/**
 * Shown when a reader doesn't have access to a paid article.
 * Handles wallet connection, subscription check, and pay-per-read.
 */
export function PaywallGate({ article, onAccessGranted }: PaywallGateProps) {
  const { connected } = useWallet();
  const { isSubscribing, error, subscribe, payPerRead } = useSubscription(
    article.publicationAddress
  );

  const handlePayPerRead = async () => {
    await payPerRead(article.blobId, article.price || 1);
    onAccessGranted();
  };

  const handleSubscribe = async () => {
    await subscribe('monthly', 5);
    onAccessGranted();
  };

  return (
    <div className="border border-pink-500/20 bg-pink-500/5 rounded-lg p-8 flex flex-col items-center gap-6 text-center">
      {/* Lock icon */}
      <div className="w-14 h-14 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-2xl">
        🔒
      </div>

      <div>
        <h3 className="text-white font-bold text-lg mb-2">
          This article is for paid readers
        </h3>
        <p className="text-white/40 text-sm max-w-sm">
          Unlock this issue or subscribe for full access to all future issues.
          100% of revenue goes directly to the writer.
        </p>
      </div>

      {!connected ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-white/30 font-mono">
            Connect your wallet to continue
          </p>
          <ConnectButton />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          {/* Pay per read */}
          <button
            onClick={handlePayPerRead}
            disabled={isSubscribing}
            className="flex-1 py-3 rounded-sm bg-pink-500 text-black font-bold text-sm tracking-wide hover:bg-pink-400 disabled:opacity-40 transition-colors"
          >
            {isSubscribing ? 'Processing...' : `Read for ${article.price || 1} APT`}
          </button>

          {/* Subscribe */}
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="flex-1 py-3 rounded-sm border border-pink-500/40 text-pink-300 font-bold text-sm tracking-wide hover:bg-pink-500/10 disabled:opacity-40 transition-colors"
          >
            Subscribe — 5 APT/mo
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs font-mono">{error}</p>
      )}

      {/* Founding member */}
      <p className="text-xs text-white/20 font-mono">
        Want lifetime access?{' '}
        <span className="text-pink-400/60 cursor-pointer hover:text-pink-400 transition-colors">
          Mint a Founding Member NFT →
        </span>
      </p>
    </div>
  );
}
