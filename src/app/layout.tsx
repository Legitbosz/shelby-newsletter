import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import Link from 'next/link';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Shelby Newsletter — Own Your Words',
  description: 'Decentralized publishing on Shelby Protocol. Write. Publish. Earn.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-[#0a0a0f] text-white min-h-screen antialiased">
        <WalletProvider>
          {/* Nav */}
          <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-sm">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-pink-500 font-mono font-bold text-lg tracking-tight">
                shelby<span className="text-white/30">.</span>news
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/explore"
                className="text-xs font-mono text-white/40 hover:text-white/70 transition-colors tracking-widest uppercase"
              >
                Explore
              </Link>
              <Link
                href="/publish"
                className="text-xs font-mono text-white/40 hover:text-white/70 transition-colors tracking-widest uppercase"
              >
                Write
              </Link>
              <ConnectButton />
            </div>
          </nav>

          {/* Page content */}
          <main className="min-h-screen">{children}</main>

          {/* Footer */}
          <footer className="border-t border-white/5 px-6 py-8 flex items-center justify-between">
            <span className="text-xs font-mono text-white/20">
              Built on{' '}
              <a
                href="https://shelby.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400/60 hover:text-pink-400 transition-colors"
              >
                Shelby Protocol
              </a>{' '}
              ·{' '}
              <a
                href="https://aptos.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400/60 hover:text-pink-400 transition-colors"
              >
                Aptos
              </a>
            </span>
            <span className="text-xs font-mono text-white/10">
              Writers own everything.
            </span>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
