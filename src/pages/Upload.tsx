
import { useState, useCallback, useEffect } from "react"; // Added useEffect
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, Music, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
// import { parseEther } from "ethers";
import { useMintTrack } from "@/hooks/contracts";
import { uploadTrack, type ERC721MetadataArgs } from "@/lib/ipfs";
import { decodeEventLog } from 'viem'; // For parsing event logs
import musicNftAbi from "@/lib/abi/MusicNFT.json"; // ABI needed for decoding event

const genres = ["Electronic", "Hip Hop", "Rock", "Jazz", "Classical", "Ambient", "Pop", "R&B", "Country", "Folk"];

// const musicNftContractAddress = import.meta.env.VITE_CONTRACT_MUSIC_NFT;
// const nftStorageToken = import.meta.env.VITE_WEB_STORAGE_TOKEN; // Used in ipfs.ts

export default function Upload() {
  // Combined loading state is now just isProcessing, individual IPFS state not needed here
  // const [isIPFSUploading, setIsIPFSUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'audio' | 'cover' | 'metadata' | 'done'>('idle');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  const {
    mintTrack,
    mintHash,
    isMintPending,
    mintError,
    isConfirming,
    isConfirmed,
    confirmationError,
    receipt, // Add receipt to get logs from useMintTrack (needs to be returned by the hook)
  } = useMintTrack();


  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    // price: "", // ETH - Removed as per new requirements for useMintTrack
    royalties: "10", // Added back for metadata, default to 10%
    // totalSupply: "100", // Still removed
    bpm: "",
    key: "",
    tags: "",
    external_url: "", // Added for optional external link
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // react-dropzone handlers
  const onDropAudio = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setAudioFile(acceptedFiles[0]);
      // TODO: Add toast for successful file selection or specific error (e.g. wrong type)
    }
  }, []);

  const onDropCover = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setCoverFile(acceptedFiles[0]);
      // TODO: Add toast
    }
  }, []);

  const { getRootProps: getAudioRootProps, getInputProps: getAudioInputProps, isDragActive: isAudioDragActive } = useDropzone({
    onDrop: onDropAudio,
    accept: { 'audio/mpeg': ['.mp3'], 'audio/flac': ['.flac'], 'audio/wav': ['.wav'] }, // Added wav
    multiple: false,
  });

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps, isDragActive: isCoverDragActive } = useDropzone({
    onDrop: onDropCover,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] },
    multiple: false,
  });
  // End react-dropzone handlers


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      toast({ title: "Wallet Not Connected", description: "Please connect your wallet to mint an NFT.", variant: "destructive" });
      return;
    }
    if (!audioFile || !coverFile) {
      toast({ title: "Missing Files", description: "Please upload both audio and cover art files.", variant: "destructive" });
      return;
    }
    // VITE_WEB_STORAGE_TOKEN check is now inside uploadTrack
    // Basic validation for required form fields
    if (!formData.title || !formData.genre) {
        toast({ title: "Missing Information", description: "Please fill in Track Title and Genre.", variant: "destructive" });
        return;
    }

    // Overall processing starts (IPFS + Minting)
    // setIsIPFSUploading(true) is effectively handled by isProcessing and uploadStage

    const metadataToUpload: ERC721MetadataArgs = {
      name: formData.title,
      description: formData.description,
      attributes: [
        { trait_type: "Genre", value: formData.genre },
        { trait_type: "BPM", value: formData.bpm || "N/A" },
        { trait_type: "Key", value: formData.key || "N/A" },
        { trait_type: "Tags", value: formData.tags || "N/A" },
        { trait_type: "Royalties", value: `${formData.royalties}%` }, // Add royalties to attributes
        // { trait_type: "Creator", value: address! },
      ],
      properties: { // Custom properties block
        bpm: formData.bpm,
        key: formData.key,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        creator_address: address,
        // Storing royalties here as well for easier structured access if needed
        royalties_percentage: parseFloat(formData.royalties) || 0,
      }
    };
    if (formData.external_url) {
        metadataToUpload.external_url = formData.external_url;
    }


    try {
      setUploadStage('audio'); // Initial stage
      setUploadProgress(0);

      const metadataCid = await uploadTrack({
        audioFile,
        coverFile,
        metadataArgs: metadataToUpload,
        onProgress: (progress) => {
          setUploadProgress(progress.percent);
          setUploadStage(progress.stage);
          console.log(`Upload Progress: ${progress.percent}% Stage: ${progress.stage}`);
        },
      });

      // IPFS upload finished (stage will be 'done')
      toast({ title: "IPFS Upload Complete!", description: "Please confirm transaction in your wallet to mint." });

      await mintTrack(metadataCid); // Pass the metadata CID (which is ipfs://<metadata_cid_hash>)

    } catch (error) {
      console.error("Error during IPFS upload or minting process:", error);
      toast({
        title: "Process Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
      setUploadStage('idle');
      setUploadProgress(0);
    }
  };

  // Handle transaction confirmation and error states from useMintTrack hook
  useEffect(() => {
    if (isConfirmed && receipt) {
      let newTrackId: string | null = null;
      // Try to find the TrackMinted event and extract tokenId
      for (const log of receipt.logs) {
        try {
          const decodedEvent = decodeEventLog({
            abi: musicNftAbi, // The ABI of the contract that emits the event
            data: log.data,
            topics: log.topics,
          });
          if (decodedEvent.eventName === 'TrackMinted') {
            // Assuming your event is TrackMinted(uint256 tokenId, address artist, string uri)
            // The actual structure of args depends on your event definition.
            // For viem, args is an object or array. If it's an object:
            newTrackId = (decodedEvent.args as any)?.tokenId?.toString();
            // If it's an array: newTrackId = (decodedEvent.args as any[])?.[0]?.toString();
            break;
          }
        } catch (e) {
          // Not the event we're looking for, or decoding failed for this log
          // console.debug("Could not decode an event or not the TrackMinted event:", e);
        }
      }

      // Simplified: Show generic success and always navigate to profile
      // Corrected toast call:
      toast({
        title: "Mint Successful!",
        description: `${formData.title} has been minted. Tx: ${mintHash ? mintHash.slice(0,10)+'...' : 'N/A'}`,
        duration: 7000,
        // variant: "success", // Or your default variant if it looks like success
      });
      navigate('/profile');
    } else if (mintError || confirmationError) { // Handle errors only if not confirmed
      // Ensure toast is only shown if there's an actual error and not just pending/idle states
      toast({
        title: "Minting Transaction Failed",
        description: (mintError?.message || confirmationError?.message) ?? "An error occurred during minting.",
        variant: "destructive",
      });
    }
  }, [isConfirmed, mintError, confirmationError, mintHash, formData.title, navigate, toast]);

  const isProcessing = uploadStage !== 'idle' && uploadStage !== 'done' || isMintPending || isConfirming;

  return (
    // Overall page container with mobile-first padding
    <div className="min-h-screen bg-gradient-dark text-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto"> {/* Slightly reduced max-width for better focus on content */}
        <div className="text-center mb-6 sm:mb-10"> {/* Adjusted margin */}
          <h1 className="font-satoshi font-bold text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3">Upload Your Track</h1> {/* Responsive text */}
          <p className="text-dt-gray-light text-sm sm:text-base"> {/* Responsive text */}
            Share your music with the world and mint it as an NFT
          </p>
        </div>

        {/* Form uses flex-col and gap for mobile-first stacking of sections */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 md:gap-8">
          {/* File Uploads Section - Stacks vertically on mobile, then 2 cols on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Audio Upload */}
            <div className="glass-card p-4 rounded-xl flex flex-col gap-3">
              <Label className="block text-base font-semibold">
                <Music className="inline h-5 w-5 mr-2 align-middle" /> Audio File (MP3, FLAC, WAV)
              </Label>
              <div {...getAudioRootProps()} className={`border-2 border-dashed border-white/20 rounded-xl p-4 py-8 sm:p-6 text-center cursor-pointer hover:border-dt-primary transition-colors flex flex-col justify-center items-center min-h-[160px] ${isAudioDragActive ? 'border-dt-primary bg-dt-primary/10' : ''}`}>
                <input {...getAudioInputProps()} />
                <UploadIcon className="h-10 w-10 sm:h-12 sm:w-12 text-dt-gray-light mx-auto mb-3" />
                {audioFile ? (
                  <div>
                    <p className="text-white font-medium text-sm sm:text-base">{audioFile.name}</p>
                    <p className="text-dt-gray-light text-xs sm:text-sm">({(audioFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                    <p className="text-dt-accent text-xs mt-1">Click or drag to change</p>
                  </div>
                ) : isAudioDragActive ? (
                  <p className="text-dt-primary font-semibold text-sm sm:text-base">Drop the audio file here...</p>
                ) : (
                  <div>
                    <p className="text-white font-medium text-sm sm:text-base">Drag 'n' drop audio file, or click</p>
                    <p className="text-dt-gray-light text-xs sm:text-sm">Max 50MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Art Upload */}
            <div className="glass-card p-4 rounded-xl flex flex-col gap-3">
              <Label className="block text-base font-semibold">
                <Image className="inline h-5 w-5 mr-2 align-middle" /> Cover Art (JPG, PNG, GIF)
              </Label>
              <div {...getCoverRootProps()} className={`border-2 border-dashed border-white/20 rounded-xl p-4 py-8 sm:p-6 text-center cursor-pointer hover:border-dt-primary transition-colors flex flex-col justify-center items-center min-h-[160px] ${isCoverDragActive ? 'border-dt-primary bg-dt-primary/10' : ''}`}>
                <input {...getCoverInputProps()} />
                {coverFile ? (
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={URL.createObjectURL(coverFile)}
                      alt="Cover preview"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg mx-auto mb-2"
                    />
                    <p className="text-white font-medium text-sm sm:text-base">{coverFile.name}</p>
                    <p className="text-dt-gray-light text-xs sm:text-sm">({(coverFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                     <p className="text-dt-accent text-xs mt-1">Click or drag to change</p>
                  </div>
                ) : isCoverDragActive ? (
                  <p className="text-dt-primary font-semibold text-sm sm:text-base">Drop the cover art here...</p>
                ) : (
                  <div>
                    <UploadIcon className="h-10 w-10 sm:h-12 sm:w-12 text-dt-gray-light mx-auto mb-3" />
                    <p className="text-white font-medium text-sm sm:text-base">Drag 'n' drop cover art, or click</p>
                    <p className="text-dt-gray-light text-xs sm:text-sm">Max 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Track Information Section */}
          <div className="glass-card p-4 sm:p-6 rounded-xl flex flex-col gap-4"> {/* Consistent padding and gap */}
            <h2 className="font-satoshi font-bold text-lg sm:text-xl">Track Information</h2>
            {/* Fields now stack vertically by default due to flex-col on parent, then grid on md+ */}
            <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4">
              <div className="flex flex-col gap-1.5"> {/* Group label and input */}
                <Label htmlFor="title">Track Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter track title"
                  className="bg-white/10 border-white/20 text-white mt-2"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="genre">Genre *</Label>
                <select
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white" // Removed mt-2, using parent gap
                  required
                >
                  <option value="">Select genre</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre} className="bg-dt-dark">
                      {genre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bpm">BPM</Label>
                <Input
                  id="bpm"
                  name="bpm"
                  type="number"
                  value={formData.bpm}
                  onChange={handleInputChange}
                  placeholder="120"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  name="key"
                  value={formData.key}
                  onChange={handleInputChange}
                  placeholder="C Major"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5"> {/* Group label and textarea */}
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell the story behind your track..."
                className="bg-white/10 border-white/20 text-white"
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-1.5"> {/* Group label and input */}
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="ambient, electronic, chill"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex flex-col gap-1.5"> {/* Group label and input */}
              <Label htmlFor="external_url">External URL (Optional)</Label>
              <Input
                id="external_url"
                name="external_url"
                type="url"
                value={formData.external_url}
                onChange={handleInputChange}
                placeholder="https://yoursite.com/track-info"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          {/* NFT Settings Section */}
          <div className="glass-card p-4 sm:p-6 rounded-xl flex flex-col gap-4">
            <h2 className="font-satoshi font-bold text-lg sm:text-xl">NFT Configuration</h2> {/* Adjusted heading size for consistency */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="royalties">Royalties (%) *</Label>
              <Input
                id="royalties"
                name="royalties"
                type="number"
                min="0"
                max="50" // Example max, adjust as needed
                step="0.1"
                value={formData.royalties}
                onChange={handleInputChange}
                placeholder="10"
                className="bg-white/10 border-white/20 text-white" // Removed mt-2
                required
              />
              <p className="text-xs text-dt-gray-light">
                Royalty percentage for secondary sales (for metadata purposes).
              </p>
            </div>
            {/* Gas fee estimate can be a static display or fetched if complex */}
            {/* For now, keeping it simple or it can be removed if not essential for this phase */}
            {/*
            <div className="mt-4 p-3 bg-dt-primary/10 rounded-lg border border-dt-primary/20">
              <h3 className="font-semibold text-dt-primary text-sm mb-1">Gas Fee Estimate</h3>
              <p className="text-dt-gray-light text-xs">
                Minting gas can vary. Current estimate: <span className="text-white font-medium">~0.02 ETH</span>
              </p>
            </div>
            */}
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              disabled={isProcessing || !audioFile || !coverFile}
              className="btn-primary text-base sm:text-lg px-8 py-3 sm:px-10 sm:py-3.5"
            >
              {uploadStage !== 'idle' && uploadStage !== 'done' && uploadStage !== 'metadata' ? (
                <> <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Uploading {uploadStage}... ({uploadProgress.toFixed(0)}%) </>
              ) : uploadStage === 'metadata' ? (
                <> <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Finalizing IPFS... </>
              ) : isMintPending ? (
                <> <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Waiting for Wallet... </>
              ) : isConfirming ? (
                <> <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Minting NFT... </>
              ) : (
                <> <UploadIcon className="h-5 w-5 mr-2" /> Mint Track as NFT </>
              )}
            </Button>
            
            {isProcessing && (
              <div className="mt-4 text-sm text-dt-gray-light">
                <p>
                  {uploadStage !== 'idle' && uploadStage !== 'done' && `Current stage: Uploading ${uploadStage}...`}
                  {isMintPending && 'Waiting for wallet confirmation...'}
                  {isConfirming && 'Minting transaction is processing...'}
                </p>
                {uploadStage !== 'idle' && uploadStage !== 'done' && (
                  <div className="w-full bg-white/10 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-dt-primary h-2.5 rounded-full transition-all duration-300 ease-linear"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                 <p className="mt-1">This may take a few minutes. Please don't close this page.</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
