import { createConfig, http, webSocket } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const alchemyApiKey = import.meta.env.VITE_ALCHEMY_KEY;
const alchemyWsUrl = import.meta.env.VITE_ALCHEMY_WS; // e.g., wss://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!alchemyApiKey) {
  console.warn("VITE_ALCHEMY_KEY is not set. Some functionalities might be limited.");
}
if (!walletConnectProjectId) {
  console.warn("VITE_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not be available.");
}
if (!alchemyWsUrl && alchemyApiKey) {
    console.warn("VITE_ALCHEMY_WS is not set, but VITE_ALCHEMY_KEY is. WebSockets will not be available for Alchemy.")
}


const transports: Record<number, ReturnType<typeof http | typeof webSocket>> = {
  [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`),
};

if (alchemyWsUrl) {
    transports[sepolia.id] = webSocket(alchemyWsUrl);
} else if (alchemyApiKey) { // Fallback to http if only API key is present
    transports[sepolia.id] = http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`);
} else { // Fallback to a generic public RPC if no alchemy key
    transports[sepolia.id] = http();
}


export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(walletConnectProjectId ? [walletConnect({ projectId: walletConnectProjectId, showQrModal: true })] : []),
    coinbaseWallet({
      appName: 'My DecentraTune App', // Optional
      // jsonRpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`, // Optional, defaults to public RPC
    }),
  ],
  transports: transports,
  ssr: false, // Important for Vite/CRA type apps
});

// Log for debugging configuration
// console.log("Wagmi Config Initialized:", wagmiConfig);
// console.log("Alchemy Key:", alchemyApiKey ? "Set" : "Not Set");
// console.log("Alchemy WS URL:", alchemyWsUrl ? "Set" : "Not Set");
// console.log("WalletConnect Project ID:", walletConnectProjectId ? "Set" : "Not Set");
// console.log("Transports:", transports);

export default wagmiConfig;
