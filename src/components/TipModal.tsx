import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { type Address, parseEther, isAddressEqual } from 'viem';
import TipJarAbi from '@/lib/abi/TipJar.json';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const tipJarContractAddress = import.meta.env.VITE_CONTRACT_TIP_JAR as Address | undefined;

interface TipModalProps {
  artistAddress: Address | undefined; // Address of the artist to tip
  trackName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TipModal: React.FC<TipModalProps> = ({ artistAddress, trackName, isOpen, onClose }) => {
  const [tipAmount, setTipAmount] = useState(''); // Store as string for input field
  const [tipTxHash, setTipTxHash] = useState<Address | undefined>(undefined);

  const { address: connectedWalletAddress } = useAccount();

  const {
    writeContract: sendTip,
    data: tipData,
    isPending: isTipTxPending, // Wallet confirmation pending
    error: tipSubmitError,
  } = useWriteContract();

  const {
    isLoading: isConfirmingTipTx, // Transaction mining pending
    isSuccess: isTipTxConfirmed,
    error: tipConfirmError,
  } = useWaitForTransactionReceipt({
    hash: tipTxHash,
  });

  useEffect(() => {
    if (tipData?.hash) {
      setTipTxHash(tipData.hash);
      toast({
        title: 'Tip Transaction Sent',
        description: `Transaction hash: ${tipData.hash}. Waiting for confirmation...`,
      });
    }
  }, [tipData]);

  useEffect(() => {
    if (isTipTxConfirmed) {
      toast({
        title: 'Tip Successful!',
        description: `Successfully tipped ${trackName ? `artist of ${trackName}` : 'the artist'}.`,
      });
      setTipAmount(''); // Reset amount
      onClose(); // Close modal on success
    }
    if (tipConfirmError) {
      toast({
        title: 'Tip Transaction Failed',
        description: tipConfirmError.message || 'The tip transaction failed to confirm.',
        variant: 'destructive',
      });
    }
  }, [isTipTxConfirmed, tipConfirmError, onClose, trackName]);

  useEffect(() => {
    if (tipSubmitError) {
      toast({
        title: 'Tip Submission Error',
        description: tipSubmitError.message || 'Could not submit tip transaction. User rejected or other error.',
        variant: 'destructive',
      });
    }
  }, [tipSubmitError]);

  const handleSendTip = async () => {
    if (!artistAddress) {
      toast({ title: 'Error', description: 'Artist address is not defined.', variant: 'destructive' });
      return;
    }
    if (!tipJarContractAddress) {
        toast({ title: 'Error', description: 'Tip Jar contract address is not configured.', variant: 'destructive' });
        return;
    }
    if (connectedWalletAddress && isAddressEqual(artistAddress, connectedWalletAddress)) {
      toast({ title: 'Action Not Allowed', description: "You cannot tip yourself.", variant: 'destructive' });
      return;
    }

    const amountInEth = parseFloat(tipAmount);
    if (isNaN(amountInEth) || amountInEth <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid positive tip amount.', variant: 'destructive' });
      return;
    }

    try {
      const value = parseEther(tipAmount); // Converts ETH string to Wei BigInt
      sendTip({
        address: tipJarContractAddress,
        abi: TipJarAbi, // Assuming TipJarAbi is an array (the ABI itself)
        functionName: 'tip',
        args: [artistAddress],
        value: value,
      });
    } catch (error) {
      console.error("Error parsing tip amount or sending tip:", error);
      toast({ title: 'Input Error', description: 'Please enter a valid ETH amount (e.g., 0.01).', variant: 'destructive' });
    }
  };

  const isLoading = isTipTxPending || isConfirmingTipTx;

  // Reset state when modal is reopened, if it was previously closed after a transaction.
  // Or if artistAddress changes.
  useEffect(() => {
    if (isOpen) {
      setTipAmount('');
      setTipTxHash(undefined);
      // Errors are reset by wagmi automatically on new write/waitForTransaction call
    }
  }, [isOpen, artistAddress]);


  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-dark text-white border-dt-gray-light">
        <DialogHeader>
          <DialogTitle>Send a Tip</DialogTitle>
          {trackName && <DialogDescription>Show your appreciation for {trackName}.</DialogDescription>}
          <DialogDescription>
            You are tipping: <span className="font-bold text-dt-primary">{artistAddress ? `${artistAddress.slice(0, 6)}...${artistAddress.slice(-4)}` : 'N/A'}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tip-amount" className="text-right">
              Amount (ETH)
            </Label>
            <Input
              id="tip-amount"
              type="number"
              step="0.001"
              min="0"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              className="col-span-3 bg-dt-gray-dark border-dt-gray-light placeholder-dt-gray-light"
              placeholder="e.g., 0.01"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="btn-secondary">
            Cancel
          </Button>
          <Button onClick={handleSendTip} disabled={isLoading || !artistAddress || !tipAmount} className="btn-primary">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isTipTxPending ? 'Waiting for Wallet...' : isConfirmingTipTx ? 'Sending Tip...' : 'Send Tip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
