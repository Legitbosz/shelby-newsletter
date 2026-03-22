import Link from 'next/link';

export default function HomePage() {
  return (
    <div>

      {/* HERO */}
      <section style={{ padding: '100px 48px 80px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(240,88,140,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ marginBottom: '28px' }}>
          <span style={{
            display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
            letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)',
            border: '1px solid var(--accent-border)', background: 'var(--accent-dim)',
            padding: '6px 18px', borderRadius: '2px',
          }}>
            ✦ Built on Shelby Protocol · Early Access
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.0, color: 'var(--text)', marginBottom: '4px', letterSpacing: '-0.03em' }}>
          Write once.
        </h1>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.0, color: 'var(--accent)', marginBottom: '44px', letterSpacing: '-0.03em' }}>
          Own forever.
        </h1>

        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '1.25rem', color: 'var(--text-2)', maxWidth: '580px', margin: '0 auto 52px', lineHeight: 1.8 }}>
          A decentralized newsletter platform where your content lives on Shelby hot storage,
          your subscribers belong to you, and your revenue is 100% yours.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '80px' }}>
          <Link href="/read" className="btn-primary" style={{ fontSize: '0.9rem', padding: '16px 40px' }}>
            Read Articles →
          </Link>
          <Link href="/publish" className="btn-secondary" style={{ fontSize: '0.9rem', padding: '16px 40px' }}>
            Start Writing
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {[
            { value: '100%', label: 'Revenue to writers' },
            { value: '0', label: 'Platform censorship' },
            { value: '👑', label: 'Content ownership' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', padding: '36px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: s.value === '👑' ? '2.8rem' : '3.5rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1, marginBottom: '10px' }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '96px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '52px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>How it works</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--text)', fontWeight: 700 }}>Three steps to sovereignty</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {[
            { n: '01', icon: '✍️', title: 'Write', body: 'Compose your article in our markdown editor. Add images, files, and rich formatting. Your words, your way.' },
            { n: '02', icon: '🚀', title: 'Publish', body: 'Your content uploads to Shelby hot storage instantly. Permanent. Uncensorable. Recorded on Aptos blockchain forever.' },
            { n: '03', icon: '💸', title: 'Earn', body: 'Set your price. Readers pay on-chain. Revenue flows directly to your wallet — instantly, with zero platform fee.' },
          ].map(step => (
            <div key={step.n} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '48px 36px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '28px', right: '28px', fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--accent)', opacity: 0.4 }}>{step.n}</div>
              <div style={{ fontSize: '2.8rem', marginBottom: '24px' }}>{step.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text)', marginBottom: '16px', fontWeight: 700 }}>{step.title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.8, fontWeight: 300 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '1px', background: 'var(--border)', margin: '0 48px' }} />

      {/* FEATURES */}
      <section style={{ padding: '96px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '52px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Features</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--text)', fontWeight: 700 }}>Everything you need, nothing you don't</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {[
            { icon: '🗄️', title: 'Hot Storage', body: 'Every issue stored permanently on Shelby Protocol. Sub-second reads. Zero CDN dependency. No link rot. Ever.' },
            { icon: '💰', title: 'Keep 100% Revenue', body: 'Readers pay on-chain directly to your wallet. No platform cut. No payout thresholds. No delays.' },
            { icon: '🔐', title: 'True Ownership', body: 'Your subscriber list is a smart contract you control. Your archive is immutable on-chain. No deplatforming.' },
            { icon: '⚡', title: 'Pay Per Read', body: 'Readers pay only for what they want. Set per-issue prices or monthly subscriptions. Instant settlement.' },
            { icon: '🎖️', title: 'Founding Members', body: 'Mint NFTs for your biggest supporters. Grant lifetime access. Tradeable on any marketplace.' },
            { icon: '🌐', title: 'Chain Agnostic', body: 'Publish on Aptos. Read from anywhere. Your content is accessible across the entire Web3 ecosystem.' },
          ].map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '36px 32px', transition: 'border-color 0.2s' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '20px' }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1.2rem', color: 'var(--text)', marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-2)', lineHeight: 1.8, fontWeight: 300 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 48px 100px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '80px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(240,88,140,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: 'var(--text)', marginBottom: '20px', lineHeight: 1.15, fontWeight: 700 }}>
            Ready to own your writing?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.15rem', color: 'var(--text-3)', marginBottom: '44px', fontWeight: 300, maxWidth: '500px', margin: '0 auto 44px', lineHeight: 1.8 }}>
            Join writers who believe their words deserve more than platform risk and engagement metrics.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/publish" className="btn-primary" style={{ fontSize: '0.9rem', padding: '16px 44px' }}>
              Start Writing for Free →
            </Link>
            <Link href="/read" className="btn-secondary" style={{ fontSize: '0.9rem', padding: '16px 44px' }}>
              Browse Articles
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
