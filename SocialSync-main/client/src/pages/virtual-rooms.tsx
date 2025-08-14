import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Video, 
  Users, 
  Clock, 
  Eye, 
  Play,
  Radio,
  Calendar,
  Globe,
  Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface VirtualRoom {
  id: number;
  title: string;
  description: string;
  privacy: string;
  isActive: boolean;
  viewerCount: number;
  startedAt: string;
  user: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export default function VirtualRoomsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<VirtualRoom | null>(null);

  const { data: virtualRooms = [], isLoading } = useQuery({
    queryKey: ['/api/live-streams'],
    queryFn: async () => {
      const response = await fetch('/api/live-streams', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch virtual rooms');
      return response.json();
    }
  });

  const handleJoinRoom = (room: VirtualRoom) => {
    setSelectedRoom(room);
    toast({
      title: "Joining virtual room",
      description: `Connecting to ${room.title}...`
    });
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just started";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ${diffInMinutes % 60}m ago`;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Virtual Rooms</h1>
          <p className="text-gray-600 mt-1">Join live video rooms and connect with others</p>
        </div>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Radio className="w-3 h-3" />
          <span>{virtualRooms.length} Live</span>
        </Badge>
      </div>

      <Separator />

      {/* Virtual Rooms Grid */}
      {virtualRooms.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No virtual rooms available</h3>
          <p className="text-gray-600 mb-4">Create a live video to start your own virtual room</p>
          <Button onClick={() => window.location.href = '/feed'}>
            <Video className="w-4 h-4 mr-2" />
            Create Live Video
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {virtualRooms.map((room: VirtualRoom) => (
            <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={room.user.avatar || undefined} />
                      <AvatarFallback>
                        {room.user.name?.charAt(0) || room.user.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm truncate">{room.user.name || room.user.username}</h3>
                      <p className="text-xs text-gray-500">@{room.user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {room.isActive && (
                      <Badge variant="destructive" className="text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                        LIVE
                      </Badge>
                    )}
                    {room.privacy === 'private' ? (
                      <Lock className="w-3 h-3 text-gray-400" />
                    ) : (
                      <Globe className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Room Title */}
                <div>
                  <h4 className="font-medium text-base mb-1 line-clamp-2">{room.title}</h4>
                  {room.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{room.description}</p>
                  )}
                </div>

                {/* Room Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{room.viewerCount || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(room.startedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Join Button */}
                <Button 
                  onClick={() => handleJoinRoom(room)}
                  className="w-full"
                  variant={room.isActive ? "default" : "outline"}
                  disabled={!room.isActive}
                >
                  {room.isActive ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Join Room
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Stream Ended
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Room Modal/Viewer would go here */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Join Virtual Room</h3>
            <p className="text-gray-600 mb-4">
              You're about to join "{selectedRoom.title}" by {selectedRoom.user.name}
            </p>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedRoom(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // Here you would implement the actual room joining logic
                  toast({
                    title: "Joined room",
                    description: `You're now in ${selectedRoom.title}`
                  });
                  setSelectedRoom(null);
                }}
                className="flex-1"
              >
                Join Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}