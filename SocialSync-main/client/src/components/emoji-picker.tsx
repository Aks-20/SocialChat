import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smile } from 'lucide-react';

const emojiCategories = {
  smileys: {
    name: 'Smileys & People',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
    ]
  },
  animals: {
    name: 'Animals & Nature',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
      '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕'
    ]
  },
  food: {
    name: 'Food & Drink',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒',
      '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
      '🥒', '🌶', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯',
      '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓',
      '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮'
    ]
  },
  activities: {
    name: 'Activities',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸',
      '🥌', '🎿', '⛷', '🏂', '🪂', '🏋', '🤼', '🤸', '⛹', '🤺',
      '🏌', '🧘', '🏄', '🏇', '🚣', '🏊', '⛹', '🏋', '🚴', '🚵'
    ]
  },
  objects: {
    name: 'Objects',
    emojis: [
      '💎', '🔔', '🔕', '🎵', '🎶', '💰', '💴', '💵', '💶', '💷',
      '💸', '💳', '🧾', '💹', '💱', '💲', '✉', '📧', '📨', '📩',
      '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '🗳', '✏',
      '✒', '🖋', '🖊', '🖌', '🖍', '📝', '💼', '📁', '📂', '🗂',
      '📅', '📆', '🗒', '🗓', '📇', '📈', '📉', '📊', '📋', '📌'
    ]
  },
  symbols: {
    name: 'Symbols',
    emojis: [
      '❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮',
      '✝', '☪', '🕉', '☸', '✡', '🔯', '🕎', '☯', '☦', '🛐',
      '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛', '🉑', '☢', '☣', '📴', '📳'
    ]
  }
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  children?: React.ReactNode;
}

export default function EmojiPicker({ onEmojiSelect, children }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('smileys');

  const filteredEmojis = searchQuery
    ? Object.values(emojiCategories)
        .flatMap(category => category.emojis)
        .filter(emoji => {
          // Simple search - could be enhanced with emoji names/descriptions
          return emoji.includes(searchQuery);
        })
    : emojiCategories[activeCategory as keyof typeof emojiCategories]?.emojis || [];

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Smile className="w-4 h-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />

          {!searchQuery && (
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="smileys" className="text-xs">😀</TabsTrigger>
                <TabsTrigger value="animals" className="text-xs">🐶</TabsTrigger>
                <TabsTrigger value="food" className="text-xs">🍎</TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-3 mt-1">
                <TabsTrigger value="activities" className="text-xs">⚽</TabsTrigger>
                <TabsTrigger value="objects" className="text-xs">💎</TabsTrigger>
                <TabsTrigger value="symbols" className="text-xs">❤</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Emoji Grid */}
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
            {filteredEmojis.map((emoji, index) => (
              <Button
                key={`${emoji}-${index}`}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100"
                onClick={() => handleEmojiClick(emoji)}
              >
                <span className="text-lg">{emoji}</span>
              </Button>
            ))}
          </div>

          {filteredEmojis.length === 0 && searchQuery && (
            <div className="text-center py-4 text-gray-500">
              No emojis found for "{searchQuery}"
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}