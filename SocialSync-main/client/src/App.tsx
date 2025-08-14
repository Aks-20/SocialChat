import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth.tsx";
import { useAuth } from "./hooks/use-auth";
import { useAuthContext } from "./lib/auth";
import { NotificationProvider } from "./contexts/notification-context";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import FeedPage from "@/pages/feed";
import ProfilePage from "@/pages/profile";
import ExplorePage from "@/pages/explore";
import MessagesPage from "@/pages/messages";
import NotificationsPage from "@/pages/notifications";
import FriendsPage from "@/pages/friends";
import WellnessPage from "@/pages/wellness";
import CommunitiesPage from "@/pages/communities";
import EventsPage from "@/pages/events";
import SavedPage from "@/pages/saved";
import SettingsPage from "@/pages/settings";
import AdminDashboard from "@/pages/admin";
import ReelsPage from "@/pages/reels";
import StatusPage from "@/pages/status";
import GroupsPage from "@/pages/groups";
import VirtualRoomsPage from "@/pages/virtual-rooms";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import NotFound from "@/pages/not-found";
import PublicPostPage from "@/pages/public-post";
import CommunityGuidelinesPage from "@/pages/community-guidelines";
import TermsOfServicePage from "@/pages/terms-of-service";
import PrivacyPolicyPage from "@/pages/privacy-policy";

function AppContent() {
  const { user, isLoading } = useAuth();
  const { impersonation } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow public post viewing without authentication
  if (!user && window.location.pathname.startsWith("/posts/")) {
    return <PublicPostPage />;
  }

  // Handle unauthenticated users
  if (!user) {
    // Show landing page for home route
    if (window.location.pathname === "/") {
      return <LandingPage />;
    }
    // Show auth page for auth route and all other protected routes
    if (
      window.location.pathname === "/auth" ||
      window.location.pathname.startsWith("/")
    ) {
      return <AuthPage />;
    }
  }

  // If user is authenticated and on auth page, redirect to home
  if (user && window.location.pathname === "/auth") {
    window.location.href = "/";
    return null;
  }

  // If impersonating, always show the regular user interface regardless of URL
  if (impersonation?.isImpersonating) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="flex pt-14">
          <Sidebar />
          <main className="flex-1 ml-64 min-h-screen">
            <Switch>
              <Route path="/" component={FeedPage} />
              <Route path="/profile/:id?" component={ProfilePage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/explore" component={ExplorePage} />
              <Route path="/messages" component={MessagesPage} />
              <Route path="/notifications" component={NotificationsPage} />
              <Route path="/friends" component={FriendsPage} />
              <Route path="/wellness" component={WellnessPage} />
              <Route path="/communities" component={CommunitiesPage} />
              <Route path="/saved" component={SavedPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route
                path="/community-guidelines"
                component={CommunityGuidelinesPage}
              />
              <Route path="/terms" component={TermsOfServicePage} />
              <Route path="/privacy" component={PrivacyPolicyPage} />
              {/* During impersonation, redirect any admin routes to feed */}
              <Route path="/admin" component={FeedPage} />
              <Route component={FeedPage} />
            </Switch>
          </main>
        </div>
      </div>
    );
  }

  // Check if user is admin and automatically redirect or show admin interface
  const isAdminUser = user.role === "admin" || user.role === "super_admin";
  const isAdminRoute = window.location.pathname.startsWith("/admin");

  // Auto-redirect admin users to admin dashboard if they're on the main site
  if (isAdminUser && !isAdminRoute && window.location.pathname === "/") {
    window.location.href = "/admin";
    return null;
  }

  if (isAdminUser && isAdminRoute) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route component={NotFound} />
        </Switch>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="flex pt-14">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen">
          <Switch>
            <Route path="/" component={FeedPage} />
            <Route path="/reels" component={ReelsPage} />
            <Route path="/reels/:id" component={ReelsPage} />
            <Route path="/status" component={StatusPage} />
            <Route path="/groups/:id" component={GroupsPage} />
            <Route path="/groups" component={GroupsPage} />
            <Route path="/virtual-rooms" component={VirtualRoomsPage} />
            <Route path="/posts/:id" component={PublicPostPage} />
            <Route path="/profile/:id?" component={ProfilePage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/explore" component={ExplorePage} />
            <Route path="/messages/:userId?" component={MessagesPage} />
            <Route path="/messages" component={MessagesPage} />
            <Route path="/notifications" component={NotificationsPage} />
            <Route path="/friends" component={FriendsPage} />
            <Route path="/wellness" component={WellnessPage} />
            <Route path="/communities" component={CommunitiesPage} />
            <Route path="/events" component={EventsPage} />
            <Route path="/saved" component={SavedPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route
              path="/community-guidelines"
              component={CommunityGuidelinesPage}
            />
            <Route path="/terms" component={TermsOfServicePage} />
            <Route path="/privacy" component={PrivacyPolicyPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NotificationProvider>
            <Toaster />
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
