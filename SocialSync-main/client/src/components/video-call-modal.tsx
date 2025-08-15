import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone,
  PhoneOff,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Settings,
  Volume2,
  VolumeX,
  MessageSquare,
  MoreHorizontal,
  X,
  Clock
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
}

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: User | null;
  callType: 'incoming' | 'outgoing' | 'active';
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
  onEndCall?: () => void;
}

export default function VideoCallModal({ 
  isOpen, 
  onClose, 
  otherUser, 
  callType,
  onAcceptCall,
  onRejectCall,
  onEndCall
}: VideoCallModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Media streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  // Call states
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // WebRTC
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  
  // UI states
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');

  // Initialize media when modal opens
  useEffect(() => {
    if (isOpen && callType === 'outgoing') {
      initializeMedia();
    }
    return () => {
      cleanupMedia();
    };
  }, [isOpen, callType]);

  // Track call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive, startTime]);

  const initializeMedia = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('Accessing camera...');
      
      const constraints = {
        video: {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          facingMode: 'user',
          frameRate: { min: 15, ideal: 24, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setConnectionStatus('Connecting to peer...');
      await initializeWebRTC(stream);
      
    } catch (error) {
      console.error('Media initialization error:', error);
      toast({
        title: "Camera access failed",
        description: "Please allow camera and microphone access",
        variant: "destructive",
      });
      onClose();
    } finally {
      setIsConnecting(false);
    }
  };

  const initializeWebRTC = async (localStream: MediaStream) => {
    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected for video call');
        setWebsocket(ws);
        
        // Create call
        const newCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCallId(newCallId);
        
        ws.send(JSON.stringify({
          type: 'create_video_call',
          callId: newCallId,
          targetUserId: otherUser?.id,
          userId: user?.id
        }));
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'call_accepted':
              setConnectionStatus('Call accepted, establishing connection...');
              await createPeerConnection(localStream);
              break;
              
            case 'call_rejected':
              toast({
                title: "Call rejected",
                description: `${otherUser?.name} rejected your call`,
                variant: "destructive",
              });
              onClose();
              break;
              
            case 'call_ended':
              toast({
                title: "Call ended",
                description: `${otherUser?.name} ended the call`,
              });
              endCall();
              break;
              
            case 'ice_candidate':
              if (peerConnection) {
                await peerConnection.addIceCandidate(data.candidate);
              }
              break;
              
            case 'offer':
              if (callType === 'incoming') {
                await handleIncomingCall(data.offer, localStream);
              }
              break;
              
            case 'answer':
              if (peerConnection) {
                await peerConnection.setRemoteDescription(data.answer);
              }
              break;
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWebsocket(null);
      };

    } catch (error) {
      console.error('WebRTC initialization error:', error);
      toast({
        title: "Connection failed",
        description: "Unable to establish video call connection",
        variant: "destructive",
      });
    }
  };

  const createPeerConnection = async (localStream: MediaStream) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local stream
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && websocket) {
          websocket.send(JSON.stringify({
            type: 'ice_candidate',
            callId: callId,
            candidate: event.candidate,
            targetUserId: otherUser?.id
          }));
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setConnectionStatus('Connected');
          setIsCallActive(true);
          setStartTime(new Date());
          if (onAcceptCall) onAcceptCall();
        } else if (pc.connectionState === 'failed') {
          setConnectionStatus('Connection failed');
          toast({
            title: "Connection failed",
            description: "Unable to establish video call",
            variant: "destructive",
          });
        }
      };

      setPeerConnection(pc);

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (websocket) {
        websocket.send(JSON.stringify({
          type: 'offer',
          callId: callId,
          offer: offer,
          targetUserId: otherUser?.id
        }));
      }

    } catch (error) {
      console.error('Peer connection error:', error);
    }
  };

  const handleIncomingCall = async (offer: RTCSessionDescriptionInit, localStream: MediaStream) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local stream
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && websocket) {
          websocket.send(JSON.stringify({
            type: 'ice_candidate',
            callId: callId,
            candidate: event.candidate,
            targetUserId: otherUser?.id
          }));
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setConnectionStatus('Connected');
          setIsCallActive(true);
          setStartTime(new Date());
        }
      };

      setPeerConnection(pc);

      // Set remote description and create answer
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (websocket) {
        websocket.send(JSON.stringify({
          type: 'answer',
          callId: callId,
          answer: answer,
          targetUserId: otherUser?.id
        }));
      }

    } catch (error) {
      console.error('Incoming call handling error:', error);
    }
  };

  const cleanupMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    if (websocket) {
      websocket.close();
      setWebsocket(null);
    }
    setIsCallActive(false);
    setCallDuration(0);
    setStartTime(null);
  };

  const handleAcceptCall = async () => {
    if (onAcceptCall) onAcceptCall();
    await initializeMedia();
  };

  const handleRejectCall = () => {
    if (websocket && callId) {
      websocket.send(JSON.stringify({
        type: 'reject_call',
        callId: callId,
        targetUserId: otherUser?.id
      }));
    }
    if (onRejectCall) onRejectCall();
    onClose();
  };

  const handleEndCall = () => {
    if (websocket && callId) {
      websocket.send(JSON.stringify({
        type: 'end_call',
        callId: callId,
        targetUserId: otherUser?.id
      }));
    }
    if (onEndCall) onEndCall();
    endCall();
  };

  const endCall = () => {
    cleanupMedia();
    onClose();
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!otherUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherUser.avatar || undefined} />
                <AvatarFallback>
                  {otherUser.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{otherUser.name}</h3>
                <p className="text-sm text-gray-500">@{otherUser.username}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isCallActive && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(callDuration)}</span>
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Video Area */}
          <div className="flex-1 bg-black relative">
            {callType === 'incoming' && !isCallActive ? (
              // Incoming call screen
              <div className="w-full h-full flex flex-col items-center justify-center text-white">
                <Avatar className="w-32 h-32 mb-6">
                  <AvatarImage src={otherUser.avatar || undefined} />
                  <AvatarFallback className="text-4xl">
                    {otherUser.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-semibold mb-2">{otherUser.name}</h2>
                <p className="text-lg mb-8">Incoming video call...</p>
                <div className="flex space-x-4">
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 w-16 h-16 rounded-full"
                    onClick={handleAcceptCall}
                  >
                    <Phone className="w-6 h-6" />
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="w-16 h-16 rounded-full"
                    onClick={handleRejectCall}
                  >
                    <PhoneOff className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            ) : callType === 'outgoing' && !isCallActive ? (
              // Outgoing call screen
              <div className="w-full h-full flex flex-col items-center justify-center text-white">
                <Avatar className="w-32 h-32 mb-6">
                  <AvatarImage src={otherUser.avatar || undefined} />
                  <AvatarFallback className="text-4xl">
                    {otherUser.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-semibold mb-2">{otherUser.name}</h2>
                <p className="text-lg mb-8">
                  {isConnecting ? connectionStatus : 'Calling...'}
                </p>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-16 h-16 rounded-full"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </div>
            ) : (
              // Active call screen
              <>
                {/* Remote video (main) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Local video (picture-in-picture) */}
                <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                </div>

                {/* Connection status */}
                {connectionStatus && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      {connectionStatus}
                    </Badge>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controls */}
          {isCallActive && (
            <div className="flex items-center justify-center space-x-4 p-4 bg-gray-900">
              <Button
                variant={isVideoEnabled ? "secondary" : "destructive"}
                size="icon"
                onClick={toggleVideo}
                className="w-12 h-12 rounded-full"
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              
              <Button
                variant={isAudioEnabled ? "secondary" : "destructive"}
                size="icon"
                onClick={toggleAudio}
                className="w-12 h-12 rounded-full"
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="destructive"
                size="icon"
                onClick={handleEndCall}
                className="w-12 h-12 rounded-full"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                onClick={toggleMute}
                className="w-12 h-12 rounded-full"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 