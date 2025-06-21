
import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface Track {
  id: string;
  title: string;
  artist: string;
  image: string;
  duration: string;
  isNFT?: boolean;
  isOwned?: boolean;
  previewUrl?: string;
  fullUrl?: string;
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  volume: number;
  isPreviewMode: boolean;
  queue: Track[];
  playTrack: (track: Track, isPreview?: boolean) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  setProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: Track) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgressState] = useState(0);
  const [volume, setVolumeState] = useState(75);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTrack = (track: Track, isPreview = false) => {
    setIsLoading(true);
    setCurrentTrack(track);
    setIsPreviewMode(isPreview);
    setIsPlaying(true);
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  const pauseTrack = () => {
    setIsPlaying(false);
  };

  const resumeTrack = () => {
    setIsPlaying(true);
  };

  const setProgress = (newProgress: number) => {
    setProgressState(newProgress);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
  };

  const nextTrack = () => {
    const currentIndex = queue.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    }
  };

  const previousTrack = () => {
    const currentIndex = queue.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    }
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  return (
    <AudioContext.Provider value={{
      currentTrack,
      isPlaying,
      isLoading,
      progress,
      volume,
      isPreviewMode,
      queue,
      playTrack,
      pauseTrack,
      resumeTrack,
      setProgress,
      setVolume,
      nextTrack,
      previousTrack,
      addToQueue
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
