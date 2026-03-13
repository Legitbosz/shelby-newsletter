import { useState, useCallback } from 'react';
import { fetchArticleBlob } from '@/lib/shelby/fetch';

interface FetchState {
  isFetching: boolean;
  content: string | null;
  error: 'ACCESS_DENIED' | 'FETCH_FAILED' | null;
}

/**
 * Hook to fetch article content from Shelby by blob ID.
 * Handles access-gated content and free content.
 */
export function useShelbyFetch() {
  const [state, setState] = useState<FetchState>({
    isFetching: false,
    content: null,
    error: null,
  });

  const fetch = useCallback(async (
    blobId: string,
    accessToken?: string
  ): Promise<string | null> => {
    setState({ isFetching: true, content: null, error: null });

    try {
      const content = await fetchArticleBlob(blobId, accessToken);
      setState({ isFetching: false, content, error: null });
      return content;
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      const error = message === 'ACCESS_DENIED' ? 'ACCESS_DENIED' : 'FETCH_FAILED';
      setState({ isFetching: false, content: null, error });
      return null;
    }
  }, []);

  return { ...state, fetch };
}
