
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
      {/* Mobile: Stacked title/subtitle and button. sm+: Row layout */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8"> {/* Adjusted layout, gap & margin */}
        <div>
          <h2 className="font-satoshi font-bold text-2xl sm:text-3xl text-light-text-primary dark:text-dark-text-primary mb-1 sm:mb-2">Featured Tracks</h2> {/* Themed color, responsive text, adjusted margin */}
          <p className="text-dt-gray-light text-sm sm:text-base">Discover the hottest drops from top artists</p> {/* Responsive text */}
        </div>
        <Button variant="ghost" className="text-dt-primary hover:text-dt-primary-dark w-full sm:w-auto text-sm sm:text-base"> {/* Full width on mobile */}
          View All
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"> {/* Adjusted gap */}
        {featuredTracks.map((track, index) => (
          <TrackCard key={index} {...track} />
        ))}
      </div>
    </section>
  );
}
