
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Heart, Share2, ArrowLeft, Coins, Calendar, User } from "lucide-react";

const trackData = {
  id: 1,
  title: "Cosmic Drift",
  artist: "NebulaBeats",
  artistAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
  image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop",
  duration: "3:42",
  price: "0.5 ETH",
  mintDate: "March 15, 2024",
  genre: "Electronic",
  totalSupply: 100,
  remaining: 23,
  description: "A transcendent journey through cosmic soundscapes, blending ambient textures with driving electronic rhythms. This track was composed during a month-long residency in the desert, inspired by the vast night sky.",
  metadata: {
    bpm: 128,
    key: "A Minor",
    royalties: "10%",
    contractAddress: "0x1234...5678",
  },
  tips: 142,
  isLiked: false,
};

export default function TrackDetails() {
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([33]);
  const [isLiked, setIsLiked] = useState(trackData.isLiked);
  const [tipAmount, setTipAmount] = useState("");

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      {/* Header */}
      <header className="p-6 border-b border-white/10">
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Artwork and Player */}
          <div className="space-y-6">
            <div className="relative">
              <img
                src={trackData.image}
                alt={trackData.title}
                className="w-full aspect-square object-cover rounded-2xl shadow-2xl"
              />
              
              {/* Play Button Overlay */}
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute bottom-6 right-6 w-16 h-16 bg-dt-primary hover:bg-dt-primary-dark rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8 text-white" />
                ) : (
                  <Play className="h-8 w-8 text-white ml-1" />
                )}
              </Button>
            </div>

            {/* Audio Player */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="font-satoshi font-bold text-2xl mb-1">{trackData.title}</h1>
                  <p className="text-dt-gray-light">{trackData.artist}</p>
                </div>
                <span className="text-dt-gray-light text-sm">{trackData.duration}</span>
              </div>
              
              <div className="space-y-2">
                <Slider
                  value={progress}
                  onValueChange={setProgress}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-dt-gray-light">
                  <span>1:24</span>
                  <span>{trackData.duration}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Track Info */}
          <div className="space-y-6">
            {/* NFT Info */}
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="font-satoshi font-bold text-xl mb-4">NFT Details</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-dt-gray-light">Price</span>
                  <span className="font-semibold text-dt-primary text-lg">{trackData.price}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-dt-gray-light">Available</span>
                  <span>{trackData.remaining} of {trackData.totalSupply}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-dt-gray-light">Mint Date</span>
                  <span>{trackData.mintDate}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-dt-gray-light">Genre</span>
                  <span>{trackData.genre}</span>
                </div>
              </div>

              <Button className="w-full btn-primary mt-6 text-lg py-3">
                Buy NFT for {trackData.price}
              </Button>
            </div>

            {/* Artist Info */}
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="font-satoshi font-bold text-xl mb-4">Artist</h2>
              
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={trackData.artistAvatar}
                  alt={trackData.artist}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-lg">{trackData.artist}</h3>
                  <p className="text-dt-gray-light text-sm">Independent Artist</p>
                </div>
              </div>

              <Link to={`/artist/${trackData.artist}`}>
                <Button variant="outline" className="w-full mb-4">
                  View Profile
                </Button>
              </Link>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Tip amount (ETH)"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
                <Button className="btn-primary">
                  <Coins className="h-4 w-4 mr-2" />
                  Tip
                </Button>
              </div>
            </div>

            {/* Track Description */}
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="font-satoshi font-bold text-xl mb-4">Description</h2>
              <p className="text-dt-gray-light leading-relaxed">{trackData.description}</p>
            </div>

            {/* Metadata */}
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="font-satoshi font-bold text-xl mb-4">Metadata</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-dt-gray-light text-sm">BPM</span>
                  <p className="font-semibold">{trackData.metadata.bpm}</p>
                </div>
                <div>
                  <span className="text-dt-gray-light text-sm">Key</span>
                  <p className="font-semibold">{trackData.metadata.key}</p>
                </div>
                <div>
                  <span className="text-dt-gray-light text-sm">Royalties</span>
                  <p className="font-semibold">{trackData.metadata.royalties}</p>
                </div>
                <div>
                  <span className="text-dt-gray-light text-sm">Tips Received</span>
                  <p className="font-semibold">{trackData.tips}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-dt-gray-light text-sm">Contract Address</span>
                <p className="font-mono text-sm break-all">{trackData.metadata.contractAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
