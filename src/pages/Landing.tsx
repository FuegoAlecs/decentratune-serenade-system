
import { Button } from "@/components/ui/button";
import { Play, Wallet, Sun, Moon, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const trendingTracks = [
  {
    id: 1,
    title: "Cosmic Drift",
    artist: "NebulaBeats",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    duration: "3:42",
    isPreviewPlaying: false,
  },
  {
    id: 2,
    title: "Digital Soul",
    artist: "CryptoHarmony",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    duration: "4:18",
    isPreviewPlaying: false,
  },
  {
    id: 3,
    title: "Ethereal Dreams",
    artist: "QuantumBeats",
    image: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=300&h=300&fit=crop",
    duration: "5:23",
    isPreviewPlaying: false,
  },
];

export default function Landing() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [playingTrack, setPlayingTrack] = useState<number | null>(null);

  const togglePreview = (trackId: number) => {
    setPlayingTrack(playingTrack === trackId ? null : trackId);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gradient-dark text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <h1 className="font-satoshi font-bold text-2xl">DecentraTune</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="hover:bg-white/10"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button className="btn-primary">
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-satoshi font-black text-6xl md:text-8xl mb-6">
            Stream.{" "}
            <span className="bg-gradient-to-r from-dt-primary to-dt-secondary bg-clip-text text-transparent">
              Own.
            </span>{" "}
            Earn.
          </h1>
          
          <p className="text-xl text-dt-gray-light mb-8 max-w-2xl mx-auto">
            The first truly decentralized music platform where artists mint tracks as NFTs 
            and fans collect exclusive music while supporting creators directly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/explore">
              <Button className="btn-primary text-lg px-8 py-4">
                <Play className="h-5 w-5 mr-2" />
                Explore Music
              </Button>
            </Link>
            <Button variant="outline" className="btn-secondary text-lg px-8 py-4">
              Learn More
            </Button>
          </div>

          {/* Audio Visualizer */}
          <div className="flex justify-center space-x-1">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="wave-bar bg-dt-primary w-1 rounded-full"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <TrendingUp className="h-6 w-6 text-dt-primary mr-3" />
            <h2 className="font-satoshi font-bold text-3xl">Trending Now</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingTracks.map((track) => (
              <div key={track.id} className="glass-card p-6 rounded-2xl hover:bg-white/10 transition-all duration-300 group">
                <div className="relative mb-4">
                  <img
                    src={track.image}
                    alt={track.title}
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                  <Button
                    onClick={() => togglePreview(track.id)}
                    className="absolute inset-0 m-auto w-16 h-16 bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="h-6 w-6 text-black ml-1" />
                  </Button>
                </div>
                
                <h3 className="font-satoshi font-semibold text-lg mb-1">{track.title}</h3>
                <p className="text-dt-gray-light mb-2">{track.artist}</p>
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
          <Button className="btn-primary text-lg px-8 py-4">
            <Wallet className="h-5 w-5 mr-2" />
            Connect Wallet to Start
          </Button>
        </div>
      </section>
    </div>
  );
}
