
import { TrendingUp, Flame } from "lucide-react";

const trendingTracks = [
  { rank: 1, title: "Blockchain Boogie", artist: "CryptoFunk", change: "+12" },
  { rank: 2, title: "NFT Anthem", artist: "MetaMusic", change: "+5" },
  { rank: 3, title: "DeFi Dreams", artist: "TokenBeats", change: "+8" },
  { rank: 4, title: "Smart Contract", artist: "Web3Waves", change: "-2" },
  { rank: 5, title: "Decentralized", artist: "P2PSound", change: "+15" },
];

export function TrendingSection() {
  return (
    <section className="mb-12">
      <div className="flex items-center mb-8">
        <Flame className="h-6 w-6 text-orange-500 mr-3" />
        <h2 className="font-satoshi font-bold text-3xl text-white">Trending Now</h2>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <div className="space-y-4">
          {trendingTracks.map((track) => (
            <div key={track.rank} className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
              <div className="flex items-center space-x-4">
                <span className="font-satoshi font-bold text-2xl text-dt-primary w-8">
                  {track.rank}
                </span>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg"></div>
                <div>
                  <h4 className="text-white font-medium">{track.title}</h4>
                  <p className="text-dt-gray-light text-sm">{track.artist}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center ${track.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">{track.change}</span>
                </div>
                <span className="text-dt-gray-light text-sm">2:45</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
