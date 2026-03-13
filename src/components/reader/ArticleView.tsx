'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Article } from '@/types/article';

interface ArticleViewProps {
  article: Article;
  content: string;
}

/**
 * Full article renderer.
 * Displays markdown content with metadata header.
 */
export function ArticleView({ article, content }: ArticleViewProps) {
  const date = new Date(article.publishedAt * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="max-w-2xl mx-auto">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-mono text-white/30">Issue #{article.issueNumber}</span>
          <span className="text-white/20">·</span>
          <span className="text-xs font-mono text-white/30">{date}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
          {article.title}
        </h1>

        {article.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="text-xs font-mono text-pink-400/60 bg-pink-500/5 border border-pink-500/10 px-2 py-0.5 rounded-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Divider */}
      <div className="border-t border-white/5 mb-10" />

      {/* Content */}
      <div className="prose prose-invert prose-pink max-w-none
        prose-headings:font-bold prose-headings:text-white
        prose-p:text-white/70 prose-p:leading-relaxed
        prose-a:text-pink-400 prose-a:no-underline hover:prose-a:underline
        prose-code:text-pink-300 prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
        prose-blockquote:border-pink-500/30 prose-blockquote:text-white/50
        prose-strong:text-white
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/20 font-mono">Stored on Shelby Protocol</span>
            <a
              href={`https://explorer.shelby.xyz/blob/${article.blobId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pink-400/50 font-mono hover:text-pink-400 transition-colors truncate max-w-[200px]"
            >
              {article.blobId}
            </a>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="text-xs font-mono text-white/20 hover:text-white/50 transition-colors border border-white/5 px-3 py-1.5 rounded-sm hover:border-white/10"
          >
            Share →
          </button>
        </div>
      </footer>
    </article>
  );
}
