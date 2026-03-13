'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ArticleEditor } from '@/components/editor/ArticleEditor';
import { PublishModal } from '@/components/editor/PublishModal';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useShelbyUpload } from '@/hooks/useShelbyUpload';
import { buildPublishTx } from '@/lib/aptos/transactions';
import type { AccessTier } from '@/types/article';

/**
 * Writer publishing page.
 * Flow: Write → Upload to Shelby → Sign Aptos tx → Done
 */
export default function PublishPage() {
  const { connected, signAndSubmitTransaction, account } = useWallet();
  const { upload, isUploading, progress, error: uploadError } = useShelbyUpload();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blobId, setBlobId] = useState<string | null>(null);
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

    setIsModalOpen(true);
    setBlobId(null);
    setTxHash(null);
    setTxError(null);

    // Step 1: Upload to Shelby
    const blob = await upload(data.content);
    if (!blob) return;

    setBlobId(blob.blobId);

    // Step 2: Register on Aptos
    try {
      const metadata = JSON.stringify({
        title: data.title,
        preview: data.preview,
        tags: data.tags,
        authorAddress: account.address,
      });

      const tx = buildPublishTx(
        blob.blobId,
        data.price ? Math.round(data.price * 1e8) : 0,
        data.accessTier,
        metadata
      );

      const result = await signAndSubmitTransaction(tx);
      setTxHash(result.hash);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

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

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">New Issue</h1>
        <p className="text-white/30 text-sm font-mono">
          Your content will be stored permanently on Shelby Protocol
        </p>
      </div>

      <ArticleEditor
        onPublish={handlePublish}
        isPublishing={isUploading}
      />

      <PublishModal
        isOpen={isModalOpen}
        isUploading={isUploading}
        uploadProgress={progress}
        blobId={blobId}
        txHash={txHash}
        error={uploadError || txError}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
