'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { usePublications } from '@/hooks/usePublications';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ProfileData {
  displayName: string;
  bio: string;
  avatar: string;
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
  aptos: string;
  ethereum: string;
}

const DEFAULT_PROFILE: ProfileData = {
  displayName: '',
  bio: '',
  avatar: '',
  website: '',
  twitter: '',
  telegram: '',
  discord: '',
  aptos: '',
  ethereum: '',
};

function shortAddr(addr: string) {
  const s = String(addr);
  return s.slice(0, 8) + '...' + s.slice(-6);
}

export default function ProfilePage() {
  const { account, connected } = useWallet();
  const address = account?.address ? String(account.address) : '';
  const { articles, isLoading, error } = usePublications(address);

  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileData>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Load profile from localStorage
  useEffect(() => {
    if (!address) return;
    const stored = localStorage.getItem(`profile-${address}`);
    if (stored) {
      const p = JSON.parse(stored);
      setProfile(p);
      setDraft(p);
      if (p.avatar) setAvatarPreview(p.avatar);
    } else {
      const defaultP = { ...DEFAULT_PROFILE, aptos: address };
      setProfile(defaultP);
      setDraft(defaultP);
    }
  }, [address]);

  const handleSave = () => {
    localStorage.setItem(`profile-${address}`, JSON.stringify(draft));
    setProfile(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAvatarUrl = (url: string) => {
    setDraft(d => ({ ...d, avatar: url }));
    setAvatarPreview(url);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setAvatarPreview(url);
      setDraft(d => ({ ...d, avatar: url }));
    };
    reader.readAsDataURL(file);
  };

  if (!connected) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '120px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontSize: '3rem' }}>✍️</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text)', fontWeight: 700 }}>Your Profile</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-3)', fontWeight: 300 }}>
          Connect your wallet to view and edit your profile.
        </p>
        <ConnectButton />
      </div>
    );
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '3px', padding: '10px 14px', fontSize: '0.9rem',
    fontFamily: 'var(--font-body)', color: 'var(--text)', outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-4)',
    letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '6px', display: 'block',
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px' }}>

      {saved && (
        <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '3px', padding: '12px 16px', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#4ade80' }}>✓ Profile saved successfully</p>
        </div>
      )}

      {/* Profile Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '48px', paddingBottom: '32px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>

        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'var(--accent-dim)', border: '2px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', fontSize: '2.2rem', color: 'var(--accent)',
            fontFamily: 'var(--font-display)',
          }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              address.slice(2, 3).toUpperCase()
            )}
          </div>
          {editing && (
            <label style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'var(--accent)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', fontSize: '0.75rem',
            }}>
              📷
              <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text)', fontWeight: 700, marginBottom: '4px' }}>
            {profile.displayName || shortAddr(address)}
          </h1>
          {profile.bio && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-3)', fontWeight: 300, marginBottom: '12px', lineHeight: 1.6 }}>
              {profile.bio}
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-4)' }}>
              {articles.length} article{articles.length !== 1 ? 's' : ''}
            </span>
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none' }}>
                🌐 Website ↗
              </a>
            )}
            {profile.twitter && (
              <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none' }}>
                𝕏 @{profile.twitter.replace('@', '')}
              </a>
            )}
            {profile.telegram && (
              <a href={`https://t.me/${profile.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none' }}>
                ✈️ Telegram
              </a>
            )}
            {profile.discord && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-3)' }}>
                💬 {profile.discord}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {editing ? (
            <>
              <button onClick={handleSave} className="btn-primary" style={{ fontSize: '0.75rem', padding: '10px 20px' }}>Save Profile</button>
              <button onClick={() => { setEditing(false); setDraft(profile); setAvatarPreview(profile.avatar); }} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '10px 16px' }}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '10px 20px' }}>✏️ Edit Profile</button>
              <Link href="/publish" className="btn-primary" style={{ fontSize: '0.75rem', padding: '10px 20px' }}>Write →</Link>
            </>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '32px', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text)', fontWeight: 700, marginBottom: '4px' }}>Edit Profile</h2>

          {/* Avatar URL */}
          <div>
            <label style={labelStyle}>Avatar URL (or upload above)</label>
            <input type="text" placeholder="https://..." value={draft.avatar} onChange={e => handleAvatarUrl(e.target.value)} style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
          </div>

          {/* Display Name */}
          <div>
            <label style={labelStyle}>Display Name</label>
            <input type="text" placeholder="Your name or alias" value={draft.displayName} onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))} style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
          </div>

          {/* Bio */}
          <div>
            <label style={labelStyle}>Bio</label>
            <textarea placeholder="Tell readers about yourself..." value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} rows={3}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
          </div>

          {/* Socials */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {[
              { key: 'website', label: 'Website', placeholder: 'https://yoursite.com' },
              { key: 'twitter', label: 'Twitter / X', placeholder: '@username' },
              { key: 'telegram', label: 'Telegram', placeholder: '@username' },
              { key: 'discord', label: 'Discord', placeholder: 'username#0000' },
            ].map(field => (
              <div key={field.key}>
                <label style={labelStyle}>{field.label}</label>
                <input type="text" placeholder={field.placeholder}
                  value={(draft as any)[field.key]}
                  onChange={e => setDraft(d => ({ ...d, [field.key]: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
              </div>
            ))}
          </div>

          {/* Wallets */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Connected Wallets</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Aptos Address</label>
                <input type="text" value={address} readOnly style={{ ...inputStyle, color: 'var(--text-3)', cursor: 'default' }} />
              </div>
              <div>
                <label style={labelStyle}>Ethereum Address (optional)</label>
                <input type="text" placeholder="0x..." value={draft.ethereum} onChange={e => setDraft(d => ({ ...d, ethereum: e.target.value }))} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Published Articles */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
          Published Articles
        </h2>

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '32px 0' }}>
            <div style={{ width: '14px', height: '14px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-3)' }}>Loading from chain...</span>
          </div>
        )}

        {error && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#ef4444' }}>{error}</p>}

        {!isLoading && articles.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '64px 32px', border: '1px dashed var(--border)', borderRadius: '4px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-3)', marginBottom: '20px', fontWeight: 300 }}>No articles published yet</p>
            <Link href="/publish" className="btn-primary" style={{ fontSize: '0.78rem' }}>Write Your First Article →</Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {articles.sort((a, b) => b.issueNumber - a.issueNumber).map(article => (
            <Link key={article.blobId} href={`/read/${encodeURIComponent(article.blobId)}?author=${address}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '4px', padding: '18px 24px', cursor: 'pointer',
                transition: 'border-color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-4)' }}>Issue #{article.issueNumber}</span>
                    <span className={article.accessTier === 'free' ? 'tag' : 'tag tag-accent'} style={{ fontSize: '0.62rem' }}>
                      {article.accessTier === 'free' ? 'Free' : article.price ? article.price.toFixed(2) + ' APT' : 'Paid'}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text)', fontWeight: 700 }}>
                    {article.title || 'Untitled'}
                  </h3>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', flexShrink: 0 }}>Read →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
