import { useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEffect, useState } from 'react'; // For managing dialog visibility based on wagmi state

export function NetworkGuard() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isLoading: isSwitchingNetwork, error: switchChainError } = useSwitchChain();
  const [showDialog, setShowDialog] = useState(false);

  const isWrongNetwork = isConnected && chainId !== sepolia.id;

  useEffect(() => {
    if (isWrongNetwork) {
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [isWrongNetwork]);

  const handleSwitchNetwork = () => {
    switchChain({ chainId: sepolia.id });
  };

  if (!isWrongNetwork) {
    return null; // Don't render anything if network is correct or not connected
  }

  // AlertDialog open prop is controlled by local state `showDialog`
  // but we don't want to allow manual closing via AlertDialogCancel or overlay click
  // if the network is wrong. The only way out is to switch or disconnect (which would hide this).
  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Incorrect Network</AlertDialogTitle>
          <AlertDialogDescription>
            DecentraTune requires you to be on the Sepolia test network.
            Please switch your wallet to the Sepolia network to continue.
            {switchChainError && (
              <p className="mt-2 text-red-500">
                Error switching network: {switchChainError.message}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* No Cancel button to force switch or disconnect action */}
          <Button
            onClick={handleSwitchNetwork}
            disabled={isSwitchingNetwork}
            className="w-full"
          >
            {isSwitchingNetwork ? 'Switching...' : 'Switch to Sepolia'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
