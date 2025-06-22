import PinataClient from '@pinata/sdk';
import { Readable } from 'stream';

// Retrieve Pinata JWT from environment variables
const pinataJwt = import.meta.env.VITE_PINATA_JWT;

if (!pinataJwt) {
  console.error(
    "VITE_PINATA_JWT is not set. IPFS uploads via Pinata will not work. " +
    "Please get a JWT from https://app.pinata.cloud/keys"
  );
}

// Initialize Pinata Client - this initialization is typically done with API key/secret for server-side.
// For client-side JWT usage, the SDK functions often take the JWT directly or expect it to be set in request headers.
// The @pinata/sdk might be more suited for backend use. Let's check how it handles client-side file uploads.
// For browser environments, directly using FormData with Pinata's API endpoint is often more straightforward
// than using this SDK, which is more Node.js oriented for file system access.

// Given the SDK structure, we might need to use a different approach for browser file uploads if this SDK
// doesn't support File objects directly in a browser-friendly way.
// Let's assume for now we'll try to make it work, but may need to adjust.

// The @pinata/sdk is primarily for Node.js. For client-side, direct API calls or a different library is better.
// However, if we must use it, we'd typically pass the JWT in custom axios instances if the main client doesn't take it.
// For now, let's structure the calls and see. The SDK's `pinFileToIPFS` expects a readable stream.

export interface ERC721MetadataOptional {
  description?: string;
  external_url?: string;
  attributes?: { trait_type: string; value: string | number }[];
  [key: string]: any;
}

export interface ERC721MetadataRequired {
  name: string;
}

export type ERC721MetadataArgs = ERC721MetadataRequired & ERC721MetadataOptional;

interface UploadTrackArgs {
  audioFile: File;
  coverFile: File;
  metadataArgs: ERC721MetadataArgs;
  onProgress?: (progress: { stage: 'audio' | 'cover' | 'metadata' | 'done'; message: string; percent?: number }) => void;
}

// Helper function to convert File to ReadableStream for Pinata SDK (if needed and viable in browser)
// This is complex in browser. A direct FormData upload to Pinata API is usually better.
// Forcing a Node.js SDK like @pinata/sdk to work with browser File objects for streaming is non-trivial.

// **Re-evaluating SDK choice for client-side:**
// The `@pinata/sdk` is NOT ideal for client-side uploads directly from the browser with `File` objects.
// It's designed for server-side (Node.js) operations where you have file system access or can easily create streams.
// The recommended way for client-side uploads to Pinata is usually to make a direct POST request
// with FormData to `https://api.pinata.cloud/pinning/pinFileToIPFS`.

// Let's proceed by constructing FormData and using fetch, bypassing the SDK for file uploads.
// The SDK's `pinJSONToIPFS` might still be usable if it handles auth correctly with JWT.

async function pinFileToIPFSWithFetch(file: File, jwt: string, stage: 'audio' | 'cover', onProgress?: UploadTrackArgs['onProgress']): Promise<string> {
  if (onProgress) onProgress({ stage, message: `Starting ${stage} upload...`, percent: 0 });

  const formData = new FormData();
  formData.append('file', file);

  // Add Pinata options if needed (e.g., wrapWithDirectory)
  const pinataOptions = JSON.stringify({
    // cidVersion: 0, // Example option
  });
  formData.append('pinataOptions', pinataOptions);

  // Add Pinata metadata if needed (distinct from NFT metadata)
  const pinataMetadata = JSON.stringify({
    name: file.name, // Example metadata
    // keyvalues: { exampleKey: 'exampleValue' }
  });
  formData.append('pinataMetadata', pinataMetadata);


  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      // 'Content-Type': 'multipart/form-data' is set automatically by browser for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text(); // Read error as text first
    console.error(`Pinata ${stage} upload failed. Status: ${response.status}. Response:`, errorBody);
    let errorMessage = `Pinata ${stage} upload failed. Status: ${response.status}.`;
    try {
        const jsonError = JSON.parse(errorBody); // Try to parse as JSON
        errorMessage += ` Error: ${jsonError.error?.details || jsonError.error || errorBody}`;
    } catch (e) {
        errorMessage += ` Details: ${errorBody.slice(0,200)}`; // Fallback to raw text
    }
    if (onProgress) onProgress({ stage, message: errorMessage, percent: 100 }); // Indicate failure
    throw new Error(errorMessage);
  }

  const result = await response.json();
  if (!result.IpfsHash) {
    console.error(`Pinata ${stage} upload failed: No IpfsHash returned. Response:`, result);
    if (onProgress) onProgress({ stage, message: 'Pinata upload error: No IpfsHash.', percent: 100 });
    throw new Error('Pinata ${stage} upload failed: No IpfsHash returned.');
  }

  if (onProgress) onProgress({ stage, message: `${stage} upload complete.`, percent: 100 });
  return result.IpfsHash;
}

async function pinJSONToIPFSWithFetch(jsonData: object, jwt: string, onProgress?: UploadTrackArgs['onProgress']): Promise<string> {
    if (onProgress) onProgress({ stage: 'metadata', message: 'Starting metadata upload...', percent: 0 });

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
            pinataContent: jsonData,
            // pinataMetadata: { name: 'MyNFTMetadata.json' } // Optional: metadata about the pin itself
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Pinata metadata upload failed. Status: ${response.status}. Response:`, errorBody);
        let errorMessage = `Pinata metadata upload failed. Status: ${response.status}.`;
        try {
            const jsonError = JSON.parse(errorBody);
            errorMessage += ` Error: ${jsonError.error?.details || jsonError.error || errorBody}`;
        } catch (e) {
            errorMessage += ` Details: ${errorBody.slice(0,200)}`;
        }
        if (onProgress) onProgress({ stage: 'metadata', message: errorMessage, percent: 100 });
        throw new Error(errorMessage);
    }

    const result = await response.json();
    if (!result.IpfsHash) {
        console.error('Pinata metadata upload failed: No IpfsHash returned. Response:', result);
        if (onProgress) onProgress({ stage: 'metadata', message: 'Pinata metadata error: No IpfsHash.', percent: 100 });
        throw new Error('Pinata metadata upload failed: No IpfsHash returned.');
    }

    if (onProgress) onProgress({ stage: 'metadata', message: 'Metadata upload complete.', percent: 100 });
    return result.IpfsHash;
}


export async function uploadTrack({
  audioFile,
  coverFile,
  metadataArgs,
  onProgress,
}: UploadTrackArgs): Promise<string> {
  if (!pinataJwt) {
    throw new Error("VITE_PINATA_JWT is not configured. Cannot upload to IPFS via Pinata.");
  }

  // 1. Upload Audio File
  const audioCid = await pinFileToIPFSWithFetch(audioFile, pinataJwt, 'audio', onProgress);

  // 2. Upload Cover File
  const coverCid = await pinFileToIPFSWithFetch(coverFile, pinataJwt, 'cover', onProgress);

  // 3. Construct and Upload ERC-721 Metadata JSON
  const erc721Metadata = {
    name: metadataArgs.name,
    description: metadataArgs.description || "",
    image: `ipfs://${coverCid}`,
    animation_url: `ipfs://${audioCid}`,
    external_url: metadataArgs.external_url || "",
    attributes: metadataArgs.attributes || [],
    properties: {
      ...(metadataArgs.properties || {}),
    }
  };

  if (!erc721Metadata.description) delete erc721Metadata.description;
  if (!erc721Metadata.external_url) delete erc721Metadata.external_url;
  if (erc721Metadata.attributes.length === 0) delete erc721Metadata.attributes;

  const metadataCid = await pinJSONToIPFSWithFetch(erc721Metadata, pinataJwt, onProgress);

  if (onProgress) {
    onProgress({ stage: 'done', message: "All uploads to Pinata finished.", percent: 100 });
  }

  return metadataCid; // This is the CID of the metadata JSON file itself
}
