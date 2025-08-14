import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import ImageEditor from './image-editor';
import { 
  Image, 
  Video, 
  Upload, 
  Camera, 
  X, 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Square,
  RotateCcw,
  FlipHorizontal,
  Edit3
} from 'lucide-react';

interface PhotoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoVideoModal({ isOpen, onClose }: PhotoVideoModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [isPlaying, setIsPlaying] = useState<boolean[]>([]);
  const [isMuted, setIsMuted] = useState<boolean[]>([]);
  
  // Camera states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // Image editing states
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.createPost(data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Post created!",
        description: "Your media post has been shared successfully.",
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
    setMediaFiles([]);
    setMediaPreviews([]);
    setActiveTab('upload');
    setIsPlaying([]);
    setIsMuted([]);
    setEditingImageIndex(null);
    setIsImageEditorOpen(false);
    stopCamera();
    onClose();
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        },
        audio: true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', mediaStream);
      
      setStream(mediaStream);
      setIsCameraActive(true);

      // Delay to ensure video element is ready
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Setting video source...');
          videoRef.current.srcObject = mediaStream;
          
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, starting playback');
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                console.log('Video playback started successfully');
              }).catch((playError) => {
                console.error('Video play error:', playError);
              });
            }
          };
          
          // Force immediate play attempt
          videoRef.current.play().catch(() => {
            console.log('Waiting for metadata to load...');
          });
        }
      }, 100);

      toast({
        title: "Camera activated",
        description: "Camera is ready for photo and video capture",
      });
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera permissions to use this feature",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
      setIsRecording(false);
    }
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isCameraActive) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const preview = URL.createObjectURL(blob);
        
        setMediaFiles(prev => [...prev, file]);
        setMediaPreviews(prev => [...prev, preview]);
        setIsPlaying(prev => [...prev, false]);
        setIsMuted(prev => [...prev, false]);

        toast({
          title: "Photo captured!",
          description: "Photo has been added to your post",
        });
      }
    }, 'image/jpeg', 0.8);
  };

  const startVideoRecording = () => {
    if (!stream) return;

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);
      setIsRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        if (recordedChunks.length > 0) {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
          const preview = URL.createObjectURL(blob);
          
          setMediaFiles(prev => [...prev, file]);
          setMediaPreviews(prev => [...prev, preview]);
          setIsPlaying(prev => [...prev, false]);
          setIsMuted(prev => [...prev, true]);

          toast({
            title: "Video recorded!",
            description: "Video has been added to your post",
          });
        }
        setIsRecording(false);
        setRecordedChunks([]);
      };

      mediaRecorder.start(1000);

      toast({
        title: "Recording started",
        description: "Tap the stop button when finished",
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording failed",
        description: "Unable to start video recording",
        variant: "destructive",
      });
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Auto-start camera when switching to camera tab
  useEffect(() => {
    if (activeTab === 'camera' && !isCameraActive && isOpen) {
      console.log('Auto-starting camera for tab switch');
      startCamera();
    }
  }, [activeTab, isOpen]);

  // Force video refresh when stream changes
  useEffect(() => {
    if (stream && videoRef.current && isCameraActive) {
      console.log('Updating video element with new stream');
      videoRef.current.srcObject = stream;
      videoRef.current.load(); // Force reload
      
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
          console.log('Video playback successful after stream update');
        } catch (error) {
          console.error('Failed to play video after stream update:', error);
        }
      };
      
      playVideo();
    }
  }, [stream, isCameraActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 10 files total
    const remainingSlots = 10 - mediaFiles.length;
    const selectedFiles = files.slice(0, remainingSlots);
    
    setMediaFiles(prev => [...prev, ...selectedFiles]);
    
    // Generate previews
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Initialize video controls
    setIsPlaying(prev => [...prev, ...selectedFiles.map(() => false)]);
    setIsMuted(prev => [...prev, ...selectedFiles.map(() => false)]);
    
    // Clear the input value to allow selecting the same files again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    setIsPlaying(prev => prev.filter((_, i) => i !== index));
    setIsMuted(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditImage = (index: number) => {
    setEditingImageIndex(index);
    setIsImageEditorOpen(true);
  };

  const handleImageEditorSave = (editedFile: File) => {
    if (editingImageIndex !== null) {
      // Update the file and preview
      setMediaFiles(prev => prev.map((file, i) => i === editingImageIndex ? editedFile : file));
      
      // Generate new preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreviews(prev => prev.map((preview, i) => 
          i === editingImageIndex ? (e.target?.result as string) : preview
        ));
      };
      reader.readAsDataURL(editedFile);
    }
    
    setIsImageEditorOpen(false);
    setEditingImageIndex(null);
    
    toast({
      title: "Image edited successfully",
      description: "Your changes have been applied",
    });
  };

  const handleImageEditorCancel = () => {
    setIsImageEditorOpen(false);
    setEditingImageIndex(null);
  };

  const toggleVideoPlay = (index: number) => {
    const video = document.getElementById(`video-${index}`) as HTMLVideoElement;
    if (video) {
      if (isPlaying[index]) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(prev => prev.map((playing, i) => i === index ? !playing : playing));
    }
  };

  const toggleVideoMute = (index: number) => {
    const video = document.getElementById(`video-${index}`) as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted[index];
      setIsMuted(prev => prev.map((muted, i) => i === index ? !muted : muted));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mediaFiles.length === 0) {
      toast({
        title: "No media selected",
        description: "Please select at least one photo or video",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    if (content.trim()) {
      formData.append('content', content.trim());
    }
    
    // For now, we'll upload the first file (extend for multiple files)
    if (mediaFiles[0]) {
      formData.append('media', mediaFiles[0]);
    }
    formData.append('privacy', privacy);

    createPostMutation.mutate(formData);
  };



  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Image className="w-5 h-5 text-green-500" />
            <span>Create Photo/Video Post</span>
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

          <Textarea
            placeholder={`What's happening, ${user?.name?.split(' ')[0]}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] text-lg border-none focus:ring-0 resize-none"
            disabled={createPostMutation.isPending}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload Files</span>
              </TabsTrigger>
              <TabsTrigger value="camera" className="flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>Take Photo/Video</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              {mediaFiles.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex space-x-4">
                      <Image className="w-12 h-12 text-green-500" />
                      <Video className="w-12 h-12 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">Add Photos and Videos</p>
                      <p className="text-gray-500">or drag and drop</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Select Files
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      {mediaFiles[index]?.type.startsWith('image/') ? (
                        <div className="relative">
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => handleEditImage(index)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveMedia(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <video 
                            id={`video-${index}`}
                            src={preview} 
                            className="w-full h-48 object-cover rounded-lg"
                            muted={isMuted[index]}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex space-x-2">
                              <Button
                                variant="secondary"
                                size="icon"
                                onClick={() => toggleVideoPlay(index)}
                                className="bg-black/50 hover:bg-black/70"
                              >
                                {isPlaying[index] ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="secondary"
                                size="icon"
                                onClick={() => toggleVideoMute(index)}
                                className="bg-black/50 hover:bg-black/70"
                              >
                                {isMuted[index] ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveMedia(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {mediaFiles.length < 10 && (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Add More</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="camera" className="space-y-4">
              <div className="relative bg-black rounded-lg aspect-video overflow-hidden">
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                      onCanPlay={() => console.log('Video can play')}
                      onLoadStart={() => console.log('Video load started')}
                      onPlaying={() => console.log('Video is playing')}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Camera controls overlay */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={flipCamera}
                        className="bg-black/50 hover:bg-black/70 text-white"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={stopCamera}
                        className="bg-black/50 hover:bg-black/70 text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {isRecording && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span>Recording</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">Camera Preview</p>
                      <p className="text-sm opacity-75 mb-4">Click Start Camera to begin</p>
                      <Button onClick={startCamera} variant="secondary">
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={takePhoto} 
                  disabled={!isCameraActive}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button 
                  onClick={isRecording ? stopVideoRecording : startVideoRecording}
                  disabled={!isCameraActive}
                  className={`${isRecording ? 'bg-gray-500 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-50`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Record Video
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex space-x-3">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || mediaFiles.length === 0}
              className="flex-1"
            >
              {createPostMutation.isPending ? 'Posting...' : 'Share'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Image Editor Dialog */}
      {isImageEditorOpen && editingImageIndex !== null && (
        <Dialog open={isImageEditorOpen} onOpenChange={() => setIsImageEditorOpen(false)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
            <ImageEditor
              imageFile={mediaFiles[editingImageIndex]}
              onSave={handleImageEditorSave}
              onCancel={handleImageEditorCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}