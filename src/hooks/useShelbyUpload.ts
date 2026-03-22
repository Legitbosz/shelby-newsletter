import { useState, useCallback } from 'react';

interface UploadState {
  isUploading: boolean;
  progress: number;
  blob: { blobId: string } | null;
  error: string | null;
}

export function useShelbyUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false, progress: 0, blob: null, error: null,
  });

  const upload = useCallback(async (content: string): Promise<{ blobId: string } | null> => {
    setState({ isUploading: true, progress: 0, blob: null, error: null });
    try {
      setState(s => ({ ...s, progress: 30 }));
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      setState(s => ({ ...s, progress: 80 }));
      if (!response.ok) throw new Error('Upload failed');
      const blob = await response.json();
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
