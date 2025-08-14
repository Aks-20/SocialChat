import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Activity,
  Search,
  Trash2,
  Shield,
  ShieldCheck,
  Crown,
  Eye,
  Settings,
  LogOut,
  BarChart3,
  UserCheck,
  UserX,
  AlertTriangle,
  Home,
  CheckSquare,
  Square
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAuthContext } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  activeUsersToday: number;
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  username: string;
  role: string;
  isSuperAdmin: boolean;
  canDelete: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface AdminPost {
  id: number;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { impersonation, startImpersonation, stopImpersonation } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [userSearch, setUserSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/admin/users', currentPage, userSearch],
    queryFn: () => fetch(`/api/admin/users?page=${currentPage}&search=${userSearch}`).then(res => res.json()),
  });

  const { data: posts } = useQuery({
    queryKey: ['/api/admin/posts', currentPage],
    queryFn: () => fetch(`/api/admin/posts?page=${currentPage}`).then(res => res.json()),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User deleted",
        description: "User has been successfully removed from the platform",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      toast({
        title: "Post deleted",
        description: "Post has been removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, canDelete }: { userId: number; role: string; canDelete: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, canDelete }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkDeletePostsMutation = useMutation({
    mutationFn: async (postIds: number[]) => {
      const response = await fetch('/api/admin/posts/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      setSelectedPosts([]);
      toast({
        title: "Posts deleted",
        description: "Selected posts have been removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleDeletePost = (postId: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleUpdateUserRole = (userId: number, newRole: string, canDelete: boolean) => {
    updateRoleMutation.mutate({ userId, role: newRole, canDelete });
  };

  const handleBulkDeletePosts = () => {
    if (selectedPosts.length === 0) {
      toast({
        title: "No posts selected",
        description: "Please select posts to delete",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedPosts.length} posts? This action cannot be undone.`)) {
      bulkDeletePostsMutation.mutate(selectedPosts);
    }
  };

  const handleSelectPost = (postId: number) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSelectAllPosts = () => {
    if (!posts || !Array.isArray(posts)) return;
    
    const allPostIds = posts.map((post: AdminPost) => post.id);
    setSelectedPosts(prev => 
      prev.length === allPostIds.length ? [] : allPostIds
    );
  };

  const handleImpersonate = async (userId: number) => {
    try {
      await startImpersonation(userId);
      toast({
        title: "Impersonation started",
        description: "You are now viewing the platform as this user",
      });
      // Redirect to main site as the impersonated user
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Impersonation failed",
        description: error.message || "Failed to start impersonation",
        variant: "destructive",
      });
    }
  };

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonation();
      toast({
        title: "Impersonation stopped",
        description: "You have returned to your admin account",
      });
    } catch (error: any) {
      toast({
        title: "Failed to stop impersonation",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const goToMainSite = () => {
    window.location.href = '/';
  };

  const getRoleIcon = (role: string, isSuperAdmin: boolean) => {
    if (isSuperAdmin) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (role === 'admin') return <Shield className="h-4 w-4 text-blue-500" />;
    return <Users className="h-4 w-4 text-gray-500" />;
  };

  const getRoleBadge = (role: string, isSuperAdmin: boolean) => {
    if (isSuperAdmin) return <Badge variant="default" className="bg-yellow-500">Super Admin</Badge>;
    if (role === 'admin') return <Badge variant="default" className="bg-blue-500">Admin</Badge>;
    return <Badge variant="outline">User</Badge>;
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
            <p>You don't have permission to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Impersonation Banner */}
      {impersonation?.isImpersonating && (
        <div className="bg-orange-500 text-white px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span className="font-medium">
                Impersonating: {user?.name || user?.username}
              </span>
              <span className="text-orange-100">
                (Original Admin: {impersonation.originalAdmin.name || impersonation.originalAdmin.username})
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStopImpersonation}
              className="bg-white text-orange-600 hover:bg-orange-50"
            >
              Stop Impersonation
            </Button>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Panel
                </h1>
              </div>
              <Badge variant="default" className="bg-blue-600">
                {user.isSuperAdmin ? 'Super Admin' : 'Admin'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToMainSite}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Main Site</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm h-screen sticky top-0 border-r border-gray-200 dark:border-gray-700">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "overview" 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "users" 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">User Management</span>
            </button>
            
            <button
              onClick={() => setActiveTab("posts")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "posts" 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium">Content Moderation</span>
            </button>
            
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "settings" 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Admin Settings</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {activeTab === "overview" && "Platform Overview"}
              {activeTab === "users" && "User Management"}
              {activeTab === "posts" && "Content Moderation"}
              {activeTab === "settings" && "Admin Settings"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === "overview" && "Monitor platform statistics and activity"}
              {activeTab === "users" && "Manage user accounts and permissions"}
              {activeTab === "posts" && "Review and moderate user-generated content"}
              {activeTab === "settings" && "Configure administrative settings"}
            </p>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as AdminStats)?.totalUsers || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as AdminStats)?.totalPosts || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as AdminStats)?.totalComments || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as AdminStats)?.activeUsersToday || 0}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users && Array.isArray(users) && users.map((adminUser: AdminUser) => (
                      <div key={adminUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {adminUser.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{adminUser.name || adminUser.username}</h3>
                              {getRoleIcon(adminUser.role, adminUser.isSuperAdmin)}
                              {getRoleBadge(adminUser.role, adminUser.isSuperAdmin)}
                            </div>
                            <p className="text-sm text-gray-500">{adminUser.email}</p>
                            <p className="text-xs text-gray-400">
                              Joined {formatDistanceToNow(new Date(adminUser.createdAt))} ago
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Impersonation Button */}
                          {!adminUser.isSuperAdmin && adminUser.id !== user?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleImpersonate(adminUser.id)}
                              className="flex items-center space-x-1"
                            >
                              <UserCheck className="h-4 w-4" />
                              <span>Impersonate</span>
                            </Button>
                          )}
                          
                          {user?.role === 'super_admin' && !adminUser.isSuperAdmin && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateUserRole(
                                  adminUser.id, 
                                  adminUser.role === 'admin' ? 'user' : 'admin',
                                  adminUser.role !== 'admin'
                                )}
                              >
                                {adminUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                              </Button>
                            </div>
                          )}
                          {user?.canDelete && !adminUser.isSuperAdmin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(adminUser.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "posts" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Post Management</CardTitle>
                    <div className="flex items-center space-x-3">
                      {selectedPosts.length > 0 && (
                        <Badge variant="secondary" className="px-3 py-1">
                          {selectedPosts.length} selected
                        </Badge>
                      )}
                      {selectedPosts.length > 0 && user?.canDelete && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleBulkDeletePosts}
                          disabled={bulkDeletePostsMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected
                        </Button>
                      )}
                      {posts && Array.isArray(posts) && posts.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSelectAllPosts}
                        >
                          {selectedPosts.length === posts.length ? (
                            <>
                              <Square className="h-4 w-4 mr-2" />
                              Deselect All
                            </>
                          ) : (
                            <>
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Select All
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {posts && Array.isArray(posts) && posts.map((post: AdminPost) => (
                      <div key={post.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                        <div className="flex items-center pt-1">
                          <button
                            onClick={() => handleSelectPost(post.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {selectedPosts.includes(post.id) ? (
                              <CheckSquare className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {post.user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{post.user.username}</span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(post.createdAt))} ago
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {post.content?.substring(0, 200)}
                            {post.content && post.content.length > 200 && '...'}
                          </p>
                          {post.imageUrl && (
                            <div className="mt-2">
                              <img
                                src={post.imageUrl}
                                alt="Post content"
                                className="max-w-xs rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/post/${post.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user?.canDelete && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Super Admin Status</h3>
                        <p className="text-sm text-gray-500">
                          You have {user.isSuperAdmin ? 'full' : 'limited'} administrative privileges
                        </p>
                      </div>
                      <Badge variant={user.isSuperAdmin ? "default" : "outline"}>
                        {user.isSuperAdmin ? 'Super Admin' : 'Admin'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Delete Permissions</h3>
                        <p className="text-sm text-gray-500">
                          Ability to delete users and content
                        </p>
                      </div>
                      <Badge variant={user.canDelete ? "destructive" : "outline"}>
                        {user.canDelete ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Account Protection</h3>
                        <p className="text-sm text-gray-500">
                          Super admin accounts cannot be deleted
                        </p>
                      </div>
                      <Badge variant="outline">
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        Protected
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}