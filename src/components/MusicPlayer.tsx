
import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([33]);
  const [volume, setVolume] = useState([75]);
  const [liked, setLiked] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Current Track Info */}
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div className="w-14 h-14 bg-gradient-primary rounded-xl flex-shrink-0"></div>
          <div className="min-w-0">
            <h4 className="text-white font-medium truncate">Ethereal Dreams</h4>
            <p className="text-dt-gray-light text-sm truncate">QuantumBeats</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLiked(!liked)}
            className={`${liked ? 'text-red-500' : 'text-dt-gray-light'} hover:text-red-500`}
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-white hover:text-dt-primary">
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 bg-dt-primary hover:bg-dt-primary-dark rounded-full flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white ml-0.5" />
              )}
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-dt-primary">
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 w-full">
            <span className="text-dt-gray-light text-xs">1:24</span>
            <Slider
              value={progress}
              onValueChange={setProgress}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-dt-gray-light text-xs">3:42</span>
          </div>
        </div>

        {/* Volume and Actions */}
        <div className="flex items-center space-x-4 flex-1 justify-end">
          <Button variant="ghost" size="sm" className="text-dt-gray-light hover:text-white">
            <Share2 className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5 text-dt-gray-light" />
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
