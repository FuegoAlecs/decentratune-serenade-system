
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
      <div className="flex items-center mb-6 md:mb-8"> {/* Adjusted Margin */}
        <Flame className="h-6 w-6 text-dt-accent mr-2 sm:mr-3" /> {/* Themed Color, Responsive Margin */}
        <h2 className="font-satoshi font-bold text-2xl sm:text-3xl text-light-text-primary dark:text-dark-text-primary">Trending Now</h2> {/* Responsive Text, Themed Color */}
      </div>

      <div className="glass-card p-4 sm:p-6 rounded-2xl"> {/* Adjusted Padding */}
        <div className="space-y-3 sm:space-y-4"> {/* Adjusted Spacing */}
          {trendingTracks.map((track) => (
            // Mobile: flex-col, then sm:flex-row. Base padding p-3.
            <div key={track.rank} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 hover:bg-white/5 dark:hover:bg-black/10 rounded-xl transition-colors cursor-pointer">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <span className="font-satoshi font-bold text-xl sm:text-2xl text-dt-primary w-7 sm:w-8 text-center"> {/* Responsive Text & Width */}
                  {track.rank}
                </span>
                {/* Album art placeholder: slightly smaller on mobile */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-lg"></div>
                <div>
                  <h4 className="text-light-text-primary dark:text-dark-text-primary font-medium text-sm sm:text-base">{track.title}</h4> {/* Themed Color, Responsive Text */}
                  <p className="text-dt-gray-light text-xs sm:text-sm">{track.artist}</p> {/* Responsive Text */}
                </div>
              </div>
              
              {/* On mobile (col layout), this div will be full width. On sm+ (row layout), it takes its content size. */}
              <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 w-full sm:w-auto">
                <div className={`flex items-center ${track.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-xs sm:text-sm font-medium">{track.change}</span> {/* Responsive Text */}
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
