import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  Heart, 
  Sparkles, 
  Briefcase, 
  Baby, 
  BookOpen,
  Dumbbell,
  Brain,
  Coffee,
  Search,
  Crown,
  UserCheck,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommunityGroup {
  id: number;
  name: string;
  description: string | null;
  category: string;
  privacy: string;
  coverImage: string | null;
  creatorId: number;
  memberCount: number;
  isVerified: boolean;
  tags: string[] | null;
  createdAt: string;
  creator: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  };
  membershipStatus?: string;
  isJoined?: boolean;
}

export function CommunityGroups() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    category: "beauty",
    privacy: "public",
    tags: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Categories with icons
  const categories = [
    { id: "all", label: "All Groups", icon: Users },
    { id: "beauty", label: "Beauty & Style", icon: Sparkles },
    { id: "wellness", label: "Wellness", icon: Heart },
    { id: "career", label: "Career", icon: Briefcase },
    { id: "motherhood", label: "Motherhood", icon: Baby },
    { id: "education", label: "Education", icon: BookOpen },
    { id: "fitness", label: "Fitness", icon: Dumbbell },
    { id: "mindfulness", label: "Mindfulness", icon: Brain },
    { id: "lifestyle", label: "Lifestyle", icon: Coffee },
  ];

  // Fetch community groups with proper category filtering
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["/api/community-groups", selectedCategory],
    queryFn: async () => {
      const categoryParam = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
      const response = await fetch(`/api/community-groups${categoryParam}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch community groups');
      }
      return response.json();
    },
  });

  // Filter groups by search term only (category filtering is handled server-side)
  const filteredGroups = groups.filter((group: CommunityGroup) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating community group:', data);
      const response = await fetch("/api/community-groups", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          category: data.category,
          privacy: data.privacy,
          tags: data.tags ? data.tags.split(",").map((tag: string) => tag.trim()) : [],
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Community creation failed:', errorText);
        throw new Error(errorText || 'Failed to create community group');
      }
      
      const result = await response.json();
      console.log('Community created successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Community created",
        description: `Your community "${data.name}" has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/community-groups"] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Community creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create community group",
        variant: "destructive",
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/community-groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to join community');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Joined community",
        description: "You've successfully joined the community!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/community-groups"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join community",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCreateForm({
      name: "",
      description: "",
      category: "beauty",
      privacy: "public",
      tags: "",
    });
  };

  const handleCreateGroup = () => {
    if (!createForm.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }
    console.log('Submitting community form:', createForm);
    createGroupMutation.mutate(createForm);
  };

  const handleJoinGroup = (groupId: number) => {
    joinGroupMutation.mutate(groupId);
  };

  const handleViewGroup = (groupId: number) => {
    setLocation(`/groups/${groupId}`);
  };

  const handleMessageMembers = (groupId: number) => {
    setLocation(`/messages?group=${groupId}`);
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.id === category);
    return categoryData?.icon || Users;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      beauty: "bg-pink-100 text-pink-800",
      wellness: "bg-green-100 text-green-800",
      career: "bg-blue-100 text-blue-800",
      motherhood: "bg-purple-100 text-purple-800",
      education: "bg-yellow-100 text-yellow-800",
      fitness: "bg-red-100 text-red-800",
      mindfulness: "bg-indigo-100 text-indigo-800",
      lifestyle: "bg-orange-100 text-orange-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-purple-500" />
          <h1 className="text-2xl font-bold">Community Groups</h1>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="w-full">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-1"
            >
              <IconComponent className="h-3 w-3" />
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* Featured Communities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Featured Communities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups
              .filter((group: CommunityGroup) => group.isVerified)
              .slice(0, 6)
              .map((group: CommunityGroup) => {
                const IconComponent = getCategoryIcon(group.category);
                return (
                  <Card key={group.id} className="p-4 border-2 border-yellow-200">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5 text-purple-500" />
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </div>
                        <Badge className={getCategoryColor(group.category)}>
                          {group.category}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {group.description || "No description available"}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={group.creator.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {group.creator.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-500">
                          by {group.creator.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          {group.memberCount} members
                        </div>
                        {group.isJoined ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewGroup(group.id)}
                              className="flex items-center gap-1"
                            >
                              <ArrowRight className="h-3 w-3" />
                              View Group
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleMessageMembers(group.id)}
                              className="flex items-center gap-1"
                            >
                              <MessageCircle className="h-3 w-3" />
                              Message
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleJoinGroup(group.id)}
                            disabled={joinGroupMutation.isPending}
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* All Communities */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedCategory === "all" ? "All Communities" : 
             categories.find(cat => cat.id === selectedCategory)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-48"></div>
                </div>
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm ? "No communities found matching your search" : "No communities in this category yet"}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create the First Community
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((group: CommunityGroup) => {
                const IconComponent = getCategoryIcon(group.category);
                return (
                  <Card key={group.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <IconComponent className="h-5 w-5 text-purple-500" />
                        <div className="flex items-center gap-2">
                          {group.isVerified && <Crown className="h-4 w-4 text-yellow-500" />}
                          <Badge className={getCategoryColor(group.category)}>
                            {group.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {group.description || "No description available"}
                        </p>
                      </div>

                      {group.tags && group.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {group.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={group.creator.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {group.creator.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-500">
                          by {group.creator.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          {group.memberCount} members
                        </div>
                        {group.isJoined ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewGroup(group.id)}
                              className="flex items-center gap-1"
                            >
                              <ArrowRight className="h-3 w-3" />
                              Enter Group
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleMessageMembers(group.id)}
                              className="flex items-center gap-1"
                            >
                              <MessageCircle className="h-3 w-3" />
                              Message Members
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleJoinGroup(group.id)}
                            disabled={joinGroupMutation.isPending}
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Community Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Community</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Community Name</Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Skincare Enthusiasts"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="groupDescription">Description</Label>
                <Textarea
                  id="groupDescription"
                  placeholder="What is your community about? What can members expect?"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full p-2 border rounded-md"
                    value={createForm.category}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="privacy">Privacy</Label>
                  <select
                    id="privacy"
                    className="w-full p-2 border rounded-md"
                    value={createForm.privacy}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, privacy: e.target.value }))}
                  >
                    <option value="public">Public - Anyone can join</option>
                    <option value="request_to_join">Request to Join - Approval required</option>
                    <option value="private">Private - Invite only</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., skincare, beauty, tips, routine"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, tags: e.target.value }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Add relevant tags to help people find your community
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateGroup} 
                disabled={createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? "Creating..." : "Create Community"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}