import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([33]);
  const [volume, setVolume] = useState([75]);
  const [liked, setLiked] = useState(false);

  // Dummy track data for consistent display - replace with actual context/props if this component is used
  const currentTrack = {
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop", // Placeholder
    title: "Ethereal Dreams",
    artist: "QuantumBeats",
    duration: "3:42",
  };

  const formatTime = (seconds: number) // Helper, assuming fixed duration for now
    => `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2, '0')}`;


  return (
    // Base styles for mobile: px-3 py-2. md+ for larger padding
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 md:p-4 z-50 transition-all duration-300">
      {/* Flex container for mobile: items distributed with space. md+ for more complex layout */}
      <div className="max-w-7xl mx-auto flex items-center justify-between space-x-2 md:space-x-4">
        {/* Current Track Info - flex-shrink to prevent overflow on mobile, md:flex-1 for desktop */}
        <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-shrink md:flex-1">
          <div className="relative">
            {/* Image size: smaller on mobile, larger on md+ */}
            <img
              src={currentTrack.image}
              alt={currentTrack.title}
              className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl object-cover"
            />
          </div>
          {/* Text info: hidden on xs, visible on sm+ */}
          <div className="min-w-0 hidden sm:block">
            <h4 className="text-white font-medium truncate text-sm md:text-base hover:text-dt-primary transition-colors cursor-pointer">
              {currentTrack.title}
            </h4>
            <p className="text-dt-gray-light text-xs md:text-sm truncate hover:text-white transition-colors cursor-pointer">
              {currentTrack.artist}
            </p>
          </div>
          {/* Like button: hidden on mobile, visible on md+ */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLiked(!liked)}
            className={`${liked ? 'text-red-500 scale-110' : 'text-dt-gray-light'} hover:text-red-500 hover:scale-110 transition-all duration-200 hidden md:inline-flex`}
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Player Controls - Central element, always visible. md:flex-1 to allow growth, but capped by max-w-md */}
        <div className="flex flex-col items-center space-y-1 md:space-y-2 md:flex-1 md:max-w-md">
          <div className="flex items-center space-x-1 md:space-x-2"> {/* Reduced spacing for mobile controls */}
            {/* SkipBack: hidden on mobile, visible sm+ */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-dt-primary hover:scale-110 transition-all duration-200 hidden sm:inline-flex"
              // onClick={previousTrack} // Assuming previousTrack function exists if used
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              // Play/Pause button size: slightly smaller on mobile
              className="w-10 h-10 md:w-12 md:h-12 bg-dt-primary hover:bg-dt-primary-dark rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 md:h-6 md:h-6 text-white" />
              ) : (
                <Play className="h-5 w-5 md:h-6 md:h-6 text-white ml-0.5" />
              )}
            </Button>
            {/* SkipForward: hidden on mobile, visible sm+ */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-dt-primary hover:scale-110 transition-all duration-200 hidden sm:inline-flex"
              // onClick={nextTrack} // Assuming nextTrack function exists if used
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress bar: hidden on mobile, visible md+ */}
          <div className="hidden md:flex items-center space-x-2 w-full">
            <span className="text-dt-gray-light text-xs">{formatTime(progress[0] / 100 * 222)}</span> {/* Dummy time calc */}
            <Slider
              value={progress}
              onValueChange={setProgress}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-dt-gray-light text-xs">{currentTrack.duration}</span>
          </div>
        </div>

        {/* Volume and Actions - hidden on mobile, visible on md+ */}
        <div className="hidden md:flex items-center space-x-2 md:space-x-4 md:flex-1 justify-end">
          <Button variant="ghost" size="sm" className="text-dt-gray-light hover:text-white hover:scale-110 transition-all duration-200 hidden lg:inline-flex"> {/* Share hidden on md, visible lg+ */}
            <Share2 className="h-5 w-5" />
          </Button>
          <div className="hidden lg:flex items-center space-x-2"> {/* Volume hidden on md, visible lg+ */}
            <Volume2 className="h-5 w-5 text-dt-gray-light" />
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="w-20 lg:w-24" // Slightly smaller base for volume slider
            />
          </div>
          {/* No expand button in this version, unlike PersistentAudioPlayer */}
        </div>
      </div>
    </div>
  );
}
