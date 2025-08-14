import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { NotificationWithUser } from '@shared/schema';
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Share2, 
  Users, 
  Cake,
  Check,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type NotificationFilter = 'all' | 'likes' | 'comments' | 'follows' | 'mentions';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json() as Promise<NotificationWithUser[]>;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "All notifications marked as read",
        description: "Your notifications have been updated.",
      });
    },
  });

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'share':
        return <Share2 className="w-4 h-4 text-purple-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification: NotificationWithUser) => {
    switch (notification.type) {
      case 'like':
        return `${notification.fromUser.name} liked your ${notification.post ? 'post' : 'content'}.`;
      case 'comment':
        return `${notification.fromUser.name} commented on your post.`;
      case 'follow':
        return `${notification.fromUser.name} started following you.`;
      case 'share':
        return `${notification.fromUser.name} shared your post.`;
      default:
        return `${notification.fromUser.name} interacted with your content.`;
    }
  };

  const filteredNotifications = notifications?.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'likes') return notification.type === 'like';
    if (filter === 'comments') return notification.type === 'comment';
    if (filter === 'follows') return notification.type === 'follow';
    if (filter === 'mentions') return notification.type === 'mention';
    return true;
  }) || [];

  // Debug logging
  console.log('All notifications:', notifications);
  console.log('Filter:', filter);
  console.log('Filtered notifications:', filteredNotifications);
  console.log('Filtered length:', filteredNotifications.length);
  console.log('Notification types:', notifications?.map(n => n.type));
  console.log('First notification structure:', notifications?.[0]);

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const filterOptions: { key: NotificationFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: notifications?.length || 0 },
    { key: 'likes', label: 'Likes', count: notifications?.filter(n => n.type === 'like').length || 0 },
    { key: 'comments', label: 'Comments', count: notifications?.filter(n => n.type === 'comment').length || 0 },
    { key: 'follows', label: 'Follows', count: notifications?.filter(n => n.type === 'follow').length || 0 },
    { key: 'mentions', label: 'Mentions', count: notifications?.filter(n => n.type === 'mention').length || 0 },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Notifications</h2>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>
      
      {/* Notification Filters */}
      <Card className="p-4 mb-6">
        <div className="flex space-x-2 overflow-x-auto">
          {filterOptions.map((option) => (
            <Button
              key={option.key}
              variant={filter === option.key ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setFilter(option.key)}
            >
              {option.label}
              {option.count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {option.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </Card>
      
      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start space-x-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredNotifications.length > 0 ? (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-colors hover:bg-muted/50 cursor-pointer ${
                !notification.isRead ? 'bg-blue-50 border-l-4 border-[hsl(221,44%,41%)]' : ''
              }`}
              onClick={() => {
                // Mark as read if unread
                if (!notification.isRead) {
                  handleMarkRead(notification.id);
                }
                
                // Navigate based on notification type
                if (notification.postId) {
                  // For post-related notifications, navigate to home page
                  navigate('/');
                  setTimeout(() => {
                    const postElement = document.getElementById(`post-${notification.postId}`);
                    if (postElement) {
                      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Highlight the post briefly
                      postElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                      setTimeout(() => {
                        postElement.style.backgroundColor = '';
                      }, 2000);
                    }
                  }, 500);
                } else if (notification.type === 'follow') {
                  // Navigate to user profile for follow notifications
                  navigate(`/profile/${notification.fromUserId}`);
                } else if (notification.type === 'message') {
                  // Navigate to messages for message notifications
                  navigate(`/messages/${notification.fromUserId}`);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={notification.fromUser.avatar || undefined} />
                      <AvatarFallback>
                        {notification.fromUser.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-background">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{notification.fromUser.name}</span>
                      {' '}
                      {getNotificationMessage(notification).split(notification.fromUser.name)[1]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt!), { addSuffix: true })}
                    </p>
                    
                    {/* Action Buttons for specific notification types */}
                    {notification.type === 'follow' && !notification.isRead && (
                      <div className="flex space-x-2 mt-2">
                        <Button size="sm" className="facebook-blue">
                          Follow back
                        </Button>
                        <Button size="sm" variant="outline">
                          View profile
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!notification.isRead && (
                      <div className="w-3 h-3 bg-[hsl(221,44%,41%)] rounded-full"></div>
                    )}
                    
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleMarkRead(notification.id);
                        }}
                        disabled={markReadMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Post preview for post-related notifications */}
                {notification.post && (
                  <div className="mt-3 ml-15 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.post.content || 'Post content'}
                    </p>
                  </div>
                )}
              </CardContent>
              </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  {getNotificationIcon('default')}
                </div>
                <p className="text-lg font-medium mb-2">
                  {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
                </p>
                <p>
                  {filter === 'all' 
                    ? "When people interact with your posts, you'll see it here." 
                    : `No ${filter} notifications to show.`
                  }
                </p>
              </div>
            </Card>
          )}
        </>
      )}
      
      {/* Load More */}
      {filteredNotifications.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline">
            View older notifications
          </Button>
        </div>
      )}
    </div>
  );
}
