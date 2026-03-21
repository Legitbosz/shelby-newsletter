import { Account, AptosSettings, Ed25519PrivateKey, Network } from '@aptos-labs/ts-sdk';
import { ShelbyClient } from '@shelby-protocol/sdk/browser';

function getShelbyAccount(): Account {
  const rawKey = process.env.NEXT_PUBLIC_SHELBY_PRIVATE_KEY ?? '';
  const hexKey = rawKey.replace('ed25519-priv-', '');
  const privateKey = new Ed25519PrivateKey(hexKey);
  return Account.fromPrivateKey({ privateKey });
}

function getShelbyClient(): ShelbyClient {
  const apiKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY;
  return new ShelbyClient({
    network: Network.TESTNET,
    apiKey,
    rpc: {
      baseUrl: 'https://api.testnet.shelby.xyz/shelby',
      apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
    },
    indexer: {
      baseUrl: 'https://api.testnet.shelby.xyz/indexer/v1/graphql',
    },
    aptos: {
      network: Network.TESTNET,
      fullnode: 'https://api.testnet.aptoslabs.com/v1',
      indexer: 'https://api.testnet.aptoslabs.com/v1/graphql',
      clientConfig: {
        API_KEY: process.env.NEXT_PUBLIC_APTOS_API_KEY,
      },
    },
  });
}
export interface UploadResult {
  blobName: string;
  uploaderAddress: string;
}

export async function uploadArticle(
  content: string,
  slug: string
): Promise<UploadResult> {
  const client = getShelbyClient();
  const signer = getShelbyAccount();
  const blobName = `articles/${slug}.md`;
  const blobData = new TextEncoder().encode(content);
  // Set expiration to tomorrow — same as CLI "tomorrow" flag
  const expirationMicros = Date.now() * 1000 + 86400_000_000;

  await client.upload({
    blobData,
    signer,
    blobName,
    expirationMicros,
  });

  return {
    blobName,
    uploaderAddress: signer.accountAddress.toString(),
  };
}