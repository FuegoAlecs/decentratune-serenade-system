
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AudioProvider } from "@/contexts/AudioContext";
import { PersistentAudioPlayer } from "@/components/PersistentAudioPlayer";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Explore from "./pages/Explore";
import TrackDetails from "./pages/TrackDetails";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ArtistsPlaceholder from "./pages/Artists"; // Import new Artists page
import WalletPlaceholder from "./pages/Wallet"; // Import new Wallet page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AudioProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-dark pb-24">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/track/:id" element={<TrackDetails />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/artists" element={<ArtistsPlaceholder />} /> {/* Add Artists route */}
              <Route path="/wallet" element={<WalletPlaceholder />} /> {/* Add Wallet route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <PersistentAudioPlayer />
          </div>
        </BrowserRouter>
      </AudioProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
