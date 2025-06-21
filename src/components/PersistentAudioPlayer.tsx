
import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share2, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/contexts/AudioContext";

export function PersistentAudioPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    isLoading, 
    progress, 
    volume, 
    isPreviewMode,
    pauseTrack, 
    resumeTrack, 
    setProgress, 
    setVolume,
    nextTrack,
    previousTrack
  } = useAudio();
  const [isExpanded, setIsExpanded] = useState(false);
  const [liked, setLiked] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Main Player Bar */}
      {/* Base styles for mobile: px-3 py-2. md+ for larger padding */}
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
              {isPreviewMode && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[0.6rem] md:text-xs px-1 rounded">
                  30s
                </div>
              )}
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
                onClick={previousTrack}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                onClick={isPlaying ? pauseTrack : resumeTrack}
                disabled={isLoading}
                // Play/Pause button size: slightly smaller on mobile
                className="w-10 h-10 md:w-12 md:h-12 bg-dt-primary hover:bg-dt-primary-dark rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200"
              >
                {isLoading ? (
                  <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
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
                onClick={nextTrack}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Progress bar: hidden on mobile, visible md+ */}
            <div className="hidden md:flex items-center space-x-2 w-full">
              <span className="text-dt-gray-light text-xs">{formatTime(progress * 3.5 * 60 / 100)}</span>
              <Slider
                value={[progress]}
                onValueChange={(value) => setProgress(value[0])}
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
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                step={1}
                className="w-20 lg:w-24" // Slightly smaller base for volume slider
              />
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-dt-gray-light hover:text-white hover:scale-110 transition-all duration-200" // Expand button always visible
            >
              <ChevronUp className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Expanded Player - Mobile: full width, vertical stack. md+: centered with glass card, horizontal or improved layout */}
        {isExpanded && (
          // Base padding p-3 for mobile, md:p-4 for larger
          <div className="mt-4 p-3 md:p-4 glass-card rounded-xl">
            {/* Mobile: flex-col, items-center. md: flex-row, justify-center */}
            <div className="flex flex-col items-center space-y-4 md:flex-row md:space-x-8 md:justify-center">
              <div className="text-center">
                <img 
                  src={currentTrack.image} 
                  alt={currentTrack.title}
                  // Image size: smaller on mobile, larger on sm+
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover mx-auto mb-2 sm:mb-4"
                />
                <h3 className="text-white font-semibold text-base sm:text-lg">{currentTrack.title}</h3>
                <p className="text-dt-gray-light text-sm sm:text-base">{currentTrack.artist}</p>
              </div>
              
              {/* Audio Visualizer - simpler/shorter on mobile, fuller on sm+ */}
              <div className="flex items-end space-x-1 h-12 sm:h-16">
                {/* Mobile: 12 bars, sm+: 20 bars */}
                {[...Array(12)].map((_, i) => ( // Render 12 bars for mobile view
                  <div
                    key={`mob-${i}`}
                    className={`bg-dt-primary w-1 rounded-full transition-all duration-200 sm:hidden ${
                      isPlaying ? 'wave-bar' : 'h-2'
                    }`}
                    style={{ animationDelay: `${i * 0.1}s`, height: isPlaying ? `${Math.random() * 16 + 4}px` : '4px' }} // Dynamic height for wave-bar on mobile
                  />
                ))}
                {[...Array(20)].map((_, i) => ( // Render 20 bars for sm+ view
                  <div
                    key={`desk-${i}`}
                    className={`bg-dt-primary w-1 rounded-full transition-all duration-200 hidden sm:block ${
                      isPlaying ? 'wave-bar' : 'h-2' // wave-bar class has fixed height animation
                    }`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
