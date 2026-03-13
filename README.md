# 📰 Shelby Newsletter — Decentralized Publishing Protocol

> A Substack alternative where writers own everything. Built on Shelby hot storage + Aptos blockchain.

![License](https://img.shields.io/badge/license-MIT-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%20%2B%20Aptos-pink)
![Status](https://img.shields.io/badge/status-MVP%20in%20progress-yellow)

---

## 🧠 What Is This?

Shelby Newsletter is an on-chain publishing platform where:

- Writers publish articles stored permanently on **Shelby decentralized hot storage**
- Readers pay per issue or subscribe via **Aptos smart contracts**
- Revenue flows **100% to the writer** — no platform cut
- Content is **permanently accessible** — no deplatforming, no link rot
- Subscriber lists are **on-chain** — writers own their audience forever

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Blockchain | Aptos (Move smart contracts) |
| Storage | Shelby Protocol (shelby.xyz) |
| Wallet | Aptos Wallet Adapter (Petra, Martian) |
| Content | Markdown / MDX |
| Auth | Wallet-based (no email required) |

---

## 📁 Project Structure

```
shelby-newsletter/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── page.tsx                # Home / discovery feed
│   │   ├── publish/page.tsx        # Writer publishing interface
│   │   ├── read/[blobId]/page.tsx  # Reader article view
│   │   ├── explore/page.tsx        # Discover publications
│   │   └── profile/[address]/page.tsx
│   │
│   ├── components/
│   │   ├── editor/
│   │   │   ├── ArticleEditor.tsx   # Markdown editor for writers
│   │   │   ├── PublishModal.tsx    # Set price + publish to Shelby
│   │   │   └── PreviewPane.tsx     # Live markdown preview
│   │   ├── reader/
│   │   │   ├── ArticleView.tsx     # Full article renderer
│   │   │   ├── PaywallGate.tsx     # Access check + payment prompt
│   │   │   └── IssueCard.tsx       # Preview card for listings
│   │   ├── wallet/
│   │   │   ├── ConnectButton.tsx   # Wallet connection UI
│   │   │   └── WalletProvider.tsx  # Aptos wallet adapter wrapper
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Badge.tsx
│   │
│   ├── lib/
│   │   ├── shelby/
│   │   │   ├── client.ts           # Shelby SDK wrapper
│   │   │   ├── upload.ts           # Upload article blob to Shelby
│   │   │   ├── fetch.ts            # Fetch blob by ID
│   │   │   └── types.ts            # Blob metadata types
│   │   ├── aptos/
│   │   │   ├── client.ts           # Aptos client setup
│   │   │   ├── contracts.ts        # Contract addresses + ABIs
│   │   │   └── transactions.ts     # Publish, subscribe, pay txs
│   │   └── utils/
│   │       ├── markdown.ts
│   │       └── format.ts
│   │
│   ├── hooks/
│   │   ├── useShelbyUpload.ts
│   │   ├── useShelbyFetch.ts
│   │   ├── useSubscription.ts
│   │   └── usePublications.ts
│   │
│   └── types/
│       ├── article.ts
│       ├── publication.ts
│       └── subscription.ts
│
├── contracts/
│   └── sources/
│       ├── newsletter.move         # Main newsletter smart contract
│       └── subscription.move       # Subscription + payment logic
│
├── .env.example
├── next.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Petra or Martian wallet (Aptos)
- Shelby DevNet SDK access (apply at shelby.xyz)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/shelby-newsletter
cd shelby-newsletter
npm install
cp .env.example .env.local
npm run dev
```

### Environment Variables

```bash
NEXT_PUBLIC_APTOS_NETWORK=devnet
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_SHELBY_RPC_URL=https://rpc.shelby.xyz
SHELBY_API_KEY=your_shelby_api_key
```

---

## 📋 MVP Roadmap

### Phase 1 — Publish + Read Flow (Current)
- [ ] Connect Aptos wallet
- [ ] Write article in markdown editor
- [ ] Upload article blob to Shelby
- [ ] Store blob ID + metadata on Aptos
- [ ] Fetch and render article by blob ID
- [ ] Public preview vs full content split

### Phase 2 — Payments & Subscriptions
- [ ] Pay-per-issue (single read access)
- [ ] Monthly subscription (streaming payments)
- [ ] Founding Member NFT mint
- [ ] Revenue dashboard for writers

### Phase 3 — Discovery & Social
- [ ] Publication profile pages
- [ ] Explore / discovery feed
- [ ] On-chain subscriber counts
- [ ] Cross-chain support (ETH, SOL)

---

## 🔑 Core Flow

```
Writer                    Shelby              Aptos
  │                         │                   │
  ├── Write article          │                   │
  ├── Upload blob ──────────►│                   │
  │◄─ Receive blob_id ───────│                   │
  ├── Publish tx ────────────────────────────────►│
  │                         │                   │
Reader                      │                   │
  ├── Check access ──────────────────────────────►│
  ├── Pay for access ────────────────────────────►│
  ├── Fetch blob ───────────►│                   │
  │◄─ Receive content ───────│                   │
  └── Read article           │                   │
```

---

## 📄 Smart Contracts

### `newsletter.move`
- `publish_issue(blob_id, price, access_tier, metadata)`
- `get_publication(author_address)`
- `verify_access(reader_address, blob_id)`

### `subscription.move`
- `subscribe(publication_address, tier)`
- `check_subscription(reader, publication)`
- `withdraw_earnings(author_address)`

---

## 📜 License

MIT — build freely, own everything.

> Built on [Shelby Protocol](https://shelby.xyz) · Powered by [Aptos](https://aptos.dev)
