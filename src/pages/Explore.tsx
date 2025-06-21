
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Grid, List } from "lucide-react";
import { TrackCard } from "@/components/TrackCard";
import { TrackCardSkeleton, EmptyState } from "@/components/LoadingStates";
// import { Link } from "react-router-dom"; // Link is not used directly in this transformed version yet
import { useAllMusicNFTs, AppNftItem } from "@/hooks/contracts"; // Import the new hook and type
import { Address } from 'ethers';

const musicNftContractAddress = import.meta.env.VITE_CONTRACT_MUSIC_NFT as Address | undefined;

// Mock genres and sort options - these would ideally come from metadata or backend if dynamic
const genres = ["All", "Electronic", "Hip Hop", "Rock", "Jazz", "Classical", "Ambient"];
const sortOptions = ["Newest", "Most Tipped", "Trending", "Price: Low to High", "Price: High to Low"];


export default function Explore() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedGenre, setSelectedGenre] = useState("All"); // Genre filtering will need adaptation
  const [sortBy, setSortBy] = useState("Newest"); // Sorting will need adaptation
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: allFetchedNfts,
    isLoading: isLoadingNfts,
    error: nftsError,
  } = useAllMusicNFTs(musicNftContractAddress, 50); // Fetch up to 50 NFTs for explore page

  // TODO: Implement filtering and sorting based on fetched data (allFetchedNfts)
  // For now, basic search on title and artist (collectionName)
  const filteredNFTs = useMemo(() => {
    if (!allFetchedNfts) return [];
    return allFetchedNfts.filter(nft => {
      // const matchesGenre = selectedGenre === "All" // || nft.genre === selectedGenre; // Genre not directly in AppNftItem, would need to parse from rawMetadata.attributes
      const matchesSearch = (nft.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (nft.collectionName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      // return matchesGenre && matchesSearch;
      return matchesSearch; // Genre filter disabled for now
    });
  }, [allFetchedNfts, searchQuery, selectedGenre]);


  // useEffect(() => {
  //   // Simulate loading - No longer needed, use isLoadingNfts from hook
  //   // setTimeout(() => setIsLoading(false), 1000);
  // }, []);


  if (isLoadingNfts) {
    return (
      <div className="min-h-screen bg-gradient-dark text-white px-4 py-6 sm:p-6"> {/* Adjusted Padding */}
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-600 rounded w-64 mb-8 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <TrackCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark text-white px-4 py-6 sm:p-6"> {/* Adjusted Padding */}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 md:mb-8"> {/* Adjusted margin */}
          <div>
            <h1 className="font-satoshi font-bold text-3xl sm:text-4xl mb-2">Explore Music NFTs</h1> {/* Adjusted Text Size */}
            <p className="text-dt-gray-light">Discover and collect exclusive tracks from independent artists</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden" /* Filter button shown only on <lg screens */
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="hover:scale-110 transition-transform duration-200"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="hover:scale-110 transition-transform duration-200"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        {/* Base: hidden (opacity-0, max-h-0). If showFilters: visible with max-h. On lg+: always visible with constrained height. */}
        <div className={`flex flex-col lg:flex-row gap-4 mb-6 md:mb-8 transition-all duration-300 ease-in-out overflow-hidden \
                         ${showFilters ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0'} \
                         lg:opacity-100 lg:max-h-20 lg:overflow-visible`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dt-gray-light" />
            <Input
              type="text"
              placeholder="Search tracks, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-light-card-surface/80 dark:bg-dark-card-surface/80 border-light-borders-lines dark:border-dark-borders-lines text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-ring ring-offset-light-background dark:ring-offset-dark-background transition-all duration-200"
            />
          </div>
          
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-light-card-surface dark:bg-dark-card-surface border border-light-borders-lines dark:border-dark-borders-lines rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary hover:bg-light-card-surface/80 dark:hover:bg-dark-card-surface/80 transition-colors duration-200 focus:ring-2 focus:ring-ring ring-offset-light-background dark:ring-offset-dark-background"
          >
            {genres.map(genre => (
              // Options need themed background as well for consistency in dropdown
              <option key={genre} value={genre} className="bg-light-card-surface dark:bg-dark-card-surface text-light-text-primary dark:text-dark-text-primary">
                {genre}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-light-card-surface dark:bg-dark-card-surface border border-light-borders-lines dark:border-dark-borders-lines rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary hover:bg-light-card-surface/80 dark:hover:bg-dark-card-surface/80 transition-colors duration-200 focus:ring-2 focus:ring-ring ring-offset-light-background dark:ring-offset-dark-background"
          >
            {sortOptions.map(option => (
              // Options need themed background
              <option key={option} value={option} className="bg-light-card-surface dark:bg-dark-card-surface text-light-text-primary dark:text-dark-text-primary">
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Results */}
        {nftsError && (
          <EmptyState
            title="Error loading tracks"
            description={nftsError.message || "Could not fetch music NFTs. Please try again later."}
            actionText="Try Again"
            onAction={() => {
              // This would ideally trigger a refetch, react-query handles retries automatically on window focus by default.
              // For manual refetch, the hook `useAllMusicNFTs` would need to expose the refetch function.
              // For now, a page refresh or navigating away and back might be needed.
              console.log("Attempting to refetch or guiding user to refresh...");
            }}
          />
        )}
        {!isLoadingNfts && !nftsError && filteredNFTs.length === 0 && (
          <EmptyState
            title="No tracks found"
            description="Try adjusting your filters or search terms, or check back later for new music."
            actionText="Clear Filters"
            onAction={() => {
              setSelectedGenre("All");
              setSearchQuery("");
            }}
          />
        )}
        {!isLoadingNfts && !nftsError && filteredNFTs.length > 0 && (
          <div className={`transition-all duration-500 ${viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }`}>
            {filteredNFTs.map((nft: AppNftItem, index) => (
              <div
                key={nft.id} // Assuming AppNftItem has a unique 'id' (token ID)
                className="transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TrackCard
                  id={nft.id}
                  title={nft.name || "Untitled Track"}
                  artist={nft.collectionName || "Unknown Artist"} // Or parse from metadata if available
                  image={nft.imageUrl || "/placeholder.svg"} // Provide a fallback placeholder
                  // The following props were in mock but not directly in AppNftItem.
                  // TrackCard will need to handle their potential absence or they need to be fetched/derived.
                  // price={"N/A"} // Example: price would come from a marketplace
                  // genre={"N/A"} // Example: genre from metadata attributes
                  // mintStatus={"Available"} // Example: status from contract state
                  // tips={0} // Example: tips from backend/contract
                  // duration={"0:00"} // Example: duration from metadata
                  // plays={0} // Example: plays from backend
                  isNFT={true} // All items from this hook are NFTs
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
