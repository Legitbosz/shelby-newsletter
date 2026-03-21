import type { Metadata } from 'next';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Shelby.News — Own Your Words',
  description: 'Decentralized publishing on Shelby Protocol. Write. Publish. Earn.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
      (function() {
        var t = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', t);
      })();
    ` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <WalletProvider>
          {/* Top ticker */}
          <div className="top-ticker" style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Built on Shelby Protocol
            </span>
            <span style={{ color: 'var(--border-hover)', fontSize: '0.8rem' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--accent)', textTransform: 'uppercase' }} className='ticker-accent'>
              Early Access
            </span>
            <span style={{ color: 'var(--border-hover)', fontSize: '0.8rem' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Writers own everything
            </span>
          </div>

          {/* Nav */}
          <nav className="main-nav" style={{
            borderBottom: '1px solid var(--border)',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: 'rgba(8,8,8,0.94)',
            backdropFilter: 'blur(20px)',
            height: '72px',
            gap: 0,
          }}>
            {/* Logo far left */}
            <Logo />

            {/* Center nav links */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
              <Link href="/read" className="nav-link">Read</Link>
              <Link href="/explore" className="nav-link">Explore</Link>
              <Link href="/publish" className="nav-link">Write</Link>
              <Link href="/profile" className="nav-link">Profile</Link>
            </div>

            {/* Right: theme + wallet */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <ThemeToggle />
              <ConnectButton />
            </div>
          </nav>

          <main style={{ minHeight: '100vh' }}>{children}</main>

          {/* Footer */}
          <footer style={{ borderTop: '1px solid var(--border)', padding: '56px 40px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: 'var(--text)' }}>
                    shelby<span style={{ color: 'var(--accent)' }}>.</span>news
                  </span>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-3)', maxWidth: '280px', lineHeight: 1.7, fontWeight: 300 }}>
                    Decentralized publishing for writers who demand sovereignty over their words and revenue.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <span style={{ }} className='footer-label'>Platform</span>
                    {[['Explore', '/explore'], ['Write', '/publish'], ['Profile', '/profile']].map(([label, href]) => (
                      <Link key={href} href={href} className="footer-link">{label}</Link>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <span style={{ }} className='footer-label'>Stack</span>
                    {[['Shelby Protocol', 'https://shelby.xyz'], ['Aptos', 'https://aptos.dev'], ['GitHub', 'https://github.com/Legitbosz/shelby-newsletter']].map(([label, href]) => (
                      <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="footer-link-accent">{label} ↗</a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ }} className='footer-copy'>
                  © 2026 Shelby.News · All content owned by its authors
                </span>
                <span style={{ }} className='footer-copy'>
                  No platform. No middleman. No compromise.
                </span>
              </div>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
