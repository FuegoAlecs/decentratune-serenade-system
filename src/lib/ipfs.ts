import { NFTStorage, File as NFTStorageFile, Blob as NFTStorageBlob } from 'nft.storage';

const nftStorageToken = import.meta.env.VITE_WEB_STORAGE_TOKEN;

if (!nftStorageToken) {
  console.error(
    "VITE_WEB_STORAGE_TOKEN is not set. IPFS uploads will not work. " +
    "Please get a token from https://nft.storage/manage/"
  );
}

export interface ERC721MetadataOptional {
  description?: string;
  external_url?: string;
  attributes?: { trait_type: string; value: string | number }[];
  // Include any other fields you expect in your metadata's 'meta' argument
  [key: string]: any;
}

export interface ERC721MetadataRequired {
  name: string;
  // image will be set by the coverFile CID
  // animation_url will be set by the audioFile CID
}

export type ERC721MetadataArgs = ERC721MetadataRequired & ERC721MetadataOptional;

interface UploadTrackArgs {
  audioFile: File;
  coverFile: File;
  metadataArgs: ERC721MetadataArgs;
  onProgress?: (progress: { percent: number; stage: 'audio' | 'cover' | 'metadata' | 'done'; totalUploaded: number; totalSize: number }) => void;
}

/**
 * Uploads track (audio, cover) and its metadata to IPFS using NFT.Storage.
 * @returns The CID of the uploaded ERC-721 metadata JSON.
 */
export async function uploadTrack({
  audioFile,
  coverFile,
  metadataArgs,
  onProgress,
}: UploadTrackArgs): Promise<string> {
  if (!nftStorageToken) {
    throw new Error("VITE_WEB_STORAGE_TOKEN is not configured. Cannot upload to IPFS.");
  }

  const client = new NFTStorage({ token: nftStorageToken });

  let totalUploadedForAudio = 0;
  let totalUploadedForCover = 0;
  const totalSize = audioFile.size + coverFile.size; // Approximate total for progress calculation (metadata is small)

  const reportProgress = (
    stage: 'audio' | 'cover' | 'metadata',
    chunkSize: number,
    currentFileTotalUploaded: number,
    currentFileSize: number
  ) => {
    if (onProgress) {
      const overallUploaded = (stage === 'audio' ? totalUploadedForAudio : totalUploadedForCover) + (stage === 'cover' && stage !== 'audio' ? totalUploadedForAudio : 0);
      const percent = totalSize > 0 ? Math.min(((overallUploaded + chunkSize) / totalSize) * 100, 100) : 0;

      if (stage === 'audio') totalUploadedForAudio = currentFileTotalUploaded;
      if (stage === 'cover') totalUploadedForCover = currentFileTotalUploaded;

      onProgress({
        percent: parseFloat(percent.toFixed(2)),
        stage,
        totalUploaded: overallUploaded + chunkSize,
        totalSize
      });
    }
  };

  // 1. Upload Audio File
  let audioFileTotalUploaded = 0;
  const audioCid = await client.storeBlob(
    new NFTStorageBlob([audioFile], { type: audioFile.type }),
    {
      onStoredChunk: (chunkSize) => {
        audioFileTotalUploaded += chunkSize;
        reportProgress('audio', chunkSize, audioFileTotalUploaded, audioFile.size);
      }
    }
  );
  if (onProgress) reportProgress('audio', 0, audioFile.size, audioFile.size); // Final progress for audio

  // 2. Upload Cover File
  let coverFileTotalUploaded = 0;
  const coverCid = await client.storeBlob(
    new NFTStorageBlob([coverFile], { type: coverFile.type }),
    {
      onStoredChunk: (chunkSize) => {
        coverFileTotalUploaded += chunkSize;
        reportProgress('cover', chunkSize, coverFileTotalUploaded, coverFile.size);
      }
    }
  );
  if (onProgress) reportProgress('cover', 0, coverFile.size, coverFile.size); // Final progress for cover


  // 3. Construct and Upload ERC-721 Metadata JSON
  const erc721Metadata = {
    name: metadataArgs.name,
    description: metadataArgs.description || "",
    image: `ipfs://${coverCid}`,
    animation_url: `ipfs://${audioCid}`, // Using animation_url for audio as per common practice
    external_url: metadataArgs.external_url || "",
    attributes: metadataArgs.attributes || [],
    // Include any other custom properties from metadataArgs.properties or similar
    properties: {
        ...(metadataArgs.properties || {}), // Spread existing properties if any
        // You can add more structured properties here if needed
        // e.g. genre: metadataArgs.genre (if it's part of metadataArgs)
    }
  };

  // Remove empty optional fields
  if (!erc721Metadata.description) delete erc721Metadata.description;
  if (!erc721Metadata.external_url) delete erc721Metadata.external_url;
  if (erc721Metadata.attributes.length === 0) delete erc721Metadata.attributes;


  const metadataBlob = new NFTStorageBlob([JSON.stringify(erc721Metadata)], { type: 'application/json' });
  const metadataCid = await client.storeBlob(metadataBlob);

  if (onProgress) {
    onProgress({ percent: 100, stage: 'metadata', totalUploaded: totalSize, totalSize }); // Metadata upload is quick
    onProgress({ percent: 100, stage: 'done', totalUploaded: totalSize, totalSize });
  }

  return metadataCid;
}
