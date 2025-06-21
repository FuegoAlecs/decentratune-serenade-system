import lighthouse from '@lighthouse-web3/sdk';

const lighthouseApiKey = import.meta.env.VITE_LIGHTHOUSE_API_KEY;

if (!lighthouseApiKey) {
  console.error(
    "VITE_LIGHTHOUSE_API_KEY is not set. IPFS uploads will not work. " +
    "Please get an API key from https://files.lighthouse.storage/ or https://lighthouse.storage/"
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
  onProgress?: (progress: { percent: number; stage: 'audio' | 'cover' | 'metadata' | 'done'; totalUploaded: number; totalSize: number, message?: string }) => void;
}

/**
 * Uploads track (audio, cover) and its metadata to IPFS using Lighthouse.
 * @returns The CID of the uploaded ERC-721 metadata JSON.
 */
export async function uploadTrack({
  audioFile,
  coverFile,
  metadataArgs,
  onProgress,
}: UploadTrackArgs): Promise<string> {
  if (!lighthouseApiKey) {
    throw new Error("VITE_LIGHTHOUSE_API_KEY is not configured. Cannot upload to IPFS.");
  }

  const totalSize = audioFile.size + coverFile.size; // Approximate total for progress (metadata is small)
  let uploadedAudioSize = 0;
  let uploadedCoverSize = 0;

  const progressCallback = (stage: 'audio' | 'cover' | 'metadata', progress: { total: number; uploaded: number }) => {
    if (onProgress) {
      let currentStageUploaded = 0;
      let overallUploaded = 0;

      if (stage === 'audio') {
        uploadedAudioSize = progress.uploaded;
        currentStageUploaded = uploadedAudioSize;
        overallUploaded = uploadedAudioSize;
      } else if (stage === 'cover') {
        uploadedCoverSize = progress.uploaded;
        currentStageUploaded = uploadedCoverSize;
        overallUploaded = uploadedAudioSize + uploadedCoverSize;
      }
      // Metadata upload is quick, specific progress for it might be overkill,
      // but we can update overall progress after it's done.

      const percent = totalSize > 0 ? Math.min((overallUploaded / totalSize) * 100, 100) : 0;
      onProgress({
        percent: parseFloat(percent.toFixed(2)),
        stage,
        totalUploaded: overallUploaded,
        totalSize,
        message: `${stage} upload progress: ${currentStageUploaded} / ${stage === 'audio' ? audioFile.size : coverFile.size}`
      });
    }
  };


  // Event listeners for File objects (used by Lighthouse SDK)
  // This is a conceptual placeholder. Lighthouse SDK's upload function takes event (File object)
  // and an API key. The progress is handled by its internal mechanism, which we tap into via a callback.

  // 1. Upload Audio File
  if (onProgress) onProgress({ percent: 0, stage: 'audio', totalUploaded: 0, totalSize, message: "Starting audio upload..." });
  const audioUploadResult = await lighthouse.upload(
    [{ name: audioFile.name, type: audioFile.type, size: audioFile.size, lastModified: audioFile.lastModified, webkitRelativePath: (audioFile as any).webkitRelativePath, arrayBuffer: () => audioFile.arrayBuffer() } as any], // Lighthouse expects an event-like object or array of File objects
    lighthouseApiKey,
    false, // show-progress parameter - false as we have a custom callback
    (progressStatus: { total: number; uploaded: number; }) => { // This is the progress callback from Lighthouse
      progressCallback('audio', progressStatus);
    }
  );
  if (!audioUploadResult.data || !audioUploadResult.data.Hash) {
    throw new Error("Lighthouse audio upload failed: No CID returned.");
  }
  const audioCid = audioUploadResult.data.Hash;
  uploadedAudioSize = audioFile.size; // Ensure progress reflects full upload
  if (onProgress) onProgress({ percent: (uploadedAudioSize / totalSize) * 100, stage: 'audio', totalUploaded: uploadedAudioSize, totalSize, message: "Audio upload complete." });


  // 2. Upload Cover File
  if (onProgress) onProgress({ percent: (uploadedAudioSize / totalSize) * 100, stage: 'cover', totalUploaded: uploadedAudioSize, totalSize, message: "Starting cover upload..." });
  const coverUploadResult = await lighthouse.upload(
    [{ name: coverFile.name, type: coverFile.type, size: coverFile.size, lastModified: coverFile.lastModified, webkitRelativePath: (coverFile as any).webkitRelativePath, arrayBuffer: () => coverFile.arrayBuffer() } as any],
    lighthouseApiKey,
    false,
    (progressStatus: { total: number; uploaded: number; }) => {
      progressCallback('cover', progressStatus);
    }
  );
  if (!coverUploadResult.data || !coverUploadResult.data.Hash) {
    throw new Error("Lighthouse cover upload failed: No CID returned.");
  }
  const coverCid = coverUploadResult.data.Hash;
  uploadedCoverSize = coverFile.size; // Ensure progress reflects full upload
  if (onProgress) onProgress({ percent: ((uploadedAudioSize + uploadedCoverSize) / totalSize) * 100, stage: 'cover', totalUploaded: uploadedAudioSize + uploadedCoverSize, totalSize, message: "Cover upload complete." });


  // 3. Construct and Upload ERC-721 Metadata JSON
  if (onProgress) onProgress({ percent: ((uploadedAudioSize + uploadedCoverSize) / totalSize) * 100, stage: 'metadata', totalUploaded: uploadedAudioSize + uploadedCoverSize, totalSize, message: "Preparing metadata..." });
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

  const metadataString = JSON.stringify(erc721Metadata);
  // Convert string to a File-like object for Lighthouse
  const metadataFile = new File([metadataString], "metadata.json", { type: "application/json" });


  // Lighthouse's upload expects an array of File-like objects or an event object from a file input.
  // We need to ensure our manually created File object is compatible.
  // The SDK might expect a full File object from an input event, so we might need to pass it as an array.
  const metadataUploadResult = await lighthouse.upload(
     [{ name: metadataFile.name, type: metadataFile.type, size: metadataFile.size, lastModified: metadataFile.lastModified, webkitRelativePath: '', arrayBuffer: () => metadataFile.arrayBuffer() } as any],
    lighthouseApiKey,
    false, // No progress needed for small metadata JSON
    undefined // No progress callback
  );

  if (!metadataUploadResult.data || !metadataUploadResult.data.Hash) {
    throw new Error("Lighthouse metadata upload failed: No CID returned.");
  }
  const metadataCid = metadataUploadResult.data.Hash;

  if (onProgress) {
    // Ensure totalUploaded reflects the sum of actual file sizes for accuracy in the 'done' stage.
    const finalTotalUploaded = audioFile.size + coverFile.size + metadataFile.size;
    const finalTotalSize = audioFile.size + coverFile.size + metadataFile.size; // More accurate total size

    onProgress({ percent: 100, stage: 'metadata', totalUploaded: finalTotalUploaded, totalSize: finalTotalSize, message: "Metadata upload complete." });
    onProgress({ percent: 100, stage: 'done', totalUploaded: finalTotalUploaded, totalSize: finalTotalSize, message: "All uploads finished." });
  }

  return metadataCid;
}
