import { useState, useEffect } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { CONTRACT_ADDRESS } from '@/lib/aptos/contracts';
import type { Article } from '@/types/article';

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
        const config = new AptosConfig({ network: Network.TESTNET });
        const aptos = new Aptos(config);

        const resource = await aptos.getAccountResource({
          accountAddress: authorAddress,
          resourceType: `${CONTRACT_ADDRESS}::newsletter::Publication`,
        }) as any;

        const parsed: Article[] = (resource?.issues || []).map((item: any) => ({
          blobId: item.blob_id,
          txHash: '',
          title: item.title,
          preview: item.preview,
          tags: item.tags || [],
          issueNumber: Number(item.issue_number),
          publicationAddress: authorAddress,
          authorAddress,
          publishedAt: Number(item.published_at),
          accessTier: item.access_tier,
          price: item.price ? Number(item.price) / 1e8 : undefined,
        }));

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
