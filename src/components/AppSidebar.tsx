
import { Home, Music, Users, Upload, Wallet, Settings, TrendingUp } from "lucide-react";
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
  return (
    <Sidebar className="border-r border-white/10 bg-gradient-dark">
      <SidebarHeader className="p-4 lg:p-6"> {/* Adjusted padding for mobile-first */}
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
          {bottomItems.map((item) => (
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
