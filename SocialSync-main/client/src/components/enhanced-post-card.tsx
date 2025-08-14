import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, MoreHorizontal, Edit3, Trash2, Reply, Video, Radio, Eye, Clock, Smile } from "lucide-react";
import ReactionPicker, { reactions, extendedReactions } from "@/components/reaction-picker";
import CommentReactionPicker, { commentReactions } from "@/components/comment-reaction-picker";
import EmojiPicker from "@/components/emoji-picker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { usePostViewTracking } from "@/hooks/use-post-view-tracking";
import { formatDistanceToNow } from "date-fns";
import type { PostWithUser, CommentWithUser, Like, User } from "@shared/schema";
import ShareDropdown from "@/components/share-dropdown";

interface EnhancedPostCardProps {
  post: PostWithUser;
}

interface CommentItemProps {
  comment: CommentWithUser;
  postId: number;
  level?: number;
  onReply?: (commentId: number) => void;
}

interface ReactionsTooltipProps {
  postId: number;
  children: React.ReactNode;
}

function ReactionsTooltip({ postId, children }: ReactionsTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: reactions, isLoading } = useQuery({
    queryKey: [`/api/posts/${postId}/reactions`],
    enabled: isOpen,
  });

  const handleClick = () => {
    setIsOpen(true);
  };

  const renderReactionsContent = () => {
    if (isLoading) {
      return <div className="text-gray-500 text-center py-4">Loading reactions...</div>;
    }

    const reactionsArray = (reactions as any[]) || [];
    
    if (reactionsArray.length === 0) {
      return <div className="text-gray-500 text-center py-4">No reactions yet</div>;
    }

    // Group reactions by type with user details
    const reactionGroups: { [key: string]: Array<{name: string, avatar?: string}> } = {};
    reactionsArray.forEach((reaction: any) => {
      const type = reaction.reactionType || 'like';
      const name = reaction.user?.name || reaction.user?.username || reaction.user?.email?.split('@')[0] || 'Unknown User';
      const avatar = reaction.user?.avatar;
      if (!reactionGroups[type]) {
        reactionGroups[type] = [];
      }
      reactionGroups[type].push({ name, avatar });
    });

    return (
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {Object.entries(reactionGroups).map(([type, users]) => {
          const reactionData = extendedReactions.find(r => r.type === type);
          const emoji = reactionData?.emoji || '👍';
          const label = reactionData?.label || 'Like';
          
          return (
            <div key={type} className="space-y-2">
              <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-1">
                <span className="text-lg">{emoji}</span>
                <span className="font-medium text-sm">{label} ({users.length})</span>
              </div>
              <div className="space-y-1 pl-6">
                {users.map((user, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <span 
        onClick={handleClick}
        className="cursor-pointer hover:underline transition-colors"
      >
        {children}
      </span>
      
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reactions</AlertDialogTitle>
            <AlertDialogDescription>
              See who reacted to this post
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            {renderReactionsContent()}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOpen(false)}>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CommentItem({ comment, postId, level = 0, onReply }: CommentItemProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);

  const { data: replies } = useQuery({
    queryKey: [`/api/comments/${comment.id}/replies`],
    enabled: showReplies && level < 2, // Limit nesting to 2 levels
  });

  const commentReactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      const response = await fetch(`/api/comments/${comment.id}/react`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reactionType })
      });
      if (!response.ok) throw new Error('Failed to react to comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (content: string) => fetch(`/api/comments/${comment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/comments/${comment.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
  });

  const handleUpdate = () => {
    if (editContent.trim()) {
      updateMutation.mutate(editContent.trim());
    }
  };

  const handleEmojiSelectEdit = (emoji: string) => {
    setEditContent(prev => prev + emoji);
  };

  return (
    <div className={`${level > 0 ? 'ml-8 mt-2' : 'mt-4'}`}>
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user.avatar || undefined} />
          <AvatarFallback>
            {comment.user.username?.charAt(0).toUpperCase() || comment.user.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">
                  {comment.user.username || comment.user.email}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt!), { addSuffix: true })}
                </span>
              </div>
              
              {user?.id === comment.userId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteMutation.mutate()}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <div className="relative">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] text-sm pr-10"
                  />
                  <div className="absolute right-2 bottom-2">
                    <EmojiPicker onEmojiSelect={handleEmojiSelectEdit}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Smile className="w-3 h-3 text-gray-500" />
                      </Button>
                    </EmojiPicker>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {editContent.length}/1000
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm mt-1">{comment.content}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-1">
            <CommentReactionPicker
              onReaction={(reactionType) => commentReactionMutation.mutate(reactionType)}
              currentReaction={comment.userReaction || null}
              disabled={commentReactionMutation.isPending}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={commentReactionMutation.isPending}
              >
                {comment.userReaction ? (
                  <>
                    <span className="mr-1 text-sm">
                      {commentReactions.find(r => r.type === comment.userReaction)?.emoji || '👍'}
                    </span>
                    <span className={`font-medium ${commentReactions.find(r => r.type === comment.userReaction)?.color || 'text-gray-600'}`}>
                      {comment.likesCount || 0}
                    </span>
                  </>
                ) : (
                  <>
                    <Heart className="h-3 w-3 mr-1 text-gray-400" />
                    <span className="text-gray-600">{comment.likesCount || 0}</span>
                  </>
                )}
              </Button>
            </CommentReactionPicker>
            
            {level < 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onReply?.(comment.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            
            {(comment.repliesCount || 0) > 0 && level < 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? 'Hide' : 'Show'} {comment.repliesCount || 0} replies
              </Button>
            )}
          </div>
          
          {showReplies && replies && Array.isArray(replies) && (
            <div className="mt-2">
              {(replies as CommentWithUser[]).map((reply: CommentWithUser) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  level={level + 1}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EnhancedPostCard({ post }: EnhancedPostCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyToComment, setReplyToComment] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);

  // Track post views automatically
  const viewTrackingRef = usePostViewTracking({ 
    postId: post.id,
    threshold: 0.5,
    delay: 1000
  });

  const { data: comments } = useQuery({
    queryKey: [`/api/posts/${post.id}/comments`],
    enabled: showComments,
  });

  // Fetch real view count data
  const { data: viewData } = useQuery({
    queryKey: [`/api/posts/${post.id}/views`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const likeMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      const response = await fetch(`/api/posts/${post.id}/react`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reactionType })
      });
      if (!response.ok) throw new Error('Failed to react to post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (data: { content: string; parentCommentId?: number }) => {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      setNewComment("");
      setReplyToComment(null);
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to update post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      console.error('Failed to update post:', error);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${post.id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete post: ${errorText}`);
      }
      const responseText = await response.text();
      return responseText ? JSON.parse(responseText) : { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      console.error('Failed to delete post:', error);
    },
  });

  const handleComment = () => {
    if (newComment.trim()) {
      commentMutation.mutate({
        content: newComment.trim(),
        parentCommentId: replyToComment || undefined,
      });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewComment(prev => prev + emoji);
  };

  const handleReply = (commentId: number) => {
    setReplyToComment(commentId);
    setShowComments(true);
  };

  const handleUpdatePost = () => {
    if (editContent.trim()) {
      updatePostMutation.mutate(editContent.trim());
    }
  };

  const handleDeletePost = () => {
    deletePostMutation.mutate();
    setShowDeleteDialog(false);
  };

  return (
    <Card id={`post-${post.id}`} ref={viewTrackingRef} className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.user.avatar || undefined} />
              <AvatarFallback>
                {post.user.username?.charAt(0).toUpperCase() || post.user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">
                  {post.user.username || post.user.email}
                </h3>
                {post.liveStreamId && (
                  <Badge variant="secondary" className="flex items-center space-x-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                    <Radio className="w-3 h-3" />
                    <span className="text-xs">Live Stream</span>
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt!), { addSuffix: true })}
                </p>
                {post.expiresAt && (() => {
                  const expiresDate = new Date(post.expiresAt);
                  const timeLeft = expiresDate.getTime() - Date.now();
                  const hoursLeft = timeLeft / (1000 * 60 * 60);
                  
                  // More user-friendly color scheme
                  let textColor, icon;
                  if (hoursLeft < 1) {
                    textColor = "text-red-600 dark:text-red-400";
                    icon = "⚠️";
                  } else if (hoursLeft < 6) {
                    textColor = "text-amber-600 dark:text-amber-400";
                    icon = "⏰";
                  } else {
                    textColor = "text-blue-600 dark:text-blue-400";
                    icon = "📅";
                  }
                  
                  return (
                    <div className={`flex items-center space-x-1 text-xs ${textColor}`}>
                      <Clock className="w-3 h-3" />
                      <span>
                        {icon} Expires {formatDistanceToNow(expiresDate, { addSuffix: true })}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          
          {user?.id === post.userId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="relative">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] pr-12"
                placeholder="What's on your mind?"
              />
              <div className="absolute bottom-3 right-3">
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                    className="h-8 w-8 p-0"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  {showEditEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 bg-background border border-border rounded-lg shadow-lg p-3 z-50 w-80 max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-8 gap-1">
                        {['😀', '😁', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '🔥', '💯', '✨', '⭐', '🌟', '💫', '🎉', '🎊', '🎈', '🎁', '🏆'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setEditContent(prev => prev + emoji);
                              setShowEditEmojiPicker(false);
                            }}
                            className="text-lg hover:bg-muted rounded p-1 transition-colors"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleUpdatePost} disabled={updatePostMutation.isPending}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setShowEditEmojiPicker(false);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {(post.content || (!post.content && !post.imageUrl && !post.videoUrl)) && (
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {post.content || "This post has no content yet."}
              </p>
            )}

            {post.imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt="Post content"
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {post.videoUrl && (
              <div className="rounded-lg overflow-hidden">
                <video
                  src={post.videoUrl}
                  controls
                  className="w-full h-auto"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <ReactionPicker 
              onReaction={(reactionType) => likeMutation.mutate(reactionType)}
              currentReaction={post.userReaction || null}
              disabled={likeMutation.isPending}
            >
              <div className="flex items-center space-x-2 px-3 py-2">
                {post.userReaction ? (
                  <>
                    <span className="text-lg">
                      {extendedReactions.find(r => r.type === post.userReaction)?.emoji || '👍'}
                    </span>
                    <ReactionsTooltip postId={post.id}>
                      <span className={extendedReactions.find(r => r.type === post.userReaction)?.color || 'text-gray-600'}>
                        {post.likesCount || 0}
                      </span>
                    </ReactionsTooltip>
                  </>
                ) : (
                  <>
                    <Heart className="h-5 w-5" />
                    <ReactionsTooltip postId={post.id}>
                      <span>{post.likesCount || 0}</span>
                    </ReactionsTooltip>
                  </>
                )}
              </div>
            </ReactionPicker>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.commentsCount || 0}</span>
            </Button>

            <ShareDropdown post={post} />
            
            <div className="flex items-center space-x-1 text-gray-500">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{(viewData as any)?.viewCount || post.viewsCount || 0}</span>
            </div>
          </div>
        </div>

        {showComments && (
          <div className="space-y-4">
            <Separator />
            
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback>
                  {user?.username?.charAt(0).toUpperCase() || user?.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                {replyToComment && (
                  <Badge variant="secondary" className="text-xs">
                    Replying to comment
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2"
                      onClick={() => setReplyToComment(null)}
                    >
                      ×
                    </Button>
                  </Badge>
                )}
                <div className="relative">
                  <Textarea
                    placeholder={replyToComment ? "Write a reply..." : "Write a comment..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] pr-12"
                  />
                  <div className="absolute right-2 bottom-2">
                    <EmojiPicker onEmojiSelect={handleEmojiSelect}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Smile className="w-4 h-4 text-gray-500" />
                      </Button>
                    </EmojiPicker>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {newComment.length}/1000
                  </div>
                  <Button
                    onClick={handleComment}
                    disabled={!newComment.trim() || commentMutation.isPending}
                    size="sm"
                  >
                    {replyToComment ? 'Reply' : 'Comment'}
                  </Button>
                </div>
              </div>
            </div>

            {comments && Array.isArray(comments) && comments.length > 0 && (
              <div className="space-y-2">
                {(comments as CommentWithUser[]).map((comment: CommentWithUser) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                    onReply={handleReply}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}