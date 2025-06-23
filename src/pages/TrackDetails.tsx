
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider"; // Assuming this is for playback, will keep for now
import { Play, Pause, Heart, Share2, ArrowLeft, Coins, Loader2 } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"; // Keep useWriteContract for buyNftWrite
import { useQuery } from '@tanstack/react-query';
// import { parseEther, formatEther, Address } from "ethers"; // formatEther and Address still needed, parseEther might be in useTipArtist
import { formatEther, Address } from "ethers"; // parseEther is in the hook
import { useToast } from "@/hooks/use-toast";
import { ipfsToHttp, cn } from "@/lib/utils"; // Added cn
import {
    useTipArtist,
    useGetListing,
    useListTrackForSale,
    useDelistTrack,
    useBuyTrack,
} from "@/hooks/contracts"; // Import the custom hook
import { useBuyNft } from '@/hooks/useBuyNft'; // Import the new hook
import { Input } from "@/components/ui/input"; // For price input
import { Tag, ShoppingCart, ListX, ShieldCheck } from "lucide-react"; // Icons for new buttons, added ShieldCheck


import musicNftAbi from "@/lib/abi/MusicNFT.json";
// import tipJarAbi from "@/lib/abi/TipJar.json"; // Handled by the hook

const musicNftContractAddress = import.meta.env.VITE_CONTRACT_MUSIC_NFT as Address | undefined;
const tipJarContractAddress = import.meta.env.VITE_CONTRACT_TIP_JAR as Address | undefined;
const trackSaleV2Address = "0x542ba58b04c2f0bb9951b5c226d67c7395b78091" as Address; // Added TrackSaleV2 address

interface NftMetadata {
  name?: string;
  description?: string;
  image?: string; // Should be IPFS URI
  audio?: string; // Should be IPFS URI
  attributes?: { trait_type: string; value: string | number }[];
  properties?: {
    bpm?: string;
    key?: string;
    tags?: string[];
    creator_address?: Address;
    // Add other custom properties your metadata might have
  };
  // Add other fields your metadata might have
  genre?: string; // Example from previous mock
  duration?: string; // Example from previous mock
}

interface NftDetailsContractData {
  minter: Address;
  owner: Address;
  price: bigint;
  totalSupply: bigint;
  soldCount: bigint;
  forSale: boolean;
}


export default function TrackDetails() {
  const { id: tokenIdStr } = useParams();
  const tokenId = tokenIdStr ? BigInt(tokenIdStr) : undefined;
  const { address: userAddress, isConnected } = useAccount();
  const { toast } = useToast();

  // const [nftMetadata, setNftMetadata] = useState<NftMetadata | null>(null); // Replaced by useQuery
  const [nftContractData, setNftContractData] = useState<NftDetailsContractData | null>(null);
  // const [isMetadataLoading, setIsMetadataLoading] = useState(true); // Replaced by useQuery

  // TODO: Replace local isPlaying, progress with useAudio context for actual playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([0]); // Default to 0
  const [isLiked, setIsLiked] = useState(false); // Placeholder for like functionality
  const [tipAmount, setTipAmount] = useState("");
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [listPriceEth, setListPriceEth] = useState("");
  const [isVerifyingBuyEligibility, setIsVerifyingBuyEligibility] = useState(false);


  // Wagmi hooks for write operations
  const { data: buyHash, writeContract: buyNftWrite, isPending: isBuyPendingPrimary, error: buyErrorPrimary } = useWriteContract(); // Renamed for clarity (primary market buy)
  const { isLoading: isBuyConfirmingPrimary, isSuccess: isBuyConfirmedPrimary, error: buyConfirmationErrorPrimary } = useWaitForTransactionReceipt({ hash: buyHash });

  // Use the custom hook for tipping
  const {
    tipArtist: callTipArtistHook,
    tipHash,
    isTipPending,
    tipError,
    // tipStatus,
    isConfirmingTip,
    isTipConfirmed,
    tipConfirmationError
  } = useTipArtist();

  // Hooks for TrackSaleV2 interactions
  const { data: listingPriceWei, isLoading: isLoadingListing, refetch: refetchListing } = useGetListing(tokenId?.toString());
  const { listTrack, currentStep: listTrackStep, isListPending, isConfirmingList, listError, isListConfirmed, resetState: resetListTrackState } = useListTrackForSale(); // Added listTrackStep and reset
  const { delistTrack, isDelistPending, isConfirmingDelist, delistError, isDelistConfirmed } = useDelistTrack();
  const { buyTrack: buyListedTrack, isBuyPending: isBuyListedPending, isConfirmingBuy: isConfirmingBuyListed, buyError: buyListedError, isBuyConfirmed: isBuyListedConfirmed, buyHash: buyListedHash } = useBuyTrack();


  // Instantiate useBuyNft hook
  const {
    isSellerApproved,
    isLoadingSellerApprovalStatus,
    approveSaleContract,
    isLoadingApprovalAction,
    isConfirmedApprovalAction, // To know when approval is done
    approvalError, // To display approval errors
    refetchSellerApproval,
  } = useBuyNft({
    tokenId: tokenId,
    sellerAddress: nftContractData?.owner,
    trackSaleV2Address: trackSaleV2Address,
    musicNftAddress: musicNftContractAddress,
  });

  const isProcessingMarketTx = isListPending || isConfirmingList || isDelistPending || isConfirmingDelist || isBuyListedPending || isConfirmingBuyListed || isLoadingApprovalAction;

  // Refetch seller approval status when an approval action is confirmed or when listing/delisting happens
  useEffect(() => {
    if (isConfirmedApprovalAction || isListConfirmed || isDelistConfirmed) {
      refetchSellerApproval();
      refetchListing(); // Also refetch listing details as it might have changed
    }
  }, [isConfirmedApprovalAction, isListConfirmed, isDelistConfirmed, refetchSellerApproval, refetchListing]);

  // Display toast for approval errors
  useEffect(() => {
    if (approvalError) {
      toast({ title: "Approval Failed", description: approvalError.message, variant: "destructive" });
    }
  }, [approvalError, toast]);

  // Reset list track state if an error occurred during approval that useListTrackForSale might not be aware of
  useEffect(() => {
    if (listTrackStep === "error" && approvalError) {
        // If useListTrackForSale errored and we also have an approvalError from useBuyNft,
        // it's possible the listTrack's internal state needs a reset if it was waiting for an approval
        // that useBuyNft was handling. This is a bit complex due to two hooks managing approvals.
        // For now, direct approval errors are handled by useBuyNft's toasts.
        // useListTrackForSale handles its own errors.
    }
  }, [listTrackStep, approvalError, resetListTrackState])


  // 1. Fetch Token URI
  const { data: tokenUriData, isLoading: isTokenUriLoading, error: tokenUriError } = useReadContract({
    address: musicNftContractAddress,
    abi: musicNftAbi,
    functionName: 'tokenURI',
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId && !!musicNftContractAddress },
  });

  // 2. Fetch NFT On-Chain Details
  const { data: contractDetailsData, isLoading: isContractDetailsLoading, error: contractDetailsError, refetch: refetchContractDetails } = useReadContract({
    address: musicNftContractAddress,
    abi: musicNftAbi,
    functionName: 'getNftDetails', // Using the function from placeholder ABI
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId && !!musicNftContractAddress },
  });

  useEffect(() => {
    if (contractDetailsData) {
      setNftContractData(contractDetailsData as NftDetailsContractData);
    }
  }, [contractDetailsData]);

  // 3. Fetch Metadata from IPFS using useQuery, enabled once tokenURI is available
  const {
    data: nftMetadata,
    isLoading: isMetadataLoading,
    error: metadataError
  } = useQuery<NftMetadata | null, Error>({
    queryKey: ['nftMetadata', tokenId?.toString(), tokenUriData],
    queryFn: async () => {
      if (!tokenUriData || typeof tokenUriData !== 'string') {
        // This case should ideally be handled by `enabled` or throw to be caught by React Query
        return null;
      }
      const response = await fetch(ipfsToHttp(tokenUriData));
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata from ${ipfsToHttp(tokenUriData)}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!tokenUriData && typeof tokenUriData === 'string' && !isTokenUriLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Retry once on failure
  });

  useEffect(() => {
    if (metadataError) {
      toast({ title: "Error", description: `Failed to load NFT metadata: ${metadataError.message}`, variant: "destructive" });
    }
    if (tokenUriError && !isTokenUriLoading) { // Ensure not to toast while initial loading
        toast({ title: "Error", description: `Failed to load token URI: ${tokenUriError.message}`, variant: "destructive" });
    }
  }, [metadataError, tokenUriError, toast, isTokenUriLoading]);

  // Handler for primary market buy (if applicable, from original contract)
  const handleBuyNFTPrimary = () => {
    if (!isConnected || !userAddress) {
      toast({ title: "Connect Wallet", description: "Please connect your wallet to buy.", variant: "destructive" });
      return;
    }
    if (!musicNftContractAddress || !nftContractData || !tokenId) {
      toast({ title: "Error", description: "NFT data not available.", variant: "destructive" });
      return;
    }
    // This logic is for the primary sale via MusicNFT contract's `buy` function
    if (!nftContractData.forSale) {
        toast({ title: "Not for Primary Sale", description: "This NFT is not currently for primary sale.", variant: "destructive" });
        return;
    }
    if (nftContractData.owner === userAddress && nftContractData.minter !== userAddress) { // Check if already owned by someone else
        toast({ title: "Already Owned", description: "You already own this NFT.", variant: "destructive" });
        return;
    }

    buyNftWrite({
      address: musicNftContractAddress,
      abi: musicNftAbi,
      functionName: 'buy', // This is MusicNFT.buy, not TrackSaleV2.buy
      args: [tokenId],
      value: nftContractData.price, // Price from MusicNFT contract details
    });
  };

  // Handlers for TrackSaleV2 interactions
  const handleListTrackForSale = async () => {
    if (!listPriceEth || parseFloat(listPriceEth) <= 0) {
      toast({ title: "Invalid Price", description: "Please enter a valid price greater than 0.", variant: "destructive" });
      return;
    }
    if (!tokenId) return;
    // TODO: Add NFT approval check here before calling listTrack
    await listTrack(tokenId.toString(), listPriceEth);
    setShowPriceInput(false);
  };

  const handleDelistListedTrack = async () => {
    if (!tokenId) return;
    await delistTrack(tokenId.toString());
  };

  const handleBuyListedTrack = async () => {
    if (!listingPriceWei || !tokenId) {
      toast({ title: "Error", description: "Track is not listed or price is unavailable.", variant: "destructive" });
      return;
    }
    if (!isConnected || !userAddress) {
      toast({ title: "Connect Wallet", description: "Please connect your wallet to buy.", variant: "destructive" });
      return;
    }
    setIsVerifyingBuyEligibility(true);
    toast({ title: "Verifying Purchase", description: "Checking latest seller status..." });

    try {
      // Step 1: Refetch contract details to get the latest owner
      const freshContractDetails = await refetchContractDetails();
      if (freshContractDetails.error || !freshContractDetails.data) {
        throw new Error("Failed to fetch latest NFT details. Please try again.");
      }
      const currentOwner = (freshContractDetails.data as NftDetailsContractData).owner;

      // Step 2: Refetch seller approval status for the (potentially new) owner
      // useBuyNft hook will use the latest nftContractData.owner due to component re-render or direct dependency
      // We need to ensure useBuyNft re-evaluates with the new owner if it changed
      // The `sellerAddress` prop to useBuyNft is `nftContractData?.owner`.
      // When `nftContractData` is updated by `setNftContractData` (from `freshContractDetails`),
      // `useBuyNft` should see the new `sellerAddress`. Then `refetchSellerApproval` will use it.

      // It might be safer to pass the new owner directly if possible, or ensure useBuyNft has re-rendered.
      // For now, relying on the useEffect dependency chain and re-render of useBuyNft.
      // Let's ensure nftContractData is set, then call refetchSellerApproval.
      setNftContractData(freshContractDetails.data as NftDetailsContractData); // This will trigger re-render of useBuyNft

      // Give a brief moment for state to propagate and useBuyNft to pick up new sellerAddress if it changed.
      // This is a bit of a hack; a more robust way would be to chain these effects or use a callback.
      // Consider making refetchSellerApproval accept an owner override if this isn't reliable.
      setTimeout(async () => {
        const freshApprovalStatus = await refetchSellerApproval();
        if (freshApprovalStatus.error || typeof freshApprovalStatus.data !== 'boolean') {
          throw new Error("Failed to verify seller approval status. Please try again.");
        }

        if (freshApprovalStatus.data === true) { // isSellerApproved is true
          toast({ title: "Verification Successful", description: "Proceeding with purchase." });
          await buyListedTrack(tokenId.toString(), listingPriceWei);
        } else {
          toast({
            title: "Purchase Blocked",
            description: "Seller approval missing or owner has changed. Please refresh and try again if the item is still available and approved.",
            variant: "destructive",
          });
        }
        setIsVerifyingBuyEligibility(false);
      }, 100); // Small delay for state update

    } catch (error: any) {
      console.error("Error during pre-buy verification:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify purchase eligibility.",
        variant: "destructive",
      });
      setIsVerifyingBuyEligibility(false);
    }
  };


  const handleTipArtist = () => {
    if (!isConnected || !userAddress) {
      toast({ title: "Connect Wallet", description: "Please connect your wallet to tip.", variant: "destructive" });
      return;
    }
    if (!tipJarContractAddress || !nftContractData || !tokenId) {
      toast({ title: "Error", description: "Artist or track data not available for tipping.", variant: "destructive" });
      return;
    }
    const tipValueEth = parseFloat(tipAmount);
    if (isNaN(tipValueEth) || tipValueEth <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid tip amount.", variant: "destructive" });
      return;
    }

    const artistAddressToTip = nftMetadata?.properties?.creator_address || nftContractData.minter;
    if (!artistAddressToTip) {
        toast({ title: "Error", description: "Could not determine artist address for tipping.", variant: "destructive" });
        return;
    }

    // Call the hook's function
    callTipArtistHook(artistAddressToTip, tipAmount);
  };

  // Effects for buy/tip transaction outcomes
  useEffect(() => {
    if (isBuyConfirmedPrimary) {
      toast({ title: "Purchase Successful!", description: `NFT purchased (primary market). Transaction: ${buyHash}` });
      refetchContractDetails();
      refetchListing(); // Also refetch marketplace listing status
    }
    if (buyErrorPrimary || buyConfirmationErrorPrimary) {
      toast({ title: "Primary Purchase Failed", description: (buyErrorPrimary?.message || buyConfirmationErrorPrimary?.message) ?? "Error during primary market purchase.", variant: "destructive" });
    }
  }, [isBuyConfirmedPrimary, buyErrorPrimary, buyConfirmationErrorPrimary, buyHash, toast, refetchContractDetails, refetchListing]);

  useEffect(() => {
    if (isListConfirmed) {
      toast({ title: "Track Listed!", description: "Your track is now listed for sale." });
      refetchListing();
    }
    if (listError) toast({ title: "Listing Failed", description: listError.message, variant: "destructive" });

    if (isDelistConfirmed) {
      toast({ title: "Track Delisted!", description: "Your track has been removed from sale." });
      refetchListing();
    }
    if (delistError) toast({ title: "Delisting Failed", description: delistError.message, variant: "destructive" });

    if (isBuyListedConfirmed) {
      toast({ title: "Purchase Successful!", description: `Track purchased from marketplace. Transaction: ${buyListedHash}` });
      refetchListing();
      refetchContractDetails(); // Owner has changed
    }
    if (buyListedError) toast({ title: "Marketplace Purchase Failed", description: buyListedError.message, variant: "destructive" });

  }, [
    isListConfirmed, listError,
    isDelistConfirmed, delistError,
    isBuyListedConfirmed, buyListedError, buyListedHash,
    toast, refetchListing, refetchContractDetails
  ]);

  useEffect(() => {
    // Adjusted to use states from useTipArtist hook
    if (isTipConfirmed) {
      toast({ title: "Tip Sent!", description: `Successfully tipped ${tipAmount} ETH. Transaction: ${tipHash}` });
      setTipAmount("");
    }
    if (tipError || tipConfirmationError) {
      toast({ title: "Tip Failed", description: (tipError?.message || tipConfirmationError?.message) ?? "Error sending tip.", variant: "destructive" });
    }
  }, [isTipConfirmed, tipError, tipConfirmationError, tipHash, tipAmount, toast]); // tipAmount is still used for the toast message


  const isLoading = isTokenUriLoading || isMetadataLoading || isContractDetailsLoading || isLoadingListing;

  if (isLoading && !nftMetadata && !nftContractData && listingPriceWei === undefined) { // Initial full load, check listingPriceWei too
    return (
      <div className="min-h-screen bg-gradient-dark text-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-dt-primary" />
        <p className="ml-4 text-xl">Loading Track Details...</p> {/* General loading message */}
      </div>
    );
  }

  if (!tokenId) {
    return <div className="min-h-screen bg-gradient-dark text-white flex items-center justify-center"><p>Track ID not found.</p></div>;
  }

  if (!musicNftContractAddress) {
    return <div className="min-h-screen bg-gradient-dark text-white flex items-center justify-center"><p>Music NFT Contract not configured.</p></div>;
  }

  // Display data, handling cases where some parts might still be loading or failed
  const displayTitle = nftMetadata?.name || "Loading title...";
  const displayArtist = nftMetadata?.properties?.creator_address ?
    `${nftMetadata.properties.creator_address.slice(0,6)}...${nftMetadata.properties.creator_address.slice(-4)}`
    : (nftContractData?.minter ? `${nftContractData.minter.slice(0,6)}...${nftContractData.minter.slice(-4)}` : "Loading artist...");
  const displayArtistFull = nftMetadata?.properties?.creator_address || nftContractData?.minter;

  const displayImage = ipfsToHttp(nftMetadata?.image) || "/placeholder.svg";
  const displayDuration = nftMetadata?.duration || "N/A";
  // Primary market price from MusicNFT contract
  const primaryMarketPriceEth = nftContractData?.price ? formatEther(nftContractData.price) : null;
  // Secondary market price from TrackSaleV2 contract
  const secondaryMarketPriceEth = listingPriceWei && listingPriceWei > BigInt(0) ? formatEther(listingPriceWei) : null;

  const displayMintDate = "N/A";
  const displayGenre = nftMetadata?.genre || nftMetadata?.attributes?.find(a => a.trait_type === "Genre")?.value?.toString() || "N/A";

  const displayTotalSupply = nftContractData ? nftContractData.totalSupply.toString() : "N/A";
  const displaySoldCount = nftContractData ? nftContractData.soldCount.toString() : "N/A";
  const displayRemaining = nftContractData ? (nftContractData.totalSupply - nftContractData.soldCount).toString() : "N/A";

  const isOwnedByCurrentUser = userAddress && nftContractData && nftContractData.owner.toLowerCase() === userAddress.toLowerCase();

  // Primary market sale status (from MusicNFT contract)
  const isForPrimarySale = nftContractData?.forSale ?? false;
  const canBuyPrimary = isForPrimarySale && !isOwnedByCurrentUser && nftContractData && nftContractData.soldCount < nftContractData.totalSupply;

  // Secondary market sale status (from TrackSaleV2)
  const isForSecondarySale = !!secondaryMarketPriceEth;
  const canBuySecondary = isForSecondarySale && !isOwnedByCurrentUser;


  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      {/* Header */}
      <header className="px-4 py-3 md:px-6 md:py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/explore" className="flex items-center text-dt-gray-light hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Explore
          </Link>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLiked(!isLiked)}
              className={`${isLiked ? "text-red-500" : "text-dt-gray-light"} hover:text-red-500`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" className="text-dt-gray-light hover:text-white">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Left Column - Artwork and Player */}
          <div className="space-y-6">
            <div className="relative">
              <img
                src={displayImage}
                alt={displayTitle}
                className="w-full aspect-square object-cover rounded-2xl shadow-2xl bg-white/5" // Added bg for loading
              />
              <Button
                onClick={() => setIsPlaying(!isPlaying)} // TODO: Integrate with actual audio playback
                className="absolute bottom-6 right-6 w-16 h-16 bg-dt-primary hover:bg-dt-primary-dark rounded-full"
              >
                {isPlaying ? <Pause className="h-8 w-8 text-white" /> : <Play className="h-8 w-8 text-white ml-1" />}
              </Button>
            </div>

            <div className="glass-card p-4 sm:p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="font-satoshi font-bold text-xl sm:text-2xl mb-1">{displayTitle}</h1>
                  <p className="text-dt-gray-light">{displayArtist}</p>
                </div>
                <span className="text-dt-gray-light text-sm">{displayDuration}</span>
              </div>
              <div className="space-y-2">
                <Slider value={progress} onValueChange={setProgress} max={100} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-dt-gray-light">
                  <span>{/* Current time */}</span>
                  <span>{displayDuration}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Track Info */}
          <div className="space-y-6">
            <div className="glass-card p-4 sm:p-6 rounded-2xl">
              <h2 className="font-satoshi font-bold text-xl mb-4">NFT Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-dt-gray-light">Status</span>
                  {isLoadingListing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {!isLoadingListing && isForSecondarySale && <span className="font-semibold text-green-400">For Sale (Market)</span>}
                  {!isLoadingListing && !isForSecondarySale && isForPrimarySale && <span className="font-semibold text-blue-400">For Sale (Primary)</span>}
                  {!isLoadingListing && !isForSecondarySale && !isForPrimarySale && Number(displayRemaining) > 0 && <span className="font-semibold text-gray-400">Not for Sale</span>}
                  {!isLoadingListing && !isForSecondarySale && !isForPrimarySale && Number(displayRemaining) === 0 && <span className="font-semibold text-red-500">Sold Out</span>}
                </div>

                {(isForSecondarySale || isForPrimarySale) && (
                  <div className="flex justify-between">
                    <span className="text-dt-gray-light">Price</span>
                    <span className="font-semibold text-dt-primary text-lg">
                      {secondaryMarketPriceEth || primaryMarketPriceEth || "N/A"} ETH
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-dt-gray-light">Available (Primary)</span>
                  <span>{displayRemaining} of {displayTotalSupply}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-dt-gray-light">Owner</span>
                  <span className="font-mono text-sm">
                    {nftContractData?.owner ? `${nftContractData.owner.slice(0,6)}...${nftContractData.owner.slice(-4)}` : "Loading..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dt-gray-light">Mint Date</span>
                  <span>{displayMintDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dt-gray-light">Genre</span>
                  <span>{displayGenre}</span>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="mt-6 space-y-3">
                {isLoadingSellerApprovalStatus && isOwnedByCurrentUser && (
                  <div className="flex items-center justify-center text-dt-gray-light">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    <span>Checking approval status...</span>
                  </div>
                )}

                {!isLoadingSellerApprovalStatus && isOwnedByCurrentUser && !isSellerApproved && (
                  <Button
                    className="w-full btn-accent text-base sm:text-lg py-3"
                    onClick={approveSaleContract}
                    disabled={isLoadingApprovalAction || isProcessingMarketTx}
                  >
                    {isLoadingApprovalAction ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                    {isLoadingApprovalAction ? "Approving..." : "Approve Sale Contract"}
                  </Button>
                )}

                {isOwnedByCurrentUser && isSellerApproved && !isForSecondarySale && !showPriceInput && (
                  <Button
                    className="w-full btn-secondary text-base sm:text-lg py-3"
                    onClick={() => setShowPriceInput(true)}
                    disabled={isProcessingMarketTx || isLoadingListing || isLoadingApprovalAction}
                  >
                    {isLoadingListing && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                    {!isLoadingListing && <Tag className="h-5 w-5 mr-2" />}
                    List for Sale
                  </Button>
                )}

                {isOwnedByCurrentUser && isSellerApproved && showPriceInput && (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Set price in ETH"
                      value={listPriceEth}
                      onChange={(e) => setListPriceEth(e.target.value)}
                      className="bg-white/10 border-white/20"
                      disabled={isProcessingMarketTx || isLoadingApprovalAction}
                    />
                    <div className="flex space-x-2">
                      <Button
                        className="flex-1 btn-primary"
                        onClick={handleListTrackForSale}
                        disabled={isProcessingMarketTx || isLoadingApprovalAction || !listPriceEth || parseFloat(listPriceEth) <= 0}
                      >
                        {(isListPending || isConfirmingList) && listTrackStep !== 'approving' && listTrackStep !== 'needsApproval' ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : "Confirm Listing"}
                        {(listTrackStep === 'approving' || listTrackStep === 'needsApproval') && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                        {listTrackStep === 'approving' && "Approving Token..."}
                        {listTrackStep === 'listing' && (isListPending || isConfirmingList) && "Listing..."}
                        {listTrackStep !== 'approving' && listTrackStep !== 'listing' && !(isListPending || isConfirmingList) && "Confirm Listing"}

                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowPriceInput(false)}
                        disabled={isProcessingMarketTx || isLoadingApprovalAction}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {isOwnedByCurrentUser && isForSecondarySale && (
                  <Button
                    className="w-full btn-outline border-red-500 text-red-500 hover:bg-red-500/10 text-base sm:text-lg py-3"
                    onClick={handleDelistListedTrack}
                    disabled={isProcessingMarketTx || isLoadingApprovalAction}
                  >
                    {isDelistPending || isConfirmingDelist ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <ListX className="h-5 w-5 mr-2" />}
                    Delist Track
                  </Button>
                )}

                {!isOwnedByCurrentUser && canBuySecondary && (
                  <>
                    {!isSellerApproved && !isLoadingSellerApprovalStatus && (
                      <p className="text-sm text-center text-yellow-500">
                        The seller needs to approve this contract for sales before you can buy.
                      </p>
                    )}
                    <Button
                      className="w-full btn-primary text-base sm:text-lg py-3"
                      onClick={handleBuyListedTrack}
                      disabled={!isSellerApproved || isProcessingMarketTx || isLoadingListing || isLoadingSellerApprovalStatus || isVerifyingBuyEligibility}
                    >
                      {isVerifyingBuyEligibility && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                      {isVerifyingBuyEligibility && "Verifying..."}
                      {!isVerifyingBuyEligibility && (isBuyListedPending || isConfirmingBuyListed) && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                      {!isVerifyingBuyEligibility && (isBuyListedPending || isConfirmingBuyListed) && "Purchasing..."}
                      {!isVerifyingBuyEligibility && !(isBuyListedPending || isConfirmingBuyListed) && <ShoppingCart className="h-5 w-5 mr-2" />}
                      {!isVerifyingBuyEligibility && !(isBuyListedPending || isConfirmingBuyListed) && `Buy for ${secondaryMarketPriceEth} ETH`}
                    </Button>
                  </>
                )}

                {/* Fallback to primary market buy if not listed on secondary and available */}
                {!isOwnedByCurrentUser && !isForSecondarySale && canBuyPrimary && (
                  <Button
                    className="w-full btn-primary mt-6 text-base sm:text-lg py-3"
                    onClick={handleBuyNFTPrimary}
                    disabled={isBuyPendingPrimary || isBuyConfirmingPrimary}
                  >
                    {isBuyPendingPrimary || isBuyConfirmingPrimary ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Coins className="h-5 w-5 mr-2"/>}
                    {isBuyPendingPrimary || isBuyConfirmingPrimary ? 'Processing...' : `Buy (Primary) for ${primaryMarketPriceEth} ETH`}
                  </Button>
                )}

                {/* Message if owned / not for sale and not owner */}
                {isOwnedByCurrentUser && !isForSecondarySale && !showPriceInput && (
                    <p className="text-center text-dt-gray-light text-sm mt-2">You own this track. List it on the marketplace!</p>
                )}
                 {!isOwnedByCurrentUser && !canBuySecondary && !canBuyPrimary && Number(displayRemaining) > 0 && (
                  <Button className="w-full btn-secondary mt-6 text-base sm:text-lg py-3" disabled>
                    Not currently for sale
                  </Button>
                )}
                {!isOwnedByCurrentUser && !canBuySecondary && !canBuyPrimary && Number(displayRemaining) === 0 && (
                  <Button className="w-full btn-secondary mt-6 text-base sm:text-lg py-3" disabled>
                    Sold Out (Primary)
                  </Button>
                )}
              </div>
            </div>

            <div className="glass-card p-4 sm:p-6 rounded-2xl">
              <h2 className="font-satoshi font-bold text-xl mb-4">Artist</h2>
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={ipfsToHttp(nftMetadata?.properties?.creator_address ? undefined : nftMetadata?.image)} // Placeholder if artist avatar separate from track
                  alt={displayArtist}
                  className="w-16 h-16 rounded-full object-cover bg-white/5"
                />
                <div>
                  <h3 className="font-semibold text-lg">{displayArtist}</h3>
                  <p className="text-dt-gray-light text-sm">Independent Artist</p>
                </div>
              </div>
              {displayArtistFull && (
                <Link to={`/profile/${displayArtistFull}`}> {/* Assuming profile page can take address */}
                  <Button variant="outline" className="w-full mb-4"> View Profile </Button>
                </Link>
              )}
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Tip amount (ETH)"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  disabled={isTipPending || isConfirmingTip} // Use states from useTipArtist hook
                />
                <Button
                  className="btn-primary"
                  onClick={handleTipArtist}
                  disabled={isTipPending || isConfirmingTip || !tipJarContractAddress || !nftContractData?.minter || !displayArtistFull}
                >
                  {isTipPending || isConfirmingTip ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Coins className="h-4 w-4 mr-2" />}
                  {isTipPending ? 'Waiting...' : isConfirmingTip ? 'Sending...' : 'Tip'}
                </Button>
              </div>
            </div>

            <div className="glass-card p-4 sm:p-6 rounded-2xl">
              <h2 className="font-satoshi font-bold text-xl mb-4">Description</h2>
              <p className="text-dt-gray-light leading-relaxed">{nftMetadata?.description || "No description available."}</p>
            </div>

            <div className="glass-card p-4 sm:p-6 rounded-2xl">
              <h2 className="font-satoshi font-bold text-xl mb-4">Metadata</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-dt-gray-light text-sm">BPM</span>
                  <p className="font-semibold">{nftMetadata?.properties?.bpm || "N/A"}</p>
                </div>
                <div>
                  <span className="text-dt-gray-light text-sm">Key</span>
                  <p className="font-semibold">{nftMetadata?.properties?.key || "N/A"}</p>
                </div>
                <div>
                  <span className="text-dt-gray-light text-sm">Royalties</span>
                  <p className="font-semibold">{/* On-chain royalty info if available */ "N/A"}</p>
                </div>
                <div>
                  <span className="text-dt-gray-light text-sm">Tips Received</span>
                  <p className="font-semibold">{/* Tips from TipJar contract if fetched */ "N/A"}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-dt-gray-light text-sm">Contract Address</span>
                <p className="font-mono text-sm break-all">{musicNftContractAddress || "N/A"}</p>
              </div>
               <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-dt-gray-light text-sm">Token ID</span>
                <p className="font-mono text-sm break-all">{tokenId?.toString() || "N/A"}</p>
              </div>
              {nftMetadata?.audio && (
                 <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-dt-gray-light text-sm">Audio IPFS</span>
                    <a href={ipfsToHttp(nftMetadata.audio)} target="_blank" rel="noopener noreferrer" className="font-mono text-sm break-all text-dt-primary hover:underline">
                        {nftMetadata.audio}
                    </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
