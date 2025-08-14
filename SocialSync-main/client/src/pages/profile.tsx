import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { User, PostWithUser } from '@shared/schema';
import EnhancedPostCard from '@/components/enhanced-post-card';
import CreatePostModal from '@/components/create-post-modal';
import { 
  Camera, 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Briefcase, 
  GraduationCap,
  Heart,
  Users,
  Edit,
  Plus,
  Settings,
  UserPlus,
  UserMinus,
  MessageCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useLocation } from 'wouter';

// Helper function to safely format dates
const safeFormatDate = (dateValue: any): string => {
  if (!dateValue) return 'recently';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'recently';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'recently';
  }
};

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
  });

  // Handle profile routing - if no ID provided, show current user's profile
  const profileUserId = id ? parseInt(id) : currentUser?.id;
  const isOwnProfile = !id || profileUserId === currentUser?.id;

  // Add loading state for current user
  if (!currentUser && !id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-48 bg-muted rounded-lg mb-4"></div>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-32 h-32 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: profileUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['/api/users', profileUserId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }
      return response.json() as Promise<User>;
    },
    enabled: !!profileUserId,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/posts', { userId: profileUserId }],
    queryFn: async () => {
      const response = await api.getPosts(profileUserId);
      return response.json() as Promise<PostWithUser[]>;
    },
    enabled: !!profileUserId,
  });

  const { data: followers } = useQuery({
    queryKey: ['/api/users', profileUserId, 'followers'],
    queryFn: async () => {
      if (!profileUserId) return [];
      const response = await api.getFollowers(profileUserId);
      return response.json() as Promise<User[]>;
    },
    enabled: !!profileUserId,
  });

  const { data: following } = useQuery({
    queryKey: ['/api/users', profileUserId, 'following'],
    queryFn: async () => {
      if (!profileUserId) return [];
      const response = await api.getFollowing(profileUserId);
      return response.json() as Promise<User[]>;
    },
    enabled: !!profileUserId,
  });

  const followMutation = useMutation({
    mutationFn: () => api.followUser(profileUserId!),
    onSuccess: async (response) => {
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/users', profileUserId, 'followers'] });
      toast({
        title: result.following ? "Following!" : "Unfollowed",
        description: result.following 
          ? `You are now following ${profileUser?.name}` 
          : `You unfollowed ${profileUser?.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<User>) => api.updateUser(currentUser!.id, data),
    onSuccess: async (response) => {
      const updatedUser = await response.json();
      queryClient.setQueryData(['/api/users', currentUser!.id], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setShowEditProfile(false);
      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleEditProfile = () => {
    if (profileUser) {
      setEditForm({
        name: profileUser.name || '',
        bio: profileUser.bio || '',
        location: profileUser.location || '',
        website: profileUser.website || '',
      });
      setShowEditProfile(true);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(editForm);
  };

  const handleFollow = () => {
    followMutation.mutate();
  };

  const handleMessage = async () => {
    if (!profileUser || !currentUser) return;
    
    try {
      // Create or get existing conversation
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: profileUser.id,
        }),
      });

      if (response.ok) {
        // Navigate to messages page with the user
        setLocation(`/messages/${profileUser.id}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to start conversation",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const isFollowing = followers?.some(follower => follower.id === currentUser?.id);

  if (userLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="overflow-hidden mb-6">
          <div className="h-64 bg-gradient-to-r from-blue-400 to-purple-500">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="relative px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-4 -mt-16">
              <Skeleton className="w-32 h-32 rounded-full mb-4 md:mb-0" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground">
            This user doesn't exist or has been removed.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Cover Photo and Profile Info */}
      <Card className="overflow-hidden mb-6">
        {/* Cover Photo */}
        <div 
          className="h-64 bg-gradient-to-r from-blue-400 to-purple-500 relative group cursor-pointer overflow-hidden"
          style={{
            backgroundImage: profileUser.coverPhoto 
              ? `url(${profileUser.coverPhoto})` 
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >

          
          {/* Static Edit button for better visibility */}
          {isOwnProfile && (
            <Button 
              variant="secondary" 
              size="sm"
              className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-gray-800 shadow-lg border-0 font-medium backdrop-blur-sm z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.style.display = 'none';
                
                input.onchange = async (event) => {
                  const target = event.target as HTMLInputElement;
                  const file = target.files?.[0];
                  if (file && profileUser) {
                    try {
                      const formData = new FormData();
                      formData.append('coverPhoto', file);
                      
                      const response = await fetch(`/api/users/${profileUser.id}/cover-photo`, {
                        method: 'POST',
                        body: formData,
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        toast({
                          title: "Success",
                          description: "Cover photo updated successfully",
                        });
                        // Refresh the profile data with multiple invalidations
                        await Promise.all([
                          queryClient.invalidateQueries({ queryKey: ['/api/users', profileUser.id.toString()] }),
                          queryClient.invalidateQueries({ queryKey: ['/api/users', profileUser.id] }),
                          queryClient.refetchQueries({ queryKey: ['/api/users', profileUser.id.toString()] }),
                        ]);
                        // Force a page refresh after a short delay to ensure data updates
                        setTimeout(() => {
                          window.location.reload();
                        }, 1000);
                      } else {
                        const error = await response.json();
                        toast({
                          title: "Error",
                          description: error.message || "Failed to update cover photo",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to upload cover photo",
                        variant: "destructive",
                      });
                    }
                  }
                };
                
                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
              }}
            >
              <Camera className="w-4 h-4 mr-2" />
              Edit Cover Photo
            </Button>
          )}
        </div>
        
        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-start md:space-x-6 -mt-16">
            {/* Profile Picture */}
            <div className="relative mb-4 md:mb-0 group">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg cursor-pointer transition-transform hover:scale-105">
                <AvatarImage src={profileUser.avatar || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {profileUser.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2 w-10 h-10 rounded-full p-0 bg-white shadow-lg hover:bg-gray-50 border-2 border-white opacity-90 hover:opacity-100 transition-all"
                  onClick={async () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.style.display = 'none';
                    
                    input.onchange = async (event) => {
                      const target = event.target as HTMLInputElement;
                      const file = target.files?.[0];
                      if (file && profileUser) {
                        try {
                          const formData = new FormData();
                          formData.append('profilePicture', file);
                          
                          const response = await fetch(`/api/users/${profileUser.id}/profile-picture`, {
                            method: 'POST',
                            body: formData,
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            toast({
                              title: "Success",
                              description: "Profile picture updated successfully",
                            });
                            // Refresh the profile data
                            queryClient.invalidateQueries({ queryKey: ['/api/users', profileUser.id.toString()] });
                          } else {
                            const error = await response.json();
                            toast({
                              title: "Error",
                              description: error.message || "Failed to update profile picture",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to upload profile picture",
                            variant: "destructive",
                          });
                        }
                      }
                    };
                    
                    document.body.appendChild(input);
                    input.click();
                    document.body.removeChild(input);
                  }}
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </Button>
              )}
            </div>
            
            {/* Profile Details */}
            <div className="flex-1 mt-4 md:mt-0">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{profileUser.name}</h1>
                {profileUser.isVerified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    ✓ Verified
                  </Badge>
                )}
              </div>
              
              {profileUser.bio && (
                <p className="text-muted-foreground mb-3">{profileUser.bio}</p>
              )}
              
              <div className="flex items-center flex-wrap gap-4 mb-4 mt-7">
                <div className="flex items-center space-x-1 text-sm hover:bg-gray-50 px-2 py-1 rounded-md cursor-pointer transition-colors">
                  <span className="font-bold text-base text-gray-900">{posts?.length || 0}</span>
                  <span className="text-gray-600">{posts?.length === 1 ? 'post' : 'posts'}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm hover:bg-gray-50 px-2 py-1 rounded-md cursor-pointer transition-colors">
                  <span className="font-bold text-base text-gray-900">{followers?.length || 0}</span>
                  <span className="text-gray-600">{followers?.length === 1 ? 'follower' : 'followers'}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm hover:bg-gray-50 px-2 py-1 rounded-md cursor-pointer transition-colors">
                  <span className="font-bold text-base text-gray-900">{following?.length || 0}</span>
                  <span className="text-gray-600">following</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 flex items-center mb-4">
                <Calendar className="w-4 h-4 mr-1" />
                Joined {safeFormatDate(profileUser.createdAt)}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {isOwnProfile ? (
                  <>
                    <Button
                      onClick={() => setShowCreatePost(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Post
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleEditProfile}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleFollow}
                      disabled={followMutation.isPending}
                      className={isFollowing ? "facebook-light" : "facebook-blue"}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={handleMessage}
                      className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - About & Photos */}
        <div className="space-y-6">
          {/* About Section */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">About</h3>
            <div className="space-y-3 text-sm">
              {profileUser.bio && (
                <div className="flex items-start space-x-3">
                  <Heart className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span>{profileUser.bio}</span>
                </div>
              )}
              
              {profileUser.location && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span>Lives in <strong>{profileUser.location}</strong></span>
                </div>
              )}
              
              {profileUser.website && (
                <div className="flex items-start space-x-3">
                  <LinkIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <a 
                    href={profileUser.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {profileUser.website}
                  </a>
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span>
                  Joined {safeFormatDate(profileUser.createdAt)}
                </span>
              </div>
            </div>
          </Card>
          
          {/* Photos Section */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Photos</h3>
              <Button variant="ghost" size="sm">
                See all photos
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {posts?.filter(post => post.imageUrl).slice(0, 9).map((post) => (
                <div key={post.id} className="aspect-square">
                  <img 
                    src={post.imageUrl!} 
                    alt="Photo" 
                    className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </div>
              ))}
              
              {(!posts || posts.filter(post => post.imageUrl).length === 0) && (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No photos yet</p>
                </div>
              )}
            </div>
          </Card>
          
          {/* Friends Section */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Friends</h3>
              <Button variant="ghost" size="sm">
                See all friends
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {followers?.length || 0} followers
            </p>
            <div className="grid grid-cols-3 gap-2">
              {followers?.slice(0, 9).map((follower) => (
                <div key={follower.id} className="text-center">
                  <Avatar className="w-full aspect-square mb-1">
                    <AvatarImage src={follower.avatar || undefined} />
                    <AvatarFallback>
                      {follower.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium truncate">{follower.name}</p>
                </div>
              ))}
              
              {(!followers || followers.length === 0) && (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No followers yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Right Column - Posts */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="space-y-6">
              {/* Create Post for Profile */}
              {isOwnProfile && (
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={currentUser?.avatar || undefined} />
                      <AvatarFallback>
                        {currentUser?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-muted-foreground"
                      onClick={() => setShowCreatePost(true)}
                    >
                      What's on your mind?
                    </Button>
                  </div>
                </Card>
              )}
              
              {/* Posts */}
              {postsLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-64 w-full" />
                    </Card>
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <EnhancedPostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <p className="text-lg mb-2">No posts yet</p>
                    <p>
                      {isOwnProfile 
                        ? "Share your first post with the community!" 
                        : `${profileUser.name} hasn't posted anything yet.`
                      }
                    </p>
                  </div>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="about">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">About {profileUser.name}</h3>
                <div className="space-y-4">
                  {profileUser.bio ? (
                    <div>
                      <h4 className="font-medium mb-1">Bio</h4>
                      <p className="text-muted-foreground">{profileUser.bio}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No bio added yet.</p>
                  )}
                  
                  {profileUser.location && (
                    <div>
                      <h4 className="font-medium mb-1">Location</h4>
                      <p className="text-muted-foreground">{profileUser.location}</p>
                    </div>
                  )}
                  
                  {profileUser.website && (
                    <div>
                      <h4 className="font-medium mb-1">Website</h4>
                      <a 
                        href={profileUser.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profileUser.website}
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="friends">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followers?.map((follower) => (
                  <Card key={follower.id} className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={follower.avatar || undefined} />
                        <AvatarFallback>
                          {follower.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{follower.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {follower.bio || 'No bio'}
                        </p>
                      </div>
                      <Link href={`/profile/${follower.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
                
                {(!followers || followers.length === 0) && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No followers yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="photos">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts?.filter(post => post.imageUrl).map((post) => (
                  <div key={post.id} className="aspect-square">
                    <img 
                      src={post.imageUrl!} 
                      alt="Photo" 
                      className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
                
                {(!posts || posts.filter(post => post.imageUrl).length === 0) && (
                  <div className="col-span-3 text-center py-12 text-muted-foreground">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No photos yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <CreatePostModal 
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
      />
      
      {/* Edit Profile Modal */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Where do you live?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={editForm.website}
                onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://your-website.com"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                className="flex-1 facebook-blue"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditProfile(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
