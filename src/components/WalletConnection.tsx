
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function WalletConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const { toast } = useToast();

  const connectWallet = async () => {
    setIsConnecting(true);
    
    // Simulate wallet connection
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setWalletAddress("0x1234...5678");
      
      toast({
        title: "Wallet Connected!",
        description: "You can now collect music NFTs and tip artists.",
      });
    }, 2000);
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    toast({
      title: "Wallet Disconnected",
      description: "Connect again to access premium features.",
    });
  };

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-green-500 text-sm font-medium">{walletAddress}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={disconnectWallet}
          className="text-red-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={connectWallet}
      disabled={isConnecting}
      className="btn-primary relative overflow-hidden"
    >
      {isConnecting ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </>
      )}
      
      {isConnecting && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      )}
    </Button>
  );
}
