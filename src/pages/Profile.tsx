
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Music, Upload, TrendingUp, Copy, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const profileData = {
  walletAddress: "0x1234...5678",
  ensName: "musiclover.eth",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
  isArtist: true,
  stats: {
    ownedTracks: 23,
    uploadedTracks: 8,
    totalTips: "12.4 ETH",
    tipsSent: "3.2 ETH",
  }
};

const ownedTracks = [
  {
    id: 1,
    title: "Cosmic Drift",
    artist: "NebulaBeats",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
    purchaseDate: "2024-03-15",
    price: "0.5 ETH",
  },
  {
    id: 2,
    title: "Digital Dreams",
    artist: "TechnoMage",
    image: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=200&h=200&fit=crop",
    purchaseDate: "2024-03-10",
    price: "0.8 ETH",
  },
];

const uploadedTracks = [
  {
    id: 1,
    title: "Neon Nights",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
    mintDate: "2024-03-12",
    sales: 45,
    totalSupply: 100,
    revenue: "22.5 ETH",
  },
  {
    id: 2,
    title: "Urban Legends",
    image: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=200&h=200&fit=crop",
    mintDate: "2024-02-28",
    sales: 100,
    totalSupply: 100,
    revenue: "30.0 ETH",
  },
];

const tipHistory = [
  {
    id: 1,
    type: "sent",
    artist: "NebulaBeats",
    track: "Cosmic Drift",
    amount: "0.1 ETH",
    date: "2024-03-16",
  },
  {
    id: 2,
    type: "received",
    fan: "musicfan.eth",
    track: "Neon Nights",
    amount: "0.05 ETH",
    date: "2024-03-15",
  },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"owned" | "uploaded" | "tips">("owned");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast notification
  };

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-dt-primary/20 to-dt-secondary/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <img
              src={profileData.avatar}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
            />
            
            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                <h1 className="font-satoshi font-bold text-3xl">{profileData.ensName}</h1>
                {profileData.isArtist && (
                  <span className="bg-dt-primary text-white px-3 py-1 rounded-full text-sm">
                    Artist
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <Wallet className="h-4 w-4 text-dt-gray-light" />
                <span className="text-dt-gray-light font-mono">{profileData.walletAddress}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(profileData.walletAddress)}
                  className="text-dt-gray-light hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-dt-primary">{profileData.stats.ownedTracks}</div>
                  <div className="text-dt-gray-light text-sm">Owned Tracks</div>
                </div>
                {profileData.isArtist && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-dt-primary">{profileData.stats.uploadedTracks}</div>
                    <div className="text-dt-gray-light text-sm">Uploaded</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-dt-primary">{profileData.stats.totalTips}</div>
                  <div className="text-dt-gray-light text-sm">Tips Received</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-dt-primary">{profileData.stats.tipsSent}</div>
                  <div className="text-dt-gray-light text-sm">Tips Sent</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              {profileData.isArtist && (
                <Link to="/upload">
                  <Button className="btn-primary">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Track
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="btn-secondary">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Etherscan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={activeTab === "owned" ? "default" : "ghost"}
            onClick={() => setActiveTab("owned")}
            className="flex items-center space-x-2"
          >
            <Music className="h-4 w-4" />
            <span>Owned Tracks</span>
          </Button>
          
          {profileData.isArtist && (
            <Button
              variant={activeTab === "uploaded" ? "default" : "ghost"}
              onClick={() => setActiveTab("uploaded")}
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>My Uploads</span>
            </Button>
          )}
          
          <Button
            variant={activeTab === "tips" ? "default" : "ghost"}
            onClick={() => setActiveTab("tips")}
            className="flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Tip History</span>
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "owned" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ownedTracks.map((track) => (
              <div key={track.id} className="glass-card p-4 rounded-2xl hover:bg-white/10 transition-all duration-300">
                <img
                  src={track.image}
                  alt={track.title}
                  className="w-full aspect-square object-cover rounded-xl mb-4"
                />
                <h3 className="font-satoshi font-semibold mb-1">{track.title}</h3>
                <p className="text-dt-gray-light text-sm mb-2">{track.artist}</p>
                <div className="flex justify-between items-center text-xs text-dt-gray-light">
                  <span>Purchased: {track.purchaseDate}</span>
                  <span className="text-dt-primary font-semibold">{track.price}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "uploaded" && profileData.isArtist && (
          <div className="space-y-6">
            {uploadedTracks.map((track) => (
              <div key={track.id} className="glass-card p-6 rounded-2xl">
                <div className="flex items-center space-x-6">
                  <img
                    src={track.image}
                    alt={track.title}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-satoshi font-semibold text-lg mb-1">{track.title}</h3>
                    <p className="text-dt-gray-light text-sm mb-3">Minted: {track.mintDate}</p>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-dt-gray-light text-sm">Sales</span>
                        <p className="font-semibold">{track.sales}/{track.totalSupply}</p>
                      </div>
                      <div>
                        <span className="text-dt-gray-light text-sm">Revenue</span>
                        <p className="font-semibold text-dt-primary">{track.revenue}</p>
                      </div>
                      <div>
                        <span className="text-dt-gray-light text-sm">Status</span>
                        <p className="font-semibold">
                          {track.sales === track.totalSupply ? "Sold Out" : "Available"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Link to={`/track/${track.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "tips" && (
          <div className="space-y-4">
            {tipHistory.map((tip) => (
              <div key={tip.id} className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      tip.type === "sent" ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"
                    }`}>
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    
                    <div>
                      <p className="font-semibold">
                        {tip.type === "sent" ? `Tipped ${tip.artist}` : `Tip from ${tip.fan}`}
                      </p>
                      <p className="text-dt-gray-light text-sm">
                        Track: {tip.track} • {tip.date}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`font-semibold ${
                    tip.type === "sent" ? "text-red-500" : "text-green-500"
                  }`}>
                    {tip.type === "sent" ? "-" : "+"}{tip.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
