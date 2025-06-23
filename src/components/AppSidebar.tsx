
import { Home, Music, Users, Upload, Wallet, Settings, TrendingUp, LogOut, CheckCircle, AlertTriangle, ExternalLink, Loader2 } from "lucide-react"; // Added ExternalLink, Loader2
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";
import { injected } from 'wagmi/connectors';
import { useRecentTransactions, type SimplifiedTransaction } from "@/hooks/contracts"; // Import the new hook and type
import { formatDistanceToNow } from 'date-fns'; // For relative time
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom"; // Import Link

const menuItems = [
  {
    title: "Dashboard", // Routes to Index.tsx
    url: "/",
    icon: Home,
  },
  {
    title: "Explore", // Changed from Discover, routes to Explore.tsx
    url: "/explore",
    icon: TrendingUp,
  },
  {
    title: "My Profile", // Changed from My Music, routes to Profile.tsx
    url: "/profile",
    icon: Music, // Icon could be User if preferred for profile
  },
  {
    title: "Artists",
    url: "/artists",
    icon: Users,
  },
  {
    title: "Upload", // Routes to Upload.tsx
    url: "/upload",
    icon: Upload,
  },
];

const bottomItems = [
  {
    title: "Wallet",
    url: "/wallet",
    icon: Wallet,
  },
  // {
  //   title: "Settings", // Page /settings not implemented yet, keeping commented
  //   url: "/settings",
  //   icon: Settings,
  // },
];

export function AppSidebar() {
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, error: connectError, isLoading: isConnectLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();

  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError
  } = useRecentTransactions(address, 3); // Fetch 3 recent transactions

  const injectedConnectorInstance = connectors.find(c => c.id === 'io.metamask' || c.id === 'injected' || c.name.toLowerCase().includes('metamask'));

  const handleConnect = () => {
    const connectorToUse = injectedConnectorInstance || injected();
    if (connectorToUse) {
      connect({ connector: connectorToUse });
    } else {
      // This case should ideally not happen if wagmi is configured with an injected connector
      console.error("No suitable injected connector found to initiate connection.");
      // TODO: Display a toast or user message
    }
  };

  // Transaction part will be added later inside the DropdownMenuContent

  return (
    <Sidebar className="border-r border-white/10 bg-gradient-dark">
      <SidebarHeader className="p-4 lg:p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-satoshi font-bold text-xl text-white">DecentraTune</h1>
            <p className="text-dt-gray-light text-sm">Web3 Music Platform</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-dt-gray-light uppercase tracking-wider text-xs font-medium mb-4">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className="w-full h-12 text-white hover:bg-dt-primary/20 hover:text-dt-primary rounded-xl transition-all duration-200 mb-1"
                  >
                    <Link to={item.url} className="flex items-center space-x-3 px-4"> {/* Use Link and to */}
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          {/* Render other bottom items first if any (e.g., Settings) */}
          {bottomItems.filter(item => item.title !== "Wallet").map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className="w-full h-12 text-white hover:bg-dt-primary/20 hover:text-dt-primary rounded-xl transition-all duration-200 mb-1"
              >
                <Link to={item.url} className="flex items-center space-x-3 px-4">
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* Wallet Button / Dropdown */}
          <SidebarMenuItem>
            {isConnected && address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="w-full h-12 text-white hover:bg-dt-primary/20 hover:text-dt-primary rounded-xl transition-all duration-200 mb-1 flex items-center space-x-3 px-4">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Wallet</span>
                      <span className="text-xs text-dt-gray-light -mt-1 truncate max-w-[100px] sm:max-w-[120px]">
                        {ensName ? ensName : `${address.slice(0, 6)}...${address.slice(-4)}`}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-dt-dark-2 border-white/10 text-white w-64" align="end" side="right" sideOffset={10}>
                  <DropdownMenuLabel className="px-3 py-2">
                    {activeConnector?.name && <p className="text-xs text-dt-gray-light mb-1">{activeConnector.name}</p>}
                    {ensName ? `${ensName} (${address.slice(0,4)}...${address.slice(-4)})` : `${address.slice(0,6)}...${address.slice(-4)}`}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />

                  <DropdownMenuLabel className="px-3 pt-2 pb-1 text-xs text-dt-gray-light">Recent Activity</DropdownMenuLabel>
                  {isLoadingTransactions && (
                    <DropdownMenuItem className="px-3 py-2 flex items-center justify-center cursor-default">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-xs text-dt-gray-light">Loading transactions...</span>
                    </DropdownMenuItem>
                  )}
                  {transactionsError && (
                     <DropdownMenuItem className="px-3 py-2 flex items-center text-red-400 cursor-default">
                       <AlertTriangle className="h-4 w-4 mr-2" />
                       <span className="text-xs">Error loading transactions</span>
                     </DropdownMenuItem>
                  )}
                  {!isLoadingTransactions && !transactionsError && transactions && transactions.length > 0 && (
                    transactions.map((tx) => (
                      <DropdownMenuItem key={tx.hash} asChild className="px-3 py-1.5 hover:bg-dt-primary/10 cursor-pointer">
                        <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full">
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-medium text-white truncate max-w-[150px]">{tx.summary}</span>
                            <span className="text-[10px] text-dt-gray-light">{formatDistanceToNow(tx.date, { addSuffix: true })}</span>
                          </div>
                          <ExternalLink className="h-3 w-3 text-dt-gray-light ml-2 shrink-0" />
                        </a>
                      </DropdownMenuItem>
                    ))
                  )}
                  {!isLoadingTransactions && !transactionsError && (!transactions || transactions.length === 0) && (
                     <DropdownMenuItem className="px-3 py-2 cursor-default">
                       <span className="text-xs text-dt-gray-light">No recent transactions.</span>
                     </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={() => disconnect()} className="px-3 py-2 hover:bg-dt-primary/20 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton
                onClick={handleConnect}
                disabled={isConnectLoading}
                className="w-full h-12 text-white hover:bg-dt-primary/20 hover:text-dt-primary rounded-xl transition-all duration-200 mb-1 flex items-center space-x-3 px-4"
              >
                {isConnectLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 text-white mr-2" />
                    <span className="font-medium">Connecting...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-400" /> {/* Or Wallet icon */}
                    <span className="font-medium">Connect Wallet</span>
                  </>
                )}
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-6 p-4 glass-card rounded-xl">
          <p className="text-dt-gray-light text-sm mb-2">Pro Membership</p>
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Upgrade</span>
            <button className="bg-dt-primary text-white px-3 py-1 rounded-lg text-sm hover:bg-dt-primary-dark transition-colors">
              Get Pro
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <div className="mt-6 p-4 glass-card rounded-xl">
          <p className="text-dt-gray-light text-sm mb-2">Pro Membership</p>
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Upgrade</span>
            <button className="bg-dt-primary text-white px-3 py-1 rounded-lg text-sm hover:bg-dt-primary-dark transition-colors">
              Get Pro
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
