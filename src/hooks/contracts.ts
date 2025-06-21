import { type Address, parseEther } from 'ethers'; // viem's parseEther might be preferred if using viem fully
import {
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt,
    // useReadContract, // May need for useTracksOwned if not using Alchemy, or for other hooks
    // useReadContracts // May need for useTracksOwned if not using Alchemy
} from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { Alchemy, Network, type OwnedNft } from 'alchemy-sdk'; // Added Nft and Network

import musicNftAbi from '@/lib/abi/MusicNFT.json';
import tipJarAbi from '@/lib/abi/TipJar.json';

const musicNftContractAddress = import.meta.env.VITE_CONTRACT_MUSIC_NFT as Address | undefined;
const tipJarContractAddress = import.meta.env.VITE_CONTRACT_TIP_JAR as Address | undefined;
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_KEY;

// Configure Alchemy SDK
// Assuming Sepolia based on .env.example. Adjust if necessary.
const alchemySettings = {
    apiKey: alchemyApiKey,
    network: Network.ETH_SEPOLIA, // TODO: Make this configurable based on VITE_CHAIN_ID if supporting multiple chains
};
const alchemy = alchemyApiKey ? new Alchemy(alchemySettings) : null;

// --- Hook to Mint a Track ---
// Based on the provided ABI, the mint function is `mintMusic(string memory tokenURI)`
// It seems to mint to the caller (`msg.sender`) implicitly.
export function useMintTrack() {
    const { address: connectedAddress } = useAccount();
    const {
        data: hash,
        writeContract,
        isPending: isMintPending,
        error: mintError,
        status: mintStatus,
    } = useWriteContract();

    const {
        data: receipt, // expose receipt
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        error: confirmationError,
    } = useWaitForTransactionReceipt({ hash });

    const mintTrack = async (cid: string) => {
        if (!musicNftContractAddress) {
            console.error("Music NFT contract address not configured.");
            // Consider throwing an error or returning a specific error state
            return;
        }
        if (!connectedAddress) {
            console.error("No wallet connected to mint the track.");
            // Consider throwing an error or returning a specific error state
            return;
        }

        writeContract({
            address: musicNftContractAddress,
            abi: musicNftAbi,
            functionName: 'mintMusic', // Corrected function name from ABI
            args: [cid], // The ABI shows `mintMusic(string memory tokenURI)`
            // `to` address is implicit (msg.sender) in this contract's mintMusic
        });
    };

    return {
        mintTrack,
        mintHash: hash,
        isMintPending, // True when waiting for user to confirm in wallet
        mintError,
        mintStatus, // 'idle' | 'pending' (waiting for wallet) | 'success' (tx sent) | 'error'
        isConfirming,
        isConfirmed,
        confirmationError,
        receipt, // return receipt
    };
}

// --- Hook to Tip an Artist ---
export function useTipArtist() {
    const {
        data: hash,
        writeContract,
        isPending: isTipPending,
        error: tipError,
        status: tipStatus,
    } = useWriteContract();

    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        error: confirmationError
    } = useWaitForTransactionReceipt({ hash });

    const tipArtist = async (artistAddress: Address, value: string) => {
        if (!tipJarContractAddress) {
            console.error("Tip Jar contract address not configured.");
            return;
        }
        if (!artistAddress) {
            console.error("Artist address is required for tipping.");
            return;
        }
        let tipValueBigInt;
        try {
            tipValueBigInt = parseEther(value);
        } catch (e) {
            console.error("Invalid tip value:", value, e);
            return;
        }

        if (tipValueBigInt <= BigInt(0)) {
            console.error("Tip value must be positive.");
            return;
        }

        writeContract({
            address: tipJarContractAddress,
            abi: tipJarAbi,
            functionName: 'tip',
            args: [artistAddress],
            value: tipValueBigInt,
        });
    };

    return {
        tipArtist,
        tipHash: hash,
        isTipPending,
        tipError,
        tipStatus,
        isConfirmingTip: isConfirming,
        isTipConfirmed: isConfirmed,
        tipConfirmationError: confirmationError,
    };
}


// --- Hook to Get Tracks Owned by an Address (using Alchemy) ---
// Define a consistent type for our app's NFT items
export interface AppNftItem {
  id: string; // Alchemy uses string token ID with type, or hex. We'll use what it provides or format tokenId.
  name?: string;
  description?: string;
  imageUrl?: string;
  audioUrl?: string; // Assuming we might find this in metadata
  contractAddress: string;
  collectionName?: string;
  externalUrl?: string; // Link to OpenSea, etc.
  rawMetadata?: Record<string, any>; // Store raw metadata if needed
}

const transformAlchemyNft = (alchemyNft: OwnedNft): AppNftItem => {
    // Attempt to find image and audio URLs from various possible places in Alchemy's media/metadata
    let imageUrl = alchemyNft.media?.[0]?.gateway || alchemyNft.raw?.metadata?.image || alchemyNft.contract?.openSeaMetadata?.imageUrl;
    if (imageUrl?.startsWith("ipfs://")) {
        imageUrl = `https://ipfs.io/ipfs/${imageUrl.substring(7)}`;
    }

    // Audio URL is less standard, might be in attributes or a custom metadata field
    let audioUrl = alchemyNft.raw?.metadata?.audio || alchemyNft.raw?.metadata?.animation_url;
    if (audioUrl?.startsWith("ipfs://")) {
        audioUrl = `https://ipfs.io/ipfs/${audioUrl.substring(7)}`;
    }

    return {
        id: alchemyNft.tokenId, // Alchemy's tokenId is usually a hex string for ERC721
        name: alchemyNft.name || alchemyNft.contract?.name || 'Unnamed NFT',
        description: alchemyNft.description || alchemyNft.contract?.openSeaMetadata?.description,
        imageUrl: imageUrl,
        audioUrl: audioUrl,
        contractAddress: alchemyNft.contract.address,
        collectionName: alchemyNft.contract.name || alchemyNft.contract.symbol,
        externalUrl: alchemyNft.contract.openSeaMetadata?.externalLink,
        rawMetadata: alchemyNft.raw?.metadata,
    };
};


export function useTracksOwned(ownerAddress?: Address) {
    return useQuery<AppNftItem[], Error>({
        queryKey: ['tracksOwned', ownerAddress],
        queryFn: async () => {
            if (!ownerAddress) return [];
            if (!alchemy) {
                console.warn("Alchemy SDK not initialized. Cannot fetch owned tracks.");
                // Consider throwing error to be caught by useQuery's error state
                // or returning a specific error object in data.
                throw new Error("Alchemy SDK not available");
            }
            try {
                const response = await alchemy.nft.getNftsForOwner(ownerAddress, {
                    // You can add contractAddresses filter if you only want NFTs from your specific collection
                    // contractAddresses: musicNftContractAddress ? [musicNftContractAddress] : undefined,
                    // pageSize: 100, // control pagination if needed
                });
                return response.ownedNfts.map(transformAlchemyNft);
            } catch (e) {
                console.error("Error fetching NFTs from Alchemy:", e);
                throw e; // Re-throw to be caught by useQuery
            }
        },
        enabled: !!ownerAddress && !!alchemy,
        staleTime: 1000 * 60 * 1, // 1 minute
    });
}

// TODO: Consider useTracksMinted hook if Alchemy can filter by creator/minter,
// or if we need to use the on-chain getTokensMintedBy + metadata fetching.
// For now, `Profile.tsx` still uses direct contract reads for minted tracks.

// TODO: Consider useTrackDetails hook for fetching single track details (tokenURI + on-chain data).
// `TrackDetails.tsx` still uses direct contract reads.


// --- Hook to Get All NFTs for a specific contract (e.g., for an Explore page) ---
export function useAllMusicNFTs(contractAddr?: Address, pageSize: number = 20) {
  return useQuery<AppNftItem[], Error>({
    queryKey: ['allMusicNfts', contractAddr, pageSize],
    queryFn: async () => {
      if (!contractAddr) return [];
      if (!alchemy) {
        console.warn("Alchemy SDK not initialized. Cannot fetch all NFTs for contract.");
        throw new Error("Alchemy SDK not available");
      }
      try {
        // Note: getNftsForContract can return a lot of data.
        // Consider pagination or more specific fetching if performance becomes an issue.
        // The `omitMetadata: false` (default) ensures we get metadata to transform.
        // `pageSize` can be used if the API supports it directly or for client-side limiting after fetch.
        // Alchemy's getNftsForContract does not directly support pageSize in the same way as getNftsForOwner.
        // It might return all, or have its own pagination mechanism using `pageKey`.
        // For simplicity, fetching all and potentially slicing/paginating client-side or fetching in batches if needed.

        let allNfts: OwnedNft[] = [];
        let pageKey: string | undefined = undefined;
        let attempts = 0; // Safety break for loop
        const maxAttempts = 10; // Fetch up to 10 pages, adjust as needed

        // Basic pagination example if we want to fetch more than the default (often 100)
        // For a simple explore page, one page might be enough, or implement proper pagination UI.
        // This example fetches a few pages up to `pageSize` or `maxAttempts`.
        do {
          const response = await alchemy.nft.getNftsForContract(contractAddr, {
            // omitMetadata: false, // default
            pageKey: pageKey,
          });
          allNfts = allNfts.concat(response.nfts);
          pageKey = response.pageKey;
          attempts++;
        } while (pageKey && allNfts.length < pageSize && attempts < maxAttempts);


        // If we fetched more than pageSize due to pageKey fetching full pages, slice it.
        const nftsToDisplay = allNfts.slice(0, pageSize);

        return nftsToDisplay.map(transformAlchemyNft);
      } catch (e) {
        console.error(`Error fetching NFTs for contract ${contractAddr} from Alchemy:`, e);
        throw e;
      }
    },
    enabled: !!contractAddr && !!alchemy,
    staleTime: 1000 * 60 * 5, // 5 minutes for explore page data
  });
}
