'use client';

import { useState, useRef, useCallback } from 'react';
import type { AccessTier } from '@/types/article';

interface UploadedMedia {
  blobId: string;
  url: string;
  name: string;
  type: string;
  size: number;
  mock?: boolean;
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImage(type: string) {
  return type.startsWith('image/');
}

export function ArticleEditor({ onPublish, isPublishing }: ArticleEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [accessTier, setAccessTier] = useState<AccessTier>('paid');
  const [price, setPrice] = useState('1');
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [attachments, setAttachments] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const preview = content.slice(0, 200).replace(/[#*`]/g, '') + '...';

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload-media', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const media: UploadedMedia = await res.json();
      setAttachments(prev => [...prev, media]);
      if (isImage(file.type)) {
        setContent(prev => prev + '\n![' + file.name + '](' + media.url + ')\n');
      }
      return media;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(uploadFile);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(uploadFile);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) { e.preventDefault(); uploadFile(file); }
    }
  }, [uploadFile]);

  const insertLink = (media: UploadedMedia) => {
    const md = isImage(media.type)
      ? '![' + media.name + '](' + media.url + ')'
      : '[' + media.name + '](' + media.url + ')';
    setContent(prev => prev + '\n' + md + '\n');
    setTab('write');
  };

  const renderMarkdown = (md: string) => {
    return md
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:4px;margin:8px 0;" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#f472b6;text-decoration:underline;" target="_blank">$1</a>')
      .replace(/^### (.+)$/gm, '<h3 style="font-size:1.1rem;font-weight:bold;color:white;margin:16px 0 8px;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size:1.3rem;font-weight:bold;color:white;margin:24px 0 12px;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size:1.6rem;font-weight:bold;color:white;margin:32px 0 16px;">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:3px;color:#f9a8d4;font-size:0.85em;">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote style="border-left:2px solid #ec4899;padding-left:16px;color:rgba(255,255,255,0.5);font-style:italic;margin:8px 0;">$1</blockquote>')
      .replace(/\n/g, '<br />');
  };

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) return;
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
      <input
        type="text"
        placeholder="Article title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full bg-transparent border-b border-white/10 pb-3 text-2xl font-semibold text-white placeholder:text-white/20 outline-none focus:border-pink-500/50 transition-colors"
      />

      <div className="flex items-center gap-3">
        <div className="flex gap-1 border-b border-white/10 flex-1">
          {(['write', 'preview'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={'px-4 py-2 text-xs font-mono capitalize tracking-widest transition-colors ' +
                (tab === t ? 'text-pink-400 border-b-2 border-pink-400' : 'text-white/30 hover:text-white/60')}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 rounded transition-colors disabled:opacity-30 whitespace-nowrap">
          {uploading ? <span className="animate-pulse">Uploading...</span> : <span>📎 Attach file</span>}
        </button>
        <input ref={fileInputRef} type="file" multiple
          accept="image/*,.pdf,.md,.txt,.json,.csv" onChange={handleFileInput} className="hidden" />
      </div>

      {uploadError && <p className="text-xs text-red-400 font-mono">{uploadError}</p>}

      {tab === 'write' ? (
        <div className={'relative ' + (dragOver ? 'ring-2 ring-pink-500/50 rounded' : '')}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}>
          <textarea
            placeholder="Write in markdown... drag & drop or paste images directly here"
            value={content}
            onChange={e => setContent(e.target.value)}
            onPaste={handlePaste}
            rows={20}
            className="w-full bg-white/5 border border-white/10 rounded p-4 text-sm text-white/80 font-mono placeholder:text-white/20 outline-none focus:border-pink-500/30 resize-none transition-colors"
          />
          {dragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded pointer-events-none">
              <p className="text-pink-400 font-mono text-sm">Drop to upload</p>
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-[400px] bg-white/5 border border-white/10 rounded p-6 text-white/80 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content ? renderMarkdown(content) : '<span style="color:rgba(255,255,255,0.2)">Nothing to preview yet...</span>' }} />
      )}

      {attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/30 font-mono uppercase tracking-widest">Attachments ({attachments.length})</p>
          <div className="flex flex-wrap gap-2">
            {attachments.map(a => (
              <div key={a.blobId} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white/50 group hover:border-white/20 transition-colors">
                {isImage(a.type) ? (
                  <img src={a.url} alt={a.name} className="w-8 h-8 object-cover rounded" />
                ) : <span>📄</span>}
                <div className="flex flex-col">
                  <span className="text-white/70 max-w-[120px] truncate">{a.name}</span>
                  <span className="text-white/25">{formatBytes(a.size)}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <button onClick={() => insertLink(a)} title="Insert into article" className="text-pink-400 hover:text-pink-300">↩</button>
                  <button onClick={() => setAttachments(p => p.filter(x => x.blobId !== a.blobId))} title="Remove" className="text-red-400 hover:text-red-300">×</button>
                </div>
                {a.mock && <span className="text-yellow-500/40 text-[10px]">mock</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40 font-mono tracking-widest uppercase">Tags (comma separated)</label>
          <input type="text" placeholder="defi, storage, web3" value={tags} onChange={e => setTags(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white/70 font-mono outline-none focus:border-pink-500/30 transition-colors" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40 font-mono tracking-widest uppercase">Access Tier</label>
          <select value={accessTier} onChange={e => setAccessTier(e.target.value as AccessTier)}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white/70 font-mono outline-none focus:border-pink-500/30 transition-colors">
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="nft_gated">NFT Gated</option>
            <option value="token_gated">Token Gated</option>
          </select>
        </div>
        {accessTier === 'paid' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/40 font-mono tracking-widest uppercase">Price (APT)</label>
            <input type="number" min="0.1" step="0.1" value={price} onChange={e => setPrice(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white/70 font-mono outline-none focus:border-pink-500/30 transition-colors" />
          </div>
        )}
      </div>

      <button onClick={handlePublish} disabled={isPublishing || !title.trim() || !content.trim()}
        className="self-end px-8 py-3 rounded-sm bg-pink-500 text-black font-bold text-sm tracking-widest uppercase hover:bg-pink-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        {isPublishing ? 'Publishing...' : 'Publish to Shelby →'}
      </button>
    </div>
  );
}
