
import { Button } from "@/components/ui/button";
import { Play, Wallet } from "lucide-react";

export function HeroSection() {
  return (
    <div
      className="relative py-12 px-4 md:py-20 md:px-6 rounded-3xl mb-8
                 bg-light-card-surface dark:bg-dark-card-surface
                 border border-light-borders-lines dark:border-dark-borders-lines
                 shadow-card-light dark:shadow-none" // Using new theme colors and shadow for light mode
    >
      {/* Mobile first: padding and text size for small screens. Breakpoints for larger screens. */}
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-4 md:mb-6">
          {/* Badge styling with new theme colors */}
          <span
            className="inline-block bg-light-accent-primary/10 dark:bg-dark-accent-primary/20
                       text-light-accent-primary dark:text-dark-accent-primary
                       px-3 py-1 md:px-4 md:py-2 rounded-full
                       text-xs sm:text-sm font-medium mb-3 md:mb-4"
          >
            🎵 Web3 Music Revolution
          </span>
        </div>
        
        {/* Headline uses new text colors */}
        <h1
          className="font-satoshi font-black
                     text-4xl sm:text-5xl md:text-7xl
                     text-light-text-primary dark:text-dark-text-primary
                     mb-4 md:mb-6 leading-tight"
        >
          Own Your
          {/* Gradient span uses new theme gradients */}
          <span className="bg-accent-gradient-light dark:bg-accent-gradient-dark bg-clip-text text-transparent"> Sound</span>
        </h1>
        
        {/* Paragraph uses new text colors */}
        <p
          className="text-base sm:text-lg md:text-xl
                     text-light-text-secondary dark:text-dark-text-secondary
                     mb-6 md:mb-8 max-w-xs sm:max-w-md md:max-w-2xl mx-auto leading-relaxed"
        >
          Stream, mint, and trade music NFTs on the first truly decentralized music platform. 
          Empower artists, collect unique tracks, and shape the future of music.
        </p>

        {/* Buttons use .btn-primary and .btn-secondary from index.css which are now themeable */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button className="btn-primary text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 w-full sm:w-auto">
            <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Start Listening
          </Button>
          <Button className="btn-secondary text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 w-full sm:w-auto">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Connect Wallet
          </Button>
        </div>

        {/* Audio Visualizer uses new accent color */}
        <div className="flex justify-center space-x-1 mt-12">
          {[...Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 12 : 20)].map((_, i) => ( // Responsive number of bars
            <div
              key={i}
              className="wave-bar bg-light-accent-primary dark:bg-dark-accent-primary w-1 rounded-full"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
