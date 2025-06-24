import React from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { ethers }
from 'ethers'; // For ABI type if needed, or general contract interaction types

// A minimal ABI for ERC721/ERC1155 isApprovedForAll and setApprovalForAll
const erc721Abi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const; // Use 'as const' for better type inference with wagmi

interface ApproveOperatorProps {
  musicNftAddress: `0x${string}`;
  trackSaleAddress: `0x${string}`;
}

const ApproveOperator: React.FC<ApproveOperatorProps> = ({
  musicNftAddress,
  trackSaleAddress,
}) => {
  const { address: userAddress, isConnected } = useAccount();

  // Check current approval status
  const { data: isApproved, isLoading: isLoadingApprovalStatus, error: errorApprovalStatus, refetch: refetchApprovalStatus } = useContractRead({
    address: musicNftAddress,
    abi: erc721Abi,
    functionName: 'isApprovedForAll',
    args: [userAddress!, trackSaleAddress], // userAddress can be undefined if not connected
    enabled: isConnected && !!userAddress, // Only run if connected and userAddress is available
    watch: true,
  });

  // Prepare for approval transaction
  const { config: approvalConfig, error: prepareError } = usePrepareContractWrite({
    address: musicNftAddress,
    abi: erc721Abi,
    functionName: 'setApprovalForAll',
    args: [trackSaleAddress, true],
    enabled: isConnected && userAddress && isApproved === false, // Only enable if not already approved and connected
  });

  // Handle approval transaction
  const { data: approvalData, write: approveOperator, isLoading: isApproving, error: approvalError } = useContractWrite(approvalConfig);

  // Wait for transaction to be mined
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess, error: waitForApprovalError } = useWaitForTransaction({
    hash: approvalData?.hash,
    enabled: !!approvalData,
    onSuccess: () => {
      refetchApprovalStatus(); // Refetch approval status after successful transaction
    }
  });

  const isLoading = isLoadingApprovalStatus || isApproving || isWaitingForApproval;
  const error = errorApprovalStatus || approvalError || waitForApprovalError || prepareError;

  if (!isConnected) {
    return <p>Please connect your wallet to manage operator approvals.</p>;
  }

  return (
    <div>
      <h2>Operator Approval for MusicNFT</h2>
      <p>
        To allow the TrackSale marketplace ({trackSaleAddress}) to manage sales of your MusicNFT tokens ({musicNftAddress}), you need to approve it as an operator.
        This means the marketplace can transfer your NFTs on your behalf when a sale occurs.
      </p>

      {isLoadingApprovalStatus && <p>Loading approval status...</p>}
      {errorApprovalStatus && <p>Error loading approval status: {errorApprovalStatus.message}</p>}

      {isApproved !== undefined && (
        <p>
          Current status: TrackSale contract is <strong>{isApproved ? 'APPROVED' : 'NOT APPROVED'}</strong> as an operator.
        </p>
      )}

      {isApproved === false && (
        <button onClick={() => approveOperator?.()} disabled={isLoading || !approveOperator || !!prepareError}>
          {isApproving || isWaitingForApproval ? 'Approving...' : 'Approve Operator'}
        </button>
      )}

      {isApproved === true && <p>Operator already approved. You're all set!</p>}

      {isLoading && !isLoadingApprovalStatus && <p>Processing transaction...</p>}
      {isApprovalSuccess && <p>Approval successful! The marketplace is now an approved operator.</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      {prepareError && <p style={{ color: 'red' }}>Error preparing transaction: {prepareError.message}</p>}
    </div>
  );
};

export default ApproveOperator;
