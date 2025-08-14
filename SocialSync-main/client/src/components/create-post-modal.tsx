import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { 
  Image, 
  UserRound, 
  Smile, 
  MapPin, 
  Flag, 
  X, 
  Upload,
  Clock,
  Plus,
  Search,
  Edit3,
  RotateCcw,
  ZoomIn,
  Sliders,
  Crop,
  Move
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Emoji data with names
const emojiData = [
  { emoji: '😀', name: 'Grinning Face' },
  { emoji: '😁', name: 'Beaming Face' },
  { emoji: '😂', name: 'Face with Tears of Joy' },
  { emoji: '🤣', name: 'Rolling on the Floor Laughing' },
  { emoji: '😊', name: 'Smiling Face with Smiling Eyes' },
  { emoji: '😇', name: 'Smiling Face with Halo' },
  { emoji: '🙂', name: 'Slightly Smiling Face' },
  { emoji: '🙃', name: 'Upside-Down Face' },
  { emoji: '😉', name: 'Winking Face' },
  { emoji: '😌', name: 'Relieved Face' },
  { emoji: '😍', name: 'Smiling Face with Heart-Eyes' },
  { emoji: '🥰', name: 'Smiling Face with Hearts' },
  { emoji: '😘', name: 'Face Blowing a Kiss' },
  { emoji: '😗', name: 'Kissing Face' },
  { emoji: '😙', name: 'Kissing Face with Smiling Eyes' },
  { emoji: '😚', name: 'Kissing Face with Closed Eyes' },
  { emoji: '😋', name: 'Face Savoring Food' },
  { emoji: '😛', name: 'Face with Tongue' },
  { emoji: '😝', name: 'Squinting Face with Tongue' },
  { emoji: '😜', name: 'Winking Face with Tongue' },
  { emoji: '🤪', name: 'Zany Face' },
  { emoji: '🤨', name: 'Face with Raised Eyebrow' },
  { emoji: '🧐', name: 'Face with Monocle' },
  { emoji: '🤓', name: 'Nerd Face' },
  { emoji: '😎', name: 'Smiling Face with Sunglasses' },
  { emoji: '🤩', name: 'Star-Struck' },
  { emoji: '🥳', name: 'Partying Face' },
  { emoji: '😏', name: 'Smirking Face' },
  { emoji: '😒', name: 'Unamused Face' },
  { emoji: '😞', name: 'Disappointed Face' },
  { emoji: '😔', name: 'Pensive Face' },
  { emoji: '😟', name: 'Worried Face' },
  { emoji: '😕', name: 'Confused Face' },
  { emoji: '🙁', name: 'Slightly Frowning Face' },
  { emoji: '☹️', name: 'Frowning Face' },
  { emoji: '😣', name: 'Persevering Face' },
  { emoji: '😖', name: 'Confounded Face' },
  { emoji: '😫', name: 'Tired Face' },
  { emoji: '😩', name: 'Weary Face' },
  { emoji: '🥺', name: 'Pleading Face' },
  { emoji: '😢', name: 'Crying Face' },
  { emoji: '😭', name: 'Loudly Crying Face' },
  { emoji: '😤', name: 'Face with Steam From Nose' },
  { emoji: '😠', name: 'Angry Face' },
  { emoji: '😡', name: 'Pouting Face' },
  { emoji: '🤬', name: 'Face with Symbols on Mouth' },
  { emoji: '🤯', name: 'Exploding Head' },
  { emoji: '😳', name: 'Flushed Face' },
  { emoji: '🥵', name: 'Hot Face' },
  { emoji: '🥶', name: 'Cold Face' },
  { emoji: '😱', name: 'Face Screaming in Fear' },
  { emoji: '😨', name: 'Fearful Face' },
  { emoji: '😰', name: 'Anxious Face with Sweat' },
  { emoji: '😥', name: 'Sad but Relieved Face' },
  { emoji: '😓', name: 'Downcast Face with Sweat' },
  { emoji: '🤗', name: 'Hugging Face' },
  { emoji: '🤔', name: 'Thinking Face' },
  { emoji: '🤭', name: 'Face with Hand Over Mouth' },
  { emoji: '🤫', name: 'Shushing Face' },
  { emoji: '🤥', name: 'Lying Face' },
  { emoji: '😶', name: 'Face Without Mouth' },
  { emoji: '😐', name: 'Neutral Face' },
  { emoji: '😑', name: 'Expressionless Face' },
  { emoji: '😬', name: 'Grimacing Face' },
  { emoji: '🙄', name: 'Face with Rolling Eyes' },
  { emoji: '😯', name: 'Hushed Face' },
  { emoji: '😦', name: 'Frowning Face with Open Mouth' },
  { emoji: '😧', name: 'Anguished Face' },
  { emoji: '😮', name: 'Face with Open Mouth' },
  { emoji: '😲', name: 'Astonished Face' },
  { emoji: '🥱', name: 'Yawning Face' },
  { emoji: '😴', name: 'Sleeping Face' },
  { emoji: '🤤', name: 'Drooling Face' },
  { emoji: '😪', name: 'Sleepy Face' },
  { emoji: '😵', name: 'Dizzy Face' },
  { emoji: '🤐', name: 'Zipper-Mouth Face' },
  { emoji: '🥴', name: 'Woozy Face' },
  { emoji: '🤢', name: 'Nauseated Face' },
  { emoji: '🤮', name: 'Face Vomiting' },
  { emoji: '🤧', name: 'Sneezing Face' },
  { emoji: '😷', name: 'Face with Medical Mask' },
  { emoji: '🤒', name: 'Face with Thermometer' },
  { emoji: '🤕', name: 'Face with Head-Bandage' },
  { emoji: '🤑', name: 'Money-Mouth Face' },
  { emoji: '🤠', name: 'Cowboy Hat Face' },
  { emoji: '😈', name: 'Smiling Face with Horns' },
  { emoji: '👿', name: 'Angry Face with Horns' },
  { emoji: '👹', name: 'Ogre' },
  { emoji: '👺', name: 'Goblin' },
  { emoji: '🤡', name: 'Clown Face' },
  { emoji: '💩', name: 'Pile of Poo' },
  { emoji: '👻', name: 'Ghost' },
  { emoji: '💀', name: 'Skull' },
  { emoji: '☠️', name: 'Skull and Crossbones' },
  { emoji: '👽', name: 'Alien' },
  { emoji: '👾', name: 'Alien Monster' },
  { emoji: '🤖', name: 'Robot' },
  { emoji: '🎃', name: 'Jack-O-Lantern' },
  { emoji: '😺', name: 'Grinning Cat' },
  { emoji: '😸', name: 'Grinning Cat with Smiling Eyes' },
  { emoji: '😹', name: 'Cat with Tears of Joy' },
  { emoji: '😻', name: 'Smiling Cat with Heart-Eyes' },
  { emoji: '😼', name: 'Cat with Wry Smile' },
  { emoji: '😽', name: 'Kissing Cat' },
  { emoji: '🙀', name: 'Weary Cat' },
  { emoji: '😿', name: 'Crying Cat' },
  { emoji: '😾', name: 'Pouting Cat' }
];

const popularEmojis = ['😀', '😂', '😍', '🥰', '😊', '🤔', '😎', '🥳', '🤗', '😭'];

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [duration, setDuration] = useState<string>('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [location, setLocation] = useState('');
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imageFilter, setImageFilter] = useState('none');
  const [imageBrightness, setImageBrightness] = useState(100);
  const [imageContrast, setImageContrast] = useState(100);
  const [imageSaturation, setImageSaturation] = useState(100);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });



  const createPostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      try {
        const response = await api.createPost(data);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Post creation failed:', error);
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
    setDuration('');
    setMediaFiles([]);
    setMediaPreviews([]);
    setShowMediaUpload(false);
    setShowEmojiPicker(false);
    setShowLocationPicker(false);
    setLocation('');
    setTaggedPeople([]);
    // Reset image editor state
    setShowImageEditor(false);
    setImageScale(1);
    setImageFilter('none');
    setImageBrightness(100);
    setImageContrast(100);
    setImageSaturation(100);
    setCropMode(false);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    onClose();
  };

  const addEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setMediaFiles(prev => [...prev, ...files]);
      
      // Generate previews for all selected files
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
      
      setShowMediaUpload(false); // Hide upload area after selection
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('media-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    // Reset image editor state
    setShowImageEditor(false);
    setImageScale(1);
    setImageFilter('none');
    setImageBrightness(100);
    setImageContrast(100);
    setImageSaturation(100);
    setCropMode(false);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && mediaFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please add some content or media to your post",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    if (content.trim()) {
      formData.append('content', content.trim());
    }
    
    // Append all media files
    mediaFiles.forEach((file, index) => {
      formData.append(`media`, file);
    });
    formData.append('privacy', privacy);
    if (duration && duration !== 'permanent') {
      formData.append('duration', duration);
    }

    createPostMutation.mutate(formData);
  };

  // Early return if user is not loaded to prevent errors
  if (!user) {
    console.log('CreatePostModal: User not loaded, returning null');
    return null;
  }

  try {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>
              Share what's on your mind with your friends and followers
            </DialogDescription>
          </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            multiple
            className="hidden"
            id="media-upload"
          />
          
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
          
          {/* Post Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Post Duration (Optional)</label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration (permanent if not set)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="1m">1 Month</SelectItem>
              </SelectContent>
            </Select>
            {duration && duration !== 'permanent' && (
              <p className="text-xs text-gray-500">
                This post will automatically be deleted after {
                  duration === '24h' ? '24 hours' :
                  duration === '7d' ? '7 days' :
                  duration === '1m' ? '1 month' : ''
                }
              </p>
            )}
          </div>
          
          <Textarea
            placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] text-lg border-none focus:ring-0 resize-none"
            disabled={createPostMutation.isPending}
          />
          
          {/* Media Preview */}
          {mediaPreviews.length > 0 && (
            <div className="space-y-2">
              {mediaPreviews.map((preview, index) => {
                const file = mediaFiles[index];
                return (
                  <div key={index} className="relative">
                    {file?.type.startsWith('image/') ? (
                      <div className="relative">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-64 object-cover rounded-lg"
                          style={{
                            transform: `scale(${imageScale})`,
                            filter: `
                              ${imageFilter === 'none' ? '' : imageFilter === 'grayscale' ? 'grayscale(100%)' : 
                                imageFilter === 'sepia' ? 'sepia(100%)' : 
                                imageFilter === 'blur' ? 'blur(2px)' : 
                                imageFilter === 'vintage' ? 'sepia(50%) contrast(1.2) brightness(1.1)' : ''}
                              brightness(${imageBrightness}%) 
                              contrast(${imageContrast}%) 
                              saturate(${imageSaturation}%)
                            `
                          }}
                        />
                        
                        {/* Crop Overlay */}
                        {cropMode && (
                          <div 
                            className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"
                            style={{
                              left: `${cropArea.x}%`,
                              top: `${cropArea.y}%`,
                              width: `${cropArea.width}%`,
                              height: `${cropArea.height}%`,
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            }}
                          >
                            <div className="absolute -top-6 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                              Crop Area
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute top-2 left-2 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowImageEditor(!showImageEditor)}
                            className="bg-white/80 backdrop-blur-sm"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <video 
                        src={preview} 
                        controls 
                        className="w-full h-64 rounded-lg"
                      />
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm"
                      onClick={() => handleRemoveMedia(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Image Editor Panel */}
          {showImageEditor && mediaPreviews.length > 0 && mediaFiles[0]?.type.startsWith('image/') && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-4 h-4" />
                <h3 className="font-medium">Edit Image</h3>
              </div>
              
              <div className="space-y-4">
                {/* Crop Mode Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Crop className="w-4 h-4" />
                      Crop
                    </label>
                    <Button
                      type="button"
                      variant={cropMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCropMode(!cropMode)}
                      className="h-8"
                    >
                      {cropMode ? 'Exit Crop' : 'Crop Image'}
                    </Button>
                  </div>
                  
                  {cropMode && (
                    <div className="space-y-3 p-3 bg-background rounded border">
                      <p className="text-xs text-muted-foreground">Adjust crop area:</p>
                      
                      {/* Crop Controls */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium">X Position</label>
                          <Slider
                            value={[cropArea.x]}
                            onValueChange={(value) => setCropArea(prev => ({ ...prev, x: value[0] }))}
                            min={0}
                            max={50}
                            step={1}
                            className="w-full"
                          />
                          <span className="text-xs text-muted-foreground">{cropArea.x}%</span>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium">Y Position</label>
                          <Slider
                            value={[cropArea.y]}
                            onValueChange={(value) => setCropArea(prev => ({ ...prev, y: value[0] }))}
                            min={0}
                            max={50}
                            step={1}
                            className="w-full"
                          />
                          <span className="text-xs text-muted-foreground">{cropArea.y}%</span>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium">Width</label>
                          <Slider
                            value={[cropArea.width]}
                            onValueChange={(value) => setCropArea(prev => ({ ...prev, width: value[0] }))}
                            min={20}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <span className="text-xs text-muted-foreground">{cropArea.width}%</span>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium">Height</label>
                          <Slider
                            value={[cropArea.height]}
                            onValueChange={(value) => setCropArea(prev => ({ ...prev, height: value[0] }))}
                            min={20}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <span className="text-xs text-muted-foreground">{cropArea.height}%</span>
                        </div>
                      </div>
                      
                      {/* Preset Crop Ratios */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCropArea({ x: 0, y: 0, width: 100, height: 100 })}
                          className="text-xs"
                        >
                          Original
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCropArea({ x: 0, y: 12.5, width: 100, height: 75 })}
                          className="text-xs"
                        >
                          4:3
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCropArea({ x: 12.5, y: 0, width: 75, height: 100 })}
                          className="text-xs"
                        >
                          3:4
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCropArea({ x: 0, y: 25, width: 100, height: 50 })}
                          className="text-xs"
                        >
                          16:9
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCropArea({ x: 12.5, y: 12.5, width: 75, height: 75 })}
                          className="text-xs"
                        >
                          1:1
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resize Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <ZoomIn className="w-4 h-4" />
                      Size
                    </label>
                    <span className="text-sm text-muted-foreground">{Math.round(imageScale * 100)}%</span>
                  </div>
                  <Slider
                    value={[imageScale]}
                    onValueChange={(value) => setImageScale(value[0])}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Filter Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filters</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { name: 'None', value: 'none' },
                      { name: 'B&W', value: 'grayscale' },
                      { name: 'Sepia', value: 'sepia' },
                      { name: 'Blur', value: 'blur' },
                      { name: 'Vintage', value: 'vintage' }
                    ].map((filter) => (
                      <Button
                        key={filter.value}
                        type="button"
                        variant={imageFilter === filter.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setImageFilter(filter.value)}
                        className="text-xs"
                      >
                        {filter.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Brightness Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Brightness</label>
                    <span className="text-sm text-muted-foreground">{imageBrightness}%</span>
                  </div>
                  <Slider
                    value={[imageBrightness]}
                    onValueChange={(value) => setImageBrightness(value[0])}
                    min={50}
                    max={150}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Contrast Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Contrast</label>
                    <span className="text-sm text-muted-foreground">{imageContrast}%</span>
                  </div>
                  <Slider
                    value={[imageContrast]}
                    onValueChange={(value) => setImageContrast(value[0])}
                    min={50}
                    max={150}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Saturation Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Saturation</label>
                    <span className="text-sm text-muted-foreground">{imageSaturation}%</span>
                  </div>
                  <Slider
                    value={[imageSaturation]}
                    onValueChange={(value) => setImageSaturation(value[0])}
                    min={0}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Reset Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImageScale(1);
                      setImageFilter('none');
                      setImageBrightness(100);
                      setImageContrast(100);
                      setImageSaturation(100);
                      setCropMode(false);
                      setCropArea({ x: 0, y: 0, width: 100, height: 100 });
                    }}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Media Upload Area */}
          {showMediaUpload && mediaPreviews.length === 0 && (
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">Add photos/videos</p>
              <p className="text-xs text-muted-foreground mb-4">or drag and drop</p>
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileInput}
              >
                Select Files
              </Button>
            </div>
          )}
          
          {/* Post Options */}
          <div className="border border-muted rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Add to your post</p>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={triggerFileInput}
                className="p-2 hover:bg-muted"
                title="Add photos/videos"
              >
                <Image className="w-5 h-5 text-green-500" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Tag people functionality - could open a people picker modal
                  toast({
                    title: "Tag People",
                    description: "People tagging feature coming soon!",
                  });
                }}
                className="p-2 hover:bg-muted"
                title="Tag people"
              >
                <UserRound className="w-5 h-5 text-blue-500" />
              </Button>
              
              {/* Emoji Picker with Custom Implementation */}
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-muted"
                  title="Add emoji"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEmojiPicker(!showEmojiPicker);
                  }}
                >
                  <Smile className="w-5 h-5 text-yellow-500" />
                </Button>
                
                {showEmojiPicker && (
                  <>
                    {/* Backdrop to close picker */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowEmojiPicker(false)}
                    />
                    {/* Emoji Picker Dropdown - Positioned Above */}
                    <div className="absolute bottom-full left-0 mb-2 bg-background border border-border rounded-lg shadow-xl p-3 z-50 w-72 max-h-48 overflow-y-auto">
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Choose an emoji</h4>
                      </div>
                      <div className="grid grid-cols-8 gap-1">
                        {emojiData.map((item) => (
                          <button
                            key={item.emoji}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addEmoji(item.emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-xl hover:bg-muted rounded-md p-2 transition-colors hover:scale-110 transform"
                            title={item.name}
                          >
                            {item.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="p-2 hover:bg-muted"
                title="Add location"
              >
                <MapPin className="w-5 h-5 text-red-500" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Flag/report functionality
                  toast({
                    title: "Flag Content",
                    description: "Content flagging feature coming soon!",
                  });
                }}
                className="p-2 hover:bg-muted"
                title="Flag content"
              >
                <Flag className="w-5 h-5 text-orange-500" />
              </Button>
            </div>
          </div>
          
          {/* Location Picker */}
          {showLocationPicker && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Add Location</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLocationPicker(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Input
                placeholder="Where are you?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mb-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {location ? `Location: ${location}` : 'No location set'}
                </span>
                {location && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation('')}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Display selected location */}
          {location && !showLocationPicker && (
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
              <MapPin className="w-4 h-4 mr-2 text-red-500" />
              <span>at {location}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLocation('')}
                className="ml-auto p-1"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full facebook-blue"
            disabled={createPostMutation.isPending || (!content.trim() && mediaFiles.length === 0)}
          >
            {createPostMutation.isPending ? 'Posting...' : 'Post'}
          </Button>
        </form>
        </DialogContent>
      </Dialog>
    );
  } catch (error) {
    console.error('CreatePostModal render error:', error);
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>There was an error loading the create post form. Please try again.</p>
            <Button onClick={handleClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}
