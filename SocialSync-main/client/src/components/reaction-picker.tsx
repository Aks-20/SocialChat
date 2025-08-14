import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, Laugh, Frown, Angry, Lightbulb, ThumbsUp } from "lucide-react";

interface ReactionPickerProps {
  onReaction: (reactionType: string) => void;
  currentReaction?: string | null;
  disabled?: boolean;
  children: React.ReactNode;
}

const reactions = [
  { type: 'like', emoji: '👍', icon: ThumbsUp, color: 'text-blue-500', label: 'Like' },
  { type: 'love', emoji: '❤️', icon: Heart, color: 'text-red-500', label: 'Love' },
  { type: 'laugh', emoji: '😂', icon: Laugh, color: 'text-yellow-500', label: 'Haha' },
  { type: 'wow', emoji: '😮', icon: Lightbulb, color: 'text-orange-500', label: 'Wow' },
  { type: 'sad', emoji: '😢', icon: Frown, color: 'text-blue-400', label: 'Sad' },
  { type: 'angry', emoji: '😡', icon: Angry, color: 'text-red-600', label: 'Angry' },
];

const extendedReactions = [
  ...reactions,
  { type: 'heart_eyes', emoji: '😍', icon: Heart, color: 'text-pink-500', label: 'Heart Eyes' },
  { type: 'kiss', emoji: '😘', icon: Heart, color: 'text-pink-400', label: 'Kiss' },
  { type: 'wink', emoji: '😉', icon: Lightbulb, color: 'text-yellow-400', label: 'Wink' },
  { type: 'cool', emoji: '😎', icon: Lightbulb, color: 'text-blue-600', label: 'Cool' },
  { type: 'thinking', emoji: '🤔', icon: Lightbulb, color: 'text-gray-500', label: 'Thinking' },
  { type: 'thumbs_down', emoji: '👎', icon: ThumbsUp, color: 'text-red-400', label: 'Dislike' },
  { type: 'clap', emoji: '👏', icon: ThumbsUp, color: 'text-green-500', label: 'Clap' },
  { type: 'fire', emoji: '🔥', icon: Lightbulb, color: 'text-orange-600', label: 'Fire' },
  { type: 'party', emoji: '🎉', icon: Lightbulb, color: 'text-purple-500', label: 'Party' },
  { type: 'shocked', emoji: '😱', icon: Lightbulb, color: 'text-yellow-600', label: 'Shocked' },
  { type: 'confused', emoji: '😕', icon: Frown, color: 'text-gray-600', label: 'Confused' },
  { type: 'sleepy', emoji: '😴', icon: Frown, color: 'text-blue-300', label: 'Sleepy' },
];

export default function ReactionPicker({ onReaction, currentReaction, disabled, children }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showExtended, setShowExtended] = useState(false);

  const handleReaction = (reactionType: string) => {
    onReaction(reactionType);
    setIsOpen(false);
    setShowExtended(false);
  };

  const handleExtendedClick = () => {
    setShowExtended(true);
  };

  const getCurrentReaction = () => {
    return reactions.find(r => r.type === currentReaction);
  };

  const currentReactionData = getCurrentReaction();
  const reactionsToShow = showExtended ? extendedReactions : reactions;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {children}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`w-auto p-3 ${showExtended ? 'max-w-md' : ''}`} align="start" side="top">
        <div className={`grid gap-2 ${showExtended ? 'grid-cols-6' : 'grid-cols-7'}`}>
          {reactionsToShow.map((reaction) => {
            const isSelected = currentReaction === reaction.type;
            
            return (
              <div key={reaction.type} className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-12 w-12 p-0 rounded-full hover:scale-110 transition-all duration-200 ${
                    isSelected ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleReaction(reaction.type);
                  }}
                  title={reaction.label}
                >
                  <span className="text-2xl">
                    {reaction.emoji}
                  </span>
                </Button>
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                  {reaction.label}
                </span>
              </div>
            );
          })}
          {!showExtended && (
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-12 w-12 p-0 rounded-full hover:scale-110 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleExtendedClick();
                }}
                title="More reactions"
              >
                <span className="text-xl text-gray-500">+</span>
              </Button>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                More
              </span>
            </div>
          )}
        </div>
        {showExtended && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => setShowExtended(false)}
            >
              Show less
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { reactions, extendedReactions };