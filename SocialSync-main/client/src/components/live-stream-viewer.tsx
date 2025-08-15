import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, 
  Mic, 
  MicOff, 
  Users,
  Eye,
  Clock,
  Heart,
  Send,
  Share2,
  Flag,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';

interface LiveStream {
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

interface LiveStreamViewerProps {
  stream: LiveStream;
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveStreamViewer({ stream, isOpen, onClose }: LiveStreamViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Array<{
    id: string;
    user: { name: string; avatar: string | null };
    text: string;
    timestamp: Date;
  }>>([]);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount);
  const [streamDuration, setStreamDuration] = useState(0);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    if (isOpen && !websocket) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for live stream viewing');
        setWebsocket(ws);
        
        // Join the stream
        ws.send(JSON.stringify({
          type: 'join_stream',
          streamId: stream.id
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'viewer_count_update' && data.streamId === stream.id) {
            setViewerCount(data.viewerCount);
          } else if (data.type === 'live_comment' && data.streamId === stream.id) {
            setComments(prev => [...prev, {
              id: Date.now().toString(),
              user: data.user,
              text: data.text,
              timestamp: new Date()
            }]);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWebsocket(null);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }

    return () => {
      if (websocket) {
        // Leave the stream
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({
            type: 'leave_stream',
            streamId: stream.id
          }));
        }
        websocket.close();
        setWebsocket(null);
      }
    };
  }, [isOpen, stream.id]);

  // Track stream duration
  useEffect(() => {
    if (isOpen && stream.startedAt) {
      const interval = setInterval(() => {
        const start = new Date(stream.startedAt);
        const now = new Date();
        const duration = Math.floor((now.getTime() - start.getTime()) / 1000);
        setStreamDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, stream.startedAt]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSendComment = () => {
    if (!comment.trim() || !websocket) return;

    const commentData = {
      type: 'live_comment',
      streamId: stream.id,
      text: comment.trim(),
      user: {
        name: user?.name || user?.username,
        avatar: user?.avatar
      }
    };

    websocket.send(JSON.stringify(commentData));
    setComment('');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Unliked" : "Liked!",
      description: isLiked ? "Removed from your liked streams" : "Added to your liked streams",
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/virtual-rooms`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Share this link with your friends",
    });
  };

  const handleReport = () => {
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep our community safe",
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Main Video Area */}
          <div className="flex-1 bg-black relative">
            {/* Video Player Placeholder */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Live Stream</p>
                <p className="text-sm opacity-75">Streaming from {stream.user.name}</p>
              </div>
            </div>

            {/* Live Indicator */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-red-500 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">LIVE</span>
              </div>
              <Badge variant="secondary" className="bg-black/50 text-white">
                <Eye className="w-3 h-3 mr-1" />
                {viewerCount}
              </Badge>
              <Badge variant="secondary" className="bg-black/50 text-white">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(streamDuration)}
              </Badge>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="bg-black/50 hover:bg-black/70"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Stream Info */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={stream.user.avatar || undefined} />
                  <AvatarFallback>
                    {stream.user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">{stream.user.name}</h3>
                  <p className="text-xs text-gray-500">@{stream.user.username}</p>
                </div>
              </div>
              <h4 className="font-medium text-base mb-2">{stream.title}</h4>
              {stream.description && (
                <p className="text-sm text-gray-600">{stream.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex space-x-2">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className="flex-1"
                >
                  <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Liked' : 'Like'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReport}
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h5 className="font-medium text-sm">Live Comments</h5>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={comment.user.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {comment.user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <p className="text-xs font-medium text-gray-700">
                            {comment.user.name}
                          </p>
                          <p className="text-sm">{comment.text}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {comment.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="flex-1 min-h-[40px] max-h-[80px] resize-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleSendComment}
                    disabled={!comment.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 