import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  FileText,
  Settings,
  Crown,
  Shield,
  UserPlus,
  MessageSquare,
  Pin,
  Upload,
  Image as ImageIcon,
  Video,
  Download,
  ExternalLink,
  MapPin,
  Clock,
  Volume2
} from 'lucide-react';

interface Group {
  id: number;
  name: string;
  description: string;
  category: string;
  privacy: 'public' | 'private' | 'request_to_join';
  coverImage?: string;
  memberCount: number;
  isVerified: boolean;
  tags: string[];
  createdAt: string;
  creator: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  membershipStatus?: 'member' | 'admin' | 'pending' | null;
  isJoined?: boolean;
}

const groupCategories = [
  { id: 'beauty', name: 'Beauty & Skincare', icon: '💄', color: 'pink' },
  { id: 'wellness', name: 'Health & Wellness', icon: '🧘', color: 'green' },
  { id: 'career', name: 'Career & Business', icon: '💼', color: 'blue' },
  { id: 'motherhood', name: 'Motherhood', icon: '👶', color: 'yellow' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '✨', color: 'purple' },
  { id: 'fitness', name: 'Fitness', icon: '💪', color: 'orange' },
  { id: 'food', name: 'Food & Cooking', icon: '🍳', color: 'red' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: 'cyan' },
];

export default function GroupsPage() {
  const params = useParams();
  const groupId = params.id;
  
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public' as 'public' | 'private' | 'request_to_join',
    tags: [] as string[],
    coverImage: null as File | null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch specific group if ID is provided
  const { data: currentGroup, isLoading: groupLoading } = useQuery({
    queryKey: ['/api/groups', groupId],
    queryFn: () => fetch(`/api/groups/${groupId}`).then(res => res.json()),
    enabled: !!groupId,
  });

  // Fetch groups list when not viewing specific group
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['/api/community-groups', activeTab, selectedCategory, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeTab === 'my-groups') params.append('my', 'true');
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      return fetch(`/api/community-groups?${params}`).then(res => res.json());
    },
    enabled: !groupId,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: FormData) => {
      return fetch('/api/community-groups', {
        method: 'POST',
        body: groupData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community-groups'] });
      setShowCreateModal(false);
      resetNewGroup();
      toast({ title: "Group created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create group", variant: "destructive" });
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return fetch(`/api/community-groups/${groupId}/join`, {
        method: 'POST',
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community-groups'] });
      toast({ title: "Joined group successfully!" });
    },
  });

  const resetNewGroup = () => {
    setNewGroup({
      name: '',
      description: '',
      category: '',
      privacy: 'public',
      tags: [],
      coverImage: null,
    });
  };

  const handleSubmitGroup = () => {
    if (!newGroup.name || !newGroup.description || !newGroup.category) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('name', newGroup.name);
    formData.append('description', newGroup.description);
    formData.append('category', newGroup.category);
    formData.append('privacy', newGroup.privacy);
    formData.append('tags', JSON.stringify(newGroup.tags));
    if (newGroup.coverImage) {
      formData.append('coverImage', newGroup.coverImage);
    }

    createGroupMutation.mutate(formData);
  };

  // If viewing a specific group, render group detail view
  if (groupId) {
    if (groupLoading) {
      return (
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading group...</p>
          </div>
        </div>
      );
    }

    if (!currentGroup) {
      return (
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Group not found</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        {/* Group Header */}
        <div className="relative">
          {currentGroup.coverImage && (
            <img 
              src={currentGroup.coverImage} 
              alt={currentGroup.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{currentGroup.name}</h1>
                  {currentGroup.isVerified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="outline">{currentGroup.privacy}</Badge>
                </div>
                <p className="text-gray-600 mb-4">{currentGroup.description}</p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {currentGroup.memberCount} members
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Created {new Date(currentGroup.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => joinGroupMutation.mutate(currentGroup.id)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Group
                </Button>
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Group Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-center text-gray-500">Group posts will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-center text-gray-500">Group events will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-center text-gray-500">Shared files will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-center text-gray-500">Group members will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Main groups list view
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Group name"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              />
              <Textarea
                placeholder="Group description"
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              />
              <Select value={newGroup.category} onValueChange={(value) => setNewGroup({ ...newGroup, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {groupCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newGroup.privacy} onValueChange={(value: any) => setNewGroup({ ...newGroup, privacy: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="request_to_join">Request to Join</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSubmitGroup} disabled={createGroupMutation.isPending}>
                {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {groupCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.icon} {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Groups Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-300 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group: Group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  {group.coverImage && (
                    <img src={group.coverImage} alt={group.name} className="w-full h-32 object-cover rounded-t-lg" />
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg truncate">{group.name}</h3>
                      {group.isVerified && <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{group.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        {group.memberCount} members
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = `/groups/${group.id}`}
                        >
                          View Group
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => joinGroupMutation.mutate(group.id)}
                          disabled={group.isJoined || joinGroupMutation.isPending}
                        >
                          {group.isJoined ? 'Joined' : 'Join'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-groups" className="space-y-4">
          {groups.filter((group: Group) => group.isJoined || group.membershipStatus).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Groups Yet</h3>
                <p className="text-gray-500 mb-4">You haven't joined any groups yet. Discover and join groups that interest you!</p>
                <Button onClick={() => setActiveTab('discover')}>
                  Discover Groups
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.filter((group: Group) => group.isJoined || group.membershipStatus).map((group: Group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  {group.coverImage && (
                    <img src={group.coverImage} alt={group.name} className="w-full h-32 object-cover rounded-t-lg" />
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg truncate">{group.name}</h3>
                      <div className="flex items-center space-x-1">
                        {group.membershipStatus === 'admin' && <Crown className="w-4 h-4 text-yellow-600" />}
                        {group.isVerified && <Shield className="w-4 h-4 text-blue-600" />}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{group.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        {group.memberCount} members
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = `/groups/${group.id}`}
                        >
                          View Group
                        </Button>
                        {group.membershipStatus === 'admin' && (
                          <Button size="sm" variant="secondary">
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}