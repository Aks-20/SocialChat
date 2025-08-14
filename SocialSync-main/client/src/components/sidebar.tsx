import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/auth";
import { 
  Home, 
  Search, 
  MessageCircle, 
  Heart, 
  User, 
  Users, 
  Bookmark,
  Settings,
  LogOut,
  Sparkles,
  Activity,
  Calendar,
  Play,
  Camera,
  UserSquare2,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const menuItems = [
    { icon: Home, label: "Home", path: "/", active: location === "/" },
    { icon: Play, label: "Reels", path: "/reels", active: location === "/reels" },
    { icon: Camera, label: "Status", path: "/status", active: location === "/status" },
    { icon: Search, label: "Explore", path: "/explore", active: location === "/explore" },
    { icon: MessageCircle, label: "Messages", path: "/messages", active: location === "/messages" },
    { icon: Heart, label: "Notifications", path: "/notifications", active: location === "/notifications" },
    { icon: User, label: "Profile", path: "/profile", active: location === "/profile" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-gray-200 shadow-sm z-30 flex flex-col">
      {/* User Profile Section - Fixed */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || ""} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name || user?.username}
            </p>
            <p className="text-xs text-gray-500 truncate">
              @{user?.username}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-2 space-y-1">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <button
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    item.active
                      ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${item.active ? "text-blue-600" : "text-gray-400"}`} />
                  {item.label}
                </button>
              </Link>
            ))}
          </div>

          {/* Additional Options */}
          <div className="px-2 mt-8 space-y-1">
            <Link href="/friends">
              <button 
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location === "/friends"
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Users className={`mr-3 h-5 w-5 ${location === "/friends" ? "text-blue-600" : "text-gray-400"}`} />
                Friends
              </button>
            </Link>

            <Link href="/virtual-rooms">
              <button 
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location === "/virtual-rooms"
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Video className={`mr-3 h-5 w-5 ${location === "/virtual-rooms" ? "text-blue-600" : "text-gray-400"}`} />
                Virtual Rooms
              </button>
            </Link>
            <Link href="/wellness">
              <button 
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location === "/wellness"
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Activity className={`mr-3 h-5 w-5 ${location === "/wellness" ? "text-blue-600" : "text-gray-400"}`} />
                Wellness
              </button>
            </Link>
            <Link href="/groups">
              <button 
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location === "/groups"
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Users className={`mr-3 h-5 w-5 ${location === "/groups" ? "text-blue-600" : "text-gray-400"}`} />
                Groups
              </button>
            </Link>
            <Link href="/communities">
              <button 
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location === "/communities"
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Sparkles className={`mr-3 h-5 w-5 ${location === "/communities" ? "text-blue-600" : "text-gray-400"}`} />
                Communities
              </button>
            </Link>
            <Link href="/events">
              <button 
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location === "/events"
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Calendar className={`mr-3 h-5 w-5 ${location === "/events" ? "text-blue-600" : "text-gray-400"}`} />
                Events
              </button>
            </Link>
            <Link href="/saved">
              <button 
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location === "/saved"
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Bookmark className={`mr-3 h-5 w-5 ${location === "/saved" ? "text-blue-600" : "text-gray-400"}`} />
                Saved
              </button>
            </Link>
            <Link href="/settings">
              <button 
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location === "/settings"
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Settings className={`mr-3 h-5 w-5 ${location === "/settings" ? "text-blue-600" : "text-gray-400"}`} />
                Settings
              </button>
            </Link>
          </div>
      </nav>

      {/* Logout Button - Fixed at bottom */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}