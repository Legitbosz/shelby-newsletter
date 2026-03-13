export type AccessTier = 'free' | 'paid' | 'nft_gated' | 'token_gated';

export interface ArticleMetadata {
  title: string;
  preview: string;
  coverImage?: string;
  tags: string[];
  issueNumber: number;
  publicationAddress: string;
  authorAddress: string;
  publishedAt: number; // unix timestamp
  accessTier: AccessTier;
  price?: number; // in APT
}

export interface Article extends ArticleMetadata {
  blobId: string;    // Shelby blob ID
  txHash: string;    // Aptos transaction hash
  content?: string;  // Only populated after access granted
}

export interface ArticleBlob {
  metadata: ArticleMetadata;
  content: string;   // Full markdown content
  audioUrl?: string; // Optional audio blob ID
}
