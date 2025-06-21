
import { Button } from "@/components/ui/button";
import { Play, Sun, Moon, TrendingUp, ArrowRight, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { WalletConnection } from "@/components/WalletConnection";
import { useAudio } from "@/contexts/AudioContext";

const trendingTracks = [
  {
    id: "1",
    title: "Cosmic Drift",
    artist: "NebulaBeats",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    duration: "3:42",
  },
  {
    id: "2",
    title: "Digital Soul",
    artist: "CryptoHarmony", 
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    duration: "4:18",
  },
  {
    id: "3",
    title: "Ethereal Dreams",
    artist: "QuantumBeats",
    image: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=300&h=300&fit=crop",
    duration: "5:23",
  },
];

export default function Landing() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const { playTrack } = useAudio();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handlePlayPreview = (track: any) => {
    playTrack(track, true);
  };

  // Assuming isDarkMode is always true as per the new theme. This can be removed or refactored.
  // Forcing dark mode based on new theme
  useEffect(() => {
    setIsDarkMode(true);
    document.documentElement.classList.add('dark'); // Ensure dark class is on HTML for global styles
    setIsLoaded(true);
  }, []);

  return (
    // Removed template literal for class, always dark. Added px-4 for mobile padding.
    <div className={`min-h-screen transition-colors duration-300 bg-gradient-dark text-white px-4 sm:px-6 lg:px-8`}>
      {/* Header: Added mobile padding (p-4), md breakpoint for larger padding (p-6) */}
      <header className="flex items-center justify-between p-4 md:p-6">
        {/* Logo and title: Ensure text size is responsive */}
        <div className={`flex items-center space-x-2 sm:space-x-3 transition-all duration-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-200">
            <span className="text-white font-bold text-lg sm:text-xl">D</span>
          </div>
          <h1 className="font-satoshi font-bold text-xl sm:text-2xl">DecentraTune</h1>
        </div>
        
        {/* Right side of header: Ensure WalletConnection is responsive if it's not already */}
        <div className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-500 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Dark mode toggle button removed as per theme requirement, kept WalletConnection */}
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)} // This logic would be removed or changed
            className="hover:bg-white/10 hover:scale-110 transition-all duration-200"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button> */}
          <WalletConnection /> {/* Assume WalletConnection is already responsive or will be handled separately */}
        </div>
      </header>

      {/* Hero Section: py-10 for mobile, md:py-20. px-4 already on parent, can remove here if not needed */}
      <section className="text-center py-10 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className={`transition-all duration-700 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {/* Headline text size: mobile text-4xl, sm:text-5xl, md:text-6xl, lg:text-8xl */}
            <h1 className="font-satoshi font-black text-4xl sm:text-5xl md:text-6xl lg:text-8xl mb-4 md:mb-6">
              Stream.{" "}
              <span className="bg-gradient-to-r from-dt-primary to-dt-secondary bg-clip-text text-transparent">
                Own.
              </span>{" "}
              Earn.
            </h1>
          </div>
          
          {/* Paragraph text size: mobile text-lg, md:text-xl. max-w for mobile and up */}
          <p className={`text-lg md:text-xl text-dt-gray-light mb-6 md:mb-8 max-w-sm sm:max-w-md md:max-w-2xl mx-auto transition-all duration-700 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            The first truly decentralized music platform where artists mint tracks as NFTs 
            and fans collect exclusive music while supporting creators directly.
          </p>

          {/* Buttons: flex-col default, sm:flex-row. Buttons full width on mobile, auto on sm+ */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 md:mb-12 transition-all duration-700 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <Link to="/explore" className="w-full sm:w-auto">
              <Button className="btn-primary text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 hover:scale-105 transition-all duration-200 w-full">
                <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Explore Music
              </Button>
            </Link>
            <Button variant="outline" className="btn-secondary text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 hover:scale-105 transition-all duration-200 w-full sm:w-auto">
              Learn More
            </Button>
          </div>

          {/* Audio Visualizer: Consider reducing number of bars on mobile if it looks too crowded */}
          <div className={`flex justify-center space-x-1 transition-all duration-700 delay-900 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {[...Array(window.innerWidth < 640 ? 10 : 15)].map((_, i) => ( // Example: Fewer bars on small screens
              <div
                key={i}
                className="wave-bar bg-dt-primary w-1 rounded-full"
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
            {trendingTracks.map((track, index) => (
              <div 
                key={track.id} 
                className={`glass-card p-4 sm:p-6 rounded-2xl hover:bg-dt-primary/20 transition-all duration-300 group hover:scale-[1.02] cursor-pointer ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                style={{ transitionDelay: `${1200 + index * 200}ms` }}
              >
                <div className="relative mb-4">
                  <img
                    src={track.image}
                    alt={track.title}
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                  <Button
                    onClick={() => handlePlayPreview(track)}
                    className="absolute inset-0 m-auto w-16 h-16 bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                  >
                    <Play className="h-6 w-6 text-black ml-1" />
                  </Button>
                </div>
                
                <h3 className="font-satoshi font-semibold text-lg mb-1 group-hover:text-dt-primary transition-colors">
                  {track.title}
                </h3>
                <p className="text-dt-gray-light mb-2 group-hover:text-white transition-colors">
                  {track.artist}
                </p>
                <span className="text-sm text-dt-gray-light">{track.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-satoshi font-bold text-4xl mb-4">Ready to Own Your Music?</h2>
          <p className="text-xl text-dt-gray-light mb-8">
            Connect your wallet and start collecting exclusive tracks from independent artists worldwide.
          </p>
          <WalletConnection />
        </div>
      </section>
    </div>
  );
}
