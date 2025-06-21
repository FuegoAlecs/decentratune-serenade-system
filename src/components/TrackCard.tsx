
import { Play, Heart, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TrackCardProps {
  title: string;
  artist: string;
  duration: string;
  image?: string;
  plays?: number;
  isNFT?: boolean;
}

export function TrackCard({ title, artist, duration, plays, isNFT }: TrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <div 
      className="track-card group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Track Image */}
      <div className="relative mb-4">
        <div className="w-full aspect-square bg-gradient-primary rounded-xl"></div>
        
        {/* Play Button Overlay */}
        <div className={`absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button className="w-14 h-14 bg-white hover:bg-gray-100 rounded-full">
            <Play className="h-6 w-6 text-black ml-0.5" />
          </Button>
        </div>

        {/* NFT Badge */}
        {isNFT && (
          <div className="absolute top-3 right-3 bg-dt-accent text-white px-2 py-1 rounded-lg text-xs font-medium">
            NFT
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-satoshi font-semibold text-white truncate">{title}</h3>
            <p className="text-dt-gray-light text-sm truncate">{artist}</p>
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
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLiked(!liked)}
            className={`${liked ? 'text-red-500' : 'text-dt-gray-light'} hover:text-red-500`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
