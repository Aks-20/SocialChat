import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAuthContext } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { getUserInitials } from "@/lib/auth";
import { 
  Search, 
  MessageCircle, 
  Bell, 
  Settings,
  LogOut,
  Plus,
  Monitor,
  HelpCircle,
  Shield,
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SearchDropdown from "./search-dropdown";
import NotificationsDropdown from "./notifications-dropdown";
import MessagesDropdown from "./messages-dropdown";
import CreateDropdown from "./create-dropdown";
import SettingsModal from "./settings-modal";

export default function Navigation() {
  const { user, logout } = useAuth();
  const { impersonation, stopImpersonation } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsModalType, setSettingsModalType] = useState<'settings' | 'privacy' | 'help' | 'display'>('settings');

  // Get real-time counts for notifications and messages
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    refetchInterval: 5000, // Refresh every 5 seconds for faster updates
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/conversations'],
    refetchInterval: 5000, // Refresh every 5 seconds for faster updates
  });

  const unreadNotifications = Array.isArray(notifications) 
    ? notifications.filter((n: any) => !n.isRead).length 
    : 0;
    
  const unreadMessages = Array.isArray(conversations) 
    ? conversations.filter((c: any) => !c.readAt && c.receiverId === user?.id).length 
    : 0;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonation();
      window.location.href = '/admin';
    } catch (error: any) {
      console.error("Failed to stop impersonation:", error);
    }
  };

  return (
    <>
      {/* Impersonation Indicator */}
      {impersonation?.isImpersonating && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={handleStopImpersonation}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg flex items-center space-x-2"
            size="sm"
          >
            <UserCheck className="h-4 w-4" />
            <span>Exit Impersonation</span>
          </Button>
        </div>
      )}

      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-[60]">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left: Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">Social</span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for people, posts, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              className="pl-10 pr-4 py-2 w-full bg-gray-100 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
            <SearchDropdown
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>

        {/* Right: Action Buttons and User Menu */}
        <div className="flex items-center space-x-3">
          {/* Create Button */}
          <div className="relative">
            <Button 
              size="sm" 
              className="rounded-full"
              onClick={() => {
                setIsCreateOpen(!isCreateOpen);
                setIsSearchOpen(false);
                setIsNotificationsOpen(false);
                setIsMessagesOpen(false);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Create</span>
            </Button>
            <CreateDropdown
              isOpen={isCreateOpen}
              onClose={() => setIsCreateOpen(false)}
              onCreatePost={() => {
                setIsCreateOpen(false);
                const event = new CustomEvent('openCreatePost');
                window.dispatchEvent(event);
              }}
              onCreateStory={() => {
                setIsCreateOpen(false);
                const event = new CustomEvent('openCreateStory');
                window.dispatchEvent(event);
              }}
              onCreateEvent={() => {
                setIsCreateOpen(false);
                const event = new CustomEvent('openCreateEvent');
                window.dispatchEvent(event);
              }}
              onCreateRoom={() => {
                setIsCreateOpen(false);
                const event = new CustomEvent('openCreateRoom');
                window.dispatchEvent(event);
              }}
            />
          </div>

          {/* Messages */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2 rounded-full"
              onClick={() => {
                setIsMessagesOpen(!isMessagesOpen);
                setIsSearchOpen(false);
                setIsNotificationsOpen(false);
                setIsCreateOpen(false);
              }}
            >
              <MessageCircle className="h-5 w-5" />
              {unreadMessages > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </Badge>
              )}
            </Button>
            <MessagesDropdown
              isOpen={isMessagesOpen}
              onClose={() => setIsMessagesOpen(false)}
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2 rounded-full"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsSearchOpen(false);
                setIsMessagesOpen(false);
                setIsCreateOpen(false);
              }}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Badge>
              )}
            </Button>
            <NotificationsDropdown
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
            />
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar || ""} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem className="flex flex-col items-start p-3">
                <div className="font-medium">{user?.name || user?.username}</div>
                <div className="text-sm text-muted-foreground">@{user?.username}</div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full">
                  <div className="flex items-center">
                    <Avatar className="h-4 w-4 mr-2">
                      <AvatarImage src={user?.avatar || ""} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <span>View Profile</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSettingsModalType('privacy');
                setShowSettingsModal(true);
              }}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Settings & Privacy</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSettingsModalType('help');
                setShowSettingsModal(true);
              }}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSettingsModalType('display');
                setShowSettingsModal(true);
              }}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>Display & Accessibility</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Modals */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        type={settingsModalType}
      />
    </nav>
    </>
  );
}
