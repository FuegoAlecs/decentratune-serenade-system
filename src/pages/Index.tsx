
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MusicPlayer } from "@/components/MusicPlayer";
import { HeroSection } from "@/components/HeroSection";
import { FeaturedSection } from "@/components/FeaturedSection";
import { TrendingSection } from "@/components/TrendingSection";
import { StatsSection } from "@/components/StatsSection";
import { Button } from "@/components/ui/button";
import { Search, Bell, User } from "lucide-react";
import { MetaMaskConnectButton } from "@/components/MetaMaskConnectButton"; // Added import
import { Link, useNavigate } from "react-router-dom"; // Added import & useNavigate
import { useState } from "react"; // Added import

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-dark">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/10 px-4 py-3 md:px-6 md:py-4"> {/* Adjusted padding */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 md:space-x-4"> {/* Adjusted spacing for trigger */}
                <SidebarTrigger className="text-white hover:text-dt-primary lg:hidden" /> {/* Hide trigger on larger screens if sidebar is visible */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dt-gray-light" />
                  <input
                    type="text"
                    placeholder="Search tracks, artists, or NFTs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchSubmit();
                      }
                    }}
                    // Updated to use new theme colors, focus ring, and responsive width
                    className="bg-light-card-surface/80 dark:bg-dark-card-surface/80 border border-light-borders-lines dark:border-dark-borders-lines rounded-xl pl-10 pr-4 py-2 text-light-text-primary dark:text-dark-text-primary placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-ring ring-offset-light-background dark:ring-offset-dark-background w-full sm:w-64 md:w-80 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4"> {/* Responsive spacing */}
                <Button variant="ghost" size="icon" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-accent-primary dark:hover:text-dark-accent-primary"> {/* Icon size and themed colors */}
                  <Bell className="h-5 w-5" />
                </Button>
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-accent-primary dark:hover:text-dark-accent-primary"> {/* Icon size and themed colors */}
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <MetaMaskConnectButton />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="px-4 py-6 md:px-6 md:py-8 pb-32"> {/* Adjusted padding */}
            <HeroSection />
            <StatsSection />
            <FeaturedSection />
            <TrendingSection />
          </div>
        </main>
        
        <MusicPlayer />
      </div>
    </SidebarProvider>
  );
};

export default Index;
