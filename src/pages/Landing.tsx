
import { Button } from "@/components/ui/button";
import { Play, Sun, Moon, TrendingUp, ArrowRight, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { WalletConnection } from "@/components/WalletConnection"; // Old button removed
// import { ConnectButton } from '@reown/appkit/react'; // Incorrect import removed
import { useAudio } from "@/contexts/AudioContext";
import { useRecentTracks, AppNftItem } from "@/hooks/contracts"; // Import the new hook and type

// const trendingTracks = [ // Static mock data removed
//   {
//     id: "1",
//     title: "Cosmic Drift",
//     artist: "NebulaBeats",
//     image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
//     duration: "3:42",
//   },
//   {
//     id: "2",
//     title: "Digital Soul",
//     artist: "CryptoHarmony",
//     image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
//     duration: "4:18",
//   },
//   {
//     id: "3",
//     title: "Ethereal Dreams",
//     artist: "QuantumBeats",
//     image: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=300&h=300&fit=crop",
//     duration: "5:23",
//   },
// ];

export default function Landing() {
  const { data: recentTracks, isLoading: isLoadingRecentTracks, error: recentTracksError } = useRecentTracks(3); // Fetch 3 recent tracks
  // State for dark mode, defaulting to system preference or true (dark)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedPreference = localStorage.getItem('theme');
      if (storedPreference) {
        return storedPreference === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default to dark if window is not available (SSR)
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const { playTrack } = useAudio();

  useEffect(() => {
    setIsLoaded(true);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handlePlayPreview = (track: any) => {
    playTrack(track, true);
  };

  return (
    // Apply Tailwind classes for background and text based on theme.
    // These will use the CSS variables defined in index.css which are switched by the 'dark' class on <html>
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary transition-colors duration-300 px-4 sm:px-6 lg:px-8">
      {/* Header: Added mobile padding (p-4), md breakpoint for larger padding (p-6) */}
      <header className="flex items-center justify-between p-4 md:p-6">
        {/* Logo and title: Ensure text size is responsive */}
        <div className={`flex items-center space-x-2 sm:space-x-3 transition-all duration-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Updated logo to use themeable gradient */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-gradient-light dark:bg-accent-gradient-dark rounded-lg sm:rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-200">
            <span className="text-white font-bold text-lg sm:text-xl">D</span> {/* Consider making D's color themeable if needed */}
          </div>
          <h1 className="font-satoshi font-bold text-xl sm:text-2xl">DecentraTune</h1>
        </div>
        
        {/* Right side of header: Theme toggle button and WalletConnection */}
        <div className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-500 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Button
            variant="ghost"
            size="icon" // Using icon size for a compact button
            onClick={toggleTheme}
            className="text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-card-surface/50 dark:hover:bg-dark-card-surface/50 hover:scale-110 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <appkit-button />
        </div>
      </header>

      {/* Hero Section: py-10 for mobile, md:py-20. */}
      <section className="text-center py-10 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className={`transition-all duration-700 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {/* Headline text size: mobile text-4xl, sm:text-5xl, md:text-6xl, lg:text-8xl */}
            <h1 className="font-satoshi font-black text-4xl sm:text-5xl md:text-6xl lg:text-8xl mb-4 md:mb-6">
              Stream.{" "}
              {/* Apply themeable gradient for "Own." span */}
              <span className="bg-accent-gradient-light dark:bg-accent-gradient-dark bg-clip-text text-transparent">
                Own.
              </span>{" "}
              Earn.
            </h1>
          </div>
          
          {/* Paragraph text size: mobile text-lg, md:text-xl. max-w for mobile and up */}
          <p className={`text-lg md:text-xl text-light-text-secondary dark:text-dark-text-secondary mb-6 md:mb-8 max-w-sm sm:max-w-md md:max-w-2xl mx-auto transition-all duration-700 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            The first truly decentralized music platform where artists mint tracks as NFTs 
            and fans collect exclusive music while supporting creators directly.
          </p>

          {/* Buttons: flex-col default, sm:flex-row. Buttons full width on mobile, auto on sm+ */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 md:mb-12 transition-all duration-700 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <Link to="/explore" className="w-full sm:w-auto">
              {/* Using .btn-primary which should now be themeable from index.css */}
              <Button className="btn-primary text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 hover:scale-105 transition-all duration-200 w-full">
                <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Explore Music
              </Button>
            </Link>
             {/* Using .btn-secondary which should now be themeable from index.css */}
            <Button className="btn-secondary text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 hover:scale-105 transition-all duration-200 w-full sm:w-auto">
              Learn More
            </Button>
          </div>

          {/* Audio Visualizer: Consider reducing number of bars on mobile if it looks too crowded */}
          <div className={`flex justify-center space-x-1 transition-all duration-700 delay-900 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {[...Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 15)].map((_, i) => ( // Example: Fewer bars on small screens
              <div
                key={i}
                className="wave-bar bg-light-accent-primary dark:bg-dark-accent-primary w-1 rounded-full"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Section: py-10 for mobile, md:py-16. px-4 from parent. */}
      <section className="py-10 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Section title: text-2xl mobile, md:text-3xl */}
          <div className="flex items-center mb-6 md:mb-8">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-dt-primary mr-2 sm:mr-3" />
            <h2 className="font-satoshi font-bold text-2xl sm:text-3xl">Trending Now</h2>
          </div>

          {/* Grid: 1 col mobile, md:2 cols, lg:3 cols for cards. Gap adjusted. */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {isLoadingRecentTracks && (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="glass-card p-4 sm:p-6 rounded-2xl animate-pulse">
                  <div className="relative mb-4">
                    <div className="w-full aspect-square bg-white/10 rounded-xl"></div>
                  </div>
                  <div className="h-6 bg-white/10 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-white/10 rounded w-1/4"></div>
                </div>
              ))
            )}
            {recentTracksError && (
              <div className="col-span-full text-center text-red-500">
                <p>Error loading trending tracks: {recentTracksError.message}</p>
              </div>
            )}
            {!isLoadingRecentTracks && !recentTracksError && (!recentTracks || recentTracks.length === 0) && (
              <div className="col-span-full text-center text-dt-gray-light">
                <p>No recent tracks to display. Mint some new music!</p>
              </div>
            )}
            {!isLoadingRecentTracks && !recentTracksError && recentTracks && recentTracks.map((track: AppNftItem, index: number) => (
              // TODO: The useRecentTracks hook currently returns dummy data.
              // This mapping will need to be adjusted once real data (name, artist, image, duration) is populated.
              // For now, using AppNftItem fields and placeholders.
              <div 
                key={track.id || index} // Use track.id if available, otherwise index
                className={`glass-card p-4 sm:p-6 rounded-2xl hover:bg-dt-primary/20 transition-all duration-300 group hover:scale-[1.02] cursor-pointer ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                style={{ transitionDelay: `${1200 + index * 200}ms` }}
                // onClick={() => navigate(`/track/${track.id}`)} // Optional: navigate to track details
              >
                <div className="relative mb-4">
                  <img
                    src={track.imageUrl || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"} // Fallback image
                    alt={track.name || "Track"}
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                  <Button
                    onClick={(e) => { e.stopPropagation(); handlePlayPreview({ id: track.id, title: track.name, artist: track.collectionName, image: track.imageUrl, audioUrl: track.audioUrl }); }}
                    className="absolute inset-0 m-auto w-16 h-16 bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                  >
                    <Play className="h-6 w-6 text-black ml-1" />
                  </Button>
                </div>
                
                <h3 className="font-satoshi font-semibold text-lg mb-1 group-hover:text-dt-primary transition-colors truncate" title={track.name}>
                  {track.name || "Untitled Track"}
                </h3>
                <p className="text-dt-gray-light mb-2 group-hover:text-white transition-colors truncate" title={track.collectionName}>
                  {track.collectionName || "Unknown Artist"}
                </p>
                {/* Duration is not directly available in AppNftItem from Alchemy unless parsed from metadata */}
                <span className="text-sm text-dt-gray-light">{"--:--"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-satoshi font-bold text-3xl sm:text-4xl mb-4">Ready to Own Your Music?</h2>
          <p className="text-lg sm:text-xl text-dt-gray-light mb-8">
            Connect your wallet and start collecting exclusive tracks from independent artists worldwide.
          </p>
          <appkit-button />
        </div>
      </section>
    </div>
  );
}
