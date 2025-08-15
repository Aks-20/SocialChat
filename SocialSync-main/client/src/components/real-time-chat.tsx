import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { MessageWithUser, User } from '@shared/schema';
import { 
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
  Circle,
  Check,
  CheckCheck
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

interface RealTimeChatProps {
  selectedUser?: User | null;
  onBack?: () => void;
}

export default function RealTimeChat({ selectedUser, onBack }: RealTimeChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
  const conversationId = selectedUser && user 
    ? [user.id, selectedUser.id].sort().join('_')
    : null;

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/conversations', selectedUser?.id],
    queryFn: () => api.get(`/api/conversations/${selectedUser?.id}`).then(res => res.data),
    enabled: !!selectedUser?.id,
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
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedUser?.id] });
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
    
    setIsTyping(isTyping);
    sendTypingIndicator(conversationId, isTyping);
  }, [conversationId, sendTypingIndicator]);

  // Handle message input change
  const handleMessageChange = useCallback((value: string) => {
    setMessageText(value);
    
    // Send typing indicator
    if (!isTyping) {
      handleTyping(true);
    }
    
    // Clear typing indicator after 2 seconds of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  }, [isTyping, handleTyping]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!selectedUser || !messageText.trim() && selectedFiles.length === 0) return;

    try {
      if (isConnected) {
        // Send via WebSocket for real-time delivery
        sendMessage(selectedUser.id, messageText);
      }
      
      // Also send via HTTP for persistence
      await sendMessageMutation.mutateAsync({
        receiverId: selectedUser.id,
        content: messageText,
        files: selectedFiles
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [selectedUser, messageText, selectedFiles, isConnected, sendMessage, sendMessageMutation]);

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

  // Join conversation when user is selected
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
      if (data.senderId === selectedUser?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedUser.id] });
        scrollToBottom();
        
        // Send read receipt
        if (data.id) {
          sendReadReceipt(data.id, conversationId!);
        }
      }
    });

    onMessage('message_sent', (data) => {
      if (data.senderId === user?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedUser?.id] });
        scrollToBottom();
      }
    });

    return () => {
      offMessage('new_message');
      offMessage('message_sent');
    };
  }, [selectedUser, user, conversationId, onMessage, offMessage, queryClient, scrollToBottom, sendReadReceipt]);

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

  if (!selectedUser) {
    return (
      <Card className="flex-1 p-8 text-center">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </Card>
    );
  }

  const typingUsers = getTypingUsers(conversationId!);
  const isOtherUserTyping = typingUsers.some(id => id === selectedUser.id);
  const isOtherUserOnline = isUserOnline(selectedUser.id);
  const otherUserStatus = getUserStatus(selectedUser.id);

  return (
    <Card className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedUser.avatar || undefined} />
            <AvatarFallback>{selectedUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{selectedUser.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${isOtherUserOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>{isOtherUserOnline ? otherUserStatus : 'Offline'}</span>
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
          {messages.map((message: MessageWithUser) => (
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
          ))}
          
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
          {isTyping && <span>You are typing...</span>}
        </div>
      </div>
    </Card>
  );
} 