import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransactionReceipt } from 'wagmi'; // Corrected import
import { toast } from '@/hooks/use-toast'; // Use ShadCN toast

import MusicNftAbi from '../lib/abi/MusicNFT.json';
import TrackSaleV2Abi from '../lib/abi/TrackSaleV2.json';
import { parseEther } from 'viem'; // Or other utility for handling ether values if needed

interface UseBuyNftProps {
  tokenId: bigint | undefined;
  sellerAddress: `0x${string}` | undefined;
  trackSaleV2Address: `0x${string}` | undefined;
  musicNftAddress: `0x${string}` | undefined;
  price?: bigint; // Assuming price is needed for the buy function
}

export const useBuyNft = ({
  tokenId,
  sellerAddress,
  trackSaleV2Address,
  musicNftAddress,
  price,
}: UseBuyNftProps) => {
  const { address: buyerAddress } = useAccount();
  const [isApproved, setIsApproved] = useState<boolean | undefined>(undefined);
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | undefined>();
  const [buyTxHash, setBuyTxHash] = useState<`0x${string}` | undefined>();

  // 1. Check if TrackSaleV2 contract is approved by the seller
  const { data: isApprovedForAll, isLoading: isLoadingIsApprovedForAll, refetch: refetchApprovalStatus } = useContractRead({
    address: musicNftAddress,
    abi: MusicNftAbi.abi,
    functionName: 'isApprovedForAll',
    args: [sellerAddress, trackSaleV2Address],
    enabled: !!musicNftAddress && !!sellerAddress && !!trackSaleV2Address && sellerAddress === buyerAddress, // Only run if the current user is the seller to approve
  });

  useEffect(() => {
    if (typeof isApprovedForAll === 'boolean') {
      setIsApproved(isApprovedForAll);
    }
  }, [isApprovedForAll]);

  // 2. Approve TrackSaleV2 contract by the seller
  const {
    data: approvalData,
    write: approveSpend,
    isLoading: isLoadingApproval,
    error: errorApproval,
  } = useContractWrite({
    address: musicNftAddress,
    abi: MusicNftAbi.abi,
    functionName: 'setApprovalForAll',
  });

  useEffect(() => {
    let toastId: string | undefined;
    if (approvalData?.hash) {
      setApprovalTxHash(approvalData.hash);
      const { id } = toast({ title: "Approving Contract", description: "Submitting approval to the network..." });
      toastId = id;
    }
    return () => {
      // Potentially dismiss if component unmounts before tx confirmation, though usually not needed
      // if (toastId) toast.dismiss(toastId);
    };
  }, [approvalData]);

  const { isLoading: isConfirmingApproval, isSuccess: isConfirmedApproval } = useWaitForTransaction({
    hash: approvalTxHash,
    onSuccess: (data) => {
      toast({ title: "Approval Confirmed", description: "Sale contract approved successfully.", variant: "default" });
      setIsApproved(true);
      refetchApprovalStatus();
    },
    onError: (error) => {
      toast({ title: "Approval Failed", description: error.message, variant: "destructive" });
    },
    enabled: !!approvalTxHash,
  });

  // 3. Buy NFT from TrackSaleV2 contract
  const {
    data: buyData,
    write: buyNft,
    isLoading: isLoadingBuy,
    error: errorBuy,
  } = useContractWrite({
    address: trackSaleV2Address,
    abi: TrackSaleV2Abi.abi,
    functionName: 'buy',
  });

  useEffect(() => {
    let toastId: string | undefined;
    if (buyData?.hash) {
      setBuyTxHash(buyData.hash);
      const { id } = toast({ title: "Processing Purchase", description: "Submitting purchase to the network..." });
      toastId = id;
    }
    return () => {
      // if (toastId) toast.dismiss(toastId);
    };
  }, [buyData]);

  const { isLoading: isConfirmingBuy, isSuccess: isConfirmedBuy } = useWaitForTransaction({
    hash: buyTxHash,
    onSuccess: (data) => {
      toast({ title: "Purchase Successful!", description: "NFT bought successfully.", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "Purchase Failed", description: error.message, variant: "destructive" });
    },
    enabled: !!buyTxHash,
  });

  const handleApprove = async () => {
    if (!trackSaleV2Address) {
      toast({ title: "Error", description: "TrackSaleV2 address not provided.", variant: "destructive"});
      return;
    }
    if (!approveSpend) {
        toast({ title: "Error", description: "Approve function not ready.", variant: "destructive"});
        return;
    }
    try {
      await approveSpend({ args: [trackSaleV2Address, true] });
    } catch (e: any) {
      console.error("Error calling approveSpend:", e);
      toast({ title: "Approval Error", description: e.message || "An error occurred during approval.", variant: "destructive" });
    }
  };

  const handleBuy = async () => {
    if (tokenId === undefined) {
      toast({ title: "Error", description: "Token ID not provided.", variant: "destructive"});
      return;
    }
    if (!buyNft) {
        toast({ title: "Error", description: "Buy function not ready.", variant: "destructive"});
        return;
    }
    try {
      // Assuming the 'buy' function on TrackSaleV2 takes tokenId and potentially a value (price)
      // Adjust according to your actual contract
      const buyArgs: any[] = [tokenId];
      const txOptions: { value?: bigint } = {};
      if (price !== undefined) {
        txOptions.value = price;
      }
      await buyNft({ args: buyArgs, ...txOptions });

    } catch (e: any) {
      console.error("Error calling buyNft:", e);
      toast({ title: "Purchase Error", description: e.message || "An error occurred during purchase.", variant: "destructive" });
    }
  };

  // This effect ensures that if the component using this hook is for a seller
  // wanting to list/sell an item, it correctly reflects their approval status.
  // For a buyer, isApprovedForAll on the seller's behalf is what matters,
  // but the hook needs to know the context (are we approving as seller, or buying as buyer).
  // The current logic in isApprovedForAll read is:
  // enabled: !!musicNftAddress && !!sellerAddress && !!trackSaleV2Address && sellerAddress === buyerAddress,
  // This means it only checks approval if the current user *is* the seller.
  // This is correct for the *seller's* approval action.
  // For the *buyer*, we need a different check or rely on the UI to pass this state.

  // For the buyer's perspective, the critical information is whether the *seller* has approved the TrackSaleV2 contract.
  // So, the `isApprovedForAll` read should be configured to check `isApprovedForAll(sellerAddress, trackSaleV2Address)`.
  // The current hook structure seems more geared towards the SELLER approving.
  // Let's refine this. The hook should primarily facilitate the BUYER'S action,
  // which depends on the SELLER'S approval.

  // Re-evaluating the isApprovedForAll check for the BUYER's context.
  // The buyer doesn't approve. The seller does.
  // The hook should read the approval status of the SELLER.
  const { data: sellerApprovalStatus, isLoading: isLoadingSellerApprovalStatus, refetch: refetchSellerApproval } = useContractRead({
    address: musicNftAddress,
    abi: MusicNftAbi.abi,
    functionName: 'isApprovedForAll',
    args: [sellerAddress, trackSaleV2Address],
    enabled: !!musicNftAddress && !!sellerAddress && !!trackSaleV2Address, // Check regardless of who the current user is
    // watch: true, // Keep an eye on this, might be useful
  });

  // The `approveSpend` function should only be callable by the seller.
  // The `buyNft` function is callable by the buyer.

  return {
    // Seller's approval status for the TrackSale contract
    isSellerApproved: sellerApprovalStatus,
    isLoadingSellerApprovalStatus,
    refetchSellerApproval,

    // Action for the SELLER to approve the TrackSale contract
    approveSaleContract: handleApprove,
    isLoadingApprovalAction: isLoadingApproval || isConfirmingApproval,
    isConfirmedApprovalAction: isConfirmedApproval,
    approvalError: errorApproval,

    // Action for the BUYER to buy the NFT
    buyNft: handleBuy,
    isLoadingBuyAction: isLoadingBuy || isConfirmingBuy,
    isConfirmedBuyAction: isConfirmedBuy,
    buyError: errorBuy,

    // Direct access to wagmi write functions if needed, though abstracted ones are preferred
    // _rawApproveWrite: approveSpend,
    // _rawBuyWrite: buyNft,
  };
};
