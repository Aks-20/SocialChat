import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './use-auth';

export interface WebSocketMessage {
  type: 'message' | 'new_message' | 'message_sent' | 'typing' | 'message_read' | 'online' | 'offline' | 'user_status' | 'user_list' | 'new_notification';
  data: any;
}

export interface TypingIndicator {
  userId: number;
  conversationId: string;
  isTyping: boolean;
}

export interface UserStatus {
  userId: number;
  status: 'online' | 'offline' | 'away' | 'busy' | 'dnd';
}

export function useWebSocket() {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<number>>>(new Map());
  const [userStatuses, setUserStatuses] = useState<Map<number, string>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Message handlers
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());

  const connect = useCallback(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      // Authenticate the connection
      ws.send(JSON.stringify({
        type: 'join',
        userId: user.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [user]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'user_list':
        setOnlineUsers(new Set(message.data.userIds || []));
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
        setUserStatuses(prev => {
          const newMap = new Map(prev);
          newMap.set(message.data.userId, 'offline');
          return newMap;
        });
        break;

      case 'user_status':
        setUserStatuses(prev => {
          const newMap = new Map(prev);
          newMap.set(message.data.userId, message.data.status);
          return newMap;
        });
        break;

      case 'typing':
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          const conversationId = message.data.conversationId;
          
          if (!newMap.has(conversationId)) {
            newMap.set(conversationId, new Set());
          }
          
          const typingSet = newMap.get(conversationId)!;
          if (message.data.isTyping) {
            typingSet.add(message.data.userId);
          } else {
            typingSet.delete(message.data.userId);
          }
          
          if (typingSet.size === 0) {
            newMap.delete(conversationId);
          }
          
          return newMap;
        });
        break;

      case 'message_read':
        // Handle read receipts
        const handler = messageHandlers.current.get('message_read');
        if (handler) {
          handler(message.data);
        }
        break;

      case 'new_message':
      case 'message_sent':
      case 'new_notification':
        // Forward to specific handlers
        const messageHandler = messageHandlers.current.get(message.type);
        if (messageHandler) {
          messageHandler(message.data);
        }
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }, []);

  // Send message
  const sendMessage = useCallback((receiverId: number, content: string, imageUrl?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const messageData = {
      receiverId,
      content,
      imageUrl,
      timestamp: new Date().toISOString()
    };

    wsRef.current.send(JSON.stringify({
      type: 'message',
      data: messageData
    }));

    return messageData;
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((conversationId: string, isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'typing',
      data: { conversationId, isTyping }
    }));
  }, []);

  // Send read receipt
  const sendReadReceipt = useCallback((messageId: number, conversationId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'mark_read',
      data: { messageId, conversationId }
    }));
  }, []);

  // Send status update
  const sendStatusUpdate = useCallback((status: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'status_update',
      data: { status }
    }));
  }, []);

  // Join/leave conversation
  const joinConversation = useCallback((conversationId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'join_conversation',
      data: { conversationId }
    }));
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'leave_conversation',
      data: { conversationId }
    }));
  }, []);

  // Register message handlers
  const onMessage = useCallback((type: string, handler: (data: any) => void) => {
    messageHandlers.current.set(type, handler);
  }, []);

  // Remove message handler
  const offMessage = useCallback((type: string) => {
    messageHandlers.current.delete(type);
  }, []);

  // Check if user is typing in a conversation
  const isUserTyping = useCallback((conversationId: string, userId: number) => {
    const typingSet = typingUsers.get(conversationId);
    return typingSet ? typingSet.has(userId) : false;
  }, [typingUsers]);

  // Get typing users for a conversation
  const getTypingUsers = useCallback((conversationId: string) => {
    return Array.from(typingUsers.get(conversationId) || []);
  }, [typingUsers]);

  // Check if user is online
  const isUserOnline = useCallback((userId: number) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Get user status
  const getUserStatus = useCallback((userId: number) => {
    return userStatuses.get(userId) || 'offline';
  }, [userStatuses]);

  // Initialize connection
  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, connect]);

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    userStatuses,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    sendStatusUpdate,
    joinConversation,
    leaveConversation,
    onMessage,
    offMessage,
    isUserTyping,
    getTypingUsers,
    isUserOnline,
    getUserStatus
  };
} 