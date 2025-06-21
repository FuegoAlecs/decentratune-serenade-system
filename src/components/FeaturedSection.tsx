
import { TrackCard } from "./TrackCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const featuredTracks = [
  {
    id: "featured-1",
    title: "Cosmic Drift",
    artist: "NebulaBeats",
    duration: "3:42",
    plays: 125420,
    isNFT: true,
  },
  {
    id: "featured-2",
    title: "Digital Soul",
    artist: "CryptoHarmony",
    duration: "4:18",
    plays: 89340,
    isNFT: false,
  },
  {
    id: "featured-3",
    title: "Ethereal Dreams",
    artist: "QuantumBeats",
    duration: "5:23",
    plays: 203850,
    isNFT: true,
  },
  {
    id: "featured-4",
    title: "Neon Nights",
    artist: "SynthWave",
    duration: "3:55",
    plays: 156920,
    isNFT: false,
  },
];

export function FeaturedSection() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-satoshi font-bold text-3xl text-white mb-2">Featured Tracks</h2>
          <p className="text-dt-gray-light">Discover the hottest drops from top artists</p>
        </div>
        <Button variant="ghost" className="text-dt-primary hover:text-dt-primary-dark">
          View All
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredTracks.map((track, index) => (
          <TrackCard key={index} {...track} />
        ))}
      </div>
    </section>
  );
}
