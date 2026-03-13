import { useState, useEffect } from 'react';
import aptosClient from '@/lib/aptos/client';
import { FUNCTIONS } from '@/lib/aptos/contracts';
import type { Article } from '@/types/article';

/**
 * Hook to load all published issues for a given author address.
 */
export function usePublications(authorAddress: string) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorAddress) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [result] = await aptosClient.view({
          payload: {
            function: FUNCTIONS.GET_ALL_ISSUES,
            functionArguments: [authorAddress],
          },
        });

        // Parse on-chain result into Article[]
        const parsed = (result as any[]).map((item: any) => ({
          blobId: item.blob_id,
          txHash: item.tx_hash,
          title: item.title,
          preview: item.preview,
          tags: item.tags || [],
          issueNumber: Number(item.issue_number),
          publicationAddress: authorAddress,
          authorAddress,
          publishedAt: Number(item.published_at),
          accessTier: item.access_tier,
          price: item.price ? Number(item.price) / 1e8 : undefined,
        })) as Article[];

        setArticles(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load publications');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [authorAddress]);

  return { articles, isLoading, error };
}
