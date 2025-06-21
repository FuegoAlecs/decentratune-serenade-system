
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
import { ipfsToHttp } from "@/lib/utils";
import { useTipArtist } from "@/hooks/contracts"; // Import the custom hook

import musicNftAbi from "@/lib/abi/MusicNFT.json";
// import tipJarAbi from "@/lib/abi/TipJar.json"; // Handled by the hook

const musicNftContractAddress = import.meta.env.VITE_CONTRACT_MUSIC_NFT as Address | undefined;
const tipJarContractAddress = import.meta.env.VITE_CONTRACT_TIP_JAR as Address | undefined;

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

  // Wagmi hooks for write operations
  const { data: buyHash, writeContract: buyNftWrite, isPending: isBuyPending, error: buyError } = useWriteContract(); // Keep for buying NFT
  const { isLoading: isBuyConfirming, isSuccess: isBuyConfirmed, error: buyConfirmationError } = useWaitForTransactionReceipt({ hash: buyHash });

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


  const handleBuyNFT = () => {
    if (!isConnected || !userAddress) {
      toast({ title: "Connect Wallet", description: "Please connect your wallet to buy.", variant: "destructive" });
      return;
    }
    if (!musicNftContractAddress || !nftContractData || !tokenId) {
      toast({ title: "Error", description: "NFT data not available.", variant: "destructive" });
      return;
    }
    if (!nftContractData.forSale) {
        toast({ title: "Not for Sale", description: "This NFT is currently not for sale.", variant: "destructive" });
        return;
    }
    if (nftContractData.owner === userAddress) {
        toast({ title: "Already Owned", description: "You already own this NFT.", variant: "destructive" });
        return;
    }

    buyNftWrite({
      address: musicNftContractAddress,
      abi: musicNftAbi,
      functionName: 'buy', // Or your specific purchase function
      args: [tokenId],
      value: nftContractData.price, // Price should be in wei from contract
    });
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
    if (isBuyConfirmed) {
      toast({ title: "Purchase Successful!", description: `NFT purchased. Transaction: ${buyHash}` });
      refetchContractDetails(); // Refetch details to update owner, availability etc.
    }
    if (buyError || buyConfirmationError) {
      toast({ title: "Purchase Failed", description: (buyError?.message || buyConfirmationError?.message) ?? "Error during purchase.", variant: "destructive" });
    }
  }, [isBuyConfirmed, buyError, buyConfirmationError, buyHash, toast, refetchContractDetails]);

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


  const isLoading = isTokenUriLoading || isMetadataLoading || isContractDetailsLoading;

  if (isLoading && !nftMetadata && !nftContractData) { // Initial full load
    return (
      <div className="min-h-screen bg-gradient-dark text-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-dt-primary" />
        <p className="ml-4 text-xl">Loading Track Details...</p>
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

  const displayImage = ipfsToHttp(nftMetadata?.image) || "/placeholder.svg"; // Use a placeholder if image not loaded
  const displayDuration = nftMetadata?.duration || "N/A";
  const displayPrice = nftContractData ? formatEther(nftContractData.price) : "N/A";
  const displayMintDate = "N/A"; // This would ideally come from metadata or contract event
  const displayGenre = nftMetadata?.genre || nftMetadata?.attributes?.find(a => a.trait_type === "Genre")?.value?.toString() || "N/A";

  const displayTotalSupply = nftContractData ? nftContractData.totalSupply.toString() : "N/A";
  const displaySoldCount = nftContractData ? nftContractData.soldCount.toString() : "N/A";
  const displayRemaining = nftContractData ? (nftContractData.totalSupply - nftContractData.soldCount).toString() : "N/A";

  const isOwnedByCurrentUser = userAddress && nftContractData && nftContractData.owner === userAddress;
  const isForSale = nftContractData?.forSale ?? false;
  const canBuy = isForSale && !isOwnedByCurrentUser && nftContractData && nftContractData.soldCount < nftContractData.totalSupply;


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
                  <span className="text-dt-gray-light">Price</span>
                  <span className="font-semibold text-dt-primary text-lg">{displayPrice} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dt-gray-light">Available</span>
                  <span>{displayRemaining} of {displayTotalSupply}</span>
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

              {isOwnedByCurrentUser ? (
                <Button className="w-full btn-secondary mt-6 text-base sm:text-lg py-3" disabled>
                  You own this NFT
                </Button>
              ) : canBuy ? (
                <Button
                  className="w-full btn-primary mt-6 text-base sm:text-lg py-3"
                  onClick={handleBuyNFT}
                  disabled={isBuyPending || isBuyConfirming}
                >
                  {isBuyPending || isBuyConfirming ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                  {isBuyPending || isBuyConfirming ? 'Processing...' : `Buy NFT for ${displayPrice} ETH`}
                </Button>
              ) : (
                <Button className="w-full btn-secondary mt-6 text-base sm:text-lg py-3" disabled>
                  { Number(displayRemaining) === 0 ? "Sold Out" : "Not Available" }
                </Button>
              )}
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
