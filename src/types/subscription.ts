export type SubscriptionTier = 'free' | 'monthly' | 'annual' | 'founding';

export interface Subscription {
  readerAddress: string;
  publicationAddress: string;
  tier: SubscriptionTier;
  startedAt: number;
  expiresAt?: number;    // undefined = lifetime (founding member)
  nftTokenId?: string;   // for founding member NFT holders
}
