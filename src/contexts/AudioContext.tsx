
import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';

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
  progress: number; // Percentage 0-100
  volume: number; // Volume 0-100
  duration: number; // Actual duration in seconds
  isPreviewMode: boolean;
  queue: Track[];
  playTrack: (track: Track, isPreview?: boolean) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  setProgress: (progress: number) => void; // Expects percentage 0-100
  setVolume: (volume: number) => void; // Expects 0-100
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: Track) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgressState] = useState(0); // Percentage-based progress for UI
  const [duration, setDurationState] = useState(0); // Actual duration in seconds
  const [volume, setVolumeState] = useState(0.75); // Volume 0-1 for HTMLAudioElement
  const [actualDuration, setActualDuration] = useState(0); // Store actual duration from audio element
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect to create and manage audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const handleLoadedData = () => {
      setIsLoading(false);
      setActualDuration(audio.duration); // Use actualDuration here
      audio.play().catch(e => console.error("Error playing audio:", e));
    };

    const handleTimeUpdate = () => {
      if (audio.duration > 0) { // audio.duration is the source of truth
        setProgressState((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Implement next track logic or replay current track
      nextTrack();
    };

    const handleError = (e: Event) => {
      console.error("Audio Error:", e);
      setIsLoading(false);
      setIsPlaying(false);
      // Potentially display an error to the user
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('waiting', () => setIsLoading(true)); // When buffering
    audio.addEventListener('canplay', () => setIsLoading(false)); // When ready after buffering


    return () => {
      audio.pause();
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', () => setIsPlaying(true));
      audio.removeEventListener('pause', () => setIsPlaying(false));
      audio.removeEventListener('waiting', () => setIsLoading(true));
      audio.removeEventListener('canplay', () => setIsLoading(false));
      // Do not nullify audioRef.current here if it's intended to persist across re-renders of the provider's children
      // audioRef.current = null;
    };
  }, [volume]); // Add volume to dependency array to update it if changed externally

  const playTrack = (track: Track, isPreview = false) => {
    if (!audioRef.current) return;
    setIsLoading(true);
    setCurrentTrack(track);
    setIsPreviewMode(isPreview);
    
    const audioSrc = isPreview ? track.previewUrl : track.fullUrl;
    if (audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.load(); // Important to load the new source
      // Play will be called by 'loadeddata' event listener
    } else {
      console.error("No audio URL provided for track:", track.title);
      setIsLoading(false);
    }
  };

  const pauseTrack = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
  };

  const resumeTrack = () => {
    if (audioRef.current && !isPlaying && currentTrack) {
      audioRef.current.play().catch(e => console.error("Error resuming audio:", e));
    }
  };

  const setProgress = (newProgressPercent: number) => { // newProgress is a percentage 0-100
    if (audioRef.current && currentTrack && actualDuration > 0) { // Use actualDuration
      const newTime = (newProgressPercent / 100) * actualDuration; // Use actualDuration
      audioRef.current.currentTime = newTime;
      setProgressState(newProgressPercent); // Optimistically update UI
    }
  };

  const setVolume = (newVolume: number) => { // newVolume is 0-100 from slider
    if (audioRef.current) {
      const newActualVolume = newVolume / 100;
      audioRef.current.volume = newActualVolume;
      setVolumeState(newActualVolume); // Store as 0-1
    }
  };

  const nextTrack = () => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    } else if (currentIndex === queue.length -1 && queue.length > 0) {
      // Optional: play first track if at end of queue (loop)
      // playTrack(queue[0]);
      // Or stop playback
      setIsPlaying(false);
    }
  };

  const previousTrack = () => {
    const currentIndex = queue.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else if (currentIndex === 0 && queue.length > 1) {
      // Optional: play last track if at beginning of queue (loop)
      // playTrack(queue[queue.length - 1]);
    }
  };

  const addToQueue = (track: Track) => {
    // Avoid adding duplicates
    setQueue(prev => prev.find(t => t.id === track.id) ? prev : [...prev, track]);
  };

  // Expose actualDuration for UI display
  const contextVolume = Math.round(volume * 100); // Convert 0-1 back to 0-100 for UI

  return (
    <AudioContext.Provider value={{
      currentTrack,
      isPlaying,
      isLoading,
      progress, // Percentage for UI slider
      volume: contextVolume, // Volume 0-100 for UI slider
      duration: actualDuration, // Actual duration in seconds for display
      isPreviewMode,
      queue,
      playTrack,
      pauseTrack,
      resumeTrack,
      setProgress, // Expects percentage
      setVolume, // Expects 0-100
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
