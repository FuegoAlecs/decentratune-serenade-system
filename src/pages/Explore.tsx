
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Grid, List, Play, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const genres = ["All", "Electronic", "Hip Hop", "Rock", "Jazz", "Classical", "Ambient"];
const sortOptions = ["Newest", "Most Tipped", "Trending", "Price: Low to High", "Price: High to Low"];

const musicNFTs = [
  {
    id: 1,
    title: "Cosmic Drift",
    artist: "NebulaBeats",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    price: "0.5 ETH",
    genre: "Electronic",
    mintStatus: "Available",
    tips: 142,
    isLiked: false,
  },
  {
    id: 2,
    title: "Urban Legends",
    artist: "CityVibes",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    price: "0.3 ETH",
    genre: "Hip Hop",
    mintStatus: "Sold Out",
    tips: 89,
    isLiked: true,
  },
  {
    id: 3,
    title: "Digital Dreams",
    artist: "TechnoMage",
    image: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=400&h=400&fit=crop",
    price: "0.8 ETH",
    genre: "Electronic",
    mintStatus: "Limited",
    tips: 203,
    isLiked: false,
  },
  {
    id: 4,
    title: "Jazz Fusion 2040",
    artist: "FutureJazz",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    price: "0.6 ETH",
    genre: "Jazz",
    mintStatus: "Available",
    tips: 156,
    isLiked: false,
  },
];

export default function Explore() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedTracks, setLikedTracks] = useState<number[]>([2]);

  const toggleLike = (trackId: number) => {
    setLikedTracks(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const filteredNFTs = musicNFTs.filter(nft => {
    const matchesGenre = selectedGenre === "All" || nft.genre === selectedGenre;
    const matchesSearch = nft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nft.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

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
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dt-gray-light" />
            <Input
              type="text"
              placeholder="Search tracks, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
          
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
          >
            {genres.map(genre => (
              <option key={genre} value={genre} className="bg-dt-dark text-white">
                {genre}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
          >
            {sortOptions.map(option => (
              <option key={option} value={option} className="bg-dt-dark text-white">
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* NFT Grid/List */}
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {filteredNFTs.map((nft) => (
            <div key={nft.id} className={`glass-card rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 group ${
              viewMode === "list" ? "flex items-center p-4" : "p-4"
            }`}>
              <div className={`relative ${viewMode === "list" ? "w-20 h-20 flex-shrink-0" : "mb-4"}`}>
                <img
                  src={nft.image}
                  alt={nft.title}
                  className={`object-cover rounded-xl ${viewMode === "list" ? "w-full h-full" : "w-full aspect-square"}`}
                />
                <Button
                  className="absolute inset-0 m-auto w-12 h-12 bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="h-4 w-4 text-black ml-0.5" />
                </Button>
                
                <div className={`absolute top-2 right-2 ${
                  nft.mintStatus === "Sold Out" ? "bg-red-500" :
                  nft.mintStatus === "Limited" ? "bg-yellow-500" : "bg-green-500"
                } text-white text-xs px-2 py-1 rounded-lg`}>
                  {nft.mintStatus}
                </div>
              </div>
              
              <div className={`${viewMode === "list" ? "flex-1 ml-4" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <Link to={`/track/${nft.id}`}>
                      <h3 className="font-satoshi font-semibold text-lg hover:text-dt-primary transition-colors truncate">
                        {nft.title}
                      </h3>
                    </Link>
                    <p className="text-dt-gray-light text-sm">{nft.artist}</p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(nft.id)}
                    className={`${
                      likedTracks.includes(nft.id) ? "text-red-500" : "text-dt-gray-light"
                    } hover:text-red-500`}
                  >
                    <Heart className={`h-4 w-4 ${likedTracks.includes(nft.id) ? "fill-current" : ""}`} />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-dt-primary font-semibold">{nft.price}</span>
                    <span className="text-dt-gray-light text-sm">{nft.tips} tips</span>
                  </div>
                  
                  {viewMode === "grid" && (
                    <Button size="sm" className="btn-primary">
                      Buy NFT
                    </Button>
                  )}
                </div>
                
                {viewMode === "list" && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Button size="sm" className="btn-primary">
                      Buy NFT
                    </Button>
                    <span className="text-xs text-dt-gray-light">{nft.genre}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
