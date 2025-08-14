import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Bookmark, Search, Grid, List, Heart, MessageCircle, Share, MoreHorizontal, Filter, Plus, Trash2, Edit } from 'lucide-react';
import PostCard from '@/components/post-card';
import type { PostWithUser } from '@shared/schema';

export default function SavedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('posts');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<{id: number, name: string} | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editCollectionName, setEditCollectionName] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    dateRange: 'all', // all, week, month, year
    postType: 'all', // all, text, image, video
    sortBy: 'newest' // newest, oldest, most-liked
  });
  const [collections, setCollections] = useState([
    { id: 1, name: "All Saved", count: 0, color: "bg-blue-500" },
    { id: 2, name: "Travel", count: 0, color: "bg-green-500" },
    { id: 3, name: "Food", count: 0, color: "bg-orange-500" },
    { id: 4, name: "Tech", count: 0, color: "bg-purple-500" },
    { id: 5, name: "Inspiration", count: 0, color: "bg-pink-500" },
  ]);

  // Fetch user's saved posts
  const { data: savedPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['/api/saved-posts'],
    enabled: !!user,
  });

  const filteredSavedPosts = (savedPosts as PostWithUser[])?.filter((post: PostWithUser) => {
    // Search filter
    const matchesSearch = post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (searchQuery && !matchesSearch) return false;
    
    // Date range filter
    if (filterOptions.dateRange !== 'all') {
      const postDate = new Date(post.createdAt || new Date());
      const now = new Date();
      const timeDiff = now.getTime() - postDate.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      
      switch (filterOptions.dateRange) {
        case 'week':
          if (daysDiff > 7) return false;
          break;
        case 'month':
          if (daysDiff > 30) return false;
          break;
        case 'year':
          if (daysDiff > 365) return false;
          break;
      }
    }
    
    // Post type filter
    if (filterOptions.postType !== 'all') {
      switch (filterOptions.postType) {
        case 'text':
          if (post.imageUrl || post.videoUrl) return false;
          break;
        case 'image':
          if (!post.imageUrl) return false;
          break;
        case 'video':
          if (!post.videoUrl) return false;
          break;
      }
    }
    
    return true;
  });

  const sortedFilteredPosts = filteredSavedPosts.sort((a: PostWithUser, b: PostWithUser) => {
    switch (filterOptions.sortBy) {
      case 'oldest':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      case 'most-liked':
        return (b.likesCount || 0) - (a.likesCount || 0);
      case 'newest':
      default:
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  const handleUnsavePost = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Post removed from saved items",
        });
        // Refresh the saved posts data
        window.location.reload();
      } else {
        throw new Error('Failed to unsave post');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from saved items",
        variant: "destructive",
      });
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a collection name",
        variant: "destructive",
      });
      return;
    }

    try {
      const colors = ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-red-500"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newCollection = {
        id: collections.length + 1,
        name: newCollectionName.trim(),
        count: 0,
        color: randomColor
      };

      setCollections([...collections, newCollection]);
      setNewCollectionName('');
      setShowCreateDialog(false);

      toast({
        title: "Success",
        description: `Collection "${newCollectionName}" created successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive",
      });
    }
  };

  const handleEditCollection = (collection: {id: number, name: string}) => {
    setEditingCollection(collection);
    setEditCollectionName(collection.name);
    setShowEditDialog(true);
  };

  const handleSaveEditCollection = () => {
    if (!editingCollection || !editCollectionName.trim()) {
      toast({
        title: "Error",
        description: "Collection name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setCollections(collections.map(collection => 
      collection.id === editingCollection.id 
        ? { ...collection, name: editCollectionName.trim() }
        : collection
    ));

    toast({
      title: "Success",
      description: `Collection renamed to "${editCollectionName.trim()}"`,
    });

    setShowEditDialog(false);
    setEditingCollection(null);
    setEditCollectionName('');
  };

  const handleDeleteCollection = async (collectionId: number, collectionName: string) => {
    try {
      // Prevent deletion of "All Saved" collection
      if (collectionName === "All Saved") {
        toast({
          title: "Error",
          description: "Cannot delete the default 'All Saved' collection",
          variant: "destructive",
        });
        return;
      }

      setCollections(collections.filter(collection => collection.id !== collectionId));
      
      toast({
        title: "Success",
        description: `Collection "${collectionName}" deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive",
      });
    }
  };

  // Update collection counts based on saved posts
  const savedCollections = collections.map(collection => ({
    ...collection,
    count: collection.name === "All Saved" ? ((savedPosts as PostWithUser[])?.length || 0) : Math.floor(((savedPosts as PostWithUser[])?.length || 0) * 0.2)
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Bookmark className="w-8 h-8 mr-3" />
          Saved
        </h1>
        <p className="text-gray-600">Keep track of posts you want to see again</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">
            Saved Posts ({(savedPosts as PostWithUser[])?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="search">Search Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilterDialog(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {postsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-20 bg-gray-200 rounded mb-4"></div>
                    <div className="flex space-x-4">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (savedPosts as PostWithUser[])?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved posts yet</h3>
                <p className="text-gray-500 mb-4">
                  When you save posts, they'll appear here so you can easily find them later
                </p>
                <Button onClick={() => window.location.href = '/'}>Explore Posts</Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
              {sortedFilteredPosts.map((post: PostWithUser) => (
                <div key={post.id} className="relative group">
                  {viewMode === 'grid' ? (
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {post.user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{post.user.name}</p>
                              <p className="text-xs text-gray-500">@{post.user.username}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnsavePost(post.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Bookmark className="w-4 h-4 fill-current" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-3">{post.content}</p>
                        
                        {/* Display image if exists */}
                        {post.imageUrl && (
                          <div className="mb-3">
                            <img 
                              src={post.imageUrl} 
                              alt="Post image" 
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                console.error('Image failed to load:', post.imageUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Display video if exists */}
                        {post.videoUrl && (
                          <div className="mb-3">
                            <video 
                              src={post.videoUrl} 
                              controls 
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                console.error('Video failed to load:', post.videoUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              Like
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              Comment
                            </span>
                            <span className="flex items-center">
                              <Share className="w-3 h-3 mr-1" />
                              Share
                            </span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <PostCard post={post} />
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedCollections.map((collection) => (
                  <Card 
                    key={collection.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => {
                      if (collection.name === "All Saved") {
                        setActiveTab("posts");
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${collection.color} rounded-lg flex items-center justify-center`}>
                            <Bookmark className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{collection.name}</h3>
                            <p className="text-sm text-gray-500">{collection.count} saved</p>
                          </div>
                        </div>
                        
                        {/* Collection Actions */}
                        {collection.name !== "All Saved" && (
                          <div className="flex items-center space-x-1">
                            {/* Edit Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                              title="Edit Collection"
                              onClick={() => handleEditCollection({id: collection.id, name: collection.name})}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            
                            {/* Delete Button with Confirmation */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                                  title="Delete Collection"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{collection.name}"? This action cannot be undone.
                                    All posts in this collection will be moved to "All Saved".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCollection(collection.id, collection.name)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="aspect-square bg-gray-100 rounded"></div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
                        <div className="w-10 h-10 border-2 border-gray-300 rounded-lg flex items-center justify-center mb-2">
                          <Plus className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Create Collection</p>
                        <p className="text-xs text-gray-500">Organize your saved posts</p>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Collection</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="collection-name">Collection Name</Label>
                        <Input
                          id="collection-name"
                          placeholder="Enter collection name..."
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateCollection();
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCollection}>
                          Create Collection
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Search Your Saved Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search saved posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchQuery && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {filteredSavedPosts.length} results for "{searchQuery}"
                    </p>
                    <Badge variant="secondary">{filteredSavedPosts.length}</Badge>
                  </div>
                  
                  {filteredSavedPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No saved posts match your search</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredSavedPosts.map((post: PostWithUser) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Collection Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCollectionName">Collection Name</Label>
              <Input
                id="editCollectionName"
                placeholder="Enter collection name"
                value={editCollectionName}
                onChange={(e) => setEditCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEditCollection();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setEditingCollection(null);
                setEditCollectionName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEditCollection}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Saved Posts</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Date Range</Label>
              <Select 
                value={filterOptions.dateRange} 
                onValueChange={(value) => setFilterOptions(prev => ({ ...prev, dateRange: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Post Type</Label>
              <Select 
                value={filterOptions.postType} 
                onValueChange={(value) => setFilterOptions(prev => ({ ...prev, postType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="text">Text Only</SelectItem>
                  <SelectItem value="image">With Images</SelectItem>
                  <SelectItem value="video">With Videos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sort By</Label>
              <Select 
                value={filterOptions.sortBy} 
                onValueChange={(value) => setFilterOptions(prev => ({ ...prev, sortBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most-liked">Most Liked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button 
              variant="outline"
              onClick={() => {
                setFilterOptions({
                  dateRange: 'all',
                  postType: 'all',
                  sortBy: 'newest'
                });
                toast({
                  title: "Filters cleared",
                  description: "All filters have been reset to default",
                });
              }}
            >
              Clear Filters
            </Button>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowFilterDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowFilterDialog(false);
                  toast({
                    title: "Filters applied",
                    description: "Your saved posts have been filtered",
                  });
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}