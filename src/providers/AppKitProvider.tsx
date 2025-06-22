import { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains'; // Using wagmi/chains
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';

// 1. Setup queryClient
const queryClient = new QueryClient();

// 2. Create wagmi Config
const wagmiConfig = createConfig({
  chains: [sepolia, mainnet], // Add chains you want to support
  connectors: [
    injected(), // For MetaMask and other browser extension wallets
    // You can add other connectors like walletConnect here if needed in the future
    // e.g., walletConnect({ projectId: 'YOUR_WALLETCONNECT_PROJECT_ID' })
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    // Example for a specific RPC for a chain:
    // [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY`),
  },
  // ssr: true, // Enable SSR if needed, ensure this works with Vite's SSR approach
});


interface AppKitProviderProps { // Renaming to a more generic name might be good later, e.g., Web3Provider
  children: ReactNode;
}

export function AppKitProvider({ children }: AppKitProviderProps) {
  // Removed useEffect and createAppKit call as it's from @reown/appkit

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
