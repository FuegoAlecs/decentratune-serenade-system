
import { useState, useEffect } from "react";
import { useAccount, useEnsName, useEnsAvatar, useReadContract, useReadContracts } from 'wagmi';
import { useQuery } from '@tanstack/react-query'; // Already here
import { Button } from "@/components/ui/button";
import { Wallet, Music, Upload, TrendingUp, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTracksOwned } from "@/hooks/contracts"; // Import the new hook
import { formatEther, Address } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { ipfsToHttp } from "@/lib/utils"; // Import the helper

import musicNftAbi from "@/lib/abi/MusicNFT.json";
import tipJarAbi from "@/lib/abi/TipJar.json";

const musicNftContractAddress = import.meta.env.VITE_CONTRACT_MUSIC_NFT as Address | undefined;
const tipJarContractAddress = import.meta.env.VITE_CONTRACT_TIP_JAR as Address | undefined;

// Interface for NFT metadata (can be shared or defined per component if structures vary)
interface NftMetadata {
  name?: string;
  description?: string;
  image?: string; // IPFS URI
  audio?: string; // IPFS URI
  attributes?: { trait_type: string; value: string | number }[];
  properties?: {
    creator_address?: Address;
    // Add other custom properties
  };
  // other fields
  artist?: string; // from mock
  price?: string; // from mock, actual price from contract
  purchaseDate?: string; // from mock, not directly on-chain for ERC721
}

interface OwnedNftItem extends NftMetadata {
  id: bigint; // Token ID
  contractPrice?: string; // Price from contract in ETH
}


// Mock data - will be replaced gradually
const profileDataMock = { // Renamed to avoid conflict
  isArtist: true, // This will likely come from a contract or backend
  stats: {
    // ownedTracks: 23, // Will be derived from fetched ownedNfts.length
    uploadedTracks: 8, // Will be fetched
    totalTips: "12.4 ETH", // Will be fetched
    tipsSent: "3.2 ETH", // Will be fetched
  }
};

// const ownedTracksMock = [ // Mock data, to be replaced by fetchedOwnedNfts
//   {
//     id: 1,
//     title: "Cosmic Drift",
//     artist: "NebulaBeats",
//     image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
//     purchaseDate: "2024-03-15",
//     price: "0.5 ETH",
//   },
// ];

const uploadedTracksMock = [
  {
    id: 1,
    title: "Neon Nights",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
    mintDate: "2024-03-12",
    sales: 45,
    totalSupply: 100,
    revenue: "22.5 ETH",
  },
  {
    id: 2,
    title: "Urban Legends",
    image: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=200&h=200&fit=crop",
    mintDate: "2024-02-28",
    sales: 100,
    totalSupply: 100,
    revenue: "30.0 ETH",
  },
];

/*
const tipHistoryMock = [ // Mock data, to be replaced
  {
    id: 1,
    type: "sent",
    artist: "NebulaBeats",
    track: "Cosmic Drift",
    amount: "0.1 ETH",
    date: "2024-03-16",
  },
  {
    id: 2,
    type: "received",
    fan: "musicfan.eth",
    track: "Neon Nights",
    amount: "0.05 ETH",
    date: "2024-03-15",
  },
];
*/

// ... (imports remain largely the same, ensure useReadContracts is imported)

export default function Profile() {
  const { profileAddress: routeAddress } = useParams<{ profileAddress?: Address }>(); // For viewing other profiles
  const { address: connectedAddress, isConnected, chain } = useAccount();
  const { toast } = useToast();

  const profileAddress = routeAddress || connectedAddress; // Use route param or connected wallet

  const [activeTab, setActiveTab] = useState<"owned" | "uploaded" | "tips">("owned");

  const { data: ensName } = useEnsName({ address: profileAddress, chainId: chain?.id, query: { enabled: !!profileAddress } });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName!, chainId: chain?.id, query: { enabled: !!ensName } });

  // const [fetchedOwnedNfts, setFetchedOwnedNfts] = useState<OwnedNftItem[]>([]); // Will be replaced by useTracksOwned hook
  // const [isLoadingOwnedNfts, setIsLoadingOwnedNfts] = useState(false); // Will be replaced by useTracksOwned hook

  const [fetchedUploadedNfts, setFetchedUploadedNfts] = useState<OwnedNftItem[]>([]); // Keep for now, or create useTracksMinted
  // const [isLoadingUploadedNfts, setIsLoadingUploadedNfts] = useState(false); // Replaced by useQuery

  interface Tip {
    from: Address;
    toArtist: Address;
    trackId: bigint;
    amount: bigint;
    timestamp: bigint;
    // For UI convenience after processing
    type?: 'sent' | 'received';
    trackName?: string; // To be fetched or mapped
    artistName?: string; // ENS or formatted address
    fanName?: string; // ENS or formatted address
    formattedDate?: string;
    formattedAmount?: string;
  }
  const [tipHistory, setTipHistory] = useState<Tip[]>([]);
  const [isLoadingTipHistory, setIsLoadingTipHistory] = useState(false);
  const [totalTipsSent, setTotalTipsSent] = useState<bigint>(BigInt(0));
  const [totalTipsReceived, setTotalTipsReceived] = useState<bigint>(BigInt(0));
  const [isArtistProfile, setIsArtistProfile] = useState<boolean>(false);
  const [isCheckingArtistStatus, setIsCheckingArtistStatus] = useState<boolean>(true);


  // const isArtistProfile = profileDataMock.isArtist; // Replaced by dynamic check below

  const displayAddress = profileAddress ? `${profileAddress.substring(0, 6)}...${profileAddress.substring(profileAddress.length - 4)}` : 'Not Connected';
  const displayName = ensName || displayAddress;
  const displayAvatar = ensAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop";

  // Use the new useTracksOwned hook for "Owned Tracks"
  const {
    data: fetchedOwnedNftsData,
    isLoading: isLoadingOwnedNfts,
    error: ownedNftsError
  } = useTracksOwned(profileAddress);

  // Ensure fetchedOwnedNfts is always an array for mapping, even if data is undefined initially
  const ownedNftsToDisplay: OwnedNftItem[] = (fetchedOwnedNftsData || []).map(nft => ({
    ...nft,
    // Convert Alchemy's string ID to bigint if your OwnedNftItem expects bigint, or adjust OwnedNftItem
    // For now, assuming AppNftItem in useTracksOwned returns an id that's compatible or doesn't need conversion here
    // If AppNftItem.id is string (hex) and OwnedNftItem.id is bigint, conversion is needed.
    // Let's assume AppNftItem from useTracksOwned already aligns with what OwnedNftItem needs or that OwnedNftItem's id can be string.
    // For simplicity, I'll assume the 'id' from useTracksOwned (which is string from Alchemy) is used directly.
    // If OwnedNftItem strictly needs bigint for `id`, this mapping needs adjustment.
    id: typeof nft.id === 'string' && nft.id.startsWith('0x') ? BigInt(nft.id) : BigInt(0), // Example, needs robust parsing if mixed formats
    image: nft.imageUrl, // Map from AppNftItem to OwnedNftItem fields
    name: nft.name,
    artist: nft.collectionName, // Or derive artist differently if needed
    // price: nft.contractPrice, // If available from Alchemy or fetched separately
  }));


  useEffect(() => {
    if (ownedNftsError) {
      toast({ title: "Error loading owned NFTs", description: ownedNftsError.message, variant: "destructive" });
    }
  }, [ownedNftsError, toast]);

  // --- Fetching Uploaded (Minted) NFTs for Artist Profile ---
  // This part remains for now, or could be refactored into a useTracksMinted hook later
  const { data: mintedTokenIdsData, isLoading: isLoadingMintedTokenIds } = useReadContract({
    address: musicNftContractAddress,
    abi: musicNftAbi,
    functionName: 'getTokensMintedBy',
    args: profileAddress ? [profileAddress] : undefined,
    // Query is enabled regardless of current isArtistProfile state, as this determines it.
    query: { enabled: !!profileAddress && !!musicNftContractAddress },
  });

  useEffect(() => {
    if (!isLoadingMintedTokenIds) {
      const ids = (mintedTokenIdsData as bigint[] || []);
      setIsArtistProfile(ids.length > 0);
      setIsCheckingArtistStatus(false);
    }
  }, [mintedTokenIdsData, isLoadingMintedTokenIds]);

  const mintedTokenIds = isArtistProfile ? (mintedTokenIdsData as bigint[] || []).filter(id => typeof id === 'bigint') : [];

  const mintedTokenUriContracts = mintedTokenIds.map(tokenId => ({
    address: musicNftContractAddress,
    abi: musicNftAbi,
    functionName: 'tokenURI',
    args: [tokenId],
  }));

  const { data: mintedTokenUrisResults, isLoading: isLoadingMintedTokenUris } = useReadContracts({
    contracts: mintedTokenUriContracts,
    query: { enabled: mintedTokenIds.length > 0 && isArtistProfile }, // This now correctly depends on the dynamically set isArtistProfile
  });

  useEffect(() => {
    const fetchAllMintedMetadata = async () => {
      if (!mintedTokenUrisResults || mintedTokenIds.length === 0) {
        setFetchedUploadedNfts([]);
        setIsLoadingUploadedNfts(false);
        return;
      }
      setIsLoadingUploadedNfts(true);
      try {
        const metadataPromises = mintedTokenUrisResults.map(async (uriResult, index) => {
          if (uriResult.status === 'success' && typeof uriResult.result === 'string') {
            try {
              const response = await fetch(ipfsToHttp(uriResult.result));
              if (!response.ok) {
                console.warn(`Failed to fetch metadata for ${uriResult.result}: ${response.status}`);
                return null;
              }
              const metadata: NftMetadata = await response.json();
              // TODO: Optionally fetch on-chain sale/revenue stats for each uploaded NFT
              return { ...metadata, id: mintedTokenIds[index] };
            } catch (e) {
              console.warn(`Error fetching or parsing metadata for ${uriResult.result}:`, e);
              return null;
            }
          }
          return null;
        });
        const resolvedMetadata = (await Promise.all(metadataPromises)).filter(Boolean) as OwnedNftItem[];
        setFetchedUploadedNfts(resolvedMetadata);
      } catch (error) {
        console.error("Error fetching uploaded NFT metadata:", error);
        toast({ title: "Error", description: "Could not load uploaded NFTs.", variant: "destructive" });
        setFetchedUploadedNfts([]);
      } finally {
        setIsLoadingUploadedNfts(false);
      }
    };

    if (mintedTokenIds.length > 0 && mintedTokenUrisResults && isArtistProfile) {
      fetchAllMintedMetadata();
    } else if (!isLoadingMintedTokenIds && !isLoadingMintedTokenUris && isArtistProfile) {
      setFetchedUploadedNfts([]);
      setIsLoadingUploadedNfts(false);
    }
  }, [mintedTokenUrisResults, mintedTokenIds, toast, isLoadingMintedTokenIds, isLoadingMintedTokenUris, isArtistProfile]);
  // --- End Fetching Uploaded NFTs ---

  // --- Fetching Tip History ---
  const { data: sentTipsData, isLoading: isLoadingSentTips } = useReadContract({
    address: tipJarContractAddress,
    abi: tipJarAbi,
    functionName: 'getTipsSentByUser',
    args: profileAddress ? [profileAddress] : undefined,
    query: { enabled: !!profileAddress && !!tipJarContractAddress },
  });

  const { data: receivedTipsData, isLoading: isLoadingReceivedTips } = useReadContract({
    address: tipJarContractAddress,
    abi: tipJarAbi,
    functionName: 'getTipsReceivedByArtist',
    args: profileAddress ? [profileAddress] : undefined,
    query: { enabled: !!profileAddress && !!tipJarContractAddress && isArtistProfile }, // Depends on dynamic isArtistProfile
  });

  useEffect(() => {
    setIsLoadingTipHistory(true);
    let combinedTips: Tip[] = [];
    let sentSum = BigInt(0);
    let receivedSum = BigInt(0);

    if (sentTipsData) {
      const processedSentTips = (sentTipsData as Tip[]).map(tip => {
        sentSum += tip.amount;
        return {
          ...tip,
          type: 'sent' as 'sent',
          // TODO: Fetch trackName using tip.trackId -> tokenURI -> metadata.name
          // TODO: Fetch artistName (ENS/address) for tip.toArtist
          // For now, using placeholders or direct values:
          trackName: `Track ID ${tip.trackId.toString()}`,
          artistName: `${tip.toArtist.slice(0,6)}...`,
          formattedDate: new Date(Number(tip.timestamp) * 1000).toLocaleDateString(),
          formattedAmount: formatEther(tip.amount),
        };
      });
      combinedTips = combinedTips.concat(processedSentTips);
    }

    if (receivedTipsData && isArtistProfile) {
      const processedReceivedTips = (receivedTipsData as Tip[]).map(tip => {
        receivedSum += tip.amount;
        return {
          ...tip,
          type: 'received' as 'received',
          trackName: `Track ID ${tip.trackId.toString()}`,
          fanName: `${tip.from.slice(0,6)}...`, // TODO: Fetch ENS for tip.from
          formattedDate: new Date(Number(tip.timestamp) * 1000).toLocaleDateString(),
          formattedAmount: formatEther(tip.amount),
        };
      });
      combinedTips = combinedTips.concat(processedReceivedTips);
    }

    combinedTips.sort((a, b) => Number(b.timestamp) - Number(a.timestamp)); // Sort by newest first
    setTipHistory(combinedTips);
    setTotalTipsSent(sentSum);
    setTotalTipsReceived(receivedSum);
    setIsLoadingTipHistory(false);

  }, [sentTipsData, receivedTipsData, isArtistProfile]);
  // --- End Fetching Tip History ---


  const copyToClipboard = (text: string) => {
    if (text) navigator.clipboard.writeText(text); // TODO: Add toast
  };

  // Initial loading state for the whole page based on essential data
  if (!isConnected && !routeAddress) { // If not connected and not viewing someone else's profile
    return (
      <div className="min-h-screen bg-gradient-dark text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-semibold mb-4">Please connect your wallet</h2>
        <p className="text-dt-gray-light mb-8">Connect your wallet to view your profile or specify a profile address.</p>
      </div>
    );
  }

  if (!profileAddress) { // Should not happen if logic above is correct, but as a safeguard
     return <div className="min-h-screen bg-gradient-dark text-white flex items-center justify-center"><p>No profile address specified.</p></div>;
  }

  const isLoadingPage = isLoadingBalance || (!routeAddress && !isConnected);


  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-dt-primary/20 to-dt-secondary/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <img src={displayAvatar} alt="Profile" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white/20" />
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                <h1 className="font-satoshi font-bold text-2xl sm:text-3xl">{displayName}</h1>
                {isCheckingArtistStatus ? (
                  <Loader2 className="h-5 w-5 animate-spin text-dt-primary ml-2" />
                ) : isArtistProfile && (
                  <span className="bg-dt-primary text-white px-3 py-1 rounded-full text-xs sm:text-sm"> Artist </span>
                )}
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <Wallet className="h-4 w-4 text-dt-gray-light" />
                <span className="text-dt-gray-light font-mono text-sm sm:text-base">{displayAddress}</span>
                {profileAddress && ( <Button variant="ghost" size="sm" onClick={() => copyToClipboard(profileAddress)} className="text-dt-gray-light hover:text-white"> <Copy className="h-4 w-4" /> </Button> )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center">
                  {/* Use isLoadingOwnedNfts from the hook now, isLoadingBalance is removed for this stat */}
                  <div className="text-xl sm:text-2xl font-bold text-dt-primary">{isLoadingOwnedNfts ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : ownedNftsToDisplay.length}</div>
                  <div className="text-dt-gray-light text-xs sm:text-sm">Owned Tracks</div>
                </div>
                {isArtistProfile && ( // Use dynamic isArtistProfile
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-dt-primary">
                      {isLoadingUploadedNfts || isLoadingMintedTokenIds ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : fetchedUploadedNfts.length}
                    </div>
                    <div className="text-dt-gray-light text-xs sm:text-sm">Uploaded</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-dt-primary">
                    {isLoadingTipHistory || isLoadingReceivedTips ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : `${formatEther(totalTipsReceived)} ETH`}
                  </div>
                  <div className="text-dt-gray-light text-xs sm:text-sm">Tips Received</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-dt-primary">
                     {isLoadingTipHistory || isLoadingSentTips ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : `${formatEther(totalTipsSent)} ETH`}
                  </div>
                  <div className="text-dt-gray-light text-xs sm:text-sm">Tips Sent</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-3 w-full md:w-auto">
              {isArtistProfile && connectedAddress === profileAddress && (
                <Link to="/upload" className="w-full md:w-auto"> <Button className="btn-primary w-full"> <Upload className="h-4 w-4 mr-2" /> Upload Track </Button> </Link>
              )}
              {profileAddress && (
                 <Button variant="outline" className="btn-secondary w-full" onClick={() => window.open(`https://sepolia.etherscan.io/address/${profileAddress}`, '_blank')}> <ExternalLink className="h-4 w-4 mr-2" /> View on Etherscan </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:p-6">
        <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
          <Button variant={activeTab === "owned" ? "default" : "ghost"} onClick={() => setActiveTab("owned")} className="flex items-center space-x-2"> <Music className="h-4 w-4" /> <span>Owned Tracks</span> </Button>
          {isArtistProfile && ( <Button variant={activeTab === "uploaded" ? "default" : "ghost"} onClick={() => setActiveTab("uploaded")} className="flex items-center space-x-2"> <Upload className="h-4 w-4" /> <span>My Uploads</span> </Button> )}
          <Button variant={activeTab === "tips" ? "default" : "ghost"} onClick={() => setActiveTab("tips")} className="flex items-center space-x-2"> <TrendingUp className="h-4 w-4" /> <span>Tip History</span> </Button>
        </div>

        {activeTab === "owned" && (
          isLoadingOwnedNfts ? ( // Use isLoading from useTracksOwned hook
            <div className="flex justify-center items-center py-10"> <Loader2 className="h-8 w-8 animate-spin text-dt-primary" /> <p className="ml-3">Loading owned tracks...</p> </div>
          ) : ownedNftsToDisplay.length === 0 ? (
            <p className="text-center text-dt-gray-light py-10">No tracks owned yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ownedNftsToDisplay.map((track) => (
                // Assuming AppNftItem's id is string (from Alchemy). If OwnedNftItem expects bigint, ensure conversion.
                <Link to={`/track/${track.id.toString()}`} key={track.id.toString()} className="glass-card p-4 rounded-2xl hover:bg-white/10 transition-all duration-300 block">
                  <img src={track.image || "/placeholder.svg"} alt={track.name || "Track image"} className="w-full aspect-square object-cover rounded-xl mb-4 bg-white/5" />
                  <h3 className="font-satoshi font-semibold mb-1 truncate" title={track.name}>{track.name || "Untitled Track"}</h3>
                  <p className="text-dt-gray-light text-sm mb-2 truncate" title={track.artist}>
                    {track.artist || "Unknown Artist"}
                  </p>
                  <div className="flex justify-between items-center text-xs text-dt-gray-light">
                    {/* Displaying the token ID from Alchemy which might be hex or decimal string */}
                    <span>ID: {track.id.length > 10 ? `${track.id.slice(0,4)}...${track.id.slice(-4)}` : track.id}</span>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {activeTab === "uploaded" && isArtistProfile && (
          isLoadingUploadedNfts || isLoadingMintedTokenIds || isLoadingMintedTokenUris ? (
            <div className="flex justify-center items-center py-10"> <Loader2 className="h-8 w-8 animate-spin text-dt-primary" /> <p className="ml-3">Loading uploaded tracks...</p> </div>
          ) : fetchedUploadedNfts.length === 0 ? (
            <p className="text-center text-dt-gray-light py-10">No tracks uploaded yet.</p>
          ) : (
            <div className="space-y-6">
              {fetchedUploadedNfts.map((track) => (
                // TODO: This display for uploaded tracks might need more specific data like sales, revenue, etc.
                // which would require additional contract calls per track or a more complex 'getTokensMintedBy' return structure.
                // For now, using similar structure to owned tracks.
                <div key={track.id.toString()} className="glass-card p-4 sm:p-6 rounded-2xl">
                  <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:space-x-4">
                    <img
                        src={ipfsToHttp(track.image) || "/placeholder.svg"}
                        alt={track.name || "Track image"}
                        className="w-full max-w-[150px] sm:w-20 h-auto sm:h-20 aspect-square sm:aspect-auto object-cover rounded-xl mb-4 sm:mb-0 bg-white/5"
                    />
                    <div className="flex-1 w-full">
                      <h3 className="font-satoshi font-semibold text-lg mb-1 truncate" title={track.name}>{track.name || "Untitled Track"}</h3>
                      {/* <p className="text-dt-gray-light text-sm mb-3">Minted: {track.mintDate}</p> */} {/* Mint date not available directly from generic metadata */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 text-xs sm:text-sm mb-4 sm:mb-0">
                        <div> <span className="text-dt-gray-light">Token ID</span> <p className="font-semibold">{track.id.toString()}</p> </div>
                        {/* TODO: Fetch and display Sales, Revenue, Status from contract if available for this specific token */}
                        <div> <span className="text-dt-gray-light">Sales</span> <p className="font-semibold">N/A</p> </div>
                        <div> <span className="text-dt-gray-light">Revenue</span> <p className="font-semibold text-dt-primary">N/A</p> </div>
                      </div>
                    </div>
                    <Link to={`/track/${track.id.toString()}`} className="w-full sm:w-auto sm:ml-auto mt-4 sm:mt-0">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto"> View Details </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === "tips" && (
          // TODO: Implement fetching and display for tip history
          <div className="space-y-4">
            {/* {tipHistoryMock.map((tip) => ( // Still using mock
              <div key={tip.id} className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${ tip.type === "sent" ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500" }`}> <TrendingUp className="h-6 w-6" /> </div>
                    <div>
                      <p className="font-semibold"> {tip.type === "sent" ? `Tipped ${tip.artist}` : `Tip from ${tip.fan}`} </p>
                      <p className="text-dt-gray-light text-sm"> Track: {tip.track} • {tip.date} </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${ tip.type === "sent" ? "text-red-500" : "text-green-500" }`}> {tip.type === "sent" ? "-" : "+"}{tip.amount} </span>
                </div>
              </div>
            ))} */}
            <p className="text-center text-dt-gray-light py-10">Tip history coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
