
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MusicPlayer } from "@/components/MusicPlayer";
import { HeroSection } from "@/components/HeroSection";
import { FeaturedSection } from "@/components/FeaturedSection";
import { TrendingSection } from "@/components/TrendingSection";
import { StatsSection } from "@/components/StatsSection";
import { Button } from "@/components/ui/button";
import { Search, Bell, User } from "lucide-react";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-dark">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:text-dt-primary" />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dt-gray-light" />
                  <input
                    type="text"
                    placeholder="Search tracks, artists, or NFTs..."
                    className="bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-dt-gray-light focus:outline-none focus:ring-2 focus:ring-dt-primary w-80"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-white hover:text-dt-primary">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:text-dt-primary">
                  <User className="h-5 w-5" />
                </Button>
                <Button className="btn-primary">
                  Connect Wallet
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="p-6 pb-32">
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
