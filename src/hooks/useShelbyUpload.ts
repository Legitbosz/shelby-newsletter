import { useState, useCallback } from 'react';
import { uploadArticleBlob } from '@/lib/shelby/upload';
import type { ShelbyBlob } from '@/lib/shelby/upload';

interface UploadState {
  isUploading: boolean;
  progress: number;
  blob: ShelbyBlob | null;
  error: string | null;
}

/**
 * Hook to upload article content to Shelby
 * Returns blob ID after successful upload
 */
export function useShelbyUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    blob: null,
    error: null,
  });

  const upload = useCallback(async (content: string): Promise<ShelbyBlob | null> => {
    setState({ isUploading: true, progress: 0, blob: null, error: null });

    try {
      setState(s => ({ ...s, progress: 20 }));

      const blob = await uploadArticleBlob(content, {
        accessTier: 'gated',
        onProgress: (percent) => setState(s => ({ ...s, progress: percent })),
      });

      setState({ isUploading: false, progress: 100, blob, error: null });
      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setState({ isUploading: false, progress: 0, blob: null, error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, blob: null, error: null });
  }, []);

  return { ...state, upload, reset };
}
