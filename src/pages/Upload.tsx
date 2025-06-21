
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, Music, Image, Loader2 } from "lucide-react";

const genres = ["Electronic", "Hip Hop", "Rock", "Jazz", "Classical", "Ambient", "Pop", "R&B", "Country", "Folk"];

export default function Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    price: "",
    royalties: "10",
    totalSupply: "100",
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
    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      // Handle success - redirect or show success message
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-dark text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-satoshi font-bold text-4xl mb-4">Upload Your Track</h1>
          <p className="text-dt-gray-light text-lg">
            Share your music with the world and mint it as an NFT
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Audio Upload */}
            <div className="glass-card p-6 rounded-2xl">
              <Label className="block text-lg font-semibold mb-4">
                <Music className="inline h-5 w-5 mr-2" />
                Audio File
              </Label>
              
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-dt-primary transition-colors">
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
            <div className="glass-card p-6 rounded-2xl">
              <Label className="block text-lg font-semibold mb-4">
                <Image className="inline h-5 w-5 mr-2" />
                Cover Art
              </Label>
              
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-dt-primary transition-colors">
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
          <div className="glass-card p-8 rounded-2xl">
            <h2 className="font-satoshi font-bold text-2xl mb-6">Track Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* NFT Settings */}
          <div className="glass-card p-8 rounded-2xl">
            <h2 className="font-satoshi font-bold text-2xl mb-6">NFT Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="price">Price (ETH) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.5"
                  className="bg-white/10 border-white/20 text-white mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="totalSupply">Total Supply *</Label>
                <Input
                  id="totalSupply"
                  name="totalSupply"
                  type="number"
                  value={formData.totalSupply}
                  onChange={handleInputChange}
                  placeholder="100"
                  className="bg-white/10 border-white/20 text-white mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="royalties">Royalties (%) *</Label>
                <Input
                  id="royalties"
                  name="royalties"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.royalties}
                  onChange={handleInputChange}
                  placeholder="10"
                  className="bg-white/10 border-white/20 text-white mt-2"
                  required
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-dt-primary/10 rounded-xl border border-dt-primary/20">
              <h3 className="font-semibold text-dt-primary mb-2">Gas Fee Estimate</h3>
              <p className="text-dt-gray-light text-sm">
                Estimated gas fee for minting: <span className="text-white font-medium">~0.02 ETH</span>
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              disabled={isUploading || !audioFile || !coverFile}
              className="btn-primary text-lg px-12 py-4"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Minting NFT...
                </>
              ) : (
                <>
                  <UploadIcon className="h-5 w-5 mr-2" />
                  Mint Track as NFT
                </>
              )}
            </Button>
            
            {isUploading && (
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
