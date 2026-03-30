'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { CONTRACT_ADDRESS } from '@/lib/aptos/contracts';

interface Comment {
  id: string;
  author: string;
  authorName?: string;
  content: string;
  createdAt: number;
  parentId?: string;
  likes: number;
  replies?: Comment[];
}

interface SocialBarProps {
  blobId: string;
  authorAddress: string;
  articleTitle: string;
}

const EMOJIS_QUICK = ['❤️','🔥','👏','🚀','💡','😂','😍','🤯','💎','⭐'];

const EMOJI_CATS: Record<string, string[]> = {
  'Faces': ['😀','😂','🤣','😍','🥰','😎','🤔','😤','🥳','😭','🤯','😱','🤩','😅','🫡'],
  'Hands': ['👍','👎','👏','🙌','🤝','✌️','🤞','👌','💪','🙏','👋','🫶'],
  'Hearts': ['❤️','🧡','💛','💚','💙','💜','💕','💞','💓','💗','💖','❤️‍🔥'],
  'Symbols': ['✅','❌','⭐','🔥','💡','⚡','🎯','💰','🏆','🌟','💎','🔐'],
  'Web3': ['💰','💎','🔐','📊','🌐','⛓️','🏦','💹','🪙','📡','🧮','🔒'],
};

function getProfile(addr: string) {
  try {
    const stored = localStorage.getItem(`profile-${addr}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return new Date(ts * 1000).toLocaleDateString();
}

export function SocialBar({ blobId, authorAddress, articleTitle }: SocialBarProps) {
  const { account, signAndSubmitTransaction } = useWallet();
  const addr = account?.address ? String(account.address) : '';

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const storageKey = `social-${blobId}`;
  const followKey = `follows-${addr}`;
  const bookmarkKey = `bookmarks-${addr}`;

  useEffect(() => {
    // Load from localStorage
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setLikeCount(data.likeCount || 0);
      setComments(data.comments || []);

      if (addr) {
        const likedBy: string[] = data.likedBy || [];
        setLiked(likedBy.includes(addr));

        const follows: string[] = JSON.parse(localStorage.getItem(followKey) || '[]');
        setFollowing(follows.includes(authorAddress));

        const bookmarks: string[] = JSON.parse(localStorage.getItem(bookmarkKey) || '[]');
        setBookmarked(bookmarks.includes(blobId));
      }
    } catch {}
  }, [addr, blobId]);

  const saveData = (updates: any) => {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
      localStorage.setItem(storageKey, JSON.stringify({ ...data, ...updates }));
    } catch {}
  };

  const handleLike = () => {
    if (!addr) return;
    const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const likedBy: string[] = data.likedBy || [];
    if (liked) {
      const newLikedBy = likedBy.filter(a => a !== addr);
      const newCount = Math.max(0, likeCount - 1);
      saveData({ likedBy: newLikedBy, likeCount: newCount });
      setLiked(false);
      setLikeCount(newCount);
    } else {
      likedBy.push(addr);
      const newCount = likeCount + 1;
      saveData({ likedBy, likeCount: newCount });
      setLiked(true);
      setLikeCount(newCount);
    }
  };

  const handleBookmark = () => {
    if (!addr) return;
    const bookmarks: string[] = JSON.parse(localStorage.getItem(bookmarkKey) || '[]');
    if (bookmarked) {
      const updated = bookmarks.filter(b => b !== blobId);
      localStorage.setItem(bookmarkKey, JSON.stringify(updated));
      setBookmarked(false);
    } else {
      bookmarks.push(blobId);
      localStorage.setItem(bookmarkKey, JSON.stringify(bookmarks));
      setBookmarked(true);
    }
  };

  const handleFollow = () => {
    if (!addr || addr === authorAddress) return;
    const follows: string[] = JSON.parse(localStorage.getItem(followKey) || '[]');
    if (following) {
      const updated = follows.filter(f => f !== authorAddress);
      localStorage.setItem(followKey, JSON.stringify(updated));
      setFollowing(false);
    } else {
      follows.push(authorAddress);
      localStorage.setItem(followKey, JSON.stringify(follows));
      setFollowing(true);
    }
  };

  const handleRepost = () => {
    const url = window.location.href;
    const text = `📰 "${articleTitle}" by ${shortAddr(authorAddress)}\n\n${url}\n\n#ShelbyNews #Web3 #Decentralized`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertEmojiInComment = (emoji: string, isReply: boolean) => {
    if (isReply) {
      const ta = replyRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const text = replyTo ? commentText : commentText;
      setCommentText(t => t.slice(0, start) + emoji + t.slice(start));
    } else {
      const ta = commentRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      setCommentText(t => t.slice(0, start) + emoji + t.slice(start));
    }
    setShowEmojiPicker(null);
  };

  const submitComment = async (parentId?: string) => {
    if (!commentText.trim() || !addr) return;
    setSubmitting(true);
    try {
      const profile = getProfile(addr);
      const newComment: Comment = {
        id: Date.now().toString(),
        author: addr,
        authorName: profile?.displayName,
        content: commentText.trim(),
        createdAt: Math.floor(Date.now() / 1000),
        parentId,
        likes: 0,
      };

      const updatedComments = parentId
        ? comments.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), newComment] } : c)
        : [...comments, newComment];

      setComments(updatedComments);
      saveData({ comments: updatedComments });
      setCommentText('');
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const likeComment = (commentId: string) => {
    const updated = comments.map(c =>
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    );
    setComments(updated);
    saveData({ comments: updated });
  };

  const btnBase = {
    display: 'flex' as const, alignItems: 'center' as const, gap: '6px',
    padding: '8px 14px', background: 'none', border: '1px solid var(--border)',
    borderRadius: '20px', cursor: 'pointer', fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem', color: 'var(--text-3)', transition: 'all 0.2s',
  };

  const CommentInput = ({ isReply = false, placeholder = 'Write a comment...' }: { isReply?: boolean; placeholder?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ position: 'relative' }}>
        <textarea
          ref={isReply ? replyRef : commentRef}
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '12px 16px', fontSize: '0.9rem',
            fontFamily: 'var(--font-body)', color: 'var(--text)', outline: 'none',
            resize: 'none', lineHeight: 1.6,
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Quick emojis */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {EMOJIS_QUICK.map(e => (
            <button key={e} onClick={() => insertEmojiInComment(e, isReply)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px 3px', borderRadius: '3px' }}
              onMouseEnter={el => (el.currentTarget as HTMLElement).style.background = 'var(--surface)'}
              onMouseLeave={el => (el.currentTarget as HTMLElement).style.background = 'none'}>
              {e}
            </button>
          ))}
          {/* More emojis */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowEmojiPicker(showEmojiPicker === 'comment' ? null : 'comment')}
              style={{ background: showEmojiPicker === 'comment' ? 'var(--surface)' : 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 6px', borderRadius: '3px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              +😊
            </button>
            {showEmojiPicker === 'comment' && (
              <div style={{ position: 'absolute', bottom: '110%', left: 0, zIndex: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', width: '280px', maxHeight: '240px', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                {Object.entries(EMOJI_CATS).map(([cat, emojis]) => (
                  <div key={cat} style={{ marginBottom: '8px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{cat}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px' }}>
                      {emojis.map(e => (
                        <button key={e} onClick={() => insertEmojiInComment(e, isReply)}
                          style={{ width: '28px', height: '28px', background: 'none', border: 'none', fontSize: '0.95rem', cursor: 'pointer', borderRadius: '3px' }}
                          onMouseEnter={el => (el.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                          onMouseLeave={el => (el.currentTarget as HTMLElement).style.background = 'none'}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {isReply && (
            <button onClick={() => { setReplyTo(null); setCommentText(''); }} className="btn-secondary" style={{ fontSize: '0.72rem', padding: '6px 14px' }}>
              Cancel
            </button>
          )}
          <button onClick={() => submitComment(replyTo?.id)} disabled={!commentText.trim() || submitting} className="btn-primary" style={{ fontSize: '0.72rem', padding: '6px 16px' }}>
            {submitting ? '...' : isReply ? 'Reply' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );

  const CommentCard = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const profile = getProfile(comment.author);
    return (
      <div style={{ marginLeft: depth > 0 ? '40px' : '0', marginBottom: '12px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px' }}>
          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--accent)', flexShrink: 0, overflow: 'hidden' }}>
              {profile?.avatar ? <img src={profile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : comment.author.slice(2, 3).toUpperCase()}
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-2)', fontWeight: 600 }}>
                {profile?.displayName || shortAddr(comment.author)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-3)', marginLeft: '8px' }}>
                {timeAgo(comment.createdAt)}
              </span>
            </div>
          </div>

          {/* Content */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-2)', lineHeight: 1.7, fontWeight: 300 }}>
            {comment.content}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button onClick={() => likeComment(comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
              ❤️ {comment.likes > 0 && comment.likes}
            </button>
            {addr && depth === 0 && (
              <button onClick={() => { setReplyTo(comment); setCommentText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-3)', padding: 0 }}>
                Reply
              </button>
            )}
          </div>
        </div>

        {/* Reply input */}
        {replyTo?.id === comment.id && (
          <div style={{ marginTop: '8px', marginLeft: '40px' }}>
            <CommentInput isReply placeholder={`Replying to ${profile?.displayName || shortAddr(comment.author)}...`} />
          </div>
        )}

        {/* Replies */}
        {comment.replies?.map(reply => (
          <CommentCard key={reply.id} comment={reply} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div style={{ marginTop: '48px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>

        {/* Like */}
        <button onClick={handleLike} style={{ ...btnBase, color: liked ? '#ef4444' : 'var(--text-3)', borderColor: liked ? 'rgba(239,68,68,0.3)' : 'var(--border)', background: liked ? 'rgba(239,68,68,0.06)' : 'none' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.4)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = liked ? 'rgba(239,68,68,0.3)' : 'var(--border)'}>
          {liked ? '❤️' : '🤍'} {likeCount > 0 ? likeCount : ''} {liked ? 'Liked' : 'Like'}
        </button>

        {/* Comment */}
        <button onClick={() => setShowComments(!showComments)} style={{ ...btnBase, color: showComments ? 'var(--accent)' : 'var(--text-3)', borderColor: showComments ? 'var(--accent-border)' : 'var(--border)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = showComments ? 'var(--accent-border)' : 'var(--border)'}>
          💬 {comments.length > 0 ? comments.length : ''} Comment{comments.length !== 1 ? 's' : ''}
        </button>

        {/* Bookmark */}
        <button onClick={handleBookmark} style={{ ...btnBase, color: bookmarked ? 'var(--accent)' : 'var(--text-3)', borderColor: bookmarked ? 'var(--accent-border)' : 'var(--border)', background: bookmarked ? 'var(--accent-dim)' : 'none' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = bookmarked ? 'var(--accent-border)' : 'var(--border)'}>
          {bookmarked ? '🔖' : '📑'} {bookmarked ? 'Saved' : 'Bookmark'}
        </button>

        {/* Repost to X */}
        <button onClick={handleRepost} style={btnBase}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
          𝕏 Share
        </button>

        {/* Copy link */}
        <button onClick={handleCopyLink} style={{ ...btnBase, color: copied ? '#4ade80' : 'var(--text-3)', borderColor: copied ? 'rgba(74,222,128,0.3)' : 'var(--border)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,222,128,0.3)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = copied ? 'rgba(74,222,128,0.3)' : 'var(--border)'}>
          {copied ? '✅ Copied!' : '🔗 Copy Link'}
        </button>

        <div style={{ flex: 1 }} />

        {/* Follow author */}
        {addr && addr !== authorAddress && (
          <button onClick={handleFollow} style={{ ...btnBase, color: following ? 'var(--accent)' : 'var(--text-3)', borderColor: following ? 'var(--accent-border)' : 'var(--border)', background: following ? 'var(--accent-dim)' : 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = following ? 'var(--accent-border)' : 'var(--border)'}>
            {following ? '✓ Following' : '+ Follow'}
          </button>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text)', fontWeight: 700 }}>
            {comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}` : 'Be the first to comment'}
          </h3>

          {/* Comment input */}
          {addr ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--accent)', flexShrink: 0, overflow: 'hidden' }}>
                {(() => { const p = getProfile(addr); return p?.avatar ? <img src={p.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : addr.slice(2, 3).toUpperCase(); })()}
              </div>
              <div style={{ flex: 1 }}>
                <CommentInput />
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-3)', fontWeight: 300 }}>
              Connect your wallet to comment
            </p>
          )}

          {/* Comments list */}
          {comments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
              {comments.map(comment => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
