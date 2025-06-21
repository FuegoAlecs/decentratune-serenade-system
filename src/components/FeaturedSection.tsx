
import { TrackCard } from "./TrackCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Alchemy, Network, Nft, OwnedNft } from 'alchemy-sdk'; // Nft for getNFTMetadata response
import { AppNftItem, transformAlchemyNft } from "@/hooks/contracts"; // Reuse transformer and type
import { TrackCardSkeleton } from "@/components/LoadingStates";
import { Address } from "ethers";

const musicNftContractAddress = import.meta.env.VITE_CONTRACT_MUSIC_NFT as Address | undefined;
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_KEY;

const alchemySettings = {
    apiKey: alchemyApiKey,
    network: Network.ETH_SEPOLIA, // TODO: Make configurable
};
const alchemy = alchemyApiKey ? new Alchemy(alchemySettings) : null;

// In a real app, these IDs would come from a config, CMS, or a dedicated API endpoint
const FEATURED_TOKEN_IDS: string[] = ["1", "2", "3", "4"]; // Example Token IDs (ensure these exist on your contract)

async function fetchFeaturedNfts(): Promise<AppNftItem[]> {
  if (!alchemy || !musicNftContractAddress) {
    throw new Error("Alchemy SDK or Contract Address not configured.");
  }
  if (FEATURED_TOKEN_IDS.length === 0) return [];

  const nftPromises = FEATURED_TOKEN_IDS.map(tokenId =>
    alchemy.nft.getNftMetadata(musicNftContractAddress, tokenId)
  );

  const results = await Promise.allSettled(nftPromises);
  const successfulNfts: Nft[] = []; // Nft is the type returned by getNftMetadata
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successfulNfts.push(result.value);
    } else {
      console.warn(`Failed to fetch metadata for token ID ${FEATURED_TOKEN_IDS[index]}:`, result.reason);
    }
  });

  // Need to adapt Nft to OwnedNft structure for transformAlchemyNft or create a new transformer
  // For now, let's create a quick adaptation. OwnedNft has `raw` and `media` that Nft (base) might not structure identically.
  // The transformAlchemyNft expects OwnedNft. Let's simplify and map directly for TrackCard.
  // OR, we can use useAllMusicNFTs and filter by IDs if that's easier.
  // For now, let's map directly to what TrackCard might need, similar to AppNftItem but simplified.

  return successfulNfts.map(nft => {
    // Direct mapping, similar to transformAlchemyNft but from Nft type
    let imageUrl = nft.media?.[0]?.gateway || nft.raw?.metadata?.image || (nft as any).contract?.openSeaMetadata?.imageUrl;
    if (imageUrl?.startsWith("ipfs://")) {
        imageUrl = `https://ipfs.io/ipfs/${imageUrl.substring(7)}`;
    }
    return {
      id: nft.tokenId,
      name: nft.name || nft.contract?.name || 'Unnamed NFT',
      description: nft.description || nft.contract?.openSeaMetadata?.description,
      imageUrl: imageUrl,
      audioUrl: nft.raw?.metadata?.audio || nft.raw?.metadata?.animation_url, // Example
      contractAddress: nft.contract.address,
      collectionName: nft.contract.name || nft.contract.symbol, // For 'artist'
      // Other fields AppNftItem has, like externalUrl, rawMetadata can be added if needed
    };
  });
}


export function FeaturedSection() {
  const {
    data: featuredTracks,
    isLoading,
    error,
  } = useQuery<AppNftItem[], Error>({
    queryKey: ["featuredTracks", musicNftContractAddress],
    queryFn: fetchFeaturedNfts,
    enabled: !!alchemy && !!musicNftContractAddress && FEATURED_TOKEN_IDS.length > 0,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  return (
    <section className="mb-12">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div>
          <h2 className="font-satoshi font-bold text-2xl sm:text-3xl text-light-text-primary dark:text-dark-text-primary mb-1 sm:mb-2">Featured Tracks</h2>
          <p className="text-dt-gray-light text-sm sm:text-base">Discover the hottest drops from top artists</p>
        </div>
        <Button variant="ghost" className="text-dt-primary hover:text-dt-primary-dark w-full sm:w-auto text-sm sm:text-base">
          View All
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(Math.min(FEATURED_TOKEN_IDS.length, 4))].map((_, i) => <TrackCardSkeleton key={i} />)}
        </div>
      )}
      {error && (
        <div className="text-red-500 text-center py-4">
          Error loading featured tracks: {error.message}
        </div>
      )}
      {!isLoading && !error && featuredTracks && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredTracks.map((track) => (
            <TrackCard
              key={track.id}
              id={track.id}
              title={track.name || "Untitled Track"}
              artist={track.collectionName || "Unknown Artist"}
              image={track.imageUrl || "/placeholder.svg"}
              // price, genre, etc. are not available directly, TrackCard needs to handle this
              isNFT={true}
            />
          ))}
          {featuredTracks.length === 0 && !isLoading && <p className="col-span-full text-center text-dt-gray-light">No featured tracks available at the moment.</p>}
        </div>
      )}
    </section>
  );
}
