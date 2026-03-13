'use client';

import { usePublications } from '@/hooks/usePublications';
import { IssueCard } from '@/components/reader/IssueCard';

interface Props {
  params: { address: string };
}

/**
 * Writer profile / publication dashboard.
 * Shows all published issues for a given wallet address.
 */
export default function ProfilePage({ params }: Props) {
  const { address } = params;
  const { articles, isLoading, error } = usePublications(address);

  const truncate = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-12 pb-8 border-b border-white/5">
        <div className="w-14 h-14 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-xl">
          ✍️
        </div>
        <div>
          <h1 className="text-white font-bold text-xl font-mono">
            {truncate(address)}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-white/30 font-mono">
              {articles.length} issues published
            </span>
            <span className="text-xs text-white/10">·</span>
            <span className="text-xs text-pink-400/50 font-mono">
              Shelby writer
            </span>
          </div>
        </div>
      </div>

      {/* Issues */}
      <div>
        <h2 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-4">
          All Issues
        </h2>

        {isLoading && (
          <div className="flex items-center gap-3 py-12 text-white/20">
            <div className="w-5 h-5 border border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            <span className="text-xs font-mono">Loading from chain...</span>
          </div>
        )}

        {error && (
          <div className="text-red-400/60 text-xs font-mono py-8">{error}</div>
        )}

        {!isLoading && articles.length === 0 && (
          <div className="text-center py-16 text-white/20 text-sm">
            No issues published yet.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {articles
            .sort((a, b) => b.issueNumber - a.issueNumber)
            .map(article => (
              <IssueCard key={article.blobId} article={article} />
            ))}
        </div>
      </div>
    </div>
  );
}
