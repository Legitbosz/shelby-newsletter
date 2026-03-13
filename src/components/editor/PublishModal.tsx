'use client';

interface PublishModalProps {
  isOpen: boolean;
  isUploading: boolean;
  uploadProgress: number;
  blobId?: string | null;
  txHash?: string | null;
  error?: string | null;
  onClose: () => void;
}

/**
 * Modal shown during and after the publish flow:
 * 1. Uploading to Shelby
 * 2. Signing Aptos transaction
 * 3. Success with blob ID + tx hash
 */
export function PublishModal({
  isOpen,
  isUploading,
  uploadProgress,
  blobId,
  txHash,
  error,
  onClose,
}: PublishModalProps) {
  if (!isOpen) return null;

  const isSuccess = !!blobId && !!txHash;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={isSuccess ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-[#111118] border border-white/10 rounded p-8 flex flex-col gap-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-white font-mono tracking-wide">
            {isSuccess ? '✅ Published!' : error ? '❌ Failed' : '📤 Publishing...'}
          </h2>
          <p className="text-xs text-white/40 mt-1">
            {isSuccess
              ? 'Your article is live on Shelby'
              : error
              ? error
              : isUploading
              ? 'Uploading to Shelby hot storage...'
              : 'Waiting for wallet signature...'}
          </p>
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className="bg-pink-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Success details */}
        {isSuccess && (
          <div className="flex flex-col gap-3">
            <div className="bg-white/5 rounded p-3 flex flex-col gap-1">
              <span className="text-xs text-white/40 font-mono">Shelby Blob ID</span>
              <span className="text-xs text-pink-300 font-mono break-all">{blobId}</span>
            </div>
            <div className="bg-white/5 rounded p-3 flex flex-col gap-1">
              <span className="text-xs text-white/40 font-mono">Aptos Tx Hash</span>
              <a
                href={`https://explorer.aptoslabs.com/txn/${txHash}?network=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pink-300 font-mono break-all hover:underline"
              >
                {txHash}
              </a>
            </div>
          </div>
        )}

        {/* Actions */}
        {(isSuccess || error) && (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-sm border border-pink-500/40 text-pink-300 text-sm font-mono tracking-widest uppercase hover:bg-pink-500/10 transition-colors"
          >
            {isSuccess ? 'Done' : 'Try Again'}
          </button>
        )}
      </div>
    </div>
  );
}
