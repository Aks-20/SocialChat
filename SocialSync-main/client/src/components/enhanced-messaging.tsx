import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { MessageWithUser, User } from '@shared/schema';
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  Info, 
  MoreHorizontal,
  ArrowLeft,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Camera,
  Mic,
  ThumbsUp,
  Heart,
  Laugh,
  Angry,
  Circle,
  Frown
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'online' | 'offline';
  data: any;
}

const EMOJI_REACTIONS = [
  { emoji: '👍', icon: ThumbsUp, name: 'like' },
  { emoji: '❤️', icon: Heart, name: 'love' },
  { emoji: '😂', icon: Laugh, name: 'laugh' },
  { emoji: '😮', icon: Circle, name: 'wow' },
  { emoji: '😢', icon: Frown, name: 'sad' },
  { emoji: '😡', icon: Angry, name: 'angry' }
];

const EMOJI_PICKER = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
  '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
  '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
  '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
  '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄',
  '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵',
  '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠',
  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
  '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎',
  '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'
];

export default function EnhancedMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const { userId: paramUserId } = useParams();
  const [selectedConversation, setSelectedConversation] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageWithUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const wsRef = useRef<WebSocket | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({
        type: 'join',
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
          // Recreate connection
        }
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'message':
        // Invalidate conversations and specific conversation queries
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        if (selectedConversation) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations', selectedConversation.id] 
          });
        }
        // Show notification if message is not from current user
        if (message.data.senderId !== user?.id) {
          toast({
            title: `New message from ${message.data.senderName}`,
            description: message.data.content.substring(0, 50) + (message.data.content.length > 50 ? '...' : ''),
          });
        }
        break;
      case 'typing':
        if (message.data.userId !== user?.id) {
          setTypingUsers(prev => new Set([...prev, message.data.userId]));
          // Clear typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(message.data.userId);
              return newSet;
            });
          }, 3000);
        }
        break;
      case 'online':
        setOnlineUsers(prev => new Set([...prev, message.data.userId]));
        break;
      case 'offline':
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(message.data.userId);
          return newSet;
        });
        break;
    }
  };

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const response = await api.getConversations();
      return response.json() as Promise<MessageWithUser[]>;
    },
    refetchInterval: 5000, // Fallback polling every 5 seconds
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await api.getConversation(selectedConversation.id);
      return response.json() as Promise<MessageWithUser[]>;
    },
    enabled: !!selectedConversation,
    refetchInterval: 2000, // Fallback polling every 2 seconds
  });

  // Handle URL parameters
  useEffect(() => {
    if (paramUserId && conversations) {
      const targetUserId = parseInt(paramUserId);
      const conversation = conversations.find(conv => {
        const otherUserId = conv.senderId === user?.id ? conv.receiverId : conv.senderId;
        return otherUserId === targetUserId;
      });
      
      if (conversation) {
        const otherUser = conversation.senderId === user?.id ? conversation.receiver : conversation.sender;
        setSelectedConversation(otherUser);
      }
    }
  }, [paramUserId, conversations, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send typing indicator
  const handleTyping = () => {
    if (!isTyping && selectedConversation && wsRef.current) {
      setIsTyping(true);
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        conversationId: selectedConversation.id,
        userId: user?.id
      }));
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.sendMessage(selectedConversation!.id, content);
      const newMessage = await response.json();
      
      // Send via WebSocket for real-time delivery
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'message',
          data: {
            ...newMessage,
            senderName: user?.name
          }
        }));
      }
      
      return newMessage;
    },
    onSuccess: () => {
      setMessageText('');
      setReplyingTo(null);
      setIsTyping(false);
      // Focus back to input
      messageInputRef.current?.focus();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageText.trim();
    if (!content || !selectedConversation || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(content);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    } else {
      handleTyping();
    }
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const handleConversationSelect = (message: MessageWithUser) => {
    const otherUser = message.senderId === user?.id ? message.receiver : message.sender;
    setSelectedConversation(otherUser);
    setLocation(`/messages/${otherUser.id}`);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setLocation('/messages');
  };

  // Process conversations
  const uniqueConversations = conversations
    ?.reduce((acc, message) => {
      const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
      const existing = acc.find(m => {
        const uid = m.senderId === user?.id ? m.receiverId : m.senderId;
        return uid === otherUserId;
      });
      
      if (!existing || new Date(message.createdAt!) > new Date(existing.createdAt!)) {
        if (existing) {
          const index = acc.indexOf(existing);
          acc[index] = message;
        } else {
          acc.push(message);
        }
      }
      return acc;
    }, [] as MessageWithUser[])
    ?.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()) || [];

  const filteredConversations = uniqueConversations.filter(message => {
    const otherUser = message.senderId === user?.id ? message.receiver : message.sender;
    return otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Card className="overflow-hidden h-[calc(100vh-120px)]">
        <div className="flex h-full">
          
          {/* Conversations Sidebar */}
          <div className={`w-full md:w-80 border-r border-border ${selectedConversation ? 'hidden md:block' : ''}`}>
            <div className="p-4 border-b border-border bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Messages</h2>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  className="pl-10 bg-muted border-none rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="h-full">
              {conversationsLoading ? (
                <div className="space-y-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="p-3 flex items-center space-x-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredConversations.map((message) => {
                    const otherUser = message.senderId === user?.id ? message.receiver : message.sender;
                    const isSelected = selectedConversation?.id === otherUser.id;
                    const isUnread = !message.readAt && message.receiverId === user?.id;
                    const isOnline = onlineUsers.has(otherUser.id);
                    
                    return (
                      <div
                        key={`${message.senderId}-${message.receiverId}`}
                        className={`p-3 hover:bg-muted cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                        }`}
                        onClick={() => handleConversationSelect(message)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={otherUser.avatar || undefined} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                {otherUser.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`truncate ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                                {otherUser.name}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.createdAt!), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className={`text-sm truncate ${isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                {message.senderId === user?.id ? 'You: ' : ''}{message.content}
                              </p>
                              {isUnread && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 flex-shrink-0"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8" />
                  </div>
                  <p className="font-medium">No conversations found</p>
                  <p className="text-sm">Try searching for someone to start a conversation</p>
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Chat Area */}
          <div className={`flex-col flex-1 ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-white dark:bg-gray-900 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedConversation.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {selectedConversation.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {onlineUsers.has(selectedConversation.id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {onlineUsers.has(selectedConversation.id) ? 'Active now' : 'Last seen recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs ${i % 2 === 0 ? 'bg-blue-100' : 'bg-gray-100'} rounded-lg p-3`}>
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-3">
                      {messages.map((message, index) => {
                        const isFromCurrentUser = message.senderId === user?.id;
                        const showAvatar = !isFromCurrentUser && (
                          index === 0 || 
                          messages[index - 1]?.senderId !== message.senderId
                        );
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex items-end space-x-2 ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isFromCurrentUser && (
                              <Avatar className={`w-6 h-6 ${showAvatar ? 'visible' : 'invisible'}`}>
                                <AvatarImage src={message.sender.avatar || undefined} />
                                <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                  {message.sender.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`max-w-xs lg:max-w-md ${isFromCurrentUser ? 'order-1' : ''}`}>
                              <div
                                className={`px-4 py-2 rounded-2xl ${
                                  isFromCurrentUser
                                    ? 'bg-blue-600 text-white rounded-br-md'
                                    : 'bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-md'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
                              <div className={`flex items-center mt-1 space-x-1 ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(new Date(message.createdAt!))}
                                </span>
                                {isFromCurrentUser && message.readAt && (
                                  <span className="text-xs text-blue-600">✓✓</span>
                                )}
                                {isFromCurrentUser && !message.readAt && (
                                  <span className="text-xs text-gray-400">✓</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Typing indicator */}
                      {typingUsers.has(selectedConversation.id) && (
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={selectedConversation.avatar || undefined} />
                            <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              {selectedConversation.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                        <Send className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium mb-1">Start the conversation</p>
                      <p className="text-muted-foreground">Send a message to get started</p>
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border bg-white dark:bg-gray-900">
                  {replyingTo && (
                    <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">Replying to: </span>
                        <span className="text-muted-foreground">{replyingTo.content.substring(0, 50)}...</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                        ×
                      </Button>
                    </div>
                  )}
                  
                  <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                    <div className="flex items-center space-x-1">
                      <Button type="button" variant="ghost" size="sm">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm">
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm">
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 relative">
                      <Textarea
                        ref={messageInputRef}
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="resize-none rounded-full border-2 pr-12 min-h-[44px] max-h-32"
                        rows={1}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="ghost" size="sm">
                              <Smile className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-2">
                            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                              {EMOJI_PICKER.map((emoji) => (
                                <Button
                                  key={emoji}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-lg hover:bg-muted"
                                  onClick={() => handleEmojiSelect(emoji)}
                                >
                                  {emoji}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {messageText.trim() ? (
                        <Button 
                          type="submit" 
                          size="sm" 
                          disabled={sendMessageMutation.isPending}
                          className="rounded-full w-10 h-10 p-0"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      ) : (
                        <>
                          <Button type="button" variant="ghost" size="sm">
                            <Mic className="w-4 h-4" />
                          </Button>
                          <Button 
                            type="button" 
                            size="sm"
                            className="rounded-full w-10 h-10 p-0"
                            onClick={() => {
                              setMessageText('👍');
                              setTimeout(() => handleSendMessage(new Event('submit') as any), 100);
                            }}
                          >
                            👍
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </div>
              </>
            ) : (
              /* No Conversation Selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Send className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-lg font-medium mb-2">Your Messages</p>
                  <p className="text-muted-foreground mb-4">Send private messages to friends and family</p>
                  <Button>Start New Conversation</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}