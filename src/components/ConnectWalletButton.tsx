import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { Wallet, LogOut, Copy as CopyIcon, ExternalLink as ExternalLinkIcon, ChevronDown, X } from 'lucide-react';
import { formatEther, Address } from 'ethers';

// Helper to copy to clipboard
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    toast.success("Address copied to clipboard!");
  }, (err) => {
    toast.error("Failed to copy address.");
    console.error('Could not copy text: ', err);
  });
};


export function ConnectWalletButton() {
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { connectors, connect, status, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();

  const { data: ensName } = useEnsName({ address, query: { enabled: !!address } });
  const { data: balance } = useBalance({ address, query: { enabled: !!address } });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (connectError) {
      toast.error(connectError.shortMessage || "Failed to connect. Please try again.");
    }
  }, [connectError]);

  useEffect(() => {
    if (isConnected && status === 'success' && activeConnector) {
        // Toasting on successful connection might be too much if session is restored.
        // Consider toasting only on explicit user action.
        // toast.success(`Connected to ${activeConnector.name}`);
        setIsModalOpen(false); // Close modal on successful connection
    }
  }, [isConnected, status, activeConnector]);

  const handleConnect = (connector: any) // wagmi's Connector type
   => {
    connect({ connector });
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("Disconnected");
    setIsDropdownOpen(false);
  };

  const displayName = ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not Connected");

  if (isConnected && address) {
    return (
      <div className="relative">
        <Button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          variant="outline"
          className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10"
        >
          <Wallet className="h-4 w-4 text-dt-primary" />
          <span className="text-sm font-medium">{displayName}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </Button>
        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-gradient-dark border border-white/10 rounded-lg shadow-xl z-50 p-4 text-white">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-dt-gray-light">Connected to {activeConnector?.name}</span>
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-dt-gray-light hover:text-white" onClick={() => setIsDropdownOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex items-center space-x-2 mb-2 p-2 rounded-md bg-white/5">
              <img src={`https://effigy.im/a/${address}.svg`} alt="Wallet avatar" className="w-8 h-8 rounded-full" />
              <div>
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-dt-gray-light">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}</p>
              </div>
            </div>
             <div className="flex items-center justify-between text-sm mb-3 p-2 rounded-md bg-white/5">
                <span>Balance</span>
                <span>{balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}` : 'Loading...'}</span>
            </div>
            <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => copyToClipboard(address)}>
                    <CopyIcon className="h-4 w-4 mr-2" /> Copy Address
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank')}>
                    <ExternalLinkIcon className="h-4 w-4 mr-2" /> View on Etherscan
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm text-red-400 hover:text-red-500" onClick={handleDisconnect}>
                    <LogOut className="h-4 w-4 mr-2" /> Disconnect
                </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary flex items-center"
      >
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gradient-dark border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-satoshi">Connect Wallet</DialogTitle>
            <DialogDescription className="text-dt-gray-light">
              Choose your preferred wallet provider to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            {connectors.filter(c => c.ready && c.type !== ' объявлено').map((connector) => ( // Filter out potential 'announced' duplicates
              <Button
                key={connector.uid}
                onClick={() => handleConnect(connector)}
                variant="outline"
                className="w-full h-14 text-base justify-start px-4 hover:bg-white/10 border-white/20"
                disabled={status === 'pending' && connector.id === activeConnector?.id}
              >
                {/* Basic icon attempt based on name, replace with actual icons later */}
                {connector.name.toLowerCase().includes("meta") && <img src="/images/metamask.svg" alt="MetaMask" className="w-6 h-6 mr-3"/>}
                {connector.name.toLowerCase().includes("walletconnect") && <img src="/images/walletconnect.svg" alt="WalletConnect" className="w-6 h-6 mr-3"/>}
                {connector.name.toLowerCase().includes("coinbase") && <img src="/images/coinbase.svg" alt="Coinbase" className="w-6 h-6 mr-3"/>}
                {!connector.name.toLowerCase().includes("meta") && !connector.name.toLowerCase().includes("walletconnect") && !connector.name.toLowerCase().includes("coinbase") && <Wallet className="w-6 h-6 mr-3"/>}

                {connector.name}
                {status === 'pending' && connector.id === activeConnector?.id && <span className="ml-auto text-sm">Connecting...</span>}
              </Button>
            ))}
            {connectors.filter(c => c.ready && c.type !== ' объявлено').length === 0 && (
                <p className="text-center text-dt-gray-light">No wallet connectors found. Please install a wallet like MetaMask.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ConnectWalletButton;
