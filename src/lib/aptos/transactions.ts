import { InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { FUNCTIONS } from './contracts';
import type { AccessTier } from '@/types/article';
import type { SubscriptionTier } from '@/types/subscription';

/**
 * Build publish_issue transaction
 * Called after uploading blob to Shelby — stores blob ID on-chain
 */
export function buildPublishTx(
  blobId: string,
  price: number,
  accessTier: AccessTier,
  metadataJson: string
): InputTransactionData {
  return {
    data: {
      function: FUNCTIONS.PUBLISH_ISSUE,
      functionArguments: [blobId, price, accessTier, metadataJson],
    },
  };
}

/**
 * Build subscribe transaction
 * Reader pays to access a publication
 */
export function buildSubscribeTx(
  publicationAddress: string,
  tier: SubscriptionTier,
  amountInOctas: number
): InputTransactionData {
  return {
    data: {
      function: FUNCTIONS.SUBSCRIBE,
      functionArguments: [publicationAddress, tier, amountInOctas],
    },
  };
}

/**
 * Build pay-per-issue transaction
 * One-time access purchase for a single article blob
 */
export function buildPayPerReadTx(
  blobId: string,
  amountInOctas: number
): InputTransactionData {
  return {
    data: {
      function: FUNCTIONS.VERIFY_ACCESS,
      functionArguments: [blobId, amountInOctas],
    },
  };
}

/**
 * Build withdraw earnings transaction
 * Writer claims accumulated revenue
 */
export function buildWithdrawTx(): InputTransactionData {
  return {
    data: {
      function: FUNCTIONS.WITHDRAW_EARNINGS,
      functionArguments: [],
    },
  };
}
