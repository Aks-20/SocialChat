import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Story } from '@shared/schema';
import { X, ChevronLeft, ChevronRight, Heart, Send, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StoryViewerProps {
  story: Story & { user: any };
  isOpen: boolean;
  onClose: () => void;
  stories?: (Story & { user: any })[];
  currentIndex?: number;
}

export default function StoryViewer({ 
  story, 
  isOpen, 
  onClose, 
  stories = [story], 
  currentIndex = 0 
}: StoryViewerProps) {
  const [progress, setProgress] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(currentIndex);
  const [isVisible, setIsVisible] = useState(false);

  const currentStory = stories[currentStoryIndex] || story;
  const duration = 5000; // 5 seconds per story

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Auto advance to next story
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            return 0;
          } else {
            // Close viewer when all stories are viewed
            onClose();
            return 0;
          }
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentStoryIndex, stories.length, onClose]);

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleStoryClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    if (clickX < width / 2) {
      handlePrevious();
    } else {
      handleNext();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200); // Wait for animation
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-md w-full h-full md:h-[600px] p-0 bg-black border-none"
        hideClose
      >
        <div className={`relative w-full h-full transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          {/* Progress Bars */}
          <div className="absolute top-4 left-4 right-4 z-20 flex space-x-1">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{
                    width: index < currentStoryIndex 
                      ? '100%' 
                      : index === currentStoryIndex 
                        ? `${progress}%`
                        : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarImage src={currentStory.user.avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {currentStory.user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-white font-semibold text-sm">{currentStory.user.name}</h3>
                <p className="text-white/70 text-xs">
                  {formatDistanceToNow(new Date(currentStory.createdAt!), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Story Content */}
          <div 
            className="w-full h-full cursor-pointer select-none"
            onClick={handleStoryClick}
          >
            {currentStory.imageUrl ? (
              <img 
                src={currentStory.imageUrl} 
                alt="Story" 
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : currentStory.videoUrl ? (
              <video 
                src={currentStory.videoUrl} 
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                {currentStory.text && (
                  <p className="text-white text-xl font-bold text-center px-8">
                    {currentStory.text}
                  </p>
                )}
              </div>
            )}
            
            {/* Story Text Overlay */}
            {currentStory.text && (currentStory.imageUrl || currentStory.videoUrl) && (
              <div className="absolute bottom-20 left-4 right-4">
                <p className="text-white text-lg font-semibold text-center bg-black/50 rounded-lg px-4 py-2">
                  {currentStory.text}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          {currentStoryIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white/70 hover:text-white"
              onClick={handlePrevious}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          
          {currentStoryIndex < stories.length - 1 && (
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white/70 hover:text-white"
              onClick={handleNext}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Story Actions */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Send message"
                  className="w-full bg-white/20 border border-white/30 rounded-full px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Click Areas for Navigation */}
          <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full" onClick={handlePrevious} />
            <div className="w-1/2 h-full" onClick={handleNext} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
