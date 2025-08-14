import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { getUserInitials } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import EnhancedPostCard from "@/components/enhanced-post-card";
import StoryViewer from "@/components/story-viewer";
import CreatePostModal from "@/components/create-post-modal";
import LiveVideoModal from "@/components/live-video-modal";
import PhotoVideoModal from "@/components/photo-video-modal";
import FeelingActivityModal from "@/components/feeling-activity-modal";
import CreateEventModal from "@/components/create-event-modal";
import CreateRoomModal from "@/components/create-room-modal";
import { 
  Plus, 
  ImageIcon, 
  Video, 
  Smile,
  Users,
  UserPlus
} from "lucide-react";
import { Link } from "wouter";
import type { PostWithUser, Story, User } from "@shared/schema";

export default function FeedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isLiveVideoModalOpen, setIsLiveVideoModalOpen] = useState(false);
  const [isPhotoVideoModalOpen, setIsPhotoVideoModalOpen] = useState(false);
  const [isFeelingActivityModalOpen, setIsFeelingActivityModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<(Story & { user: User }) | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // Listen for navigation events
  useEffect(() => {
    const handleOpenCreatePost = () => setIsCreatePostModalOpen(true);
    const handleOpenCreateStory = () => {
      // For now, just open the post modal - can be extended for story creation
      setIsCreatePostModalOpen(true);
    };
    const handleOpenCreateEvent = () => setIsCreateEventModalOpen(true);
    const handleOpenCreateRoom = () => setIsCreateRoomModalOpen(true);

    window.addEventListener('openCreatePost', handleOpenCreatePost);
    window.addEventListener('openCreateStory', handleOpenCreateStory);
    window.addEventListener('openCreateEvent', handleOpenCreateEvent);
    window.addEventListener('openCreateRoom', handleOpenCreateRoom);

    return () => {
      window.removeEventListener('openCreatePost', handleOpenCreatePost);
      window.removeEventListener('openCreateStory', handleOpenCreateStory);
      window.removeEventListener('openCreateEvent', handleOpenCreateEvent);
      window.removeEventListener('openCreateRoom', handleOpenCreateRoom);
    };
  }, []);

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['/api/posts'],
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['/api/stories'],
  });

  const { data: friendSuggestions = [] } = useQuery({
    queryKey: ['/api/friend-suggestions'],
    enabled: !!user,
  });



  const sendRequestMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      return apiRequest("POST", "/api/friend-requests", { receiverId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-suggestions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  const handleStoryClick = (story: Story & { user: User }, index: number) => {
    setSelectedStory(story);
    setSelectedStoryIndex(index);
  };

  const closeStoryViewer = () => {
    setSelectedStory(null);
  };

  if (postsLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="space-y-1">
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-200 rounded"></div>
                  <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Stories Section */}
        {stories.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {/* Add Story Button */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground font-medium">Create Story</p>
                </div>

                {/* Stories */}
                {stories.map((story: any, index: number) => (
                  <div 
                    key={story.id} 
                    className="flex-shrink-0 text-center cursor-pointer"
                    onClick={() => handleStoryClick(story, index)}
                  >
                    <div className="w-20 h-20 rounded-2xl p-1 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
                      <div className="w-full h-full rounded-xl bg-white p-1">
                        <Avatar className="w-full h-full">
                          <AvatarImage src={story.user?.avatar || ""} className="rounded-xl" />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm rounded-xl">
                            {getUserInitials(story.user)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <p className="text-xs mt-2 text-muted-foreground font-medium truncate max-w-[80px]">
                      {story.user?.name || story.user?.username}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Create Post */}
        <div>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar || ""} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="flex-1 bg-gray-100 rounded-full px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => setIsCreatePostModalOpen(true)}
                >
                  <span className="text-gray-500">What's on your mind, {user?.name || user?.username}?</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  className="flex-1 text-gray-600 hover:bg-gray-100 py-3"
                  onClick={() => setIsLiveVideoModalOpen(true)}
                >
                  <Video className="h-5 w-5 mr-2 text-red-500" />
                  Live Video
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1 text-gray-600 hover:bg-gray-100 py-3"
                  onClick={() => setIsPhotoVideoModalOpen(true)}
                >
                  <ImageIcon className="h-5 w-5 mr-2 text-green-500" />
                  Photo/Video
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1 text-gray-600 hover:bg-gray-100 py-3"
                  onClick={() => setIsFeelingActivityModalOpen(true)}
                >
                  <Smile className="h-5 w-5 mr-2 text-yellow-500" />
                  Feeling/Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900">Welcome to your feed!</h3>
                  <p className="text-sm text-gray-500 mb-6">Start following people and sharing posts to see content here.</p>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700" 
                    onClick={() => setIsCreatePostModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            posts.map((post: PostWithUser) => (
              <EnhancedPostCard key={post.id} post={post} />
            ))
          )}
        </div>

        {/* People You May Know Section */}
        {friendSuggestions.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">People You May Know</h4>
                <Link href="/friends">
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    See All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-4">
                {friendSuggestions.slice(0, 2).map((suggestion: User) => (
                  <div key={suggestion.id} className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <Link href={`/profile/${suggestion.id}`}>
                      <Avatar className="h-16 w-16 mx-auto mb-3 cursor-pointer hover:opacity-80">
                        <AvatarImage src={suggestion.avatar || undefined} />
                        <AvatarFallback className="bg-gray-200 text-gray-600">
                          {suggestion.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link href={`/profile/${suggestion.id}`}>
                      <h5 className="font-medium text-sm mb-1 cursor-pointer hover:text-blue-600">
                        {suggestion.name}
                      </h5>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-3">@{suggestion.username}</p>
                    <Button 
                      size="sm" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => sendRequestMutation.mutate(suggestion.id)}
                      disabled={sendRequestMutation.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <CreatePostModal 
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
      />
      
      <LiveVideoModal 
        isOpen={isLiveVideoModalOpen}
        onClose={() => setIsLiveVideoModalOpen(false)}
      />
      
      <PhotoVideoModal 
        isOpen={isPhotoVideoModalOpen}
        onClose={() => setIsPhotoVideoModalOpen(false)}
      />
      
      <FeelingActivityModal 
        isOpen={isFeelingActivityModalOpen}
        onClose={() => setIsFeelingActivityModalOpen(false)}
      />
      
      <CreateEventModal 
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
      />
      
      <CreateRoomModal 
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
      />
      
      {selectedStory && (
        <StoryViewer 
          story={selectedStory}
          isOpen={!!selectedStory}
          onClose={closeStoryViewer}
          stories={stories}
          currentIndex={selectedStoryIndex}
        />
      )}
    </div>
  );
}