
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Grid, List } from "lucide-react";
import { TrackCard } from "@/components/TrackCard";
import { TrackCardSkeleton, EmptyState } from "@/components/LoadingStates";
import { Link } from "react-router-dom";

const genres = ["All", "Electronic", "Hip Hop", "Rock", "Jazz", "Classical", "Ambient"];
const sortOptions = ["Newest", "Most Tipped", "Trending", "Price: Low to High", "Price: High to Low"];

const musicNFTs = [
  {
    id: "1",
    title: "Cosmic Drift",
    artist: "NebulaBeats",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    price: "0.5 ETH",
    genre: "Electronic",
    mintStatus: "Available" as const,
    tips: 142,
    duration: "3:42",
    plays: 15420,
    isNFT: true,
  },
  {
    id: "2",
    title: "Urban Legends",
    artist: "CityVibes",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    price: "0.3 ETH",
    genre: "Hip Hop",
    mintStatus: "Sold Out" as const,
    tips: 89,
    duration: "4:18",
    plays: 8930,
    isNFT: true,
  },
  {
    id: "3",
    title: "Digital Dreams",
    artist: "TechnoMage",
    image: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=400&h=400&fit=crop",
    price: "0.8 ETH",
    genre: "Electronic",
    mintStatus: "Limited" as const,
    tips: 203,
    duration: "5:23",
    plays: 12580,
    isNFT: true,
  },
  {
    id: "4",
    title: "Jazz Fusion 2040",
    artist: "FutureJazz",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    price: "0.6 ETH",
    genre: "Jazz",
    mintStatus: "Available" as const,
    tips: 156,
    duration: "4:45",
    plays: 9870,
    isNFT: true,
  },
];

export default function Explore() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const filteredNFTs = musicNFTs.filter(nft => {
    const matchesGenre = selectedGenre === "All" || nft.genre === selectedGenre;
    const matchesSearch = nft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nft.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark text-white p-6">
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
    <div className="min-h-screen bg-gradient-dark text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-satoshi font-bold text-4xl mb-2">Explore Music NFTs</h1>
            <p className="text-dt-gray-light">Discover and collect exclusive tracks from independent artists</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
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
        <div className={`flex flex-col lg:flex-row gap-4 mb-8 transition-all duration-300 ${showFilters || window.innerWidth >= 1024 ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden lg:opacity-100 lg:max-h-20'}`}>
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
        {filteredNFTs.length === 0 ? (
          <EmptyState
            title="No tracks found"
            description="Try adjusting your filters or search terms to discover more music."
            actionText="Clear Filters"
            onAction={() => {
              setSelectedGenre("All");
              setSearchQuery("");
            }}
          />
        ) : (
          <div className={`transition-all duration-500 ${viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }`}>
            {filteredNFTs.map((nft, index) => (
              <div
                key={nft.id}
                className="transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TrackCard {...nft} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
