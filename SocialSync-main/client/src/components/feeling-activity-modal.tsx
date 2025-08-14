import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { 
  Smile, 
  Heart, 
  Angry, 
  Frown, 
  Meh, 
  Laugh,
  MapPin,
  Users,
  Music,
  Utensils,
  Plane,
  BookOpen,
  Gamepad2,
  Car,
  Home,
  Briefcase,
  GraduationCap,
  Coffee,
  Camera,
  Gift,
  PartyPopper,
  Sun,
  Moon,
  Search,
  X,
  Plus
} from 'lucide-react';

interface FeelingActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const feelings = [
  { id: 'happy', label: 'Happy', icon: Smile, color: 'text-yellow-500' },
  { id: 'excited', label: 'Excited', icon: PartyPopper, color: 'text-orange-500' },
  { id: 'grateful', label: 'Grateful', icon: Heart, color: 'text-red-500' },
  { id: 'blessed', label: 'Blessed', icon: Sun, color: 'text-yellow-600' },
  { id: 'loved', label: 'Loved', icon: Heart, color: 'text-pink-500' },
  { id: 'motivated', label: 'Motivated', icon: Briefcase, color: 'text-blue-500' },
  { id: 'relaxed', label: 'Relaxed', icon: Coffee, color: 'text-brown-500' },
  { id: 'proud', label: 'Proud', icon: GraduationCap, color: 'text-purple-500' },
  { id: 'thoughtful', label: 'Thoughtful', icon: BookOpen, color: 'text-gray-500' },
  { id: 'tired', label: 'Tired', icon: Moon, color: 'text-indigo-500' },
  { id: 'sad', label: 'Sad', icon: Frown, color: 'text-blue-400' },
  { id: 'angry', label: 'Angry', icon: Angry, color: 'text-red-600' },
];

const activities = [
  { id: 'eating', label: 'Eating', icon: Utensils, color: 'text-orange-500' },
  { id: 'traveling', label: 'Traveling', icon: Plane, color: 'text-blue-500' },
  { id: 'listening', label: 'Listening to music', icon: Music, color: 'text-purple-500' },
  { id: 'reading', label: 'Reading', icon: BookOpen, color: 'text-green-500' },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2, color: 'text-red-500' },
  { id: 'driving', label: 'Driving', icon: Car, color: 'text-gray-500' },
  { id: 'working', label: 'Working', icon: Briefcase, color: 'text-blue-600' },
  { id: 'studying', label: 'Studying', icon: GraduationCap, color: 'text-indigo-500' },
  { id: 'cooking', label: 'Cooking', icon: Utensils, color: 'text-yellow-500' },
  { id: 'celebrating', label: 'Celebrating', icon: PartyPopper, color: 'text-pink-500' },
  { id: 'shopping', label: 'Shopping', icon: Gift, color: 'text-purple-600' },
  { id: 'photography', label: 'Taking photos', icon: Camera, color: 'text-teal-500' },
];

export default function FeelingActivityModal({ isOpen, onClose }: FeelingActivityModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [withPeople, setWithPeople] = useState<Array<{id: number, name: string}>>([]);
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'feeling' | 'activity'>('feeling');

  // Search for users to tag
  const { data: searchResults } = useQuery({
    queryKey: ['/api/search', personSearchQuery],
    queryFn: async () => {
      if (!personSearchQuery.trim()) return { users: [], posts: [] };
      const response = await fetch(`/api/search?q=${encodeURIComponent(personSearchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: personSearchQuery.length > 0,
  });

  const addPerson = (user: any) => {
    if (!withPeople.some(p => p.id === user.id)) {
      setWithPeople([...withPeople, { id: user.id, name: user.name || user.username }]);
    }
    setPersonSearchQuery('');
  };

  const removePerson = (userId: number) => {
    setWithPeople(withPeople.filter(p => p.id !== userId));
  };

  const createPostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.createPost(data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Post created!",
        description: "Your feeling/activity post has been shared successfully.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setContent('');
    setPrivacy('public');
    setSelectedFeeling(null);
    setSelectedActivity(null);
    setLocation('');
    setWithPeople([]);
    setPersonSearchQuery('');
    setSearchQuery('');
    setActiveTab('feeling');
    onClose();
  };



  const generatePostContent = () => {
    let generatedContent = '';
    
    if (selectedFeeling) {
      const feeling = feelings.find(f => f.id === selectedFeeling);
      generatedContent += `is feeling ${feeling?.label.toLowerCase()}`;
    }
    
    if (selectedActivity) {
      const activity = activities.find(a => a.id === selectedActivity);
      if (generatedContent) generatedContent += ' and ';
      generatedContent += `is ${activity?.label.toLowerCase()}`;
    }
    
    if (location) {
      generatedContent += ` at ${location}`;
    }
    
    if (withPeople.length > 0) {
      generatedContent += ` with ${withPeople.map(p => p.name).join(', ')}`;
    }
    
    return generatedContent;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFeeling && !selectedActivity) {
      toast({
        title: "Select feeling or activity",
        description: "Please select at least a feeling or activity to share",
        variant: "destructive",
      });
      return;
    }

    const generatedContent = generatePostContent();
    const finalContent = content.trim() ? `${content.trim()}\n\n${user?.name} ${generatedContent}` : `${user?.name} ${generatedContent}`;

    const formData = new FormData();
    formData.append('content', finalContent);
    formData.append('privacy', privacy);
    
    // Add location and tagged people as metadata
    if (location) {
      formData.append('location', location);
    }
    if (withPeople.length > 0) {
      formData.append('taggedPeople', JSON.stringify(withPeople));
    }

    createPostMutation.mutate(formData);
  };

  const filteredFeelings = feelings.filter(feeling => 
    feeling.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivities = activities.filter(activity => 
    activity.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Smile className="w-5 h-5 text-yellow-500" />
            <span>How are you feeling?</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold">{user?.name}</h4>
              <Select value={privacy} onValueChange={setPrivacy}>
                <SelectTrigger className="w-fit bg-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends</SelectItem>
                  <SelectItem value="private">Only me</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {(selectedFeeling || selectedActivity) && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Preview:</p>
              <p className="font-medium">{user?.name} {generatePostContent()}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={activeTab === 'feeling' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('feeling')}
              className="flex-1"
            >
              <Smile className="w-4 h-4 mr-2" />
              Feeling
            </Button>
            <Button
              variant={activeTab === 'activity' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('activity')}
              className="flex-1"
            >
              <Coffee className="w-4 h-4 mr-2" />
              Activity
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={`Search ${activeTab === 'feeling' ? 'feelings' : 'activities'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Feelings/Activities Grid */}
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeTab === 'feeling' ? (
                filteredFeelings.map((feeling) => {
                  const IconComponent = feeling.icon;
                  return (
                    <Button
                      key={feeling.id}
                      variant={selectedFeeling === feeling.id ? 'default' : 'outline'}
                      className="h-auto p-3 flex flex-col items-center space-y-2"
                      onClick={() => setSelectedFeeling(selectedFeeling === feeling.id ? null : feeling.id)}
                    >
                      <IconComponent className={`w-6 h-6 ${feeling.color}`} />
                      <span className="text-sm">{feeling.label}</span>
                    </Button>
                  );
                })
              ) : (
                filteredActivities.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <Button
                      key={activity.id}
                      variant={selectedActivity === activity.id ? 'default' : 'outline'}
                      className="h-auto p-3 flex flex-col items-center space-y-2"
                      onClick={() => setSelectedActivity(selectedActivity === activity.id ? null : activity.id)}
                    >
                      <IconComponent className={`w-6 h-6 ${activity.color}`} />
                      <span className="text-sm text-center">{activity.label}</span>
                    </Button>
                  );
                })
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Where are you?
            </label>
            <Input
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* With People */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Who are you with?
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="Search people..."
                value={personSearchQuery}
                onChange={(e) => setPersonSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => {
                  if (personSearchQuery.trim()) {
                    const customPerson = { id: Date.now(), name: personSearchQuery.trim() };
                    setWithPeople([...withPeople, customPerson]);
                    setPersonSearchQuery('');
                  }
                }}
                variant="outline" 
                size="sm"
                disabled={!personSearchQuery.trim()}
              >
                Add
              </Button>
            </div>
            {withPeople.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {withPeople.map((person) => (
                  <Badge key={person.id} variant="secondary" className="cursor-pointer" onClick={() => removePerson(person.id)}>
                    {person.name} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Where are you? */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>Where are you?</span>
            </div>
            <Input
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Who are you with? */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Who are you with?</span>
            </div>
            
            {/* Tagged people */}
            {withPeople.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {withPeople.map((person) => (
                  <Badge key={person.id} variant="secondary" className="flex items-center space-x-1">
                    <span>{person.name}</span>
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removePerson(person.id)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search people..."
                  value={personSearchQuery}
                  onChange={(e) => setPersonSearchQuery(e.target.value)}
                  className="w-full"
                />
                
                {/* Search results dropdown */}
                {personSearchQuery && searchResults?.users?.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                    {searchResults.users.map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => addPerson(user)}
                      >
                        <Avatar className="w-6 h-6 mr-2">
                          <AvatarImage src={user.avatar || ""} />
                          <AvatarFallback className="text-xs">
                            {user.name?.charAt(0) || user.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{user.name || user.username}</div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (personSearchQuery.trim()) {
                    // Add as custom person (not a registered user)
                    const customPerson = { id: Date.now(), name: personSearchQuery.trim() };
                    setWithPeople([...withPeople, customPerson]);
                    setPersonSearchQuery('');
                  }
                }}
                disabled={!personSearchQuery.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Additional message */}
          <Textarea
            placeholder="Say something about this..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={createPostMutation.isPending}
          />

          <div className="flex space-x-3">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || (!selectedFeeling && !selectedActivity)}
              className="flex-1"
            >
              {createPostMutation.isPending ? 'Posting...' : 'Share'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}