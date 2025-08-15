import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { User, MessageWithUser } from '@shared/schema';
import { 
  Send, 
  Users, 
  MessageCircle,
  Wifi,
  WifiOff,
  Circle,
  Search,
  UserPlus,
  ArrowLeft,
  Phone,
  Video,
  Info,
  Paperclip,
  Check,
  CheckCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FriendChatProps {
  onBack?: () => void;
}

export default function FriendChat({ onBack }: FriendChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // WebSocket hook
  const {
    isConnected,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    joinConversation,
    leaveConversation,
    onMessage,
    offMessage,
    isUserTyping,
    getTypingUsers,
    isUserOnline,
    getUserStatus
  } = useWebSocket();

  // Get conversation ID
  const conversationId = selectedFriend && user 
    ? [user.id, selectedFriend.id].sort().join('_')
    : null;

  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['/api/friends'],
    queryFn: async () => {
      const response = await api.get('/api/friends');
      return response.json() as Promise<User[]>;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch messages for selected friend
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/conversations', selectedFriend?.id],
    queryFn: async () => {
      if (!selectedFriend?.id) return [];
      const response = await api.get(`/api/conversations/${selectedFriend.id}`);
      return response.json() as Promise<MessageWithUser[]>;
    },
    enabled: !!selectedFriend?.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; content: string; files?: File[] }) => {
      const formData = new FormData();
      formData.append('receiverId', data.receiverId.toString());
      formData.append('content', data.content);
      
      if (data.files) {
        data.files.forEach(file => {
          formData.append('files', file);
        });
      }
      
      return api.post('/api/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      setMessageText('');
      setSelectedFiles([]);
      setFilePreviews([]);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedFriend?.id] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  // Handle typing indicator
  const handleTyping = useCallback((isTyping: boolean) => {
    if (!conversationId) return;
    
    sendTypingIndicator(conversationId, isTyping);
  }, [conversationId, sendTypingIndicator]);

  // Handle message input change
  const handleMessageChange = useCallback((value: string) => {
    setMessageText(value);
    
    // Send typing indicator
    handleTyping(true);
    
    // Clear typing indicator after 2 seconds of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  }, [handleTyping]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!selectedFriend || (!messageText.trim() && selectedFiles.length === 0)) return;

    try {
      if (isConnected) {
        // Send via WebSocket for real-time delivery
        sendMessage(selectedFriend.id, messageText);
      }
      
      // Also send via HTTP for persistence
      await sendMessageMutation.mutateAsync({
        receiverId: selectedFriend.id,
        content: messageText,
        files: selectedFiles
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [selectedFriend, messageText, selectedFiles, isConnected, sendMessage, sendMessageMutation]);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Remove file
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Join conversation when friend is selected
  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId);
    }
    
    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId, joinConversation, leaveConversation]);

  // Handle incoming messages
  useEffect(() => {
    onMessage('new_message', (data) => {
      if (data.senderId === selectedFriend?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedFriend.id] });
        scrollToBottom();
        
        // Send read receipt
        if (data.id) {
          sendReadReceipt(data.id, conversationId!);
        }
      }
    });

    onMessage('message_sent', (data) => {
      if (data.senderId === user?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedFriend?.id] });
        scrollToBottom();
      }
    });

    return () => {
      offMessage('new_message');
      offMessage('message_sent');
    };
  }, [selectedFriend, user, conversationId, onMessage, offMessage, queryClient, scrollToBottom, sendReadReceipt]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Filter friends based on search
  const filteredFriends = friends.filter(friend =>
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p>Please log in to access friend chat</p>
      </Card>
    );
  }

  const typingUsers = getTypingUsers(conversationId!);
  const isOtherUserTyping = selectedFriend && typingUsers.some(id => id === selectedFriend.id);
  const isOtherUserOnline = selectedFriend && isUserOnline(selectedFriend.id);
  const otherUserStatus = selectedFriend ? getUserStatus(selectedFriend.id) : 'offline';

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
        {/* Friends List */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Friends
            </h3>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Friends List */}
          <ScrollArea className="h-[600px]">
            {friendsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No friends found' : 'No friends yet'}
                </p>
                {!searchQuery && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.href = '/friends'}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friends
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((friend) => {
                  const isOnline = isUserOnline(friend.id);
                  const status = getUserStatus(friend.id);
                  
                  return (
                    <div
                      key={friend.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedFriend?.id === friend.id 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedFriend(friend)}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.avatar || undefined} />
                          <AvatarFallback>{friend.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{friend.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col">
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  {onBack && (
                    <Button variant="ghost" size="sm" onClick={onBack}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedFriend.avatar || undefined} />
                      <AvatarFallback>{selectedFriend.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                      isOtherUserOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedFriend.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span className="capitalize">{otherUserStatus}</span>
                      {isOtherUserTyping && (
                        <>
                          <span>•</span>
                          <span className="text-primary">typing...</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message: MessageWithUser) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${message.senderId === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <div className="p-3 rounded-lg">
                            {message.content && <p className="text-sm">{message.content}</p>}
                            {message.imageUrl && (
                              <img 
                                src={message.imageUrl} 
                                alt="Message attachment" 
                                className="mt-2 rounded max-w-full h-auto"
                              />
                            )}
                            <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                              <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
                              {message.senderId === user?.id && (
                                <div className="flex items-center space-x-1">
                                  <Check className="h-3 w-3" />
                                  {message.isRead && <CheckCheck className="h-3 w-3" />}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Typing indicator */}
                  {isOtherUserTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* File previews */}
              {filePreviews.length > 0 && (
                <div className="p-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    {filePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="w-16 h-16 object-cover rounded"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <Textarea
                      ref={messageInputRef}
                      value={messageText}
                      onChange={(e) => handleMessageChange(e.target.value)}
                      placeholder="Type a message..."
                      className="min-h-[60px] max-h-[120px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input">
                      <Button variant="ghost" size="sm" asChild>
                        <span>
                          <Paperclip className="h-4 w-4" />
                        </span>
                      </Button>
                    </label>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() && selectedFiles.length === 0}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Connection status */}
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Select a friend to start chatting</h3>
                <p>Choose someone from your friends list to begin a conversation</p>
                {friends.length === 0 && (
                  <Button 
                    className="mt-4"
                    onClick={() => window.location.href = '/friends'}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friends
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 