import { type Address, parseEther } from 'ethers'; // viem's parseEther might be preferred if using viem fully
import {
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt,
    usePublicClient, // Added usePublicClient
    // useReadContract, // May need for useTracksOwned if not using Alchemy, or for other hooks
    // useReadContracts // May need for useTracksOwned if not using Alchemy
} from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Added useQueryClient
import { Alchemy, Network, type OwnedNft } from 'alchemy-sdk'; // Added Nft and Network

import musicNftAbi from '@/lib/abi/MusicNFT.json';
import tipJarAbi from '@/lib/abi/TipJar.json';
import trackSaleV2Abi from '@/lib/abi/TrackSaleV2.json'; // Import the new ABI

const musicNftContractAddress = import.meta.env.VITE_CONTRACT_MUSIC_NFT as Address | undefined;
const tipJarContractAddress = import.meta.env.VITE_CONTRACT_TIP_JAR as Address | undefined;
export const trackSaleV2ContractAddress = import.meta.env.VITE_CONTRACT_TRACK_SALE_V2 as Address | undefined; // Add new contract address
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

    const queryClient = useQueryClient(); // Get query client

    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        error: confirmationError,
        data: tipReceipt, // Capture receipt to use its status
    } = useWaitForTransactionReceipt({
        hash,
        onSuccess: (data) => { // Invalidate queries on successful confirmation
            if (data.status === 'success') {
                console.log('[useTipArtist] Tip transaction successful, invalidating tip history queries.');
                // Invalidate queries related to tip history.
                // These keys are educated guesses based on wagmi's patterns.
                // Consider broader invalidation if specific keys are complex or numerous.
                queryClient.invalidateQueries({ queryKey: ['readContract', tipJarContractAddress, 'getTipsSentByUser'] });
                queryClient.invalidateQueries({ queryKey: ['readContract', tipJarContractAddress, 'getTipsReceivedByArtist'] });
                // A broader approach if specific args for query keys are unknown/dynamic here:
                // queryClient.invalidateQueries({ queryKey: ['readContract', tipJarContractAddress] });
            }
        }
    });

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
    const pinataGateway = "https://harlequin-leading-squirrel-331.mypinata.cloud/ipfs/";

    let imageUrl = alchemyNft.media?.[0]?.gateway || alchemyNft.raw?.metadata?.image || alchemyNft.contract?.openSeaMetadata?.imageUrl;
    if (imageUrl?.startsWith("ipfs://")) {
        imageUrl = `${pinataGateway}${imageUrl.substring(7)}`;
    } else if (imageUrl && !imageUrl.startsWith("http")) { // Assuming raw CID for image if not starting with http
        // This case might need refinement if image CIDs could be non-IPFS identifiers
        // For now, let's assume if it's not ipfs:// and not http(s)://, it could be a raw CID
        // However, image URLs from `alchemyNft.media[0].gateway` should already be HTTP URLs.
        // This primarily targets `alchemyNft.raw.metadata.image`.
        const looksLikeCid = imageUrl.length > 40 && (imageUrl.startsWith("Qm") || imageUrl.startsWith("bafy")); // Basic CID check
        if (looksLikeCid) {
            imageUrl = `${pinataGateway}${imageUrl}`;
        }
    }


    let audioUrl: string | undefined = undefined;
    const rawMetadata = alchemyNft.raw?.metadata;

    if (rawMetadata) {
        const animationUrlField = rawMetadata.animation_url;
        const audioField = rawMetadata.audio;

        if (typeof animationUrlField === 'string' && animationUrlField.trim() !== '') {
            if (animationUrlField.startsWith("ipfs://")) {
                audioUrl = `${pinataGateway}${animationUrlField.substring(7)}`;
            } else if (!animationUrlField.startsWith("http")) { // Assume raw CID
                audioUrl = `${pinataGateway}${animationUrlField}`;
            } else {
                audioUrl = animationUrlField; // Already a full URL
            }
        } else if (typeof audioField === 'string' && audioField.trim() !== '') {
            // Fallback to audio field
            if (audioField.startsWith("ipfs://")) {
                audioUrl = `${pinataGateway}${audioField.substring(7)}`;
            } else if (!audioField.startsWith("http")) { // Assume raw CID
                audioUrl = `${pinataGateway}${audioField}`;
            } else {
                audioUrl = audioField; // Already a full URL
            }
        }
    }
    // If audioUrl is still undefined here, it means neither animation_url nor audio field provided a usable value.

    return {
        id: alchemyNft.tokenId,
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

import { useState, useEffect } from 'react'; // Import useState and useEffect

// --- TrackSaleV2 Hooks ---

export type ListingStep = "idle" | "checkingApproval" | "needsApproval" | "approving" | "listing" | "error" | "success";

// Hook to list a track for sale
export function useListTrackForSale() {
    const { address: connectedAddress } = useAccount();
    const publicClient = usePublicClient();

    // State for managing the multi-step process
    const [currentStep, setCurrentStep] = useState<ListingStep>("idle");
    const [operationError, setOperationError] = useState<Error | null>(null);
    const [approvalHash, setApprovalHash] = useState<Address | undefined>(undefined);
    const [listingHash, setListingHash] = useState<Address | undefined>(undefined);
    // State to store details for the listing step if approval is required first
    const [pendingListingDetails, setPendingListingDetails] = useState<{ tokenId: bigint, priceWei: bigint } | null>(null);

    // Wagmi hook for MusicNFT.approve()
    const {
        writeContractAsync: approveMusicNft, // Using writeContractAsync for manual awaiting
        isPending: isApproveSignPending, // User is signing approve tx in wallet
        reset: resetApprove,
    } = useWriteContract();

    // Wagmi hook for TrackSaleV2.setTrackPrice()
    const {
        writeContractAsync: setTrackPriceOnSaleContract, // Using writeContractAsync
        isPending: isSetPriceSignPending, // User is signing setTrackPrice tx in wallet
        reset: resetSetPrice,
    } = useWriteContract();

    // Use specific useWaitForTransactionReceipt hooks for each transaction
    const {
        isLoading: isApproveConfirming,
        isSuccess: isApproveConfirmed,
        error: approveConfirmationError,
        data: approveReceipt,
    } = useWaitForTransactionReceipt({ hash: approvalHash });

    const {
        isLoading: isListingConfirming,
        isSuccess: isListingConfirmed,
        error: listingConfirmationError,
        data: listingReceipt
    } = useWaitForTransactionReceipt({ hash: listingHash });


    const listTrack = async (tokenId: string, priceEth: string) => {
        console.log(`[useListTrackForSale] listTrack called with tokenId: ${tokenId}, priceEth: ${priceEth}`);
        setOperationError(null);
        resetApprove();
        resetSetPrice();
        setApprovalHash(undefined);
        setListingHash(undefined);
        setPendingListingDetails(null); // Clear any pending details

        if (!trackSaleV2ContractAddress) {
            console.error("TrackSaleV2 contract address not configured.");
            setOperationError(new Error("TrackSaleV2 contract address not configured."));
            setCurrentStep("error");
            return;
        }
        if (!connectedAddress) {
            console.error("No wallet connected to list the track.");
            setOperationError(new Error("No wallet connected."));
            setCurrentStep("error");
            return;
        }
        if (!musicNftContractAddress) {
            console.error("MusicNFT contract address not configured for approval check.");
            setOperationError(new Error("MusicNFT contract address not configured."));
            setCurrentStep("error");
            return;
        }
        if (!publicClient) {
            console.error("Public client not available for checking approval.");
            setOperationError(new Error("Public client not available."));
            setCurrentStep("error");
            return;
        }

        let localPriceWei: bigint;
        try {
            localPriceWei = parseEther(priceEth);
            console.log(`[useListTrackForSale] Parsed priceEth '${priceEth}' to localPriceWei: ${localPriceWei.toString()}`);
        } catch (e) {
            console.error(`[useListTrackForSale] Invalid priceEth format: '${priceEth}'`, e);
            setOperationError(new Error("Invalid price format."));
            setCurrentStep("error");
            return;
        }
        if (localPriceWei <= BigInt(0)) {
            console.error(`[useListTrackForSale] Price must be positive. Received: ${localPriceWei.toString()}`);
            setOperationError(new Error("Price must be positive."));
            setCurrentStep("error");
            return;
        }

        let localTokenIdBigInt: bigint;
        try {
            localTokenIdBigInt = BigInt(tokenId);
            console.log(`[useListTrackForSale] Parsed tokenId '${tokenId}' to localTokenIdBigInt: ${localTokenIdBigInt.toString()}`);
        } catch (e) {
            console.error(`[useListTrackForSale] Invalid tokenId format for BigInt conversion: '${tokenId}'`, e);
            setOperationError(new Error("Invalid tokenId format."));
            setCurrentStep("error");
            return;
        }

        setPendingListingDetails({ tokenId: localTokenIdBigInt, priceWei: localPriceWei });
        console.log(`[useListTrackForSale] Pending listing details set: tokenId=${localTokenIdBigInt.toString()}, priceWei=${localPriceWei.toString()}`);

        try {
            setCurrentStep("checkingApproval");
            console.log(`[useListTrackForSale] Step: checkingApproval. TokenId: ${localTokenIdBigInt}, PriceWei: ${localPriceWei}`);

            // 1. Check isApprovedForAll first
            console.log(`[useListTrackForSale] Checking isApprovedForAll for owner ${connectedAddress} to operator ${trackSaleV2ContractAddress}`);
            const isOperatorApproved = await publicClient.readContract({
                address: musicNftContractAddress!, // Added non-null assertion, checked above
                abi: musicNftAbi,
                functionName: 'isApprovedForAll',
                args: [connectedAddress!, trackSaleV2ContractAddress!], // Added non-null assertion
            });
            console.log(`[useListTrackForSale] isApprovedForAll status: ${isOperatorApproved}`);

            if (isOperatorApproved) {
                console.log("[useListTrackForSale] Operator is approved. Proceeding directly to listing.");
                await _proceedToListing(localTokenIdBigInt, localPriceWei);
                return;
            }

            // 2. If not operator approved, check for single token approval
            console.log(`[useListTrackForSale] Operator not globally approved. Checking single token approval for token ID: ${localTokenIdBigInt} to spender: ${trackSaleV2ContractAddress}`);
            const approvedAddress = await publicClient.readContract({
                address: musicNftContractAddress!, // Added non-null assertion
                abi: musicNftAbi,
                functionName: 'getApproved',
                args: [localTokenIdBigInt],
            });
            console.log(`[useListTrackForSale] Current single-token approved address for token ${localTokenIdBigInt}: ${approvedAddress}`);

            const isSingleTokenApproved = approvedAddress?.toLowerCase() === trackSaleV2ContractAddress!.toLowerCase();

            if (!isSingleTokenApproved) {
                setCurrentStep("needsApproval");
                console.log(`[useListTrackForSale] Step: needsApproval. Single token approval needed for token ID: ${localTokenIdBigInt}. Requesting approval...`);
                const approveArgs: readonly [`0x${string}`, bigint] = [trackSaleV2ContractAddress!, localTokenIdBigInt];
                // Safe logging for BigInt array
                console.log(`[useListTrackForSale] Calling approveMusicNft with spender: ${approveArgs[0]}, tokenId: ${approveArgs[1].toString()}`);
                const approveTxHash = await approveMusicNft({
                    address: musicNftContractAddress!, // Added non-null assertion
                    abi: musicNftAbi,
                    functionName: 'approve',
                    args: approveArgs,
                });
                setApprovalHash(approveTxHash);
                setCurrentStep("approving");
                console.log(`[useListTrackForSale] Step: approving. Approval transaction sent: ${approveTxHash}. Waiting for confirmation...`);
                return;
            }

            console.log(`[useListTrackForSale] Single token already approved. Proceeding directly to listing.`);
            await _proceedToListing(localTokenIdBigInt, localPriceWei);

        } catch (err: any) {
            console.error("[useListTrackForSale] Error during listing initiation or approval check:", err);
            setOperationError(err);
            setCurrentStep("error");
            setPendingListingDetails(null);
        }
    };

    const _proceedToListing = async (tokenIdToProcess: bigint, priceWeiToProcess: bigint) => {
        console.log(`[useListTrackForSale] _proceedToListing called. TokenId: ${tokenIdToProcess}, PriceWei: ${priceWeiToProcess}`);
        try {
            setCurrentStep("listing");
            console.log(`[useListTrackForSale] Step: listing. Proceeding to list token ${tokenIdToProcess.toString()} for ${priceWeiToProcess.toString()} wei.`);
            const setPriceArgs: readonly [bigint, bigint] = [tokenIdToProcess, priceWeiToProcess];
            // Safe logging for BigInt array
            console.log(`[useListTrackForSale] Calling setTrackPriceOnSaleContract with tokenId: ${setPriceArgs[0].toString()}, priceWei: ${setPriceArgs[1].toString()}`);
            const listTxHash = await setTrackPriceOnSaleContract({
                address: trackSaleV2ContractAddress!, // Added non-null assertion
                abi: trackSaleV2Abi,
                functionName: 'setTrackPrice',
                args: setPriceArgs,
            });
            setListingHash(listTxHash);
            console.log(`[useListTrackForSale] Step: listing. Set track price transaction sent: ${listTxHash}. Waiting for confirmation...`);
        } catch (err: any) {
            console.error("[useListTrackForSale] Error during setTrackPrice call:", err);
            setOperationError(err);
            setCurrentStep("error");
        } finally {
            setPendingListingDetails(null);
        }
    };

    useEffect(() => {
        console.log(`[useListTrackForSale] Approval Effect: currentStep=${currentStep}, isApproveConfirmed=${isApproveConfirmed}, pendingListingDetails=${!!pendingListingDetails}`);
        if (currentStep === 'approving' && isApproveConfirmed && pendingListingDetails) {
            if (approveReceipt) {
                console.log(`[useListTrackForSale] Approval receipt status: ${approveReceipt.status}`);
                if (approveReceipt.status === 'success') {
                    console.log('[useListTrackForSale] Approval confirmed. Automatically proceeding to list.');
                    _proceedToListing(pendingListingDetails.tokenId, pendingListingDetails.priceWei);
                } else {
                     console.error("[useListTrackForSale] Approval transaction reverted on-chain.");
                     setOperationError(new Error("NFT Approval transaction failed (reverted)."));
                     setCurrentStep("error");
                     setPendingListingDetails(null);
                }
            } else {
                console.error("[useListTrackForSale] approveReceipt is undefined even though isApproveConfirmed is true.");
                setOperationError(new Error("Approval data missing despite confirmation. Please retry."));
                setCurrentStep("error");
                setPendingListingDetails(null);
            }
        } else if (currentStep === 'approving' && approveConfirmationError) {
            console.error("[useListTrackForSale] Approval confirmation error (useWaitForTransactionReceipt):", approveConfirmationError);
            setOperationError(new Error(`Approval failed: ${approveConfirmationError.message}`));
            setCurrentStep("error");
            setPendingListingDetails(null);
        }
    }, [isApproveConfirmed, approveConfirmationError, approveReceipt, currentStep, pendingListingDetails]);

    useEffect(() => {
        console.log(`[useListTrackForSale] Listing Effect: currentStep=${currentStep}, isListingConfirmed=${isListingConfirmed}`);
        if (currentStep === 'listing' && isListingConfirmed && listingReceipt) {
            console.log(`[useListTrackForSale] Listing receipt status: ${listingReceipt.status}`);
             if (listingReceipt.status === 'success') {
                console.log('[useListTrackForSale] Listing confirmed!');
                setCurrentStep("success");
            } else {
                console.error("[useListTrackForSale] Listing transaction reverted.");
                setOperationError(new Error("Set track price transaction failed."));
                setCurrentStep("error");
            }
        } else if (currentStep === 'listing' && listingConfirmationError) {
            console.error("[useListTrackForSale] Listing confirmation error:", listingConfirmationError);
            setOperationError(listingConfirmationError);
            setCurrentStep("error");
        }
    }, [isListingConfirmed, listingConfirmationError, listingReceipt, currentStep]);


    return {
        listTrack,
        currentStep,
        operationError,
        isApproveSignPending, // Signing approval in wallet
        isApproveConfirming,  // Approval tx is confirming on-chain
        isApproveConfirmed,   // Approval tx succeeded
        approveConfirmationError,
        approvalHash,
        isSetPriceSignPending, // Signing listing in wallet
        isListingConfirming,   // Listing tx is confirming on-chain
        isListingConfirmed,    // Listing tx succeeded
        listingConfirmationError,
        listingHash,
        resetState: () => { // Function to reset all local state
            setCurrentStep("idle");
            setOperationError(null);
            setApprovalHash(undefined);
            setListingHash(undefined);
            resetApprove(); // Resets wagmi's internal state for this write hook
            resetSetPrice(); // Resets wagmi's internal state for this write hook
        }
    };
}

// Hook to delist a track
export function useDelistTrack() {
    const { address: connectedAddress } = useAccount();
    const {
        data: hash,
        writeContract,
        isPending: isDelistPending,
        error: delistError,
        status: delistStatus,
    } = useWriteContract();

    const {
        data: receipt,
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        error: confirmationError,
    } = useWaitForTransactionReceipt({ hash });

    const delistTrack = async (tokenId: string) => {
        if (!trackSaleV2ContractAddress) {
            console.error("TrackSaleV2 contract address not configured.");
            return;
        }
        if (!connectedAddress) {
            console.error("No wallet connected to delist the track.");
            return;
        }
        console.log(`Delisting track ${tokenId}`);
        writeContract({
            address: trackSaleV2ContractAddress,
            abi: trackSaleV2Abi,
            functionName: 'delistTrack', // from ABI: delistTrack(uint256 tokenId)
            args: [BigInt(tokenId)],
        });
    };

    return {
        delistTrack,
        delistHash: hash,
        isDelistPending,
        delistError,
        delistStatus,
        isConfirmingDelist: isConfirming,
        isDelistConfirmed: isConfirmed,
        delistConfirmationError: confirmationError,
        delistReceipt: receipt,
    };
}

// Hook to buy a track
export function useBuyTrack() {
    const { address: connectedAddress } = useAccount();
    const {
        data: hash,
        writeContract,
        isPending: isBuyPending,
        error: buyError,
        status: buyStatus,
    } = useWriteContract();

    const {
        data: receipt,
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        error: confirmationError,
    } = useWaitForTransactionReceipt({ hash });

    const buyTrack = async (tokenId: string, priceWei: bigint) => {
        if (!trackSaleV2ContractAddress) {
            console.error("TrackSaleV2 contract address not configured.");
            return;
        }
        if (!connectedAddress) {
            console.error("No wallet connected to buy the track.");
            return;
        }
        if (priceWei <= BigInt(0)) {
            console.error("Price must be positive for buying.");
            return;
        }
        console.log(`Buying track ${tokenId} for ${priceWei} wei`);
        writeContract({
            address: trackSaleV2ContractAddress,
            abi: trackSaleV2Abi,
            functionName: 'buy', // from ABI: buy(uint256 tokenId)
            args: [BigInt(tokenId)],
            value: priceWei,
        });
    };

    return {
        buyTrack,
        buyHash: hash,
        isBuyPending,
        buyError,
        buyStatus,
        isConfirmingBuy: isConfirming,
        isBuyConfirmed: isConfirmed,
        buyConfirmationError: confirmationError,
        buyReceipt: receipt,
    };
}

// Hook to get listing details for a track
export function useGetListing(tokenId?: string) {
    const publicClient = usePublicClient();
    const { data: account } = useAccount(); // To potentially disable if owner, etc.

    return useQuery<bigint | null, Error>({
        queryKey: ['trackListing', trackSaleV2ContractAddress, tokenId],
        queryFn: async () => {
            if (!publicClient) throw new Error("Public client not available.");
            if (!trackSaleV2ContractAddress) throw new Error("TrackSaleV2 contract address not configured.");
            if (!tokenId) return null; // Or throw, or handle as "not listed"

            try {
                const price = await publicClient.readContract({
                    address: trackSaleV2ContractAddress,
                    abi: trackSaleV2Abi,
                    functionName: 'getPrice', // from ABI: getPrice(uint256 tokenId) returns (uint256)
                    args: [BigInt(tokenId)],
                });
                // If price is 0, it means not listed or listing removed.
                return price > BigInt(0) ? price as bigint : null;
            } catch (e: any) {
                // Handle cases where the contract might revert if token doesn't exist or other errors
                // For example, if getPrice reverts for a non-listed token instead of returning 0.
                // The current ABI implies it returns 0 for non-listed, but good to be safe.
                console.error(`[useGetListing] Error fetching price for token ${tokenId}:`, e); // Enhanced logging
                return null; // Treat as not listed on error
            }
        },
        // Fetching public price data should not strictly depend on a connected account.
        // It will run if publicClient, contractAddress, and tokenId are available.
        // The hook will refetch if any part of its queryKey (including tokenId) changes.
        enabled: !!publicClient && !!trackSaleV2ContractAddress && !!tokenId && typeof tokenId === 'string' && tokenId.trim() !== "", // Ensure tokenId is valid for enabling query
        staleTime: 1000 * 60 * 1, // 1 minute stale time
        // refetchInterval: 1000 * 30, // Optional: more frequent refetching for price updates
    });
}


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

// --- Hook to Get Recently Minted Tracks ---
export function useRecentTracks(count: number = 5) {
  const { data: publicClient } = usePublicClient(); // Get public client from wagmi

  return useQuery<AppNftItem[], Error>({
    queryKey: ['recentTracks', count],
    queryFn: async () => {
      if (!publicClient) {
        console.warn("Public client not available. Cannot fetch recent tracks.");
        throw new Error("Public client not available");
      }
      if (!musicNftContractAddress) {
        console.warn("MusicNFT contract address not configured.");
        throw new Error("MusicNFT contract address not configured");
      }

      try {
        // Fetch TrackMinted events
        // Note: Fetching events can be resource-intensive.
        // For production, a dedicated indexing service (like The Graph) is often better.
        // This example fetches logs from the last N blocks or a fixed range.
        // Adjust block range as needed for performance and desired recency.
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(2000) ? currentBlock - BigInt(2000) : BigInt(0); // Look back ~1 hour on Sepolia (12s block time)

        const logs = await publicClient.getLogs({
          address: musicNftContractAddress,
          event: musicNftAbi.find(item => item.type === 'event' && item.name === 'TrackMinted'), // Provide ABI for the event
          // topics: [encodeEventTopics({ abi: musicNftAbi, eventName: 'TrackMinted' })[0]], // Optional: More specific topic filtering
          fromBlock: fromBlock,
          toBlock: 'latest',
        });

        // Sort logs by block number and log index to get the most recent ones first
        const sortedLogs = logs.sort((a, b) => {
            if (b.blockNumber === a.blockNumber) {
                return Number(b.logIndex) - Number(a.logIndex);
            }
            return Number(b.blockNumber) - Number(a.blockNumber);
        });

        const recentTrackData: AppNftItem[] = [];
        for (const log of sortedLogs.slice(0, count)) {
          // Decode the event to get tokenURI and tokenId
          // Assuming TrackMinted event is: event TrackMinted(uint256 indexed tokenId, address indexed artist, string uri);
          // The actual parsing depends on how viem/ethers decodes event logs from getLogs result.
          // For viem, `decodeEventLog` can be used if topics/data are structured for it.
          // Here, we'll manually assume structure or use a simpler parse if possible.
          // This part might need adjustment based on the exact structure of `log.args` from `getLogs`
          // For now, let's assume log.args contains { tokenId, artist, uri } or similar.
          // This will likely need `decodeEventLog` from viem for proper parsing.

          // Placeholder for actual event decoding - THIS WILL LIKELY FAIL WITHOUT PROPER DECODING
          // const { tokenId, artist, uri } = log.args as any; // EXAMPLE - Needs proper decoding
          // For now, we can't easily decode without `decodeEventLog` and full ABI parsing here.
          // Let's skip fetching IPFS metadata for now and just return placeholders
          // to get the structure right, then refine IPFS fetching.

          // This is a simplified placeholder. Actual IPFS fetching and metadata parsing is complex.
          // We'll need to fetch `tokenURI` from the event, then fetch JSON from IPFS, then parse it.
          // For now, let's assume we can get some basic info.
          // This part needs to be robustly implemented.

          // TODO: Implement proper event decoding and IPFS metadata fetching for each track.
          // For now, creating dummy items based on what we might get.
          // This will be non-functional for IPFS data until proper decoding and fetching logic is added.

          // This is a very simplified placeholder and needs full implementation
          // of event decoding and IPFS fetching.
          // const tokenIdFromEvent = (log.topics[1] ? BigInt(log.topics[1]).toString() : "unknown"); // Example if tokenId is indexed
          // const tokenUriFromEvent = "ipfs://placeholder"; // Need to get from event data

          // For now, this hook will return an empty array until proper event parsing and IPFS fetching is implemented.
          // This is a complex step.
        }

        // console.log("Fetched recent track logs (unparsed):", sortedLogs.slice(0, count));
        // Actual implementation of fetching metadata for each URI would go here.
        // For now, returning an empty array as the parsing is complex and not done yet.
        if (sortedLogs.length > 0) {
            // This is a placeholder. The actual implementation would involve:
            // 1. Decoding each log to get the tokenURI.
            // 2. Fetching the JSON from IPFS using the tokenURI.
            // 3. Parsing the JSON to extract metadata (name, image, artist).
            // 4. Formatting it into AppNftItem.
            // This is non-trivial. For now, I'll log a warning.
            console.warn("useRecentTracks: Event log parsing and IPFS metadata fetching not fully implemented yet.");
        }

        return []; // Placeholder: return empty until full logic is built

      } catch (e) {
        console.error("Error fetching recent tracks:", e);
        throw e;
      }
    },
    enabled: !!publicClient && !!musicNftContractAddress,
    staleTime: 1000 * 60 * 2, // 2 minutes for recent tracks
  });
}

import { type AssetTransfersWithMetadataResponse, type AssetTransfersCategory } from 'alchemy-sdk';

// --- Hook to Get Recent Transactions for an Address (using Alchemy) ---
export interface SimplifiedTransaction {
  hash: string;
  type: string; // e.g., "Send", "Receive", "Mint", "Approve"
  summary: string; // e.g., "Sent 0.1 ETH to 0xabc..." or "Minted 'Track Title'"
  date: Date;
  value?: string; // e.g., "0.1 ETH" or "1 NFT"
  asset?: string; // e.g., "ETH", "USDC", "YourNFTName"
  explorerUrl?: string; // Link to Etherscan/SepoliaScan
}

const getExplorerBaseUrl = () => {
  // TODO: Make this dynamic based on configured chain ID (VITE_CHAIN_ID)
  // For now, assuming Sepolia if no specific chain info available from wagmi/alchemy config here
  const chainId = import.meta.env.VITE_CHAIN_ID || '11155111'; // Default to Sepolia
  if (chainId === '1') return "https://etherscan.io/tx/";
  if (chainId === '11155111') return "https://sepolia.etherscan.io/tx/";
  // Add other chains as needed
  return "https://etherscan.io/tx/"; // Fallback
};


export function useRecentTransactions(address?: Address, count: number = 5) {
  return useQuery<SimplifiedTransaction[], Error>({
    queryKey: ['recentTransactions', address, count, musicNftContractAddress],
    queryFn: async () => {
      if (!address || !alchemy) {
        throw new Error("Address or Alchemy SDK not available");
      }

      try {
        const categories: AssetTransfersCategory[] = [
          "external", "internal", "erc20", "erc721", "erc1155"
        ];

        // Fetch transactions sent FROM the address
        const sentTxResponse: AssetTransfersWithMetadataResponse = await alchemy.core.getAssetTransfers({
          fromAddress: address,
          category: categories,
          order: "desc",
          maxCount: count * 2, // Fetch more to allow merging and still get `count` recent
          withMetadata: true,
          excludeZeroValue: true,
        });

        // Fetch transactions sent TO the address
        const receivedTxResponse: AssetTransfersWithMetadataResponse = await alchemy.core.getAssetTransfers({
          toAddress: address,
          category: categories,
          order: "desc",
          maxCount: count * 2, // Fetch more
          withMetadata: true,
          excludeZeroValue: true,
        });

        // Combine, deduplicate (by hash), and sort
        const allUserTxs = [...sentTxResponse.transfers, ...receivedTxResponse.transfers];
        const uniqueTxs = Array.from(new Map(allUserTxs.map(tx => [tx.hash, tx])).values());

        uniqueTxs.sort((a, b) => {
            // Alchemy's metadata.blockTimestamp is "YYYY-MM-DDTHH:mm:ss.SSSZ"
            return new Date(b.metadata.blockTimestamp).getTime() - new Date(a.metadata.blockTimestamp).getTime();
        });

        const explorerBaseUrl = getExplorerBaseUrl();

        return uniqueTxs.slice(0, count).map((tx): SimplifiedTransaction => {
          const date = new Date(tx.metadata.blockTimestamp);
          let type = "Unknown";
          let summary = `Tx: ${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`;
          let valueDisplay = tx.value?.toString() ?? "";
          let assetDisplay = tx.asset ?? "";

          const isSender = tx.from.toLowerCase() === address.toLowerCase();
          const isReceiver = tx.to?.toLowerCase() === address.toLowerCase();

          if (tx.category === "erc721" || tx.category === "erc1155") {
            const tokenId = tx.tokenId ? ` #${BigInt(tx.tokenId).toString()}` : "";
            assetDisplay = tx.asset || (tx.rawContract.address === musicNftContractAddress ? "DecentraTune NFT" : "NFT");
            valueDisplay = `${tx.value || 1} ${assetDisplay}${tokenId}`; // ERC721 value is 1
            if (tx.rawContract.address === musicNftContractAddress && tx.from === "0x0000000000000000000000000000000000000000") {
              type = "Mint";
              summary = `Minted ${assetDisplay}${tokenId}`;
            } else if (isSender) {
              type = "Send NFT";
              summary = `Sent ${valueDisplay} to ${tx.to?.slice(0,6)}...`;
            } else if (isReceiver) {
              type = "Receive NFT";
              summary = `Received ${valueDisplay} from ${tx.from.slice(0,6)}...`;
            }
          } else if (tx.category === "erc20") {
            valueDisplay = `${tx.value ? parseFloat(tx.value.toString()).toFixed(4) : ""} ${tx.asset}`;
            if (isSender) {
              type = "Send Token";
              summary = `Sent ${valueDisplay} to ${tx.to?.slice(0,6)}...`;
            } else if (isReceiver) {
              type = "Receive Token";
              summary = `Received ${valueDisplay} from ${tx.from.slice(0,6)}...`;
            }
          } else if (tx.category === "external" || tx.category === "internal") {
            assetDisplay = "ETH"; // Or native currency based on chain
             valueDisplay = `${tx.value ? parseFloat(tx.value.toString()).toFixed(5) : ""} ${assetDisplay}`;
            if (isSender) {
              type = "Send ETH";
              summary = `Sent ${valueDisplay} to ${tx.to?.slice(0,6)}...`;
            } else if (isReceiver) {
              type = "Receive ETH";
              summary = `Received ${valueDisplay} from ${tx.from.slice(0,6)}...`;
            }
          }

          // Fallback for contract interaction if not fitting above
          if (type === "Unknown" && tx.to) {
             if (isSender && tx.to.toLowerCase() === musicNftContractAddress?.toLowerCase()) {
                type = "Contract Call";
                summary = `Interacted with DecentraTune Contract`;
            } else if (isSender) {
                type = "Contract Call";
                summary = `Called contract ${tx.to.slice(0,6)}...`;
            }
          }


          return {
            hash: tx.hash,
            type,
            summary,
            date,
            value: valueDisplay,
            asset: assetDisplay,
            explorerUrl: `${explorerBaseUrl}${tx.hash}`,
          };
        });

      } catch (e) {
        console.error("Error fetching recent transactions:", e);
        throw e;
      }
    },
    enabled: !!address && !!alchemy,
    staleTime: 1000 * 60 * 0.5, // 30 seconds, transactions can update frequently
    refetchInterval: 1000 * 60 * 1, // Refetch every minute
  });
}
