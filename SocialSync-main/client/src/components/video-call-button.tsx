import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Phone } from 'lucide-react';
import VideoCallModal from './video-call-modal';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
}

interface VideoCallButtonProps {
  user: User;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export default function VideoCallButton({ 
  user, 
  variant = 'outline', 
  size = 'default',
  className = ''
}: VideoCallButtonProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [callType, setCallType] = useState<'outgoing' | 'incoming' | 'active'>('outgoing');

  const handleStartVideoCall = () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to make video calls",
        variant: "destructive",
      });
      return;
    }

    if (currentUser.id === user.id) {
      toast({
        title: "Cannot call yourself",
        description: "You cannot make a video call to yourself",
        variant: "destructive",
      });
      return;
    }

    setCallType('outgoing');
    setIsVideoCallOpen(true);
  };

  const handleAcceptCall = () => {
    setCallType('active');
    toast({
      title: "Call accepted",
      description: `Video call with ${user.name} started`,
    });
  };

  const handleRejectCall = () => {
    setIsVideoCallOpen(false);
    toast({
      title: "Call rejected",
      description: `Video call with ${user.name} was rejected`,
    });
  };

  const handleEndCall = () => {
    setIsVideoCallOpen(false);
    toast({
      title: "Call ended",
      description: `Video call with ${user.name} ended`,
    });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleStartVideoCall}
        className={`flex items-center space-x-2 ${className}`}
      >
        <Video className="w-4 h-4" />
        <span>Video Call</span>
      </Button>

      <VideoCallModal
        isOpen={isVideoCallOpen}
        onClose={() => setIsVideoCallOpen(false)}
        otherUser={user}
        callType={callType}
        onAcceptCall={handleAcceptCall}
        onRejectCall={handleRejectCall}
        onEndCall={handleEndCall}
      />
    </>
  );
} 