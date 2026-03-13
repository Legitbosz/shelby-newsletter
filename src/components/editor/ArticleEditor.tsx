'use client';

import { useState } from 'react';
import type { AccessTier } from '@/types/article';

interface ArticleEditorProps {
  onPublish: (data: {
    title: string;
    content: string;
    preview: string;
    tags: string[];
    accessTier: AccessTier;
    price?: number;
  }) => void;
  isPublishing?: boolean;
}

/**
 * Main article editor for writers.
 * Markdown-based with live preview toggle.
 * TODO: Swap textarea for @uiw/react-md-editor for rich editing.
 */
export function ArticleEditor({ onPublish, isPublishing }: ArticleEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [accessTier, setAccessTier] = useState<AccessTier>('paid');
  const [price, setPrice] = useState('1');
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const preview = content.slice(0, 200).replace(/[#*`]/g, '') + '...';

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) return;
    onPublish({
      title: title.trim(),
      content,
      preview,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      accessTier,
      price: accessTier === 'paid' ? parseFloat(price) : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <input
        type="text"
        placeholder="Article title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full bg-transparent border-b border-white/10 pb-3 text-2xl font-semibold text-white placeholder:text-white/20 outline-none focus:border-pink-500/50 transition-colors"
      />

      {/* Tab toggle */}
      <div className="flex gap-1 border-b border-white/10">
        {(['write', 'preview'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono capitalize tracking-widest transition-colors ${
              tab === t
                ? 'text-pink-400 border-b-2 border-pink-400'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Editor / Preview */}
      {tab === 'write' ? (
        <textarea
          placeholder="Write your article in markdown..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={20}
          className="w-full bg-white/5 border border-white/10 rounded p-4 text-sm text-white/80 font-mono placeholder:text-white/20 outline-none focus:border-pink-500/30 resize-none transition-colors"
        />
      ) : (
        <div className="min-h-[400px] bg-white/5 border border-white/10 rounded p-6 text-white/80 text-sm leading-relaxed prose prose-invert max-w-none">
          {content ? (
            <pre className="whitespace-pre-wrap font-sans">{content}</pre>
          ) : (
            <span className="text-white/20">Nothing to preview yet...</span>
          )}
        </div>
      )}

      {/* Settings row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tags */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40 font-mono tracking-widest uppercase">
            Tags (comma separated)
          </label>
          <input
            type="text"
            placeholder="defi, storage, web3"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white/70 font-mono outline-none focus:border-pink-500/30 transition-colors"
          />
        </div>

        {/* Access tier */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40 font-mono tracking-widest uppercase">
            Access Tier
          </label>
          <select
            value={accessTier}
            onChange={e => setAccessTier(e.target.value as AccessTier)}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white/70 font-mono outline-none focus:border-pink-500/30 transition-colors"
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="nft_gated">NFT Gated</option>
            <option value="token_gated">Token Gated</option>
          </select>
        </div>

        {/* Price */}
        {accessTier === 'paid' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/40 font-mono tracking-widest uppercase">
              Price (APT)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white/70 font-mono outline-none focus:border-pink-500/30 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Publish button */}
      <button
        onClick={handlePublish}
        disabled={isPublishing || !title.trim() || !content.trim()}
        className="self-end px-8 py-3 rounded-sm bg-pink-500 text-black font-bold text-sm tracking-widest uppercase hover:bg-pink-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {isPublishing ? 'Publishing...' : 'Publish to Shelby →'}
      </button>
    </div>
  );
}
