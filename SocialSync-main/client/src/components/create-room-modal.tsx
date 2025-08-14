import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Lock, Globe, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const { toast } = useToast();
  const [roomData, setRoomData] = useState({
    name: '',
    description: '',
    privacy: 'public',
    maxMembers: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room name",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: roomData.name,
          description: roomData.description,
          privacy: roomData.privacy,
          maxMembers: roomData.maxMembers ? parseInt(roomData.maxMembers) : null
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Room created successfully",
        });
        setRoomData({
          name: '',
          description: '',
          privacy: 'public',
          maxMembers: ''
        });
        onClose();
      } else {
        throw new Error('Failed to create room');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-teal-500" />
            Create Room
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              placeholder="Enter room name..."
              value={roomData.name}
              onChange={(e) => setRoomData({...roomData, name: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-description">Description</Label>
            <Textarea
              id="room-description"
              placeholder="Describe your room..."
              value={roomData.description}
              onChange={(e) => setRoomData({...roomData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-privacy">Privacy</Label>
            <Select value={roomData.privacy} onValueChange={(value) => setRoomData({...roomData, privacy: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select privacy setting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Public - Anyone can join
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Private - Invite only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-members">Max Members (Optional)</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="max-members"
                type="number"
                placeholder="Enter maximum number of members..."
                value={roomData.maxMembers}
                onChange={(e) => setRoomData({...roomData, maxMembers: e.target.value})}
                className="pl-10"
                min="2"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <MessageCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm">About Rooms</h4>
                <p className="text-blue-700 text-xs mt-1">
                  Rooms are spaces for ongoing conversations with multiple people. Members can join and leave at any time.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}