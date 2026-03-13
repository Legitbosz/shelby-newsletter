import { useState, useEffect } from 'react';
import aptosClient from '@/lib/aptos/client';
import { FUNCTIONS } from '@/lib/aptos/contracts';
import { buildSubscribeTx, buildPayPerReadTx } from '@/lib/aptos/transactions';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import type { SubscriptionTier } from '@/types/subscription';

/**
 * Hook to check and manage reader subscriptions.
 * Checks on-chain access for a given publication or blob.
 */
export function useSubscription(publicationAddress: string) {
  const { account, signAndSubmitTransaction } = useWallet();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check subscription status on mount
  useEffect(() => {
    if (!account?.address || !publicationAddress) return;

    const checkAccess = async () => {
      setIsChecking(true);
      try {
        const [result] = await aptosClient.view({
          payload: {
            function: FUNCTIONS.CHECK_SUBSCRIPTION,
            functionArguments: [account.address, publicationAddress],
          },
        });
        setHasAccess(Boolean(result));
      } catch {
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [account?.address, publicationAddress]);

  // Subscribe to a publication
  const subscribe = async (tier: SubscriptionTier, amountInApt: number) => {
    if (!account) return;
    setIsSubscribing(true);
    setError(null);

    try {
      const amountInOctas = amountInApt * 1e8;
      const tx = buildSubscribeTx(publicationAddress, tier, amountInOctas);
      await signAndSubmitTransaction(tx);
      setHasAccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Pay per single issue
  const payPerRead = async (blobId: string, amountInApt: number) => {
    if (!account) return;
    setIsSubscribing(true);
    setError(null);

    try {
      const amountInOctas = amountInApt * 1e8;
      const tx = buildPayPerReadTx(blobId, amountInOctas);
      await signAndSubmitTransaction(tx);
      setHasAccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  return {
    hasAccess,
    isChecking,
    isSubscribing,
    error,
    subscribe,
    payPerRead,
  };
}
