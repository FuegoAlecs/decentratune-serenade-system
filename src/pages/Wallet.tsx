import React from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRecentTransactions, type SimplifiedTransaction } from "@/hooks/contracts";
import { formatDistanceToNow } from 'date-fns';
import { Wallet as WalletIcon, LogOut, ExternalLink, Copy, Check, Loader2, AlertTriangle } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard'; // For copying address
import { toast } from "@/hooks/use-toast"; // Using the custom toast hook

const WalletPage: React.FC = () => {
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, isLoading: isConnectLoading, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance, isLoading: isLoadingBalance } = useBalance({ address });

  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError
  } = useRecentTransactions(address, 15); // Fetch 15 recent transactions

  const [copied, setCopied] = React.useState(false);

  const handleConnect = () => {
    const injectedConnectorInstance = connectors.find(c => c.id === 'io.metamask' || c.id === 'injected') || injected();
    connect({ connector: injectedConnectorInstance });
  };

  const onCopy = () => {
    setCopied(true);
    toast({ title: "Copied!", description: "Wallet address copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center p-4 sm:p-6 text-white">
        <WalletIcon className="h-16 w-16 text-dt-primary mb-6" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-lg sm:text-xl text-dt-gray-light mb-8 max-w-md">
          To view your wallet details, balances, and transaction history, please connect your Web3 wallet.
        </p>
        <Button
          onClick={handleConnect}
          disabled={isConnectLoading}
          size="lg"
          className="btn-primary text-lg px-8 py-3"
        >
          {isConnectLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Connecting...
            </>
          ) : (
            "Connect Wallet"
          )}
        </Button>
        {connectError && (
          <p className="text-red-400 mt-4 text-sm">Error connecting: {connectError.message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="font-satoshi font-bold text-3xl sm:text-4xl">My Wallet</h1>

        {/* Wallet Information Card */}
        <Card className="bg-dt-dark-2 border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl">Wallet Details</CardTitle>
            <CardDescription className="text-dt-gray-light">
              {activeConnector?.name ? `${activeConnector.name} Connected` : "Connected"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-dt-gray-light">Address:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm sm:text-base break-all">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "N/A"}
                </span>
                {address && (
                  <CopyToClipboard text={address} onCopy={onCopy}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-dt-gray-light hover:text-white">
                      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </CopyToClipboard>
                )}
              </div>
            </div>
            {ensName && (
              <div className="flex items-center justify-between">
                <span className="text-dt-gray-light">ENS:</span>
                <span className="font-medium text-sm sm:text-base">{ensName}</span>
              </div>
            )}
             <div className="flex items-center justify-between">
              <span className="text-dt-gray-light">Balance:</span>
              {isLoadingBalance ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="font-medium text-sm sm:text-base">
                  {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "N/A"}
                </span>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => disconnect()} className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full sm:w-auto">
              <LogOut className="h-4 w-4 mr-2" /> Disconnect
            </Button>
          </CardFooter>
        </Card>

        {/* Transaction History Section */}
        <Card className="bg-dt-dark-2 border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl">Recent Activity</CardTitle>
            <CardDescription className="text-dt-gray-light">Your latest on-chain transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-dt-primary" />
                <p className="ml-3 text-dt-gray-light">Loading transactions...</p>
              </div>
            )}
            {transactionsError && (
              <div className="text-red-400 py-10 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Error loading transactions: {transactionsError.message}</p>
              </div>
            )}
            {!isLoadingTransactions && !transactionsError && transactions && transactions.length > 0 && (
              <ul className="space-y-3">
                {transactions.map((tx) => (
                  <li key={tx.hash} className="p-3 bg-dt-dark-1 rounded-lg hover:bg-dt-dark-1/70 transition-colors">
                    <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between space-x-3">
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                           <p className={`text-sm font-semibold truncate ${
                            tx.type.toLowerCase().includes("send") || tx.type.toLowerCase().includes("mint") && tx.summary.toLowerCase().includes("minted") ? 'text-amber-400' :
                            tx.type.toLowerCase().includes("receive") ? 'text-green-400' : 'text-sky-400'
                           }`}>{tx.type}</p>
                           <p className="text-xs text-dt-gray-light whitespace-nowrap">{formatDistanceToNow(tx.date, { addSuffix: true })}</p>
                        </div>
                        <p className="text-xs text-dt-gray-light truncate" title={tx.summary}>{tx.summary}</p>
                        {tx.value && <p className="text-xs text-white mt-0.5">{tx.value}</p>}
                      </div>
                      <ExternalLink className="h-4 w-4 text-dt-gray-light shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {!isLoadingTransactions && !transactionsError && (!transactions || transactions.length === 0) && (
              <p className="text-dt-gray-light py-10 text-center">No recent transactions found.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default WalletPage;
