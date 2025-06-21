
import { Button } from "@/components/ui/button";
import { Play, Wallet } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative bg-gradient-hero py-20 px-6 rounded-3xl mb-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-6">
          <span className="inline-block bg-dt-primary/20 text-dt-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            🎵 Web3 Music Revolution
          </span>
        </div>
        
        <h1 className="font-satoshi font-black text-5xl md:text-7xl text-white mb-6 leading-tight">
          Own Your
          <span className="bg-gradient-to-r from-dt-primary to-dt-secondary bg-clip-text text-transparent"> Sound</span>
        </h1>
        
        <p className="text-xl text-dt-gray-light mb-8 max-w-2xl mx-auto leading-relaxed">
          Stream, mint, and trade music NFTs on the first truly decentralized music platform. 
          Empower artists, collect unique tracks, and shape the future of music.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button className="btn-primary text-lg px-8 py-4">
            <Play className="h-5 w-5 mr-2" />
            Start Listening
          </Button>
          <Button variant="outline" className="btn-secondary text-lg px-8 py-4">
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
