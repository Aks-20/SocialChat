import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, ThumbsUp, Laugh, Lightbulb, Frown, Angry } from 'lucide-react';

const commentReactions = [
  { type: 'like', emoji: '👍', icon: ThumbsUp, color: 'text-blue-500', label: 'Like' },
  { type: 'love', emoji: '❤️', icon: Heart, color: 'text-red-500', label: 'Love' },
  { type: 'laugh', emoji: '😂', icon: Laugh, color: 'text-yellow-500', label: 'Haha' },
  { type: 'wow', emoji: '😮', icon: Lightbulb, color: 'text-orange-500', label: 'Wow' },
  { type: 'sad', emoji: '😢', icon: Frown, color: 'text-blue-400', label: 'Sad' },
  { type: 'angry', emoji: '😡', icon: Angry, color: 'text-red-600', label: 'Angry' },
];

interface CommentReactionPickerProps {
  onReaction: (reactionType: string) => void;
  currentReaction?: string | null;
  disabled?: boolean;
  children: React.ReactNode;
}

export default function CommentReactionPicker({ 
  onReaction, 
  currentReaction, 
  disabled = false, 
  children 
}: CommentReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleReactionClick = (reactionType: string) => {
    onReaction(reactionType);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex space-x-1">
          {commentReactions.map((reaction) => (
            <Button
              key={reaction.type}
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 hover:scale-110 transition-transform ${
                currentReaction === reaction.type ? 'bg-gray-100 dark:bg-gray-800' : ''
              }`}
              onClick={() => handleReactionClick(reaction.type)}
              title={reaction.label}
            >
              <span className="text-lg">{reaction.emoji}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { commentReactions };