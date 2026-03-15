import { InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { FUNCTIONS } from './contracts';

type MoveFunction = `${string}::${string}::${string}`;

export function buildInitPublicationTx(): InputTransactionData {
  return {
    data: {
      function: FUNCTIONS.INIT_PUBLICATION as MoveFunction,
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
      function: FUNCTIONS.PUBLISH_ISSUE as MoveFunction,
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
      function: FUNCTIONS.SUBSCRIBE as MoveFunction,
      functionArguments: [publicationAddress, tier, amountInOctas],
    },
  };
}

export function buildWithdrawTx(): InputTransactionData {
  return {
    data: {
      function: FUNCTIONS.WITHDRAW_EARNINGS as MoveFunction,
      functionArguments: [],
    },
  };
}
