'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { ArticleEditor } from '@/components/editor/ArticleEditor';
import { PublishModal } from '@/components/editor/PublishModal';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useShelbyUpload } from '@/hooks/useShelbyUpload';
import { buildInitPublicationTx, buildPublishTx } from '@/lib/aptos/transactions';
import { CONTRACT_ADDRESS } from '@/lib/aptos/contracts';
import type { AccessTier } from '@/types/article';

export default function PublishPage() {
  const { connected, signAndSubmitTransaction, account } = useWallet();
  const { upload, isUploading, progress, error: uploadError } = useShelbyUpload();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blobId, setBlobId] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const handlePublish = async (data: {
    title: string;
    content: string;
    preview: string;
    tags: string[];
    accessTier: AccessTier;
    price?: number;
  }) => {
    if (!account) return;

    // Open modal IMMEDIATELY so user sees progress right away
    setIsModalOpen(true);
    setBlobId(null);
    setBlobUrl(null);
    setTxHash(null);
    setTxError(null);

    // Step 1: Upload to Shelby (encode → register → RPC upload)
    const blob = await upload({
      content: data.content,
      title: data.title,
      tags: data.tags,
    });
    if (!blob) return;

    setBlobId(blob.blobId);
    if (blob.url) setBlobUrl(blob.url);

    // Step 2: Check if publication exists on-chain, init if not
    try {
      const config = new AptosConfig({ network: Network.TESTNET });
      const aptos = new Aptos(config);
      const pubExists = await aptos
        .getAccountResource({
          accountAddress: account.address.toString(),
          resourceType: `${CONTRACT_ADDRESS}::newsletter::Publication`,
        })
        .catch(() => null);

      if (!pubExists) {
        const initTx = buildInitPublicationTx();
        await signAndSubmitTransaction(initTx);
        await new Promise((r) => setTimeout(r, 2000));
      }

      // Step 3: Publish issue on-chain
      const tx = buildPublishTx(
        blob.blobId,
        data.title,
        data.preview || data.content.slice(0, 200),
        data.accessTier,
        data.price ? Math.round(data.price * 1e8) : 0,
        data.tags
      );

      const result = await signAndSubmitTransaction(tx);
      setTxHash(result.hash);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="max-w-xl mx-auto px-6 py-32 text-center flex flex-col items-center gap-6">
        <div className="text-4xl">✍️</div>
        <h1 className="text-2xl font-bold text-white">Ready to write?</h1>
        <p className="text-white/40 text-sm">
          Connect your Aptos wallet to start publishing on Shelby.
        </p>
        <ConnectButton />
      </div>
    );
  }

  // ── Editor ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">New Issue</h1>
        <p className="text-white/30 text-sm font-mono">
          Your content will be stored permanently on Shelby Protocol
        </p>
      </div>

      <ArticleEditor onPublish={handlePublish} isPublishing={isUploading} />

      <PublishModal
        isOpen={isModalOpen}
        isUploading={isUploading}
        uploadProgress={progress}
        blobId={blobId}
        blobUrl={blobUrl}
        txHash={txHash}
        error={uploadError || txError}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
