/**
 * Explore / discovery page.
 * TODO: Fetch real publications from on-chain indexer.
 */
export default function ExplorePage() {
  const placeholders = [
    { address: '0xabc...123', name: 'DePIN Weekly', desc: 'Everything happening in decentralized infrastructure.', issues: 12, tags: ['depin', 'infra'] },
    { address: '0xdef...456', name: 'Shelby Research', desc: 'Deep dives into Shelby Protocol architecture and ecosystem.', issues: 7, tags: ['shelby', 'storage'] },
    { address: '0xghi...789', name: 'Aptos Insider', desc: 'Weekly alpha from inside the Aptos ecosystem.', issues: 24, tags: ['aptos', 'defi'] },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white mb-2">Explore</h1>
        <p className="text-white/30 text-sm font-mono">
          Discover publications stored on Shelby Protocol
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {placeholders.map(pub => (
          <div
            key={pub.address}
            className="border border-white/5 bg-white/[0.02] hover:border-pink-500/20 rounded p-5 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-white font-semibold">{pub.name}</h3>
              <span className="text-xs font-mono text-white/25">{pub.issues} issues</span>
            </div>
            <p className="text-white/40 text-sm mb-3">{pub.desc}</p>
            <div className="flex gap-2">
              {pub.tags.map(t => (
                <span key={t} className="text-xs font-mono text-pink-400/50 bg-pink-500/5 border border-pink-500/10 px-2 py-0.5 rounded-sm">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-white/10 text-xs font-mono mt-12">
        On-chain indexer integration coming in Phase 3
      </p>
    </div>
  );
}
