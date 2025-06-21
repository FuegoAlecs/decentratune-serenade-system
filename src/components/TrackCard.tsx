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
  image = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop" // Default image
}: TrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false); // Confetti can be themed if needed
  const { playTrack, currentTrack, isPlaying } = useAudio();

  const isCurrentTrack = currentTrack?.id === id;

  const handlePlay = () => {
    const track = { id, title, artist, image, duration, isNFT, isOwned };
    playTrack(track, !isOwned); // Play preview if not owned
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

  return (
    <div 
      // Using the .track-card class defined in index.css for base styling (bg, border, shadow, padding)
      // group class enables group-hover utilities for child elements
      className="track-card group relative"
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
                      transition-opacity duration-300 ${isHovered || isCurrentTrack ? 'opacity-100' : 'opacity-0'}`}
        >
          <Button 
            onClick={handlePlay}
            // Themed play button: white background, dark text for contrast on overlay
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white hover:bg-gray-200 dark:bg-dark-card-surface dark:hover:bg-dark-borders-lines rounded-full hover:scale-110 transition-all duration-200"
            aria-label="Play track"
          >
            {isCurrentTrack && isPlaying ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-light-text-primary dark:border-dark-text-primary border-t-transparent rounded-full animate-spin" />
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
            {price && <span className="text-light-accent-primary dark:text-dark-accent-primary font-semibold">{price}</span>}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 self-end sm:self-center">
            <Button
              variant="ghost"
              size="icon" // Made it an icon button
              onClick={handleLike}
              className={`${liked ? 'text-red-500 scale-110' : 'text-light-text-secondary dark:text-dark-text-secondary'} hover:text-red-500 hover:scale-110 transition-all duration-200 p-1.5 sm:p-2`}
              aria-label={liked ? "Unlike track" : "Like track"}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            </Button>
            
            {isNFT && !isOwned && (
              <Button 
                size="sm" 
                className="btn-primary text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 hover:scale-105" // Using .btn-primary and adjusted padding for smaller size
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
