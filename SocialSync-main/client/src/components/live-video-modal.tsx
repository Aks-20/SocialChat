import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Settings,
  Users,
  Eye,
  Clock,
  StopCircle,
  Radio,
  AlertCircle
} from 'lucide-react';

interface LiveVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveVideoModal({ isOpen, onClose }: LiveVideoModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentStreamId, setCurrentStreamId] = useState<number | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  // Initialize camera and microphone
  useEffect(() => {
    if (isOpen && !stream) {
      initializeMedia();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  // Ensure video stream is properly connected when stream changes
  useEffect(() => {
    if (stream && videoRef.current && hasPermissions) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream, hasPermissions]);

  // Set up WebSocket connection for real-time viewer tracking
  useEffect(() => {
    if (isOpen && !websocket) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for viewer tracking');
        setWebsocket(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'viewer_count_update' && data.streamId === currentStreamId) {
            setViewerCount(data.viewerCount);
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
        websocket.close();
        setWebsocket(null);
      }
    };
  }, [isOpen]);

  // Clean up WebSocket when component unmounts or modal closes
  useEffect(() => {
    if (!isOpen && websocket) {
      if (currentStreamId && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'leave_stream',
          streamId: currentStreamId
        }));
      }
      websocket.close();
      setWebsocket(null);
    }
  }, [isOpen]);

  const initializeMedia = async () => {
    try {
      setIsSettingUp(true);
      setPermissionError('');
      
      const constraints = {
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      console.log('Requesting media with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      console.log('Audio tracks:', mediaStream.getAudioTracks());
      
      setStream(mediaStream);
      setHasPermissions(true);
      
      // Ensure video element is ready and stream is connected
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = async () => {
          console.log('Video metadata loaded');
          try {
            await videoRef.current?.play();
            console.log('Video playing');
          } catch (playError) {
            console.error('Error playing video:', playError);
          }
        };
        videoRef.current.onerror = (error) => {
          console.error('Video element error:', error);
        };
      }
    } catch (error) {
      console.error('Media initialization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPermissionError(`Camera/microphone access denied: ${errorMessage}`);
      toast({
        title: "Permission denied",
        description: "Please allow camera and microphone access to start live video",
        variant: "destructive",
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const createLiveStreamMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; privacy: string }) => {
      const response = await fetch('/api/live-streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create live stream');
      return response.json();
    },
    onSuccess: (data) => {
      const streamId = data.id;
      setCurrentStreamId(streamId);
      
      // Join the stream as a viewer via WebSocket for real-time tracking
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'join_stream',
          streamId: streamId
        }));
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/live-streams'] });
      
      toast({
        title: "Live stream created!",
        description: "Your stream is now available in Virtual Rooms",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              onClose();
              window.location.href = '/virtual-rooms';
            }}
          >
            View Room
          </Button>
        ),
      });
    }
  });

  const handleClose = () => {
    // Leave WebSocket stream if currently connected
    if (currentStreamId && websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'leave_stream',
        streamId: currentStreamId
      }));
    }
    
    // Stop all media tracks to properly release camera/microphone
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track:`, track.label);
      });
      setStream(null);
    }
    
    // Clear video element source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Reset all state
    setTitle('');
    setDescription('');
    setPrivacy('public');
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setIsLive(false);
    setViewerCount(0);
    setRecordingTime(0);
    setStartTime(null);
    setCurrentStreamId(null);
    setHasPermissions(false);
    setPermissionError('');
    onClose();
  };

  const handleStartLive = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your live video",
        variant: "destructive",
      });
      return;
    }

    if (!hasPermissions) {
      toast({
        title: "Camera access required",
        description: "Please allow camera and microphone access",
        variant: "destructive",
      });
      return;
    }

    setIsLive(true);
    setStartTime(new Date());
    setViewerCount(0); // Will be updated via WebSocket
    
    // Create the live stream record
    createLiveStreamMutation.mutate({
      title,
      description,
      privacy
    });
  };

  // Track recording time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setRecordingTime(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, startTime]);

  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStopLive = () => {
    setIsLive(false);
    setViewerCount(0);
    setRecordingTime(0);
    setStartTime(null);
    
    // Show options to post to newsfeed
    if (currentStreamId) {
      toast({
        title: "Live stream ended",
        description: "Would you like to share this stream to your newsfeed?",
      });
      
      // Show post option dialog instead of immediately closing
      setShowPostDialog(true);
    } else {
      handleClose();
    }
  };

  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postContent, setPostContent] = useState('');

  const handlePostToFeed = async () => {
    if (!currentStreamId) return;
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: postContent || `Just finished an amazing live stream: "${title}"`,
          liveStreamId: currentStreamId,
          privacy: privacy
        })
      });
      
      if (!response.ok) throw new Error('Failed to post live stream');
      
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Posted to newsfeed!",
        description: "Your live stream is now visible to your followers",
      });
      
      setShowPostDialog(false);
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post to newsfeed",
        variant: "destructive",
      });
    }
  };

  const handleSkipPost = () => {
    setShowPostDialog(false);
    handleClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-red-500" />
              <span>Go Live</span>
            </DialogTitle>
          </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <h4 className="font-semibold">{user?.name}</h4>
              <Select value={privacy} onValueChange={setPrivacy}>
                <SelectTrigger className="w-32 bg-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Public</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Friends</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Only me</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Live Video Preview */}
          <div className="relative bg-black rounded-lg aspect-video overflow-hidden">
            {isSettingUp ? (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Setting up camera...</p>
                </div>
              </div>
            ) : permissionError ? (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                  <p className="text-lg mb-2">Camera Access Required</p>
                  <p className="text-sm opacity-75 mb-4">{permissionError}</p>
                  <Button onClick={initializeMedia} variant="secondary" size="sm">
                    Retry Camera Access
                  </Button>
                </div>
              </div>
            ) : hasPermissions ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover transform scale-x-[-1]"
                  style={{ 
                    filter: 'brightness(1.1) contrast(1.1)',
                    backgroundColor: '#000',
                    minHeight: '100%',
                    minWidth: '100%'
                  }}
                  onCanPlay={() => console.log('Video can play')}
                  onPlay={() => console.log('Video started playing')}
                  onLoadStart={() => console.log('Video load started')}
                />
                {isLive && (
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
                      {formatRecordingTime(recordingTime)}
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Camera preview will appear here</p>
                  <p className="text-sm opacity-75">Allow camera access to continue</p>
                </div>
              </div>
            )}
            
            {/* Control buttons overlay */}
            {hasPermissions && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
                <Button
                  variant={isVideoEnabled ? "secondary" : "destructive"}
                  size="icon"
                  onClick={toggleVideo}
                  className="bg-black/50 hover:bg-black/70"
                >
                  {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant={isAudioEnabled ? "secondary" : "destructive"}
                  size="icon"
                  onClick={toggleAudio}
                  className="bg-black/50 hover:bg-black/70"
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                {isLive && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleStopLive}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <StopCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Live Video Details */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <input
                type="text"
                placeholder="What's your live video about?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Description (optional)</label>
              <Textarea
                placeholder="Tell viewers what to expect..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>
          </div>

          {/* Live Video Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Live Video Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Make sure you have a stable internet connection</li>
              <li>• Your live video will be saved to your profile</li>
              <li>• Viewers can comment and react in real-time</li>
              <li>• You'll receive notifications when people join</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            {isLive ? (
              <Button 
                onClick={handleStopLive}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={createLiveStreamMutation.isPending}
              >
                <StopCircle className="w-4 h-4 mr-2" />
                End Live Stream
              </Button>
            ) : (
              <Button 
                onClick={handleStartLive}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={!hasPermissions || createLiveStreamMutation.isPending}
              >
                {createLiveStreamMutation.isPending ? (
                  <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Radio className="w-4 h-4 mr-2" />
                )}
                Go Live
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Post to Newsfeed Dialog */}
    <Dialog open={showPostDialog} onOpenChange={() => setShowPostDialog(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Live Stream</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your live stream "{title}" has ended. Would you like to share it with your followers?
          </p>
          
          <Textarea
            placeholder="Add a caption for your live stream post..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="min-h-[80px]"
          />
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleSkipPost} className="flex-1">
              Skip
            </Button>
            <Button onClick={handlePostToFeed} className="flex-1 bg-blue-500 hover:bg-blue-600">
              Share to Feed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}