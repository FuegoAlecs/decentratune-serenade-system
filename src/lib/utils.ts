import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to convert IPFS URI to HTTP URL
export const ipfsToHttp = (ipfsUri?: string): string => {
  if (!ipfsUri) return "";
  // Prioritize dedicated gateway if specified in environment variables for security/rate-limiting
  const gateway = import.meta.env.VITE_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
  if (ipfsUri.startsWith("ipfs://")) {
    return `${gateway}${ipfsUri.substring(7)}`;
  }
  // If it's already an HTTP(S) URL, or some other protocol, return as is.
  if (ipfsUri.startsWith("http://") || ipfsUri.startsWith("https://")) {
    return ipfsUri;
  }
  // Fallback for just CID
  if (!ipfsUri.includes("/")) {
    return `${gateway}${ipfsUri}`;
  }
  return ipfsUri; // Return as is if not recognized ipfs pattern
};
