import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// RainbowKit styles are no longer needed as we are building a custom UI
// import '@rainbow-me/rainbowkit/styles.css';

import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './lib/wagmi'; // Import the new manual config
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 5000,
        }}
      />
    </QueryClientProvider>
  </WagmiProvider>
);
