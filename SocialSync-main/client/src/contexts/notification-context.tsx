import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface NotificationContextType {
  onlineUsers: Set<number>;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  onlineUsers: new Set(),
  unreadCount: 0,
  setUnreadCount: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

interface WebSocketMessage {
  type: string;
  data: any;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  // WebSocket connection for real-time notifications and online status
  useEffect(() => {
    if (!user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setOnlineUsers(new Set());
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected for notifications');
      // Authenticate the connection
      ws.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (user) {
          // Will trigger useEffect again
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'new_notification':
        // Show toast notification
        toast({
          title: "New Notification",
          description: message.data.message,
          duration: 4000,
        });
        
        // Refresh notifications
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
        break;

      case 'online':
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.add(message.data.userId);
          return newSet;
        });
        break;

      case 'offline':
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(message.data.userId);
          return newSet;
        });
        break;

      case 'user_list':
        // Initial online users list
        setOnlineUsers(new Set(message.data.userIds || []));
        break;

      case 'new_message':
        // Handle message notifications
        if (message.data.senderId !== user?.id) {
          toast({
            title: `New message from ${message.data.senderName}`,
            description: message.data.content.substring(0, 50) + (message.data.content.length > 50 ? '...' : ''),
          });
          
          // Refresh conversations
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        }
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  };

  const value = {
    onlineUsers,
    unreadCount,
    setUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}