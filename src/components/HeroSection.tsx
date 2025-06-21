
import { Button } from "@/components/ui/button";
import { Play, Wallet } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative bg-gradient-hero py-12 px-4 md:py-20 md:px-6 rounded-3xl mb-8">
      {/* This is a correctly formatted JSX comment: Mobile first: padding and text size for small screens. Breakpoints for larger screens. */}
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-4 md:mb-6">
          {/* Adjusted padding and margin for badge */}
          <span className="inline-block bg-dt-primary/20 text-dt-primary px-3 py-1 md:px-4 md:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 md:mb-4">
            🎵 Web3 Music Revolution
          </span>
        </div>
        
        {/* Mobile: text-4xl, md: text-5xl, lg: text-7xl */}
        <h1 className="font-satoshi font-black text-4xl sm:text-5xl md:text-7xl text-white mb-4 md:mb-6 leading-tight">
          Own Your
          <span className="bg-gradient-to-r from-dt-primary to-dt-secondary bg-clip-text text-transparent"> Sound</span>
        </h1>
        
        {/* Mobile: text-base, md: text-xl */}
        <p className="text-base sm:text-lg md:text-xl text-dt-gray-light mb-6 md:mb-8 max-w-xs sm:max-w-md md:max-w-2xl mx-auto leading-relaxed">
          Stream, mint, and trade music NFTs on the first truly decentralized music platform. 
          Empower artists, collect unique tracks, and shape the future of music.
        </p>

        {/* Flex direction is col by default, sm:flex-row for larger screens */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Button text size and padding adjusted for mobile first */}
          <Button className="btn-primary text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 w-full sm:w-auto">
            <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Start Listening
          </Button>
          <Button variant="outline" className="btn-secondary text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 w-full sm:w-auto">
            <Wallet className="h-5 w-5 mr-2" />
            Connect Wallet
          </Button>
        </div>

        {/* Audio Visualizer */}
        <div className="flex justify-center space-x-1 mt-12">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="wave-bar bg-dt-primary w-1 rounded-full"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
