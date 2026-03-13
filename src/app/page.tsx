import Link from 'next/link';

/**
 * Home page — hero + feature highlights.
 * TODO: Add live publication feed from on-chain data.
 */
export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="px-6 py-28 max-w-4xl mx-auto w-full text-center">
        <div className="inline-block border border-pink-500/30 text-pink-400 text-xs font-mono px-3 py-1 rounded-sm mb-8 tracking-widest uppercase">
          Built on Shelby Protocol · Early Access
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white leading-none mb-6 tracking-tight">
          Write once.
          <br />
          <span className="text-pink-500">Own forever.</span>
        </h1>

        <p className="text-white/40 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          A decentralized newsletter platform where your content lives on Shelby hot storage,
          your subscribers belong to you, and your revenue arrives instantly on-chain.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/publish"
            className="px-8 py-3 bg-pink-500 text-black font-bold text-sm rounded-sm tracking-wide hover:bg-pink-400 transition-colors"
          >
            Start Writing →
          </Link>
          <Link
            href="/explore"
            className="px-8 py-3 border border-white/10 text-white/60 font-mono text-sm rounded-sm tracking-wide hover:border-white/20 hover:text-white/80 transition-colors"
          >
            Explore Publications
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 px-6 py-20 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🗄',
              title: 'Hot Storage',
              body: 'Every issue stored permanently on Shelby Protocol. Sub-second reads. Zero CDN dependency. No link rot. Ever.',
            },
            {
              icon: '💰',
              title: 'You Keep 100%',
              body: 'Readers pay on-chain. Revenue flows directly to your wallet. No platform cut. No payout thresholds. No delays.',
            },
            {
              icon: '🔑',
              title: 'You Own Everything',
              body: 'Your subscriber list is a smart contract you control. Your archive is immutable on-chain. No one can deplatform you.',
            },
            {
              icon: '⚡',
              title: 'Pay Per Read',
              body: 'Readers pay only for what they want. Set per-issue prices or monthly subscriptions. Micropayments settle instantly.',
            },
            {
              icon: '🎖',
              title: 'Founding Members',
              body: 'Mint NFTs for your biggest supporters. Lifetime access. Tradeable. Your early readers become stakeholders.',
            },
            {
              icon: '🌐',
              title: 'Chain Agnostic',
              body: 'Publish on Aptos. Read from Ethereum. Subscribe from Solana. Your content is accessible across the entire ecosystem.',
            },
          ].map(f => (
            <div
              key={f.title}
              className="border border-white/5 bg-white/[0.02] rounded p-6 hover:border-pink-500/20 transition-colors"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
