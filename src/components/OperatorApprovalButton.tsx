import React, { useEffect, useState } from 'react';
import { type Address } from 'viem';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import MusicNftAbi from '@/lib/abi/MusicNFT.json'; // Assuming this is the correct path
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast'; // Using ShadCN toast

interface OperatorApprovalButtonProps {
  musicNftAddress: Address | undefined;
  trackSaleAddress: Address | undefined;
  userAddress: Address | undefined; // The owner of the NFTs
  className?: string;
}

export const OperatorApprovalButton: React.FC<OperatorApprovalButtonProps> = ({
  musicNftAddress,
  trackSaleAddress,
  userAddress,
  className,
}) => {
  console.log('OperatorApprovalButton Mounted. Received props:');
  console.log('  musicNftAddress:', musicNftAddress);
  console.log('  trackSaleAddress:', trackSaleAddress);
  console.log('  userAddress (owner):', userAddress);

  const { address: connectedWalletAddress } = useAccount(); // Wallet connected to the dapp

  // State for the approval transaction hash
  const [approvalTxHash, setApprovalTxHash] = useState<Address | undefined>(undefined);

  // 1. Read current approval status
  const {
    data: isCurrentlyApproved,
    isLoading: isLoadingApprovalStatus,
    error: errorLoadingApprovalStatus,
    refetch: refetchApprovalStatus
  } = useReadContract({
    address: musicNftAddress,
    abi: MusicNftAbi.abi,
    functionName: 'isApprovedForAll',
    args: userAddress && trackSaleAddress ? [userAddress, trackSaleAddress] : undefined,
    query: {
      enabled: !!musicNftAddress && !!trackSaleAddress && !!userAddress,
      // staleTime: 1000 * 30, // Optional: refetch status periodically or rely on manual refetch
    },
  });

  // 2. Prepare setApprovalForAll write function
  const {
    writeContract: setApprovalForAll,
    data: writeApprovalData,
    isPending: isApprovalTxPending, // True when user is prompted by wallet
    error: errorSubmittingApprovalTx
  } = useWriteContract();

  // 3. Wait for approval transaction confirmation
  const {
    isLoading: isConfirmingApprovalTx,
    isSuccess: isApprovalTxConfirmed,
    error: errorConfirmingApprovalTx
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  // Effect to update tx hash for useWaitForTransactionReceipt
  useEffect(() => {
    if (writeApprovalData?.hash) {
      setApprovalTxHash(writeApprovalData.hash);
      toast({
        title: 'Approval Transaction Sent',
        description: `Transaction hash: ${writeApprovalData.hash}. Waiting for confirmation...`,
      });
    }
  }, [writeApprovalData]);

  // Effect to handle transaction confirmation or error
  useEffect(() => {
    if (isApprovalTxConfirmed) {
      toast({
        title: 'Approval Updated',
        description: 'Marketplace approval status has been successfully updated.',
      });
      refetchApprovalStatus();
    } else if (errorConfirmingApprovalTx) { // Ensure this is an else if to avoid running after success
      toast({
        title: 'Approval Transaction Failed',
        description: errorConfirmingApprovalTx.message || 'The approval transaction failed to confirm.',
        variant: 'destructive',
      });
      refetchApprovalStatus(); // Also refetch on error to sync UI with on-chain state
    }
  }, [isApprovalTxConfirmed, errorConfirmingApprovalTx, refetchApprovalStatus]);

  // Effect to handle error when submitting tx (e.g. user rejects in wallet)
  useEffect(() => {
    if (errorSubmittingApprovalTx) {
         toast({
            title: 'Approval Submission Error',
            description: errorSubmittingApprovalTx.message || 'Could not submit approval transaction.',
            variant: 'destructive',
        });
    }
  }, [errorSubmittingApprovalTx]);


  const handleToggleApproval = async () => {
    if (!musicNftAddress || !trackSaleAddress || !userAddress) {
      toast({ title: 'Missing Information', description: 'Contract or user address not provided.', variant: 'destructive' });
      return;
    }
    if (connectedWalletAddress !== userAddress) {
        toast({ title: 'Action Not Allowed', description: 'Only the NFT owner can change marketplace approval.', variant: 'destructive' });
        return;
    }

    const newApprovalState = !isCurrentlyApproved;
    setApprovalForAll({
      address: musicNftAddress,
      abi: MusicNftAbi.abi,
      functionName: 'setApprovalForAll',
      args: [trackSaleAddress, newApprovalState],
    });
  };

  const isLoading = isLoadingApprovalStatus || isApprovalTxPending || isConfirmingApprovalTx;
  const buttonText = isCurrentlyApproved ? 'Revoke Marketplace Approval' : 'Approve Marketplace For All NFTs';
  const explanationText = `This action will ${isCurrentlyApproved ? 'revoke permission for' : 'grant permission to'} the marketplace contract (${trackSaleAddress ? trackSaleAddress.slice(0,6)+'...'+trackSaleAddress.slice(-4) : 'N/A'}) to transfer ANY of your NFTs from this collection (${musicNftAddress ? musicNftAddress.slice(0,6)+'...'+musicNftAddress.slice(-4) : 'N/A'}) on your behalf. This is required for listing and selling.`;

  if (!musicNftAddress || !trackSaleAddress || !userAddress) {
    return <div className={className}>Required addresses not provided for approval component.</div>;
  }

  if (errorLoadingApprovalStatus) {
    return (
      <div className={`text-red-500 ${className}`}>
        Error loading approval status: {errorLoadingApprovalStatus.message}
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg space-y-3 ${className}`}>
      <h3 className="font-semibold text-lg">Marketplace Operator Approval</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{explanationText}</p>

      <div>
        <span className="text-sm font-medium">Current Status: </span>
        {isLoadingApprovalStatus && <Loader2 className="h-4 w-4 animate-spin inline-block ml-2" />}
        {!isLoadingApprovalStatus && isCurrentlyApproved !== undefined && (
          <span className={isCurrentlyApproved ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
            {isCurrentlyApproved ? 'Approved' : 'Not Approved'}
          </span>
        )}
         {!isLoadingApprovalStatus && isCurrentlyApproved === undefined && (
            <span className="text-gray-500">Unknown (possibly wrong network or parameters)</span>
        )}
      </div>

      {userAddress === connectedWalletAddress ? (
        <Button
          onClick={handleToggleApproval}
          disabled={isLoading || isCurrentlyApproved === undefined}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? (isConfirmingApprovalTx ? 'Confirming...' : (isApprovalTxPending ? 'Waiting for Wallet...' : 'Loading Status...')) : buttonText}
        </Button>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You are not the owner ({userAddress ? userAddress.slice(0,6)+'...'+userAddress.slice(-4) : 'N/A'}) of these NFTs, so you cannot change this setting.
        </p>
      )}
    </div>
  );
};
