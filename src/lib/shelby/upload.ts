import shelbyClient from './client';

export interface ShelbyBlob {
  blobId: string;
  size: number;
  contentType: string;
  createdAt: number;
}

export interface UploadOptions {
  accessTier?: 'public' | 'gated';
  contentType?: string;
  onProgress?: (percent: number) => void;
}

/**
 * Upload article content to Shelby hot storage.
 * Returns a blob ID to be stored on-chain via Aptos.
 *
 * TODO: Replace with official Shelby SDK when available:
 * import { ShelbySDK } from '@shelby-xyz/sdk'
 * const blob = await ShelbySDK.upload(payload, { apiKey })
 */
export async function uploadArticleBlob(
  content: string,
  options: UploadOptions = {}
): Promise<ShelbyBlob> {
  const { accessTier = 'gated', contentType = 'application/json' } = options;

  const payload = JSON.stringify({ content, accessTier });

  const response = await fetch(`${shelbyClient.rpcUrl}/v1/blobs`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      Authorization: `Bearer ${shelbyClient.apiKey}`,
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`Shelby upload failed: ${response.statusText}`);
  }

  return response.json() as Promise<ShelbyBlob>;
}
