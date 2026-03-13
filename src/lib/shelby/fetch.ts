import shelbyClient from './client';

/**
 * Fetch article content from Shelby by blob ID.
 * Pass accessToken if content is gated (paid tier).
 * Throws 'ACCESS_DENIED' if reader hasn't paid.
 */
export async function fetchArticleBlob(
  blobId: string,
  accessToken?: string
): Promise<string> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${shelbyClient.apiKey}`,
  };

  if (accessToken) {
    headers['X-Access-Token'] = accessToken;
  }

  const response = await fetch(
    `${shelbyClient.rpcUrl}/v1/blobs/${blobId}`,
    { headers }
  );

  if (response.status === 403) {
    throw new Error('ACCESS_DENIED');
  }

  if (!response.ok) {
    throw new Error(`Shelby fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content as string;
}
