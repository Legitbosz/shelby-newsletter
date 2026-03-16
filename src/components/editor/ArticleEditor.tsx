'use client';

import { useState, useRef, useCallback } from 'react';
import type { AccessTier } from '@/types/article';

interface UploadedMedia {
  blobId: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

interface ArticleEditorProps {
  onPublish: (data: {
    title: string;
    content: string;
    preview: string;
    tags: string[];
    accessTier: AccessTier;
    price?: number;
    attachments?: UploadedMedia[];
  }) => void;
  isPublishing?: boolean;
}

function isImage(type: string) {
  return type.startsWith('image/');
}

// Content block types
type Block =
  | { id: string; type: 'text'; value: string }
  | { id: string; type: 'image'; url: string; name: string; caption: string };

function uid() {
  return Math.random().toString(36).slice(2);
}

// Convert blocks to markdown string for publishing
function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map(b => {
      if (b.type === 'text') return b.value;
      if (b.type === 'image') return `![${b.caption || b.name}](${b.url})`;
      return '';
    })
    .join('\n\n');
}

export function ArticleEditor({ onPublish, isPublishing }: ArticleEditorProps) {
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([
    { id: uid(), type: 'text', value: '' },
  ]);
  const [tags, setTags] = useState('');
  const [accessTier, setAccessTier] = useState<AccessTier>('paid');
  const [price, setPrice] = useState('1');
  const [attachments, setAttachments] = useState<UploadedMedia[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateText = (id: string, value: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, value } as Block : b));
  };

  const updateCaption = (id: string, caption: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, caption } as Block : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => {
      const next = prev.filter(b => b.id !== id);
      if (next.length === 0) return [{ id: uid(), type: 'text', value: '' }];
      return next;
    });
  };

  const insertImageBlock = useCallback((file: File, afterId?: string) => {
    setUploading(true);
    const url = URL.createObjectURL(file);
    const media: UploadedMedia = {
      blobId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url,
      name: file.name,
      type: file.type,
      size: file.size,
    };
    setAttachments(prev => [...prev, media]);

    const newImageBlock: Block = { id: uid(), type: 'image', url, name: file.name, caption: '' };
    const newTextBlock: Block = { id: uid(), type: 'text', value: '' };

    setBlocks(prev => {
      if (!afterId) {
        return [...prev, newImageBlock, newTextBlock];
      }
      const idx = prev.findIndex(b => b.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, newImageBlock, newTextBlock);
      return next;
    });
    setUploading(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(f => {
      if (isImage(f.type)) insertImageBlock(f);
    });
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(f => {
      if (isImage(f.type)) insertImageBlock(f);
    });
  };

  const handleTextPaste = useCallback((e: React.ClipboardEvent, blockId: string) => {
    const imageItem = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        insertImageBlock(file, blockId);
      }
    }
  }, [insertImageBlock]);

  const content = blocksToMarkdown(blocks);
  const preview = content.slice(0, 200).replace(/[#*`!\[\]]/g, '') + '...';
  const hasContent = blocks.some(b => b.type === 'image' || (b.type === 'text' && b.value.trim()));

  const handlePublish = () => {
    if (!title.trim() || !hasContent) return;
    onPublish({
      title: title.trim(),
      content,
      preview,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      accessTier,
      price: accessTier === 'paid' ? parseFloat(price) : undefined,
      attachments,
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

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
        <span className="text-xs text-white/30 font-mono">Write</span>
        <div className="flex-1" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 rounded transition-colors disabled:opacity-30 whitespace-nowrap"
        >
          {uploading ? <span className="animate-pulse">Uploading...</span> : <span>📎 Attach image</span>}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Editor blocks */}
      <div
        className={'relative flex flex-col gap-1 min-h-[400px] bg-white/5 border border-white/10 rounded p-4 ' + (dragOver ? 'ring-2 ring-pink-500/50' : '')}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {blocks.map((block, idx) => {
          if (block.type === 'text') {
            return (
              <textarea
                key={block.id}
                value={block.value}
                onChange={e => updateText(block.id, e.target.value)}
                onPaste={e => handleTextPaste(e, block.id)}
                placeholder={idx === 0 ? 'Write in markdown... paste or drag images directly here' : ''}
                rows={Math.max(3, (block.value.match(/\n/g) || []).length + 2)}
                className="w-full bg-transparent text-sm text-white/80 font-mono placeholder:text-white/20 outline-none resize-none leading-relaxed"
              />
            );
          }

          if (block.type === 'image') {
            return (
              <div key={block.id} className="relative group my-3">
                <img
                  src={block.url}
                  alt={block.caption || block.name}
                  className="rounded-lg border border-white/10"
                  style={{ maxHeight: '160px', maxWidth: '260px', objectFit: 'cover' }}
                />
                <input
                  type="text"
                  value={block.caption}
                  onChange={e => updateCaption(block.id, e.target.value)}
                  placeholder="Add a caption (optional)"
                  className="w-full mt-1.5 bg-transparent text-xs text-white/30 font-mono placeholder:text-white/15 outline-none border-b border-white/5 focus:border-white/20 pb-1 transition-colors"
                />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(block.url);
                    removeBlock(block.id);
                    setAttachments(prev => prev.filter(a => a.url !== block.url));
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white/50 hover:text-red-400 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>
            );
          }

          return null;
        })}

        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded pointer-events-none">
            <p className="text-pink-400 font-mono text-sm">Drop image to insert</p>
          </div>
        )}
      </div>

      {/* Settings row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40 font-mono tracking-widest uppercase">Tags (comma separated)</label>
          <input
            type="text"
            placeholder="defi, storage, web3"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white/70 font-mono outline-none focus:border-pink-500/30 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40 font-mono tracking-widest uppercase">Access Tier</label>
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
        {accessTier === 'paid' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/40 font-mono tracking-widest uppercase">Price (APT)</label>
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
        disabled={isPublishing || !title.trim() || !hasContent}
        className="self-end px-8 py-3 rounded-sm bg-pink-500 text-black font-bold text-sm tracking-widest uppercase hover:bg-pink-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {isPublishing ? 'Publishing...' : 'Publish to Shelby →'}
      </button>
    </div>
  );
}
