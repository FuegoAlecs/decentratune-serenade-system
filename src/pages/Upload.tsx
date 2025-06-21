
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, Music, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
// import { parseEther } from "ethers"; // Not needed if mintMusic doesn't take price/royalties
import { NFTStorage, File as NFTStorageFile } from "nft.storage";
import { useMintTrack } from "@/hooks/contracts"; // Import the custom hook

// import musicNftAbi from "@/lib/abi/MusicNFT.json"; // ABI import handled by the hook

const genres = ["Electronic", "Hip Hop", "Rock", "Jazz", "Classical", "Ambient", "Pop", "R&B", "Country", "Folk"];

// const musicNftContractAddress = import.meta.env.VITE_CONTRACT_MUSIC_NFT; // Handled by the hook
const nftStorageToken = import.meta.env.VITE_WEB_STORAGE_TOKEN;

export default function Upload() {
  const [isIPFSUploading, setIsIPFSUploading] = useState(false); // Specifically for IPFS part
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  const {
    mintTrack,
    mintHash,
    isMintPending, // This is wagmi's isPending for writeContract (waiting for wallet)
    mintError,
    // mintStatus, // Can be used for more granular UI updates
    isConfirming, // This is from useWaitForTransactionReceipt (tx mining)
    isConfirmed,
    confirmationError
  } = useMintTrack();


  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    // price: "", // ETH - Removed as per new requirements for useMintTrack
    // royalties: "10", // Removed
    // totalSupply: "100", // Removed, assuming ERC721 single collection
    bpm: "",
    key: "",
    tags: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'audio') {
        setAudioFile(file);
      } else {
        setCoverFile(file);
      }
    }
  };

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
    if (!nftStorageToken) { // musicNftContractAddress check is now within the hook
      toast({ title: "Configuration Error", description: "NFT Storage service is not configured.", variant: "destructive" });
      console.error("Missing VITE_WEB_STORAGE_TOKEN");
      return;
    }
    // Basic validation for required form fields (price, totalSupply, royalties removed)
    if (!formData.title || !formData.genre) {
        toast({ title: "Missing Information", description: "Please fill in Track Title and Genre.", variant: "destructive" });
        return;
    }

    setIsIPFSUploading(true); // Start IPFS upload loading state

    try {
      const client = new NFTStorage({ token: nftStorageToken });
      toast({ title: "Uploading files to IPFS...", description: "This may take a moment." });

      const audioBlob = new Blob([audioFile], { type: audioFile.type });
      const coverBlob = new Blob([coverFile], { type: coverFile.type });

      const audioCid = await client.storeBlob(new NFTStorageFile([audioBlob], audioFile.name, { type: audioFile.type }));
      const coverCid = await client.storeBlob(new NFTStorageFile([coverBlob], coverFile.name, { type: coverFile.type }));

      toast({ title: "Files uploaded!", description: "Preparing metadata..." });

      const metadata = {
        name: formData.title,
        description: formData.description,
        image: `ipfs://${coverCid}`,
        audio: `ipfs://${audioCid}`,
        external_url: "",
        attributes: [
          { trait_type: "Genre", value: formData.genre },
          { trait_type: "BPM", value: formData.bpm || "N/A" },
          { trait_type: "Key", value: formData.key || "N/A" },
          { trait_type: "Tags", value: formData.tags || "N/A" },
          { trait_type: "Creator", value: address },
        ],
        properties: {
            bpm: formData.bpm,
            key: formData.key,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            creator_address: address,
        }
      };

      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataCid = await client.storeBlob(new NFTStorageFile([metadataBlob], 'metadata.json', { type: 'application/json' }));
      const metadataUri = `ipfs://${metadataCid}`;

      setIsIPFSUploading(false); // IPFS upload finished
      toast({ title: "Metadata prepared!", description: "Please confirm transaction in your wallet." });

      // Call the mintTrack function from the hook
      await mintTrack(metadataUri);

    } catch (error) {
      console.error("Error during IPFS upload or metadata preparation:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during IPFS upload.",
        variant: "destructive",
      });
      setIsIPFSUploading(false);
    }
  };

  // Handle transaction submission, confirmation, and error states from useMintTrack hook
  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: "Track Minted Successfully!",
        description: `${formData.title} is now available as an NFT. Transaction: ${mintHash}`,
      });
      // Reset form fields or navigate away
      navigate('/profile');
    }
    if (mintError || confirmationError) {
      toast({
        title: "Transaction Failed",
        description: (mintError?.message || confirmationError?.message) ?? "An error occurred during minting.",
        variant: "destructive",
      });
    }
  }, [isConfirmed, mintError, confirmationError, mintHash, formData.title, navigate, toast]);

  const isProcessing = isIPFSUploading || isMintPending || isConfirming;

  return (
    <div className="min-h-screen bg-gradient-dark text-white px-4 py-6 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-satoshi font-bold text-3xl sm:text-4xl mb-3 sm:mb-4">Upload Your Track</h1>
          <p className="text-dt-gray-light text-base sm:text-lg">
            Share your music with the world and mint it as an NFT
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8"> {/* Adjusted Gap */}
            {/* Audio Upload */}
            <div className="glass-card p-4 sm:p-6 rounded-2xl"> {/* Adjusted Padding */}
              <Label className="block text-base sm:text-lg font-semibold mb-3 sm:mb-4"> {/* Adjusted Text Size & Margin */}
                <Music className="inline h-5 w-5 mr-2" />
                Audio File
              </Label>
              
              <div className="border-2 border-dashed border-white/20 rounded-xl p-6 sm:p-8 text-center hover:border-dt-primary transition-colors"> {/* Adjusted Padding */}
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, 'audio')}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <UploadIcon className="h-12 w-12 text-dt-gray-light mx-auto mb-4" />
                  {audioFile ? (
                    <div>
                      <p className="text-white font-medium">{audioFile.name}</p>
                      <p className="text-dt-gray-light text-sm">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-medium">Click to upload audio</p>
                      <p className="text-dt-gray-light text-sm">MP3, WAV, FLAC up to 50MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Cover Art Upload */}
            <div className="glass-card p-4 sm:p-6 rounded-2xl"> {/* Adjusted Padding */}
              <Label className="block text-base sm:text-lg font-semibold mb-3 sm:mb-4"> {/* Adjusted Text Size & Margin */}
                <Image className="inline h-5 w-5 mr-2" />
                Cover Art
              </Label>
              
              <div className="border-2 border-dashed border-white/20 rounded-xl p-6 sm:p-8 text-center hover:border-dt-primary transition-colors"> {/* Adjusted Padding */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'cover')}
                  className="hidden"
                  id="cover-upload"
                />
                <label htmlFor="cover-upload" className="cursor-pointer">
                  {coverFile ? (
                    <div>
                      <img
                        src={URL.createObjectURL(coverFile)}
                        alt="Cover preview"
                        className="w-24 h-24 object-cover rounded-lg mx-auto mb-4"
                      />
                      <p className="text-white font-medium">{coverFile.name}</p>
                      <p className="text-dt-gray-light text-sm">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <UploadIcon className="h-12 w-12 text-dt-gray-light mx-auto mb-4" />
                      <p className="text-white font-medium">Click to upload cover</p>
                      <p className="text-dt-gray-light text-sm">JPG, PNG up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Track Information */}
          <div className="glass-card p-4 py-6 sm:p-8 rounded-2xl"> {/* Adjusted Padding */}
            <h2 className="font-satoshi font-bold text-xl sm:text-2xl mb-4 sm:mb-6">Track Information</h2> {/* Adjusted Text Size & Margin */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"> {/* Adjusted Gap */}
              <div>
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

              <div>
                <Label htmlFor="genre">Genre *</Label>
                <select
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white mt-2"
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

              <div>
                <Label htmlFor="bpm">BPM</Label>
                <Input
                  id="bpm"
                  name="bpm"
                  type="number"
                  value={formData.bpm}
                  onChange={handleInputChange}
                  placeholder="120"
                  className="bg-white/10 border-white/20 text-white mt-2"
                />
              </div>

              <div>
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  name="key"
                  value={formData.key}
                  onChange={handleInputChange}
                  placeholder="C Major"
                  className="bg-white/10 border-white/20 text-white mt-2"
                />
              </div>
            </div>

            <div className="mt-6">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell the story behind your track..."
                className="bg-white/10 border-white/20 text-white mt-2"
                rows={4}
              />
            </div>

            <div className="mt-6">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="ambient, electronic, chill"
                className="bg-white/10 border-white/20 text-white mt-2"
              />
            </div>
          </div>

          {/* NFT Settings - Removed Price, Total Supply, Royalties as per new requirements */}
          {/* <div className="glass-card p-4 py-6 sm:p-8 rounded-2xl">
            <h2 className="font-satoshi font-bold text-xl sm:text-2xl mb-4 sm:mb-6">NFT Settings</h2>
            <div className="mt-6 p-4 bg-dt-primary/10 rounded-xl border border-dt-primary/20">
              <h3 className="font-semibold text-dt-primary mb-2">Gas Fee Estimate</h3>
              <p className="text-dt-gray-light text-sm">
                Estimated gas fee for minting: <span className="text-white font-medium">~0.02 ETH</span>
              </p>
            </div>
          </div> */}

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              disabled={isProcessing || !audioFile || !coverFile} // Use combined isProcessing
              className="btn-primary text-base sm:text-lg px-8 py-3 sm:px-10 sm:py-3.5"
            >
              {isIPFSUploading ? (
                <> <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Uploading to IPFS... </>
              ) : isMintPending ? (
                <> <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Waiting for Wallet... </>
              ) : isConfirming ? (
                <> <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Minting NFT... </>
              ) : (
                <> <UploadIcon className="h-5 w-5 mr-2" /> Mint Track as NFT </>
              )}
            </Button>
            
            {isProcessing && (
              <p className="text-dt-gray-light text-sm mt-4">
                This may take a few minutes. Please don't close this page.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
