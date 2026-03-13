import Link from 'next/link';
import type { Article } from '@/types/article';

interface IssueCardProps {
  article: Article;
}

const ACCESS_LABELS: Record<string, string> = {
  free: 'Free',
  paid: 'Paid',
  nft_gated: 'NFT',
  token_gated: 'Token',
};

const ACCESS_COLORS: Record<string, string> = {
  free: 'text-green-400 border-green-400/30',
  paid: 'text-pink-400 border-pink-400/30',
  nft_gated: 'text-purple-400 border-purple-400/30',
  token_gated: 'text-blue-400 border-blue-400/30',
};

/**
 * Article preview card shown in feeds and profile pages.
 */
export function IssueCard({ article }: IssueCardProps) {
  const date = new Date(article.publishedAt * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/read/${article.blobId}`}>
      <div className="group border border-white/5 hover:border-pink-500/20 bg-white/[0.02] hover:bg-white/[0.04] rounded p-5 transition-all cursor-pointer">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/30 font-mono">
            Issue #{article.issueNumber} · {date}
          </span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${
              ACCESS_COLORS[article.accessTier]
            }`}
          >
            {ACCESS_LABELS[article.accessTier]}
            {article.price ? ` · ${article.price} APT` : ''}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white font-semibold text-base mb-2 group-hover:text-pink-200 transition-colors">
          {article.title}
        </h3>

        {/* Preview */}
        <p className="text-white/40 text-sm leading-relaxed line-clamp-2">
          {article.preview}
        </p>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="text-xs font-mono text-white/25 bg-white/5 px-2 py-0.5 rounded-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
