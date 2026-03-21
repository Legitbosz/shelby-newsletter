'use client';

import { useState, useRef, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { CONTRACT_ADDRESS, FUNCTIONS } from '@/lib/aptos/contracts';
import Link from 'next/link';

type AccessTier = 'free' | 'paid';

interface Attachment {
  name: string;
  type: string;
  size: number;
  url: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImage(type: string) { return type.startsWith('image/'); }
function isVideo(type: string) { return type.startsWith('video/'); }

const EMOJIS = ['😀','😂','🔥','💡','🚀','✅','❌','⭐','💰','📰','🎯','💎','🌐','⚡','🔐','📊','🎉','👀','💪','🤝','📌','🔗','💬','🌟','🏆','📈','🎨','🔮','💫','🌍','⚖️','🛡️','🔑','📡','🧠','💻','📱','🎭','✍️','📚'];

export const dynamic = 'force-dynamic';

export default function PublishPage() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [accessTier, setAccessTier] = useState<AccessTier>('paid');
  const [price, setPrice] = useState('1');
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [blobId, setBlobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (before: string, after: string = '', placeholder: string = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const newText = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const newText = content.slice(0, start) + emoji + content.slice(start);
    setContent(newText);
    setShowEmoji(false);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  };

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload-media', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const media = await res.json();
      const attachment: Attachment = { name: file.name, type: file.type, size: file.size, url: media.url };
      setAttachments(prev => [...prev, attachment]);
      if (isImage(file.type)) {
        setContent(prev => prev + '\n\n![' + file.name + '](' + media.url + ')\n');
      }
    } catch (err) {
      setError('File upload failed');
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

  const renderPreview = (md: string) => {
    return md
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:6px;margin:16px 0;display:block;" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--accent);text-decoration:underline;" target="_blank">$1</a>')
      .replace(/^### (.+)$/gm, '<h3 style="font-family:var(--font-display);font-size:1.3rem;font-weight:700;color:var(--text);margin:24px 0 8px;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-family:var(--font-display);font-size:1.6rem;font-weight:700;color:var(--text);margin:32px 0 12px;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-family:var(--font-display);font-size:2rem;font-weight:700;color:var(--text);margin:40px 0 16px;">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text);">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      .replace(/`(.+?)`/g, '<code style="background:var(--surface);padding:2px 7px;border-radius:3px;color:var(--accent);font-family:var(--font-mono);font-size:0.85em;">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--accent);padding:12px 20px;color:var(--text-2);font-style:italic;margin:20px 0;background:var(--surface);">$1</blockquote>')
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:32px 0;" />')
      .replace(/\n/g, '<br />');
  };

  async function handlePublish() {
    if (!title.trim() || !content.trim() || !account) return;
    setError(null); setTxHash(null); setBlobId(null);
    try {
      setStatus('Uploading to Shelby...');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content, title,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          attachments: attachments.map(a => ({ name: a.name, type: a.type, url: a.url, size: a.size })),
        }),
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const blob = await uploadRes.json();
      setBlobId(blob.blobId);

      setStatus('Checking publication...');
      const config = new AptosConfig({ network: Network.TESTNET });
      const aptos = new Aptos(config);
      const pubExists = await aptos.getAccountResource({
        accountAddress: String(account.address),
        resourceType: `${CONTRACT_ADDRESS}::newsletter::Publication`,
      }).catch(() => null);

      if (!pubExists) {
        setStatus('Initializing publication...');
        await signAndSubmitTransaction({
          data: {
            function: FUNCTIONS.INIT_PUBLICATION as `${string}::${string}::${string}`,
            functionArguments: [],
          },
        });
        await new Promise(r => setTimeout(r, 2000));
      }

      setStatus('Publishing on Aptos...');
      const preview = content.slice(0, 200).replace(/[#*`\[\]!~]/g, '').trim();
      const result = await signAndSubmitTransaction({
        data: {
          function: FUNCTIONS.PUBLISH_ISSUE as `${string}::${string}::${string}`,
          functionArguments: [
            blob.blobId, title.trim(), preview, accessTier,
            accessTier === 'paid' ? Math.round(parseFloat(price) * 1e8) : 0,
            tags.split(',').map(t => t.trim()).filter(Boolean),
          ],
        },
      });
      setTxHash((result as any).hash);
      setStatus('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('');
    }
  }

  const btnStyle = {
    padding: '5px 9px', background: 'var(--surface)' as string,
    border: '1px solid var(--border)' as string, borderRadius: '2px',
    fontFamily: 'var(--font-mono)' as string, fontSize: '0.72rem',
    color: 'var(--text-3)' as string, cursor: 'pointer' as const,
    transition: 'all 0.15s' as string,
  };

  if (!connected) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '120px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontSize: '3rem' }}>✍️</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text)', fontWeight: 700 }}>Ready to write?</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-3)', fontWeight: 300 }}>Connect your wallet to start publishing on Shelby.</p>
        <ConnectButton />
      </div>
    );
  }

  if (txHash) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '80px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontSize: '3rem' }}>🎉</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text)', fontWeight: 700 }}>Published!</h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-3)', fontWeight: 300 }}>Your article is live on Shelby Protocol.</p>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px 24px', width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {blobId && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Shelby Blob ID</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)', wordBreak: 'break-all' }}>{blobId}</div>
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Aptos Tx Hash</div>
            <a href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)', wordBreak: 'break-all', textDecoration: 'underline' }}>
              {txHash}
            </a>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/read" className="btn-primary" style={{ fontSize: '0.8rem' }}>View in Feed &rarr;</Link>
          <button onClick={() => { setTitle(''); setContent(''); setTags(''); setTxHash(null); setBlobId(null); setAttachments([]); }} className="btn-secondary" style={{ fontSize: '0.8rem' }}>Write Another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text)', fontWeight: 700, marginBottom: '6px' }}>New Issue</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)', letterSpacing: '0.05em' }}>
          Stored permanently on Shelby Protocol &middot; Recorded on Aptos
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Title */}
        <input type="text" placeholder="Article title..." value={title} onChange={e => setTitle(e.target.value)}
          style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', paddingBottom: '12px', fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', outline: 'none' }}
          onFocus={e => e.currentTarget.style.borderBottomColor = 'var(--accent-border)'}
          onBlur={e => e.currentTarget.style.borderBottomColor = 'var(--border)'} />

        {/* Rich Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px' }}>
          {/* Headings */}
          {[['H1','# ','Heading 1'],['H2','## ','Heading 2'],['H3','### ','Heading 3']].map(([lbl, md, ph]) => (
            <button key={lbl} onClick={() => insertAtCursor(md as string, '', ph as string)} style={{ ...btnStyle, fontWeight: 700 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}>
              {lbl}
            </button>
          ))}

          <div style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 3px' }} />

          {/* Formatting */}
          <button onClick={() => insertAtCursor('**', '**', 'bold')} style={{ ...btnStyle, fontWeight: 900 }} title="Bold"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>B</button>
          <button onClick={() => insertAtCursor('*', '*', 'italic')} style={{ ...btnStyle, fontStyle: 'italic' }} title="Italic"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>I</button>
          <button onClick={() => insertAtCursor('~~', '~~', 'strikethrough')} style={{ ...btnStyle, textDecoration: 'line-through' }} title="Strikethrough"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>S</button>
          <button onClick={() => insertAtCursor('`', '`', 'code')} style={{ ...btnStyle }} title="Inline code"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>&lt;/&gt;</button>

          <div style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 3px' }} />

          {/* Block */}
          <button onClick={() => insertAtCursor('> ', '', 'quote')} style={btnStyle} title="Blockquote"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>&ldquo;</button>
          <button onClick={() => insertAtCursor('- ', '', 'list item')} style={btnStyle} title="Bullet list"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>&bull;</button>
          <button onClick={() => insertAtCursor('1. ', '', 'list item')} style={btnStyle} title="Numbered list"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>1.</button>
          <button onClick={() => insertAtCursor('[', '](url)', 'link text')} style={btnStyle} title="Link"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>🔗</button>
          <button onClick={() => insertAtCursor('\n---\n', '', '')} style={btnStyle} title="Divider"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>&mdash;</button>

          <div style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 3px' }} />

          {/* Emoji */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowEmoji(p => !p)} style={{ ...btnStyle, background: showEmoji ? 'var(--accent-dim)' : 'var(--surface)', borderColor: showEmoji ? 'var(--accent-border)' : 'var(--border)', fontSize: '0.9rem' }} title="Emoji">
              😊
            </button>
            {showEmoji && (
              <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px', width: '264px', display: 'flex', flexWrap: 'wrap', gap: '2px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => insertEmoji(e)}
                    style={{ width: '32px', height: '32px', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', borderRadius: '3px' }}
                    onMouseEnter={el => (el.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                    onMouseLeave={el => (el.currentTarget as HTMLElement).style.background = 'none'}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Attach */}
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: '6px', opacity: uploading ? 0.5 : 1 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}>
            {uploading ? '↑ Uploading...' : '📎 Attach'}
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.md,.txt,.json,.csv" onChange={handleFileInput} style={{ display: 'none' }} />
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)' }}>
          {(['write', 'preview'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: tab === t ? 'var(--accent)' : 'var(--text-3)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px',
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* Editor / Preview */}
        {tab === 'write' ? (
          <div style={{ position: 'relative' }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}>
            <textarea ref={textareaRef}
              placeholder="Write your article in markdown... drag & drop or paste images here"
              value={content} onChange={e => setContent(e.target.value)} onPaste={handlePaste} rows={12}
              style={{ width: '100%', background: dragOver ? 'rgba(240,88,140,0.04)' : 'var(--surface)', border: dragOver ? '1px solid var(--accent-border)' : '1px solid var(--border)', borderRadius: '3px', padding: '20px', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', outline: 'none', resize: 'none', lineHeight: 1.75, transition: 'all 0.2s', overflowY: 'auto', maxHeight: '320px' }} />
            {dragOver && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(240,88,140,0.06)', borderRadius: '3px', pointerEvents: 'none' }}>
                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '0.9rem' }}>Drop to upload</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ minHeight: '400px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '24px', fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: content ? renderPreview(content) : '<span style="color:var(--text-4);font-family:var(--font-mono);font-size:0.85rem;">Nothing to preview yet...</span>' }} />
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Attachments ({attachments.length})</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {attachments.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '8px 12px' }}>
                  {isImage(a.type) ? (
                    <img src={a.url} alt={a.name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '3px' }} />
                  ) : isVideo(a.type) ? (
                    <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '3px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                      <video src={a.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted preload="metadata" />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                        <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '8px solid white', marginLeft: '2px' }} />
                      </div>
                    </div>
                  ) : <span style={{ fontSize: '1.3rem' }}>📄</span>}
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-2)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-4)' }}>{formatBytes(a.size)}</div>
                  </div>
                  <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: '1rem', padding: '0 2px', lineHeight: 1 }}>
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tags</label>
            <input type="text" placeholder="defi, web3, aptos" value={tags} onChange={e => setTags(e.target.value)} className="input" style={{ fontSize: '0.9rem' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Access</label>
            <select value={accessTier} onChange={e => setAccessTier(e.target.value as AccessTier)} className="input" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          {accessTier === 'paid' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Price (APT)</label>
              <input type="number" min="0.1" step="0.1" value={price} onChange={e => setPrice(e.target.value)} className="input" style={{ fontSize: '0.9rem' }} />
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '3px', padding: '12px 16px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#ef4444' }}>{error}</p>
          </div>
        )}

        {status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '14px', height: '14px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-3)' }}>{status}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handlePublish} disabled={!title.trim() || !content.trim() || !!status} className="btn-primary" style={{ fontSize: '0.85rem', padding: '14px 36px' }}>
            {status ? 'Publishing...' : 'Publish to Shelby →'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
