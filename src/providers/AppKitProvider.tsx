import { ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains'; // Using wagmi/chains for sepolia
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId from https://cloud.reown.com
// Using the projectId provided by the user
const projectId = 'd037b3479d501b08798dfb857b9a0cb4';

// 2. Create a metadata object - optional
const metadata = {
  name: 'DecentraTune', // Updated App Name
  description: 'Decentralized Music Platform', // Updated Description
  // url: window.location.origin, // This can cause issues during build if window is not defined
  url: import.meta.env.VITE_APP_URL || 'https://example.com', // Use env variable or a placeholder
  icons: ['https://assets.reown.com/reown-profile-pic.png'] // Placeholder icon, user might want to change this
};

// 3. Set the networks
// Using Sepolia as primary, as contracts are deployed there.
// User can expand this list if needed.
const networks = [sepolia];

// 4. Create Wagmi Adapter
// Assuming ssr: true might not be needed for a Vite CSR app,
// but following user's example. Can be changed if it causes issues.
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
});

interface AppKitProviderProps {
  children: ReactNode;
}

export function AppKitProvider({ children }: AppKitProviderProps) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
