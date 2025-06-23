import { Play, Heart, MoreHorizontal, Coins, Download, Check, Tag, ShoppingCart, ListX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // For price input
import { useState, useEffect } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "ethers"; // viem's formatEther, parseEther
import {
    useGetListing,
    useListTrackForSale,
    useDelistTrack,
    useBuyTrack
} from "@/hooks/contracts"; // Import the new hooks
import { useToast } from "@/components/ui/use-toast"; // For notifications

interface TrackCardProps {
  id: string; // Token ID (tokenId)
  title: string;
  artist: string; // Consider if this is the owner address or a display name
  ownerAddress?: string; // Actual owner address of the NFT
  image?: string;
  audioUrl?: string;
  duration?: string;
  plays?: number;
  isNFT?: boolean;
  // isOwned prop will be determined dynamically via ownerAddress and connected account
  // price prop will be fetched dynamically via useGetListing
  mintStatus?: "Available" | "Limited" | "Sold Out"; // This might relate to initial minting, not resale
}

export function TrackCard({
  id, // This is tokenId
  title,
  artist, // This is likely a display name, not owner address
  ownerAddress, // Actual current owner of the NFT
  image = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
  audioUrl,
  duration = "0:00",
  plays,
  isNFT,
  mintStatus, // Keep for now, might be separate from resale status
}: TrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false); // Keep for other actions
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [listPriceEth, setListPriceEth] = useState("");

  const { playTrack, currentTrack, isPlaying, isLoading: isAudioLoading } = useAudio();
  const { address: connectedAddress } = useAccount();
  const { toast } = useToast();

  // Determine if the connected user owns this track
  const isOwned = !!connectedAddress && !!ownerAddress && connectedAddress.toLowerCase() === ownerAddress.toLowerCase();

  // Fetch listing details
  const { data: listingPriceWei, isLoading: isLoadingListing, refetch: refetchListing } = useGetListing(id);

  // Contract interaction hooks
  const { listTrack, isListPending, isConfirmingList, listError, isListConfirmed } = useListTrackForSale();
  const { delistTrack, isDelistPending, isConfirmingDelist, delistError, isDelistConfirmed } = useDelistTrack();
  const { buyTrack, isBuyPending, isConfirmingBuy, buyError, isBuyConfirmed } = useBuyTrack();

  const isProcessingTx = isListPending || isConfirmingList || isDelistPending || isConfirmingDelist || isBuyPending || isConfirmingBuy;

  useEffect(() => {
    if (isListConfirmed || isDelistConfirmed || isBuyConfirmed) {
      toast({ title: "Transaction Confirmed", description: "Your transaction has been confirmed." });
      refetchListing(); // Refetch listing price after a successful transaction
      // Potentially refetch owner data if a buy occurred, though this card doesn't fetch owner directly
      // Parent component managing the list of tracks might need to refetch to update ownerAddress
    }
    if (listError) toast({ title: "Listing Error", description: listError.message, variant: "destructive" });
    if (delistError) toast({ title: "Delisting Error", description: delistError.message, variant: "destructive" });
    if (buyError) toast({ title: "Purchase Error", description: buyError.message, variant: "destructive" });
  }, [isListConfirmed, isDelistConfirmed, isBuyConfirmed, listError, delistError, buyError, toast, refetchListing]);

  const isCurrentTrackPlaying = currentTrack?.id === id && isPlaying;
  const isCurrentTrackLoading = currentTrack?.id === id && isAudioLoading; // Corrected: use isAudioLoading

  const handlePlay = () => {
    if (!audioUrl) {
      console.warn("No audio URL provided for track:", title);
      toast({ title: "Playback Error", description: "No audio URL available for this track.", variant: "destructive" });
      return;
    }
    // Construct the Track object for AudioContext
    // For now, assume `isOwned` determines if fullUrl or previewUrl is used.
    // If your NFT metadata provides separate preview and full URLs, adjust accordingly.
    const trackForPlayer = {
      id,
      title,
      artist,
      image,
      duration, // Initial duration, AudioContext will update with actual
      fullUrl: audioUrl, // Assuming audioUrl is the full version
      previewUrl: isOwned ? undefined : audioUrl, // Play full if owned, else treat audioUrl as preview (or adapt if separate preview exists)
      isNFT,
      isOwned
    };

    // If it's a preview, `isPreview` should be true.
    // If the user owns the track, `isOwned` is true, so `!isOwned` is false (play full version).
    // If the user does not own the track, `isOwned` is false, so `!isOwned` is true (play preview version).
    playTrack(trackForPlayer, !isOwned);
  };

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 600);
    }
  };

  const handleMint = () => {
    setShowConfetti(true); // Placeholder for minting logic
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const handleListTrack = async () => {
    if (!listPriceEth || parseFloat(listPriceEth) <= 0) {
      toast({ title: "Invalid Price", description: "Please enter a valid price greater than 0.", variant: "destructive" });
      return;
    }
    // TODO: Add NFT approval check here before calling listTrack
    // For now, assuming approval is granted.
    // Example: const isApproved = await checkApproval(musicNftContractAddress, id, trackSaleV2Address);
    // if (!isApproved) { /* request approval */ return; }
    await listTrack(id, listPriceEth);
    setShowPriceInput(false); // Hide input after attempting to list
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
      // Using the .track-card class defined in index.css for base styling (bg, border, shadow)
      // group class enables group-hover utilities for child elements
      // Added responsive padding here instead of in index.css's .track-card
      className="track-card group relative p-3 sm:p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Confetti Effect - theme the confetti color */}
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

      {/* Track Image */}
      <div className="relative mb-3 sm:mb-4"> {/* Responsive margin */}
        <img 
          src={image} 
          alt={title}
          // Image has a themed gradient overlay for fallback or style
          className="w-full aspect-square bg-accent-gradient-light dark:bg-accent-gradient-dark rounded-lg sm:rounded-xl object-cover"
        />
        
        {/* Play Button Overlay */}
        <div
          className={`absolute inset-0 bg-black/30 dark:bg-black/50 rounded-lg sm:rounded-xl
                      flex items-center justify-center
                      transition-opacity duration-300 ${isHovered || isCurrentTrackPlaying || isCurrentTrackLoading ? 'opacity-100' : 'opacity-0'}`}
        >
          <Button 
            onClick={handlePlay}
            disabled={isCurrentTrackLoading} // Disable button if this track is loading
            // Themed play button: white background, dark text for contrast on overlay
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white hover:bg-gray-200 dark:bg-dark-card-surface dark:hover:bg-dark-borders-lines rounded-full hover:scale-110 transition-all duration-200"
            aria-label="Play track"
          >
            {isCurrentTrackLoading ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-light-text-primary dark:border-dark-text-primary border-t-transparent rounded-full animate-spin" />
            ) : isCurrentTrackPlaying ? (
              // TODO: Replace with Pause icon from lucide-react if you want to allow pause from here
              // For now, spinning loader indicates it's active and playing, or use a static playing indicator
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-light-text-primary dark:border-dark-text-primary border-t-transparent rounded-full animate-spin" /> // Placeholder for playing state
            ) : (
              <Play className="h-5 w-5 sm:h-6 sm:h-6 text-light-text-primary dark:text-dark-text-primary ml-0.5" />
            )}
          </Button>
        </div>

        {/* Status Badges - Themed */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col space-y-1 sm:space-y-2">
          {isNFT && (
            <div className="bg-light-accent-primary dark:bg-dark-accent-primary text-white px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium">
              NFT
            </div>
          )}
          {isOwned && (
            <div className="bg-light-success dark:bg-dark-success text-white px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Owned
            </div>
          )}
          {mintStatus && (
            <div className={`text-white px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium ${
              mintStatus === "Sold Out" ? "bg-light-error dark:bg-dark-error" :
              mintStatus === "Limited" ? "bg-yellow-500" : "bg-light-success dark:bg-dark-success" // Assuming yellow-500 is acceptable for both themes or define a themeable warning color
            }`}>
              {mintStatus}
            </div>
          )}
        </div>

        {/* Download for owned tracks - Themed */}
        {isOwned && (
          <Button
            variant="ghost"
            size="icon" // Made it an icon button for consistency
            className="absolute top-2 left-2 sm:top-3 sm:left-3 text-white bg-black/40 dark:bg-black/60 hover:bg-black/60 dark:hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 sm:p-2 rounded-full"
            aria-label="Download track"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Track Info - Themed text colors */}
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
          <Button
            variant="ghost"
            size="icon" // Made it an icon button
            className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1.5 sm:p-2"
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
            <span className="text-light-text-secondary dark:text-dark-text-secondary">{duration}</span>
            {plays !== undefined && <span className="text-light-text-secondary dark:text-dark-text-secondary">{plays.toLocaleString()} plays</span>}
            {/* Display listing price */}
            {isLoadingListing && <Loader2 className="h-4 w-4 animate-spin" />}
            {!isLoadingListing && listingPriceWei && listingPriceWei > BigInt(0) && (
              <span className="text-light-accent-primary dark:text-dark-accent-primary font-semibold">
                {formatEther(listingPriceWei)} ETH
              </span>
            )}
          </div>

          <div className="flex flex-col items-end space-y-2 mt-2 sm:mt-0">
            {isNFT && showPriceInput && isOwned && (
              <div className="flex items-center space-x-2 w-full">
                <Input
                  type="number"
                  placeholder="Price (ETH)"
                  value={listPriceEth}
                  onChange={(e) => setListPriceEth(e.target.value)}
                  className="h-8 text-xs sm:text-sm"
                  disabled={isProcessingTx}
                />
                <Button
                  size="sm"
                  className="btn-primary text-xs sm:text-sm px-2 py-1"
                  onClick={handleListTrack}
                  disabled={isProcessingTx || !listPriceEth}
                >
                  {isListPending || isConfirmingList ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setShowPriceInput(false)}
                  disabled={isProcessingTx}
                >
                  <ListX className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center space-x-1 sm:space-x-2 self-end sm:self-center">
              {/* Like Button remains */}
              <Button
                variant="ghost"
              size="icon" // Made it an icon button
              onClick={handleLike}
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
                    size="sm"
                    variant="outline"
                    className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5"
                    onClick={handleDelistTrack}
                    disabled={isProcessingTx}
                  >
                    {isDelistPending || isConfirmingDelist ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ListX className="h-3 w-3 mr-1" />}
                    Delist
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="btn-secondary text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5" // Assuming btn-secondary for list action
                    onClick={() => setShowPriceInput(true)}
                    disabled={isProcessingTx || isLoadingListing}
                  >
                    {isLoadingListing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Tag className="h-3 w-3 mr-1" />}
                    List for Sale
                  </Button>
                )}
              </>
            )}
            {isNFT && connectedAddress && !isOwned && !isLoadingListing && listingPriceWei && listingPriceWei > BigInt(0) && (
              <Button
                size="sm"
                className="btn-primary text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 hover:scale-105"
                onClick={handleBuyTrack}
                disabled={isProcessingTx}
              >
                {isBuyPending || isConfirmingBuy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ShoppingCart className="h-3 w-3 mr-1" />}
                Buy for {formatEther(listingPriceWei)} ETH
              </Button>
            )}
            {/* Fallback to original Mint button if not owned and not listed (e.g. primary market) */}
            {/* This condition ensures mint button only shows if not for sale and user doesn't own it */}
            {isNFT && !isOwned && !isLoadingListing && (!listingPriceWei || listingPriceWei === BigInt(0)) && mintStatus && mintStatus !== "Sold Out" && (
              <Button
                size="sm"
                className="btn-primary text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 hover:scale-105"
                onClick={handleMint} // This is the original mint button logic
              >
                <Coins className="h-3 w-3 mr-1" />
                Mint {/* Or text could be "Purchase" if it's a primary sale mechanism */}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
