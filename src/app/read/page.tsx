'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ArticleView } from '@/components/reader/ArticleView';
import { PaywallGate } from '@/components/reader/PaywallGate';
import { useShelbyFetch } from '@/hooks/useShelbyFetch';
import { useSubscription } from '@/hooks/useSubscription';
import type { Article } from '@/types/article';

interface Props {
  params: { blobId: string };
}

/**
 * Article reader page.
 * Fetches article metadata from Aptos, content from Shelby.
 * Shows PaywallGate if reader doesn't have access.
 *
 * TODO: Fetch real article metadata from Aptos via blobId.
 */
export default function ReadPage({ params }: Props) {
  const { blobId } = params;
  const { connected } = useWallet();
  const { isFetching, content, error, fetch } = useShelbyFetch();

  // Placeholder article — replace with real Aptos fetch
  const [article] = useState<Article>({
    blobId,
    txHash: '0x...',
    title: 'Loading...',
    preview: '',
    tags: [],
    issueNumber: 1,
    publicationAddress: '0x...',
    authorAddress: '0x...',
    publishedAt: Date.now() / 1000,
    accessTier: 'paid',
    price: 1,
  });

  const { hasAccess, isChecking } = useSubscription(article.publicationAddress);

  const [accessGranted, setAccessGranted] = useState(false);

  // Auto-fetch if free content or access confirmed
  useEffect(() => {
    if (article.accessTier === 'free' || hasAccess || accessGranted) {
      fetch(blobId);
    }
  }, [article.accessTier, hasAccess, accessGranted, blobId, fetch]);

  if (isChecking || isFetching) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
        <span className="text-white/30 text-xs font-mono">
          {isChecking ? 'Checking access...' : 'Loading from Shelby...'}
        </span>
      </div>
    );
  }

  if (error === 'ACCESS_DENIED' || (!hasAccess && !accessGranted && article.accessTier !== 'free')) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-white mb-2">{article.title}</h1>
        <p className="text-white/40 text-sm mb-8">{article.preview}</p>
        <PaywallGate
          article={article}
          onAccessGranted={() => setAccessGranted(true)}
        />
      </div>
    );
  }

  if (content) {
    return (
      <div className="px-6 py-12">
        <ArticleView article={article} content={content} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center text-white/30 text-sm font-mono">
      Article not found.
    </div>
  );
}
