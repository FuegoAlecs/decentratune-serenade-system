import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// import '@rainbow-me/rainbowkit/styles.css'; // Not needed with AppKit

// Remove old Wagmi config and direct QueryClientProvider setup
// import { WagmiProvider } from 'wagmi';
// import { wagmiConfig } from './lib/wagmi';
// import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import { AppKitProvider } from './providers/AppKitProvider'; // Import the new AppKitProvider
import { Toaster } from 'react-hot-toast';

// const queryClient = new QueryClient(); // QueryClient is now initialized within AppKitProvider

createRoot(document.getElementById('root')!).render(
  <AppKitProvider>
    <App />
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 5000,
      }}
    />
  </AppKitProvider>
);
