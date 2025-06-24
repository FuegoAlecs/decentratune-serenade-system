
import { useState, useEffect } from "react";
import { useAccount, useEnsName, useEnsAvatar, useReadContract, useReadContracts } from 'wagmi';
import { useQuery } from '@tanstack/react-query'; // Already here
import { Button } from "@/components/ui/button";
import { Wallet, Music, Upload, TrendingUp, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTracksOwned, AppNftItem } from "@/hooks/contracts"; // Import the new hook and AppNftItem
import { formatEther, Address } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { ipfsToHttp } from "@/lib/utils"; // Import the helper
import { TrackCard } from "@/components/TrackCard"; // Import TrackCard
import { OperatorApprovalButton } from "@/components/OperatorApprovalButton"; // Import the new component

import musicNftAbi from "@/lib/abi/MusicNFT.json";
import tipJarAbi from "@/lib/abi/TipJar.json";

const musicNftContractAddress = import.meta.env.VITE_CONTRACT_MUSIC_NFT as Address | undefined;
const tipJarContractAddress = import.meta.env.VITE_CONTRACT_TIP_JAR as Address | undefined;
// Define trackSaleAddress (as it's hardcoded in contracts.ts and TrackDetails.tsx for now)
// TODO: Centralize this address if it becomes configurable via .env as well
const trackSaleAddress = "0x542ba58b04c2f0bb9951b5c226d67c7395b78091" as Address;

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

// Mock data definitions (profileDataMock, ownedTracksMock, uploadedTracksMock, tipHistoryMock)
// have been removed as their functionality is covered by live data fetching.

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
    fromEnsName?: string;
    toArtistEnsName?: string;
  }
  const [processedTipHistory, setProcessedTipHistory] = useState<Tip[]>([]); // Renamed from tipHistory for clarity
  const [isLoadingTipHistory, setIsLoadingTipHistory] = useState(true); // Default to true
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

  // Use fetchedOwnedNftsData directly (it's AppNftItem[])
  const ownedNftsToDisplay: AppNftItem[] = fetchedOwnedNftsData || [];

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

  // Effect for processing raw tip data and fetching additional metadata
  useEffect(() => {
    const processAndEnrichTips = async () => {
      console.log('[ProfilePage] processAndEnrichTips called.');
      console.log('[ProfilePage] Raw sentTipsData:', JSON.stringify(sentTipsData, (key, value) => typeof value === 'bigint' ? value.toString() : value));
      console.log('[ProfilePage] Raw receivedTipsData:', JSON.stringify(receivedTipsData, (key, value) => typeof value === 'bigint' ? value.toString() : value));

      if (!sentTipsData && !receivedTipsData) {
        console.log('[ProfilePage] No tip data to process.');
        setProcessedTipHistory([]);
        setIsLoadingTipHistory(false);
        return;
      }
      setIsLoadingTipHistory(true);

      let combinedRawTips: Omit<Tip, 'type' | 'trackName' | 'artistName' | 'fanName' | 'formattedDate' | 'formattedAmount'>[] = [];
      let sentSum = BigInt(0);
      let receivedSum = BigInt(0);

      if (sentTipsData) {
        (sentTipsData as any[]).forEach(tip => {
          sentSum += tip.amount;
          combinedRawTips.push({ ...tip, type: 'sent' });
        });
      }
      if (receivedTipsData && isArtistProfile) {
        (receivedTipsData as any[]).forEach(tip => {
          receivedSum += tip.amount;
          combinedRawTips.push({ ...tip, type: 'received' });
        });
      }
      console.log('[ProfilePage] Processing tips. Combined raw tips:', JSON.stringify(combinedRawTips, (key, value) => typeof value === 'bigint' ? value.toString() : value));

      // Deduplicate tips by transaction hash if available, or a composite key
      // For now, assuming the contract calls return unique sets or events don't overlap in this simple fetch.
      // If Tip objects had a unique `id` or `txHash`, deduplication would be more robust.

      // Fetch metadata for all tips
      const enrichedTipsPromises = combinedRawTips.map(async (rawTip) => {
        let trackName = `Track ID ${rawTip.trackId.toString()}`;
        let fromEns: string | null = null;
        let toArtistEns: string | null = null;

        // 1. Fetch Track Name
        if (musicNftContractAddress && rawTip.trackId) {
          try {
            // This is a simplified way. In a real app, you'd use useReadContract or a batching solution for multiple URIs.
            // For simplicity in this useEffect, we'll do a direct fetch.
            // This is NOT ideal for performance if there are many tips, consider useReadContracts.
            const tokenUriResult = await (window as any).ethereum?.request({ // Using window.ethereum for direct call, replace with wagmi's publicClient if preferred
                method: 'eth_call',
                params: [{
                    to: musicNftContractAddress,
                    data: new (await import('ethers')).Interface(musicNftAbi).encodeFunctionData('tokenURI', [rawTip.trackId])
                }, 'latest']
            });
            if (tokenUriResult) {
                 const iface = new (await import('ethers')).Interface(musicNftAbi);
                 const decodedUri = iface.decodeFunctionResult('tokenURI', tokenUriResult)[0];
                 if (typeof decodedUri === 'string' && decodedUri) {
                    const metadataResponse = await fetch(ipfsToHttp(decodedUri));
                    if (metadataResponse.ok) {
                        const metadata = await metadataResponse.json();
                        trackName = metadata.name || trackName;
                    }
                 }
            }
          } catch (e) {
            console.warn(`Failed to fetch metadata for track ${rawTip.trackId}:`, e);
          }
        }

        // 2. Fetch ENS names (example, ideally useEnsName would be batched or managed outside if many unique addresses)
        // This is also simplified. For many unique addresses, direct useEnsName calls in map aren't ideal.
        // However, wagmi's useEnsName is hook-based, not easily callable in a loop like this.
        // A more complex solution would involve collecting all unique addresses and fetching ENS names once.
        // For now, we'll skip direct ENS fetching in this loop to avoid complexity with hooks.
        // Placeholder: ENS names would be fetched and set here.

        return {
          ...rawTip,
          trackName,
          artistName: rawTip.type === 'sent' ? `${rawTip.toArtist.slice(0, 6)}...` : undefined, // Placeholder
          fanName: rawTip.type === 'received' ? `${rawTip.from.slice(0, 6)}...` : undefined, // Placeholder
          formattedDate: new Date(Number(rawTip.timestamp) * 1000).toLocaleDateString(),
          formattedAmount: formatEther(rawTip.amount),
        } as Tip;
      });

      const resolvedEnrichedTips = await Promise.all(enrichedTipsPromises);
      resolvedEnrichedTips.sort((a, b) => Number(b.timestamp) - Number(a.timestamp)); // Sort by newest first
      console.log('[ProfilePage] Enriched and sorted tips:', JSON.stringify(resolvedEnrichedTips, (key, value) => typeof value === 'bigint' ? value.toString() : value));

      setProcessedTipHistory(resolvedEnrichedTips);
      setTotalTipsSent(sentSum);
      setTotalTipsReceived(receivedSum);
      setIsLoadingTipHistory(false);
      console.log('[ProfilePage] Finished processing tips.');
    };

    console.log(`[ProfilePage] Tip history useEffect trigger: isLoadingSentTips=${isLoadingSentTips}, isLoadingReceivedTips=${isLoadingReceivedTips}, isCheckingArtistStatus=${isCheckingArtistStatus}, profileAddress=${profileAddress}, tipJarContractAddress=${tipJarContractAddress}`);
    if ((profileAddress && tipJarContractAddress) && (isLoadingSentTips || isLoadingReceivedTips || isCheckingArtistStatus)) {
      // Still waiting for initial data or artist status
      console.log('[ProfilePage] Tip history: Still waiting for initial data or artist status.');
      setIsLoadingTipHistory(true);
    } else {
      console.log('[ProfilePage] Tip history: Proceeding to processAndEnrichTips.');
      processAndEnrichTips();
    }
  }, [sentTipsData, receivedTipsData, isArtistProfile, profileAddress, tipJarContractAddress, musicNftContractAddress, isLoadingSentTips, isLoadingReceivedTips, isCheckingArtistStatus, chain?.id]);
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

  // const isLoadingPage = isLoadingBalance || (!routeAddress && !isConnected); // Removed as specific loaders are used.

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
        {/* Marketplace Settings Section - Visible only on own profile */}
        {(() => {
          if (connectedAddress && profileAddress && connectedAddress.toLowerCase() === profileAddress.toLowerCase()) {
            console.log('Profile.tsx - Rendering OperatorApprovalButton. Props:');
            console.log('Profile.tsx - musicNftAddress:', musicNftContractAddress);
            console.log('Profile.tsx - trackSaleAddress:', trackSaleAddress);
            console.log('Profile.tsx - userAddress (from connectedAddress):', connectedAddress);
            return (
              <div className="mb-8 p-4 sm:p-6 border border-white/10 rounded-lg glass-card">
                <h2 className="text-xl font-satoshi font-semibold mb-4">Marketplace Settings</h2>
                <OperatorApprovalButton
                  musicNftAddress={musicNftContractAddress}
                  trackSaleAddress={trackSaleAddress}
                  userAddress={connectedAddress} // Since this is user's own profile, userAddress is connectedAddress
                />
              </div>
            );
          }
          return null;
        })()}

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
              {ownedNftsToDisplay.map((nft) => (
                <TrackCard
                  key={nft.id}
                  id={nft.id}
                  title={nft.name || "Untitled Track"}
                  artist={nft.collectionName || "Unknown Artist"} // This is more like collection name, artist display name might be in metadata
                  ownerAddress={profileAddress} // Pass the owner address (the profile being viewed)
                  image={nft.imageUrl || "/placeholder.svg"}
                  audioUrl={nft.audioUrl}
                  isNFT={true}
                  // isOwned is now determined within TrackCard based on ownerAddress and connectedAddress
                  // duration, plays, etc., can be passed if available in AppNftItem/rawMetadata
                />
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
            // Using TrackCard directly for uploaded tracks for consistency
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {fetchedUploadedNfts.map((track) => (
                <TrackCard
                  key={track.id.toString()}
                  id={track.id.toString()}
                  title={track.name || "Untitled Track"}
                  // Artist here is the minter, which is the profileAddress
                  artist={ensName || displayAddress}
                  ownerAddress={profileAddress} // Minter is assumed owner for list/delist on this tab
                  image={ipfsToHttp(track.image) || "/placeholder.svg"}
                  audioUrl={track.audio ? ipfsToHttp(track.audio) : undefined}
                  isNFT={true}
                  // duration, plays, etc. would come from track.attributes or track.properties if available
                />
              ))}
            </div>
          )
        )}

        {activeTab === "tips" && (
          isLoadingTipHistory ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-dt-primary" />
              <p className="ml-3">Loading tip history...</p>
            </div>
          ) : processedTipHistory.length === 0 ? (
            <p className="text-center text-dt-gray-light py-10">No tip history found.</p>
          ) : (
            <div className="space-y-4">
              {processedTipHistory.map((tip, index) => (
                <div key={index} className="p-4 border border-white/10 rounded-lg glass-card-muted flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                      {tip.type === 'sent' ? 'Sent Tip to ' : 'Received Tip from '}
                      <Link
                        to={`/profile/${tip.type === 'sent' ? tip.toArtist : tip.from}`}
                        className="text-dt-primary hover:underline"
                      >
                        {tip.type === 'sent' ? (tip.toArtistEnsName || tip.artistName) : (tip.fromEnsName || tip.fanName)}
                      </Link>
                    </div>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      For Track: <span className="font-medium text-light-text-primary dark:text-dark-text-primary">{tip.trackName}</span> (ID: {tip.trackId.toString()})
                    </p>
                    <p className="text-xs text-dt-gray-light">{tip.formattedDate}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${tip.type === 'sent' ? 'text-red-400' : 'text-green-400'}`}>
                      {tip.type === 'sent' ? '-' : '+'} {tip.formattedAmount} ETH
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
