import { Play, Heart, MoreHorizontal, Coins, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { Link } from "react-router-dom";

interface TrackCardProps {
  id: string;
  title: string;
  artist: string;
  duration: string;
  image?: string;
  plays?: number;
  isNFT?: boolean;
  isOwned?: boolean;
  price?: string;
  mintStatus?: "Available" | "Limited" | "Sold Out";
}

export function TrackCard({ 
  id, 
  title, 
  artist, 
  duration, 
  plays, 
  isNFT, 
  isOwned, 
  price, 
  mintStatus,
  image = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"
}: TrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { playTrack, currentTrack, isPlaying } = useAudio();

  const isCurrentTrack = currentTrack?.id === id;

  const handlePlay = () => {
    const track = {
      id,
      title,
      artist,
      image,
      duration,
      isNFT,
      isOwned
    };
    
    playTrack(track, !isOwned);
  };

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) {
      // Heart burst animation
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 600);
    }
  };

  const handleMint = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  return (
    <div 
      className="track-card group relative transition-all duration-300 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-dt-primary rounded-full animate-bounce"
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
      <div className="relative mb-4">
        <img 
          src={image} 
          alt={title}
          className="w-full aspect-square bg-gradient-primary rounded-xl object-cover"
        />
        
        {/* Play Button Overlay */}
        <div className={`absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-all duration-300 ${
          isHovered || isCurrentTrack ? 'opacity-100' : 'opacity-0'
        }`}>
          <Button 
            onClick={handlePlay}
            className="w-14 h-14 bg-white hover:bg-gray-100 rounded-full hover:scale-110 transition-all duration-200"
          >
            {isCurrentTrack && isPlaying ? (
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="h-6 w-6 text-black ml-0.5" />
            )}
          </Button>
        </div>

        {/* Status Badges */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          {isNFT && (
            <div className="bg-dt-accent text-white px-2 py-1 rounded-lg text-xs font-medium">
              NFT
            </div>
          )}
          {isOwned && (
            <div className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Owned
            </div>
          )}
          {mintStatus && (
            <div className={`text-white px-2 py-1 rounded-lg text-xs font-medium ${
              mintStatus === "Sold Out" ? "bg-red-500" :
              mintStatus === "Limited" ? "bg-yellow-500" : "bg-green-500"
            }`}>
              {mintStatus}
            </div>
          )}
        </div>

        {/* Download for owned tracks */}
        {isOwned && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 left-3 text-white bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Track Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <Link to={`/track/${id}`}>
              <h3 className="font-satoshi font-semibold text-white truncate hover:text-dt-primary transition-colors">
                {title}
              </h3>
            </Link>
            <p className="text-dt-gray-light text-sm truncate hover:text-white transition-colors cursor-pointer">
              {artist}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-dt-gray-light hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-dt-gray-light text-xs">{duration}</span>
            {plays && <span className="text-dt-gray-light text-xs">{plays.toLocaleString()} plays</span>}
            {price && <span className="text-dt-primary font-semibold text-sm">{price}</span>}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`${liked ? 'text-red-500 scale-110' : 'text-dt-gray-light'} hover:text-red-500 hover:scale-110 transition-all duration-200`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            </Button>
            
            {isNFT && !isOwned && (
              <Button 
                size="sm" 
                className="btn-primary hover:scale-105 transition-all duration-200"
                onClick={handleMint}
              >
                <Coins className="h-3 w-3 mr-1" />
                Mint
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
