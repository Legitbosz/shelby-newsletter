export interface ShelbyBlob {
  blobId: string;
  size: number;
  contentType: string;
  createdAt: number;
  mock?: boolean;
  warning?: string;
}

export interface UploadOptions {
  accessTier?: 'public' | 'gated';
  contentType?: string;
  title?: string;
  tags?: string[];
  onProgress?: (percent: number) => void;
}

export async function uploadArticleBlob(
  content: string,
  options: UploadOptions = {}
): Promise<ShelbyBlob> {
  const { title, tags, onProgress } = options;

  onProgress?.(30);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, title, tags }),
  });

  onProgress?.(80);

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const blob = await response.json();
  onProgress?.(100);

  if (blob.mock) {
    console.warn('Mock blob ID - Shelby network unavailable:', blob.warning);
  }

  return blob as ShelbyBlob;
}
