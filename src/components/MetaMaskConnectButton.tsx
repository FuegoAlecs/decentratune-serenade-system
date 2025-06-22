import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { injected } from 'wagmi/connectors'; // Corrected import for wagmi v2
import { Button } from '@/components/ui/button';
import { LogOut, Wallet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MetaMaskConnectButton() {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();

  // Find the MetaMask connector specifically, or default to the first injected connector
  // For wagmi v2, you typically pass the connector function directly (e.g., injected())
  // to the `connect` function if it's not already configured globally.
  // The `connectors` array from `useConnect` will list configured connectors.
  // We will rely on the global wagmi config to have an injected/MetaMask connector.
  // If not, the connect() call might need a specific connector instance.

  const injectedConnectorInstance = connectors.find(c => c.id === 'io.metamask' || c.id === 'injected' || c.name.toLowerCase().includes('metamask'));


  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <Wallet className="h-4 w-4" />
            <span>{ensName ? `${ensName} (${address?.slice(0, 6)}...${address?.slice(-4)})` : `${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => disconnect()}>
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      onClick={() => {
        if (injectedConnectorInstance) {
          connect({ connector: injectedConnectorInstance });
        } else {
          // Attempt to connect with a generic injected connector if not found
          // This relies on the wagmi config having a default injected connector setup
          // Or you can explicitly pass the imported `injected()` connector function
          connect({ connector: injected() });
          // TODO: Consider logging a warning if no specific metamask/injected connector was found in the pre-configured list
          console.warn("MetaMask connector not found in wagmi config, attempting generic injected connection.");
        }
      }}
      disabled={isLoading}
      className="flex items-center space-x-2"
    >
      {isLoading && pendingConnector?.id === injectedConnectorInstance?.id ? ( // Check against found connector's id
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </>
      )}
    </Button>
  );
}
