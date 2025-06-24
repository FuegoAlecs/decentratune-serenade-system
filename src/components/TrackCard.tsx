import { Play, Heart, MoreHorizontal, Coins, Download, Check, Tag, ShoppingCart, ListX, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // For price input
import { useState, useEffect } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { Link } from "react-router-dom";
import { useAccount, useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { formatEther, parseEther } from "ethers"; // viem's formatEther, parseEther
import {
    useGetListing,
    useListTrackForSale,
    useDelistTrack,
    useBuyTrack
} from "@/hooks/contracts"; // Import the new hooks
import { useToast } from "@/components/ui/use-toast"; // For notifications

// Placeholder - this should ideally come from a config file or environment variable
const TRACK_SALE_CONTRACT_ADDRESS = "0xYourTrackSaleContractAddressHere" as `0x${string}`;

// Minimal ABI for ERC721/ERC1155 isApprovedForAll and setApprovalForAll
const erc721ApprovalAbi = [
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "operator", "type": "address" }
    ],
    "name": "isApprovedForAll",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "operator", "type": "address" },
      { "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  }
] as const;

interface TrackCardProps {
  id: string; // Token ID (tokenId)
  musicNftAddress: `0x${string}`; // Address of the NFT contract
  title: string;
  artist: string;
  ownerAddress?: string;
  image?: string;
  audioUrl?: string;
  duration?: string;
  plays?: number;
  isNFT?: boolean;
  mintStatus?: "Available" | "Limited" | "Sold Out";
}

export function TrackCard({
  id,
  musicNftAddress,
  title,
  artist,
  ownerAddress,
  image = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
  audioUrl,
  duration = "0:00",
  plays,
  isNFT,
  mintStatus,
}: TrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [listPriceEth, setListPriceEth] = useState("");

  const { playTrack, currentTrack, isPlaying, isLoading: isAudioLoading } = useAudio();
  const { address: connectedAddress, isConnected } = useAccount();
  const { toast } = useToast();

  const isOwned = !!connectedAddress && !!ownerAddress && connectedAddress.toLowerCase() === ownerAddress.toLowerCase();

  // Approval status for TrackSale operator
  const {
    data: isOperatorApproved,
    isLoading: isLoadingApprovalStatus,
    error: errorApprovalStatus,
    refetch: refetchApprovalStatus
  } = useContractRead({
    address: musicNftAddress,
    abi: erc721ApprovalAbi,
    functionName: 'isApprovedForAll',
    args: [connectedAddress!, TRACK_SALE_CONTRACT_ADDRESS],
    enabled: isConnected && !!connectedAddress && isOwned && !!musicNftAddress, // Only run if connected, owner, and NFT address is valid
    watch: true,
  });

  const { data: listingPriceWei, isLoading: isLoadingListing, refetch: refetchListing } = useGetListing(id);

  const { listTrack, isListPending, isConfirmingList, listError, isListConfirmed } = useListTrackForSale();
  const { delistTrack, isDelistPending, isConfirmingDelist, delistError, isDelistConfirmed } = useDelistTrack();
  const { buyTrack, isBuyPending, isConfirmingBuy, buyError, isBuyConfirmed } = useBuyTrack();

  // --- Approve Operator Logic ---
  const { config: approveConfig, error: prepareApproveError } = usePrepareContractWrite({
    address: musicNftAddress,
    abi: erc721ApprovalAbi,
    functionName: 'setApprovalForAll',
    args: [TRACK_SALE_CONTRACT_ADDRESS, true],
    enabled: isConnected && isOwned && musicNftAddress && isOperatorApproved === false,
  });
  const { data: approveData, write: approveMarketplace, isLoading: isApprovingMarketplace, error: approveError } = useContractWrite(approveConfig);
  const { isLoading: isWaitingForApproveTx, isSuccess: isApproveSuccess, error: approveTxError } = useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess: () => {
      toast({ title: "Approval Successful", description: "Marketplace is now approved." });
      refetchApprovalStatus();
    },
    onError: (err) => {
      toast({ title: "Approval Error", description: err.message, variant: "destructive" });
    }
  });

  const isProcessingApproval = isApprovingMarketplace || isWaitingForApproveTx;
  const approvalHookError = prepareApproveError || approveError || approveTxError;
  // --- End Approve Operator Logic ---

  // --- Revoke Operator Logic ---
  const { config: revokeConfig, error: prepareRevokeError } = usePrepareContractWrite({
    address: musicNftAddress,
    abi: erc721ApprovalAbi,
    functionName: 'setApprovalForAll',
    args: [TRACK_SALE_CONTRACT_ADDRESS, false],
    enabled: isConnected && isOwned && musicNftAddress && isOperatorApproved === true,
  });
  const { data: revokeData, write: revokeMarketplace, isLoading: isRevokingMarketplace, error: revokeError } = useContractWrite(revokeConfig);
  const { isLoading: isWaitingForRevokeTx, isSuccess: isRevokeSuccess, error: revokeTxError } = useWaitForTransaction({
    hash: revokeData?.hash,
    onSuccess: () => {
      toast({ title: "Revoke Successful", description: "Marketplace approval has been revoked." });
      refetchApprovalStatus();
    },
    onError: (err) => {
      toast({ title: "Revoke Error", description: err.message, variant: "destructive" });
    }
  });

  const isProcessingRevoke = isRevokingMarketplace || isWaitingForRevokeTx;
  const revokeHookError = prepareRevokeError || revokeError || revokeTxError;
  // --- End Revoke Operator Logic ---

  const isProcessingTx = isListPending || isConfirmingList || isDelistPending || isConfirmingDelist || isBuyPending || isConfirmingBuy || isProcessingApproval || isProcessingRevoke;

  useEffect(() => {
    if (isListConfirmed || isDelistConfirmed || isBuyConfirmed) {
      toast({ title: "Transaction Confirmed", description: "Your transaction has been confirmed." });
      refetchListing();
    }
    // Errors for listing/delisting/buying are handled by individual hooks if they set specific error states
    // For now, relying on the toast notifications from the hooks themselves or the generic tx error.
    if (listError) toast({ title: "Listing Error", description: listError.message, variant: "destructive" });
    if (delistError) toast({ title: "Delisting Error", description: delistError.message, variant: "destructive" });
    if (buyError) toast({ title: "Purchase Error", description: buyError.message, variant: "destructive" });
    if (approvalHookError) toast({ title: "Approve Action Error", description: approvalHookError.message, variant: "destructive"})
    if (revokeHookError) toast({ title: "Revoke Action Error", description: revokeHookError.message, variant: "destructive"})


  }, [isListConfirmed, isDelistConfirmed, isBuyConfirmed, listError, delistError, buyError, approvalHookError, revokeHookError, toast, refetchListing]);

  const isCurrentTrackPlaying = currentTrack?.id === id && isPlaying;
  const isCurrentTrackLoading = currentTrack?.id === id && isAudioLoading;

  const handlePlay = () => {
    if (!audioUrl) {
      toast({ title: "Playback Error", description: "No audio URL available for this track.", variant: "destructive" });
      return;
    }
    const trackForPlayer = {
      id, title, artist, image, duration,
      fullUrl: audioUrl,
      previewUrl: isOwned ? undefined : audioUrl,
      isNFT, isOwned
    };
    playTrack(trackForPlayer, !isOwned);
  };

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 600);
    }
  };

  const handleMint = () => { // Original mint logic placeholder
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
    toast({title: "Minting soon!", description: "This action will be connected to the primary minting contract."});
  };

  const handleListTrack = async () => {
    if (!listPriceEth || parseFloat(listPriceEth) <= 0) {
      toast({ title: "Invalid Price", description: "Please enter a valid price greater than 0.", variant: "destructive" });
      return;
    }
    await listTrack(id, listPriceEth);
    setShowPriceInput(false);
  };

  const handleDelistTrack = async () => {
    await delistTrack(id);
  };

  const handleBuyTrack = async () => {
    if (!listingPriceWei) {
      toast({ title: "Error", description: "Track is not listed for sale or price is unavailable.", variant: "destructive" });
      return;
    }
    await buyTrack(id, listingPriceWei);
  };

  return (
    <div
      className="track-card group relative p-3 sm:p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-light-accent-primary dark:bg-dark-accent-primary rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="relative mb-3 sm:mb-4">
        <img 
          src={image} 
          alt={title}
          className="w-full aspect-square bg-accent-gradient-light dark:bg-accent-gradient-dark rounded-lg sm:rounded-xl object-cover"
        />
        <div
          className={`absolute inset-0 bg-black/30 dark:bg-black/50 rounded-lg sm:rounded-xl flex items-center justify-center transition-opacity duration-300 ${isHovered || isCurrentTrackPlaying || isCurrentTrackLoading ? 'opacity-100' : 'opacity-0'}`}
        >
          <Button 
            onClick={handlePlay}
            disabled={isCurrentTrackLoading}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white hover:bg-gray-200 dark:bg-dark-card-surface dark:hover:bg-dark-borders-lines rounded-full hover:scale-110 transition-all duration-200"
            aria-label="Play track"
          >
            {isCurrentTrackLoading ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-light-text-primary dark:border-dark-text-primary border-t-transparent rounded-full animate-spin" />
            ) : isCurrentTrackPlaying ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-light-text-primary dark:border-dark-text-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="h-5 w-5 sm:h-6 sm:h-6 text-light-text-primary dark:text-dark-text-primary ml-0.5" />
            )}
          </Button>
        </div>

        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col space-y-1 sm:space-y-2">
          {isNFT && (
            <div className="bg-light-accent-primary dark:bg-dark-accent-primary text-white px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium">NFT</div>
          )}
          {isOwned && (
            <div className="bg-light-success dark:bg-dark-success text-white px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium flex items-center">
              <Check className="h-3 w-3 mr-1" />Owned
            </div>
          )}
          {mintStatus && (
            <div className={`text-white px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium ${
              mintStatus === "Sold Out" ? "bg-light-error dark:bg-dark-error" :
              mintStatus === "Limited" ? "bg-yellow-500" : "bg-light-success dark:bg-dark-success"}`}
            >
              {mintStatus}
            </div>
          )}
        </div>

        {isOwned && (
          <Button
            variant="ghost" size="icon"
            className="absolute top-2 left-2 sm:top-3 sm:left-3 text-white bg-black/40 dark:bg-black/60 hover:bg-black/60 dark:hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 sm:p-2 rounded-full"
            aria-label="Download track"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <Link to={`/track/${id}`}>
              <h3 className="font-satoshi font-semibold text-light-text-primary dark:text-dark-text-primary truncate hover:text-light-accent-primary dark:hover:text-dark-accent-primary transition-colors text-sm sm:text-base">
                {title}
              </h3>
            </Link>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-xs sm:text-sm truncate hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors cursor-pointer">
              {artist}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1.5 sm:p-2" aria-label="More options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
            <span className="text-light-text-secondary dark:text-dark-text-secondary">{duration}</span>
            {plays !== undefined && <span className="text-light-text-secondary dark:text-dark-text-secondary">{plays.toLocaleString()} plays</span>}
            {isLoadingListing && <Loader2 className="h-4 w-4 animate-spin" />}
            {!isLoadingListing && listingPriceWei && listingPriceWei > BigInt(0) && (
              <span className="text-light-accent-primary dark:text-dark-accent-primary font-semibold">
                {formatEther(listingPriceWei)} ETH
              </span>
            )}
          </div>

          <div className="flex flex-col items-end space-y-2 mt-2 sm:mt-0 w-full sm:w-auto"> {/* Ensure this div takes necessary width or specific width for price input */}
            {isNFT && showPriceInput && isOwned && (
              <div className="flex items-center space-x-2 w-full"> {/* Ensure this div takes necessary width or specific width for price input */}
                <Input
                  type="number" placeholder="Price (ETH)" value={listPriceEth}
                  onChange={(e) => setListPriceEth(e.target.value)}
                  className="h-8 text-xs sm:text-sm flex-grow" // Added flex-grow
                  disabled={isProcessingTx}
                />
                <Button
                  size="sm" className="btn-primary text-xs sm:text-sm px-2 py-1"
                  onClick={handleListTrack}
                  disabled={isProcessingTx || !listPriceEth || parseFloat(listPriceEth) <= 0}
                >
                  {isListPending || isConfirmingList ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                </Button>
                <Button
                  size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" // Added flex-shrink-0
                  onClick={() => setShowPriceInput(false)}
                  disabled={isProcessingTx}
                >
                  <ListX className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center space-x-1 sm:space-x-2 self-end"> {/* Removed sm:self-center to align with potential full-width input */}
              <Button
                variant="ghost" size="icon" onClick={handleLike}
                className={`${liked ? 'text-red-500 scale-110' : 'text-light-text-secondary dark:text-dark-text-secondary'} hover:text-red-500 hover:scale-110 transition-all duration-200 p-1.5 sm:p-2`}
                aria-label={liked ? "Unlike track" : "Like track"}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              </Button>

              {/* Sale related buttons */}
              {isNFT && connectedAddress && isOwned && !showPriceInput && (
                <>
                  {!isLoadingListing && listingPriceWei && listingPriceWei > BigInt(0) ? (
                    <Button
                      size="sm" variant="outline"
                      className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5"
                      onClick={handleDelistTrack} disabled={isProcessingTx}
                    >
                      {isDelistPending || isConfirmingDelist ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ListX className="h-3 w-3 mr-1" />}
                      Delist
                    </Button>
                  ) : (
                    <Button
                      size="sm" className="btn-secondary text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5"
                      onClick={() => setShowPriceInput(true)} disabled={isProcessingTx || isLoadingListing}
                    >
                      {isLoadingListing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Tag className="h-3 w-3 mr-1" />}
                      List for Sale
                    </Button>
                  )}
                </>
              )}
              {isNFT && connectedAddress && !isOwned && !isLoadingListing && listingPriceWei && listingPriceWei > BigInt(0) && (
                <Button
                  size="sm" className="btn-primary text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 hover:scale-105"
                  onClick={handleBuyTrack} disabled={isProcessingTx}
                >
                  {isBuyPending || isConfirmingBuy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ShoppingCart className="h-3 w-3 mr-1" />}
                  Buy for {formatEther(listingPriceWei)} ETH
                </Button>
              )}
              {isNFT && !isOwned && !isLoadingListing && (!listingPriceWei || listingPriceWei === BigInt(0)) && mintStatus && mintStatus !== "Sold Out" && (
                <Button
                  size="sm" className="btn-primary text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 hover:scale-105"
                  onClick={handleMint}
                >
                  <Coins className="h-3 w-3 mr-1" />
                  Mint
                </Button>
              )}

              {/* Approve/Revoke Marketplace Button */}
              {isNFT && isConnected && isOwned && musicNftAddress && TRACK_SALE_CONTRACT_ADDRESS !== "0xYourTrackSaleContractAddressHere" && (
                <>
                  {isLoadingApprovalStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                  {!isLoadingApprovalStatus && errorApprovalStatus && (
                    <span className="text-xs text-red-500">Error loading approval</span>
                  )}
                  {!isLoadingApprovalStatus && !errorApprovalStatus && isOperatorApproved === false && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 border-orange-500 text-orange-500 hover:bg-orange-500/10"
                      onClick={() => approveMarketplace?.()}
                      disabled={isProcessingTx || !approveMarketplace || !!prepareApproveError}
                    >
                      {isProcessingApproval ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
                      Approve Marketplace
                    </Button>
                  )}
                  {!isLoadingApprovalStatus && !errorApprovalStatus && isOperatorApproved === true && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 border-red-500 text-red-500 hover:bg-red-500/10"
                      onClick={() => revokeMarketplace?.()}
                      disabled={isProcessingTx || !revokeMarketplace || !!prepareRevokeError}
                    >
                      {isProcessingRevoke ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ShieldOff className="h-3 w-3 mr-1" />}
                      Revoke Approval
                    </Button>
                  )}
                </>
              )}
            </div> {/* Closes buttons row */}
          </div> {/* Closes column for price input and buttons */}
        </div> {/* Closes L2 Div for duration/plays AND buttons area */}
      </div> {/* Closes L1 Outer Track Info div */}
    </div> // Closes main component div
  );
}
