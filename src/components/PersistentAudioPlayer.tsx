
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
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Current Track Info */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="relative">
              <img 
                src={currentTrack.image} 
                alt={currentTrack.title}
                className="w-14 h-14 rounded-xl object-cover"
              />
              {isPreviewMode && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1 rounded">
                  30s
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-white font-medium truncate hover:text-dt-primary transition-colors cursor-pointer">
                {currentTrack.title}
              </h4>
              <p className="text-dt-gray-light text-sm truncate hover:text-white transition-colors cursor-pointer">
                {currentTrack.artist}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLiked(!liked)}
              className={`${liked ? 'text-red-500 scale-110' : 'text-dt-gray-light'} hover:text-red-500 hover:scale-110 transition-all duration-200`}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:text-dt-primary hover:scale-110 transition-all duration-200"
                onClick={previousTrack}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                onClick={isPlaying ? pauseTrack : resumeTrack}
                disabled={isLoading}
                className="w-12 h-12 bg-dt-primary hover:bg-dt-primary-dark rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6 text-white" />
                ) : (
                  <Play className="h-6 w-6 text-white ml-0.5" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:text-dt-primary hover:scale-110 transition-all duration-200"
                onClick={nextTrack}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 w-full">
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

          {/* Volume and Actions */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            <Button variant="ghost" size="sm" className="text-dt-gray-light hover:text-white hover:scale-110 transition-all duration-200">
              <Share2 className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5 text-dt-gray-light" />
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-dt-gray-light hover:text-white hover:scale-110 transition-all duration-200"
            >
              <ChevronUp className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Expanded Player */}
        {isExpanded && (
          <div className="mt-4 p-4 glass-card rounded-xl">
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <img 
                  src={currentTrack.image} 
                  alt={currentTrack.title}
                  className="w-32 h-32 rounded-xl object-cover mx-auto mb-4"
                />
                <h3 className="text-white font-semibold">{currentTrack.title}</h3>
                <p className="text-dt-gray-light">{currentTrack.artist}</p>
              </div>
              
              {/* Audio Visualizer */}
              <div className="flex items-end space-x-1 h-16">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`bg-dt-primary w-1 rounded-full transition-all duration-200 ${
                      isPlaying ? 'wave-bar' : 'h-2'
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
