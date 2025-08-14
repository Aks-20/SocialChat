import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { PostWithUser, Comment } from '@shared/schema';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Globe,
  Users,
  Lock,
  Bookmark,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: PostWithUser;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { data: comments } = useQuery({
    queryKey: ['/api/posts', post.id, 'comments'],
    queryFn: async () => {
      const response = await api.getComments(post.id);
      return response.json() as Promise<(Comment & { user: any })[]>;
    },
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: () => api.likePost(post.id),
    onSuccess: async (response) => {
      const result = await response.json();
      queryClient.setQueryData(['/api/posts'], (oldData: PostWithUser[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                isLiked: result.liked,
                likesCount: result.liked ? p.likesCount + 1 : p.likesCount - 1
              }
            : p
        );
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => fetch(`/api/posts/${post.id}/save`, {
      method: 'POST',
      credentials: 'include',
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post saved to your collection",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to save post",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.createComment(post.id, content),
    onSuccess: async (response) => {
      const newComment = await response.json();
      queryClient.setQueryData(['/api/posts', post.id, 'comments'], (oldData: any[] | undefined) => {
        return oldData ? [...oldData, newComment] : [newComment];
      });
      queryClient.setQueryData(['/api/posts'], (oldData: PostWithUser[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(p => 
          p.id === post.id 
            ? { ...p, commentsCount: p.commentsCount + 1 }
            : p
        );
      });
      setCommentText('');
      toast({
        title: "Comment added!",
        description: "Your comment has been posted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      commentMutation.mutate(commentText.trim());
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${post.user.name} on SocialConnect`,
        text: post.content || 'Check out this post!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Post link has been copied to clipboard.",
      });
    }
  };

  const getPrivacyIcon = () => {
    switch (post.privacy) {
      case 'public':
        return <Globe className="w-3 h-3" />;
      case 'friends':
        return <Users className="w-3 h-3" />;
      case 'private':
        return <Lock className="w-3 h-3" />;
      default:
        return <Globe className="w-3 h-3" />;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.user.avatar || undefined} />
              <AvatarFallback>
                {post.user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold">{post.user.name}</h4>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(post.createdAt!), { addSuffix: true })}
                </span>
                <span>•</span>
                {getPrivacyIcon()}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {post.content && (
          <p className="mb-3 text-sm leading-relaxed">{post.content}</p>
        )}
        
        {post.imageUrl && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img 
              src={post.imageUrl} 
              alt="Post content" 
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}
        
        {post.videoUrl && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <video 
              src={post.videoUrl} 
              controls 
              className="w-full h-auto max-h-96"
            />
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            {post.likesCount > 0 && (
              <>
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <Heart className="w-3 h-3 text-white fill-current" />
                  </div>
                </div>
                <span className="ml-2">{post.likesCount} likes</span>
              </>
            )}
          </div>
          <div className="flex space-x-4">
            {post.commentsCount > 0 && (
              <span>{post.commentsCount} comments</span>
            )}
            {post.sharesCount > 0 && (
              <span>{post.sharesCount} shares</span>
            )}
          </div>
        </div>

        <Separator className="mb-3" />

        {/* Action Buttons */}
        <div className="flex justify-around">
          <Button
            variant="ghost"
            size="sm"
            className={`post-action-btn ${post.isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={likeMutation.isPending}
          >
            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
            <span>Like</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="post-action-btn"
            onClick={handleComment}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comment</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="post-action-btn"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {comments?.map((comment) => (
              <div key={comment.id} className="flex space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.user.avatar || undefined} />
                  <AvatarFallback>
                    {comment.user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted rounded-2xl px-3 py-2">
                  <p className="font-semibold text-sm">{comment.user.name}</p>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))}

            {/* Add Comment */}
            <form onSubmit={handleSubmitComment} className="flex space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex space-x-2">
                <Input
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-muted border-none"
                  disabled={commentMutation.isPending}
                />
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={!commentText.trim() || commentMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
