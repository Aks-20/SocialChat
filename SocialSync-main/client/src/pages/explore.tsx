import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { PostWithUser, User } from '@shared/schema';
import { 
  Search, 
  Heart, 
  MessageCircle, 
  TrendingUp,
  Users,
  Hash,
  Image as ImageIcon,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Share2,
  Bookmark
} from 'lucide-react';

export default function ExplorePage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedPost, setSelectedPost] = useState<PostWithUser | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/search', searchQuery, searchType],
    queryFn: async () => {
      if (!searchQuery.trim()) return { users: [], posts: [] };
      const response = await api.search(searchQuery, searchType);
      return response.json() as Promise<{ users: User[], posts: PostWithUser[] }>;
    },
    enabled: !!searchQuery.trim(),
  });

  const { data: trendingPosts, isLoading: trendingLoading } = useQuery({
    queryKey: ['/api/posts', 'trending'],
    queryFn: async () => {
      const response = await api.getPosts(undefined, 20, 0);
      return response.json() as Promise<PostWithUser[]>;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({
        title: "Search required",
        description: "Please enter something to search for",
        variant: "destructive",
      });
    }
  };

  const handlePostClick = (post: PostWithUser) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
    setIsVideoPlaying(false);
    setIsVideoMuted(true);
    setVideoRef(null); // Reset video ref
    setVideoRef(null); // Reset video ref
  };

  const handleVideoToggle = () => {
    if (videoRef) {
      if (isVideoPlaying) {
        videoRef.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.play();
        setIsVideoPlaying(true);
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef) {
      videoRef.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleShare = () => {
    if (navigator.share && selectedPost) {
      navigator.share({
        title: `Post by ${selectedPost.user.name}`,
        text: selectedPost.content || 'Check out this post!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Post link copied to clipboard",
      });
    }
  };

  const handleSavePost = () => {
    if (selectedPost) {
      fetch(`/api/posts/${selectedPost.id}/save`, {
        method: 'POST',
        credentials: 'include',
      }).then(response => {
        if (response.ok) {
          toast({
            title: "Success",
            description: "Post saved to your collection",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to save post",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleUserClick = (user: User) => {
    // In a real app, this would navigate to user profile
    toast({
      title: "Profile clicked",
      description: `Clicked on ${user.name}'s profile`,
    });
  };

  const filteredPosts = trendingPosts?.filter(post => post.imageUrl || post.videoUrl) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Explore</h2>
        
        {/* Search and Filters */}
        <Card className="p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search posts, people, hashtags..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="posts">Posts</SelectItem>
                  <SelectItem value="users">People</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </Card>

        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Search Results</h3>
            
            {searchLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="w-full h-64" />
                    <div className="p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : searchResults && (searchResults.users.length > 0 || searchResults.posts.length > 0) ? (
              <div className="space-y-6">
                {/* User Results */}
                {searchResults.users.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      People ({searchResults.users.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.users.map((user) => (
                        <Card 
                          key={user.id} 
                          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleUserClick(user)}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback>
                                {user.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1">
                                <h5 className="font-semibold truncate">{user.name}</h5>
                                {user.isVerified && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                    ✓
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                @{user.username}
                              </p>
                              {user.bio && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {user.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Results */}
                {searchResults.posts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center">
                      <Hash className="w-4 h-4 mr-2" />
                      Posts ({searchResults.posts.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.posts.map((post) => (
                        <Card 
                          key={post.id} 
                          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handlePostClick(post)}
                        >
                          <div className="relative">
                            {post.imageUrl ? (
                              <img 
                                src={post.imageUrl} 
                                alt="Post content" 
                                className="w-full h-64 object-cover"
                              />
                            ) : post.videoUrl ? (
                              <video 
                                src={post.videoUrl} 
                                className="w-full h-64 object-cover"
                                muted
                              />
                            ) : (
                              <div className="w-full h-64 bg-muted flex items-center justify-center">
                                <ImageIcon className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                              <div className="text-white opacity-0 hover:opacity-100 transition-opacity flex space-x-4">
                                <span className="flex items-center">
                                  <Heart className="w-4 h-4 mr-1" />
                                  {post.likesCount}
                                </span>
                                <span className="flex items-center">
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  {post.commentsCount}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={post.user.avatar || undefined} />
                                <AvatarFallback className="text-xs">
                                  {post.user.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{post.user.name}</span>
                            </div>
                            {post.content && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {post.content}
                              </p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No results found</p>
                <p className="text-muted-foreground">
                  Try searching for something else or check your spelling.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Trending Section */}
        {!searchQuery.trim() && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Trending Posts</h3>
            </div>
            
            {trendingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="w-full h-64" />
                    <div className="p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handlePostClick(post)}
                  >
                    <div className="relative">
                      {post.imageUrl ? (
                        <img 
                          src={post.imageUrl} 
                          alt="Post content" 
                          className="w-full h-64 object-cover"
                        />
                      ) : post.videoUrl ? (
                        <video 
                          src={post.videoUrl} 
                          className="w-full h-64 object-cover"
                          muted
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                        <div className="text-white opacity-0 hover:opacity-100 transition-opacity flex space-x-4">
                          <span className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {post.likesCount}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {post.commentsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={post.user.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {post.user.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{post.user.name}</span>
                      </div>
                      {post.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.content}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No posts to explore</p>
                <p className="text-muted-foreground">
                  Check back later for new content from the community.
                </p>
              </Card>
            )}

            {/* Load More Button */}
            {filteredPosts.length > 0 && (
              <div className="text-center mt-8">
                <Button className="facebook-blue">
                  Load More Posts
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="flex flex-col md:flex-row h-full">
            {/* Media Section */}
            <div className="flex-1 bg-black flex items-center justify-center relative">
              {selectedPost?.imageUrl ? (
                <img 
                  src={selectedPost.imageUrl} 
                  alt="Post content" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : selectedPost?.videoUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video 
                    ref={(el) => setVideoRef(el)}
                    src={selectedPost.videoUrl}
                    className="max-w-full max-h-full object-contain"
                    controls={false}
                    muted={isVideoMuted}
                    loop
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onLoadedData={() => {
                      // Reset video state when new video loads
                      setIsVideoPlaying(false);
                      setIsVideoMuted(true);
                    }}
                  />
                  {/* Video Controls Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-20">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoToggle();
                        }}
                        className="text-white hover:bg-white hover:bg-opacity-20 bg-black bg-opacity-50"
                      >
                        {isVideoPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMuteToggle();
                        }}
                        className="text-white hover:bg-white hover:bg-opacity-20 bg-black bg-opacity-50"
                      >
                        {isVideoMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 bg-muted flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPostModalOpen(false)}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Post Details Section */}
            <div className="w-full md:w-96 flex flex-col bg-white dark:bg-gray-900">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedPost?.user.avatar || undefined} />
                    <AvatarFallback>
                      {selectedPost?.user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{selectedPost?.user.name}</h3>
                      {selectedPost?.user.isVerified && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{selectedPost?.user.username}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-4">
                {selectedPost?.content && (
                  <p className="text-sm leading-relaxed mb-4">{selectedPost.content}</p>
                )}
                
                {/* Engagement Stats */}
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {selectedPost?.likesCount || 0} likes
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {selectedPost?.commentsCount || 0} comments
                  </span>
                </div>

                <Separator className="mb-4" />

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                      <Heart className="w-4 h-4 mr-1" />
                      Like
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Comment
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="text-gray-500 hover:text-green-500"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSavePost}
                      className="text-gray-500 hover:text-blue-500"
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
