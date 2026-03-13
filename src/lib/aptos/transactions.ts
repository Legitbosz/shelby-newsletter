import { InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { CONTRACT_ADDRESS, FUNCTIONS } from './contracts';

export function buildInitPublicationTx(): InputTransactionData {
  return {
    data: {
      function: FUNCTIONS.INIT_PUBLICATION,
      functionArguments: [],
    },
  };
}

export function buildPublishTx(
  blobId: string,
  title: string,
  preview: string,
  accessTier: string,
  price: number,
  tags: string[]
): InputTransactionData {
  return {
    data: {
      function: FUNCTIONS.PUBLISH_ISSUE,
      functionArguments: [blobId, title, preview, accessTier, price, tags],
    },
  };
}

export function buildSubscribeTx(
  publicationAddress: string,
  tier: string,
  amountInOctas: number
): InputTransactionData {
  return {
    data: {
      function: FUNCTIONS.SUBSCRIBE,
      functionArguments: [publicationAddress, tier, amountInOctas],
    },
  };
}

export function buildWithdrawTx(): InputTransactionData {
  return {
    data: {
      function: FUNCTIONS.WITHDRAW_EARNINGS,
      functionArguments: [],
    },
  };
}
