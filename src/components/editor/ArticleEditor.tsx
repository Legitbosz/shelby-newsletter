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

function uid() {
  return Math.random().toString(36).slice(2);
}

export function ArticleEditor({ onPublish, isPublishing }: ArticleEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [accessTier, setAccessTier] = useState<AccessTier>('paid');
  const [price, setPrice] = useState('1');
  const [attachments, setAttachments] = useState<UploadedMedia[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const preview = content.slice(0, 200).replace(/[#*`!\[\]]/g, '') + '...';
  const hasContent = content.trim().length > 0 || attachments.length > 0;

  const addImage = useCallback((file: File) => {
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
    setUploading(false);
  }, []);

  const removeImage = (blobId: string, url: string) => {
    URL.revokeObjectURL(url);
    setAttachments(prev => prev.filter(a => a.blobId !== blobId));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(f => {
      if (isImage(f.type)) addImage(f);
    });
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(f => {
      if (isImage(f.type)) addImage(f);
    });
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) { e.preventDefault(); addImage(file); }
    }
  }, [addImage]);

  const handlePublish = () => {
    if (!title.trim() || !hasContent) return;
    const imageMarkdown = attachments
      .map(a => `![${a.name}](${a.url})`)
      .join('\n\n');
    const fullContent = imageMarkdown
      ? content + (content ? '\n\n' : '') + imageMarkdown
      : content;

    onPublish({
      title: title.trim(),
      content: fullContent,
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

      {/* Text editor — clean, no images inside */}
      <div
        className={'relative ' + (dragOver ? 'ring-2 ring-pink-500/50 rounded' : '')}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onPaste={handlePaste}
          placeholder="Write in markdown... paste or drag images directly here"
          rows={18}
          className="w-full bg-white/5 border border-white/10 rounded p-4 text-sm text-white/80 font-mono placeholder:text-white/20 outline-none focus:border-pink-500/30 resize-none transition-colors leading-relaxed"
        />
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded pointer-events-none">
            <p className="text-pink-400 font-mono text-sm">Drop image to attach</p>
          </div>
        )}
      </div>

      {/* Image thumbnails — below the editor, small 72x72 */}
      {attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/30 font-mono uppercase tracking-widest">
            Attached images ({attachments.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {attachments.map(a => (
              <div key={a.blobId} className="relative group">
                <img
                  src={a.url}
                  alt={a.name}
                  className="rounded border border-white/10 object-cover"
                  style={{ width: '72px', height: '72px' }}
                />
                <button
                  onClick={() => removeImage(a.blobId, a.url)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs items-center justify-center hidden group-hover:flex"
                >
                  ×
                </button>
                <p className="text-[10px] text-white/25 font-mono mt-1 max-w-[72px] truncate">
                  {a.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
