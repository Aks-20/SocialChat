import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  MessageCircle,
  Mail,
  Link as LinkIcon
} from 'lucide-react';

interface SharePostButtonProps {
  postId: number;
  postContent: string;
  className?: string;
}

export default function SharePostButton({ postId, postContent, className }: SharePostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const postUrl = `${window.location.origin}/posts/${postId}`;
  const shareText = postContent.length > 100 
    ? `${postContent.substring(0, 100)}...` 
    : postContent;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast({
        title: "Link copied!",
        description: "Post link has been copied to your clipboard.",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the link manually.",
        variant: "destructive",
      });
    }
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: Copy,
      action: copyToClipboard,
      color: 'text-gray-600 hover:text-gray-800'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
        setIsOpen(false);
      },
      color: 'text-blue-600 hover:text-blue-800'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      action: () => {
        const text = `Check out this post: ${shareText}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`, '_blank');
        setIsOpen(false);
      },
      color: 'text-blue-400 hover:text-blue-600'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      action: () => {
        const text = `Check out this post: ${shareText} ${postUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        setIsOpen(false);
      },
      color: 'text-green-600 hover:text-green-800'
    },
    {
      name: 'Email',
      icon: Mail,
      action: () => {
        const subject = 'Check out this post on SocialConnect';
        const body = `Hi,\n\nI thought you might find this post interesting:\n\n"${shareText}"\n\nView it here: ${postUrl}\n\nBest regards`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
        setIsOpen(false);
      },
      color: 'text-purple-600 hover:text-purple-800'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this post</DialogTitle>
        </DialogHeader>
        
        {/* Direct link copy */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Input
                value={postUrl}
                readOnly
                className="text-sm"
              />
            </div>
            <Button onClick={copyToClipboard} size="sm">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Share options */}
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <Button
                  key={option.name}
                  variant="outline"
                  onClick={option.action}
                  className={`flex items-center justify-center space-x-2 h-12 ${option.color}`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-sm">{option.name}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}