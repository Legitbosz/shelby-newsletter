import { useState, useEffect } from 'react';
import aptosClient from '@/lib/aptos/client';
import { FUNCTIONS, CONTRACT_ADDRESS } from '@/lib/aptos/contracts';
import { buildSubscribeTx } from '@/lib/aptos/transactions';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import type { SubscriptionTier } from '@/types/subscription';

export function useSubscription(publicationAddress: string) {
  const { account, signAndSubmitTransaction } = useWallet();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account?.address || !publicationAddress) return;

    const checkAccess = async () => {
      setIsChecking(true);
      try {
        const [result] = await aptosClient.view({
          payload: {
            function: FUNCTIONS.CHECK_SUBSCRIPTION as `${string}::${string}::${string}`,
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

  const subscribe = async (tier: SubscriptionTier, amountInApt: number) => {
    if (!account) return;
    setIsSubscribing(true);
    setError(null);
    try {
      const tx = buildSubscribeTx(publicationAddress, tier, amountInApt * 1e8);
      await signAndSubmitTransaction(tx);
      setHasAccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  const payPerRead = async (blobId: string, amountInApt: number) => {
    if (!account) return;
    setIsSubscribing(true);
    setError(null);
    try {
      const tx = {
        data: {
          function: `${CONTRACT_ADDRESS}::subscription::pay_per_read` as `${string}::${string}::${string}`,
          functionArguments: [publicationAddress, blobId, Math.round(amountInApt * 1e8)],
        },
      };
      await signAndSubmitTransaction(tx);
      setHasAccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  return { hasAccess, isChecking, isSubscribing, error, subscribe, payPerRead };
}
