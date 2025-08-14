import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserInitials } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Share, 
  Settings,
  Check,
  X,
  Bell,
  BellOff
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { NotificationWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsDropdown({ 
  isOpen, 
  onClose 
}: NotificationsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [, navigate] = useLocation();
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    likesComments: true,
    follows: true,
    messages: true,
    posts: true,
    mentions: true,
    marketing: false
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: isOpen,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onMutate: async (notificationId: number) => {
      // Optimistically update the notification to read
      queryClient.setQueryData(['/api/notifications'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((n: any) => 
          n.id === notificationId ? { ...n, isRead: true } : n
        );
      });
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onMutate: async () => {
      // Optimistically mark all notifications as read
      queryClient.setQueryData(['/api/notifications'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((n: any) => ({ ...n, isRead: true }));
      });
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'share':
        return <Share className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: NotificationWithUser) => {
    const userName = notification.fromUser.name || notification.fromUser.username;
    
    switch (notification.type) {
      case 'like':
        return `${userName} liked your post`;
      case 'comment':
        return `${userName} commented on your post`;
      case 'follow':
        return `${userName} started following you`;
      case 'share':
        return `${userName} shared your post`;
      default:
        return notification.content || 'New notification';
    }
  };

  const unreadCount = notifications.filter((n: NotificationWithUser) => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <Badge className="ml-2 h-5 px-2 text-xs bg-blue-600">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 text-xs h-auto p-1"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all read
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1"
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <div className="text-sm text-gray-500 mb-1">No notifications yet</div>
            <div className="text-xs text-gray-400">
              When you get notifications, they'll show up here
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification: NotificationWithUser) => (
              <div 
                key={notification.id}
                className={`flex items-start p-4 hover:bg-gray-50 cursor-pointer relative ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  // Mark as read if unread
                  if (!notification.isRead) {
                    markAsReadMutation.mutate(notification.id);
                  }
                  
                  // Close the dropdown first
                  onClose();
                  
                  // Navigate based on notification type
                  if (notification.postId) {
                    // For post-related notifications (like, comment, share), navigate to the specific post
                    // First try to navigate to home page with post focus
                    navigate('/');
                    
                    // Use a longer timeout to ensure page loads, then try to scroll to post
                    setTimeout(() => {
                      const postElement = document.getElementById(`post-${notification.postId}`);
                      if (postElement) {
                        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Highlight the post briefly
                        postElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        setTimeout(() => {
                          postElement.style.backgroundColor = '';
                        }, 2000);
                      } else {
                        // If post not found on feed, try to load it directly
                        // This could happen if the post is not in the current feed view
                        console.log(`Post ${notification.postId} not found in current feed`);
                      }
                    }, 500);
                  } else if (notification.type === 'follow') {
                    // Navigate to user profile for follow notifications
                    navigate(`/profile/${notification.fromUserId}`);
                  } else if (notification.type === 'message') {
                    // Navigate to messages for message notifications
                    navigate(`/messages/${notification.fromUserId}`);
                  } else {
                    // For other notification types, navigate to full notifications page
                    navigate('/notifications');
                  }
                }}
              >
                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="absolute left-2 top-6 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}

                {/* User Avatar */}
                <div className="relative mr-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notification.fromUser.avatar || ""} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {getUserInitials(notification.fromUser)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Notification type icon */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-white flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 mb-1">
                    <span className="font-medium">
                      {notification.fromUser.name || notification.fromUser.username}
                    </span>
                    <span className="ml-1">
                      {getNotificationText(notification).replace(
                        notification.fromUser.name || notification.fromUser.username, 
                        ''
                      )}
                    </span>
                  </div>
                  
                  {/* Post preview if applicable */}
                  {notification.post && (
                    <div className="text-xs text-gray-500 bg-gray-100 rounded p-2 mt-2 line-clamp-2">
                      {notification.post.content}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                    
                    {/* Action buttons for certain notification types */}
                    {notification.type === 'follow' && (
                      <div className="flex space-x-2">
                        <Button size="sm" className="h-7 px-3 text-xs">
                          Follow Back
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
                          View Profile
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mark as read button */}
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 p-1 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsReadMutation.mutate(notification.id);
                    }}
                  >
                    <Check className="h-3 w-3 text-gray-400" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 p-3">
          <Link href="/notifications">
            <Button 
              variant="ghost" 
              className="w-full text-blue-600 text-sm h-auto p-2"
              onClick={onClose}
            >
              See All Notifications
            </Button>
          </Link>
        </div>
      )}
      
      {/* Notification Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications on your device
                </p>
              </div>
              <Switch
                checked={notificationSettings.pushNotifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, pushNotifications: checked})
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, emailNotifications: checked})
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Likes and Comments</Label>
                <p className="text-sm text-muted-foreground">
                  When someone likes or comments on your posts
                </p>
              </div>
              <Switch
                checked={notificationSettings.likesComments}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, likesComments: checked})
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>New Followers</Label>
                <p className="text-sm text-muted-foreground">
                  When someone starts following you
                </p>
              </div>
              <Switch
                checked={notificationSettings.follows}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, follows: checked})
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Messages</Label>
                <p className="text-sm text-muted-foreground">
                  When you receive new messages
                </p>
              </div>
              <Switch
                checked={notificationSettings.messages}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, messages: checked})
                }
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setShowSettingsModal(false);
                  toast({
                    title: "Settings saved",
                    description: "Your notification preferences have been updated.",
                  });
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}