import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getUserInitials } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { 
  Search, 
  MessageCircle, 
  Settings,
  Edit,
  Phone,
  Video,
  MoreHorizontal,
  X,
  Send
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { MessageWithUser, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessagesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MessagesDropdown({ 
  isOpen, 
  onClose 
}: MessagesDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState("");
  
  // Message settings state
  const [messageSettings, setMessageSettings] = useState({
    readReceipts: true,
    onlineStatus: true,
    messageNotifications: true,
    lastSeenVisibility: 'everyone', // everyone, contacts, selected, nobody
    profilePhotoVisibility: 'everyone',
    statusVisibility: 'contacts',
    whoCanAddToGroups: 'everyone'
  });

  const { data: conversations = [], isLoading } = useQuery<MessageWithUser[]>({
    queryKey: ['/api/conversations'],
    enabled: isOpen,
  });

  // Search users for recipient selection
  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ['/api/search', recipientQuery],
    queryFn: async () => {
      const response = await api.search(recipientQuery, 'users');
      const data = await response.json();
      // Extract users array from nested response structure
      return data.users || data || [];
    },
    enabled: recipientQuery.length > 2 && showComposeModal,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { receiverId: number; content: string }) => 
      api.sendMessage(data.receiverId, data.content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({
        title: "Message sent!",
        description: "Your message has been delivered.",
      });
      setShowComposeModal(false);
      setSelectedRecipient(null);
      setMessageContent("");
      setRecipientQuery("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
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

  const getOtherUser = (conversation: MessageWithUser) => {
    return conversation.senderId === user?.id ? conversation.receiver : conversation.sender;
  };

  const getLastMessagePreview = (conversation: MessageWithUser) => {
    const isFromCurrentUser = conversation.senderId === user?.id;
    const preview = conversation.content.length > 50 
      ? conversation.content.substring(0, 50) + "..."
      : conversation.content;
    
    return isFromCurrentUser ? `You: ${preview}` : preview;
  };

  // Process conversations with real-time updates
  const uniqueConversations = conversations
    .reduce((acc, conv) => {
      const otherUserId = conv.senderId === user?.id ? conv.receiverId : conv.senderId;
      const existing = acc.find(c => {
        const existingOtherUserId = c.senderId === user?.id ? c.receiverId : c.senderId;
        return existingOtherUserId === otherUserId;
      });
      
      if (!existing || new Date(conv.createdAt!) > new Date(existing.createdAt!)) {
        if (existing) {
          const index = acc.indexOf(existing);
          acc[index] = conv;
        } else {
          acc.push(conv);
        }
      }
      return acc;
    }, [] as MessageWithUser[])
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

  const filteredConversations = uniqueConversations.filter((conv: MessageWithUser) => {
    const otherUser = getOtherUser(conv);
    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser.name?.toLowerCase().includes(searchLower) ||
      otherUser.username.toLowerCase().includes(searchLower) ||
      conv.content.toLowerCase().includes(searchLower)
    );
  });

  const unreadCount = conversations.filter((conv: MessageWithUser) => 
    !conv.readAt && conv.receiverId === user?.id
  ).length;

  const handleEditClick = () => {
    setShowComposeModal(true);
  };

  const handleSettingsClick = () => {
    setShowSettingsModal(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    
    let recipientId: number;
    
    if (selectedRecipient) {
      recipientId = selectedRecipient.id;
    } else if (recipientQuery.trim()) {
      // Search for user by name/username if no recipient is selected
      try {
        const response = await api.search(recipientQuery.trim(), 'users');
        const searchData = await response.json();
        const users = searchData.users || searchData;
        
        if (users.length === 0) {
          toast({
            title: "User not found",
            description: "Could not find a user with that name or username.",
            variant: "destructive",
          });
          return;
        }
        
        recipientId = users[0].id;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to find user. Please try again.",
          variant: "destructive",
        });
        return;
      }
    } else {
      return;
    }
    
    sendMessageMutation.mutate({
      receiverId: recipientId,
      content: messageContent.trim()
    });
  };

  const handleRecipientSelect = (user: User) => {
    setSelectedRecipient(user);
    setRecipientQuery(user.name || user.username);
  };

  if (!isOpen) return null;

  // If compose modal is open, render it instead of the dropdown
  if (showComposeModal) {
    return (
      <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="relative">
              <Label htmlFor="recipient">To</Label>
              <Input
                id="recipient"
                placeholder="Search for people..."
                className="mt-1"
                value={recipientQuery}
                onChange={(e) => setRecipientQuery(e.target.value)}
              />
              
              {/* Search Results Dropdown */}
              {recipientQuery.length > 2 && !selectedRecipient && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((user: User) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleRecipientSelect(user)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>
                            {user.name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No users found matching "{recipientQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your message..."
                className="mt-1 min-h-[100px]"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowComposeModal(false);
                  setSelectedRecipient(null);
                  setMessageContent("");
                  setRecipientQuery("");
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={(!selectedRecipient && !recipientQuery.trim()) || !messageContent.trim() || sendMessageMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <h3 className="font-semibold text-gray-900">Messages</h3>
          {unreadCount > 0 && (
            <Badge className="ml-2 h-5 px-2 text-xs bg-blue-600">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-1" onClick={handleEditClick}>
            <Edit className="h-4 w-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="sm" className="p-1" onClick={handleSettingsClick}>
            <Settings className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 text-sm bg-gray-50 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="w-32 h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="w-12 h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <div className="text-sm text-gray-500 mb-1">
              {searchQuery ? "No messages found" : "No messages yet"}
            </div>
            <div className="text-xs text-gray-400">
              {searchQuery 
                ? "Try searching for a different term" 
                : "Start a conversation to see messages here"
              }
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation: MessageWithUser) => {
              const otherUser = getOtherUser(conversation);
              const isUnread = !conversation.readAt && conversation.receiverId === user?.id;
              
              return (
                <Link 
                  key={conversation.id} 
                  href={`/messages/${otherUser.id}`}
                  className="block"
                  onClick={onClose}
                >
                  <div className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                    isUnread ? 'bg-blue-50' : ''
                  }`}>
                    {/* User Avatar with Online Status */}
                    <div className="relative mr-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherUser.avatar || ""} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                          {getUserInitials(otherUser)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator - would be dynamic in real app */}
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {otherUser.name || otherUser.username}
                        </div>
                        <span className="text-xs text-gray-500">
                          {conversation.createdAt ? formatDistanceToNow(conversation.createdAt, { addSuffix: true }) : ''}
                        </span>
                      </div>
                      
                      <div className={`text-sm line-clamp-1 ${
                        isUnread ? 'font-medium text-gray-900' : 'text-gray-600'
                      }`}>
                        {getLastMessagePreview(conversation)}
                      </div>

                      {/* Message status indicators */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          {conversation.senderId === user?.id && (
                            <div className={`w-2 h-2 rounded-full ${
                              conversation.readAt ? 'bg-blue-500' : 'bg-gray-400'
                            }`}></div>
                          )}
                        </div>
                        
                        {isUnread && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100">
                      <Button variant="ghost" size="sm" className="p-1 h-auto">
                        <Phone className="h-3 w-3 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1 h-auto">
                        <Video className="h-3 w-3 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-3">
        <Link href="/messages">
          <Button 
            variant="ghost" 
            className="w-full text-blue-600 text-sm h-auto p-2"
            onClick={onClose}
          >
            See All Messages
          </Button>
        </Link>
      </div>



      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Message Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Read receipts</Label>
                <p className="text-sm text-muted-foreground">
                  Let others know when you've read their messages
                </p>
              </div>
              <Switch
                checked={messageSettings.readReceipts}
                onCheckedChange={(checked) => {
                  setMessageSettings({...messageSettings, readReceipts: checked});
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Online status</Label>
                <p className="text-sm text-muted-foreground">
                  Show when you're active
                </p>
              </div>
              <Switch
                checked={messageSettings.onlineStatus}
                onCheckedChange={(checked) => {
                  setMessageSettings({...messageSettings, onlineStatus: checked});
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Message notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new messages
                </p>
              </div>
              <Switch
                checked={messageSettings.messageNotifications}
                onCheckedChange={(checked) => {
                  setMessageSettings({...messageSettings, messageNotifications: checked});
                }}
              />
            </div>
            
            <DropdownMenuSeparator />
            
            {/* Privacy Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Privacy Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Last seen</Label>
                  <p className="text-sm text-muted-foreground">
                    Who can see when you were last online
                  </p>
                </div>
                <Select
                  value={messageSettings.lastSeenVisibility}
                  onValueChange={(value) => 
                    setMessageSettings({...messageSettings, lastSeenVisibility: value})
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="contacts">My contacts</SelectItem>
                    <SelectItem value="selected">Selected contacts</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Profile photo</Label>
                  <p className="text-sm text-muted-foreground">
                    Who can see your profile photo
                  </p>
                </div>
                <Select
                  value={messageSettings.profilePhotoVisibility}
                  onValueChange={(value) => 
                    setMessageSettings({...messageSettings, profilePhotoVisibility: value})
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="contacts">My contacts</SelectItem>
                    <SelectItem value="selected">Selected contacts</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Who can see your status updates
                  </p>
                </div>
                <Select
                  value={messageSettings.statusVisibility}
                  onValueChange={(value) => 
                    setMessageSettings({...messageSettings, statusVisibility: value})
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="contacts">My contacts</SelectItem>
                    <SelectItem value="selected">Selected contacts</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Groups</Label>
                  <p className="text-sm text-muted-foreground">
                    Who can add you to groups
                  </p>
                </div>
                <Select
                  value={messageSettings.whoCanAddToGroups}
                  onValueChange={(value) => 
                    setMessageSettings({...messageSettings, whoCanAddToGroups: value})
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="contacts">My contacts</SelectItem>
                    <SelectItem value="admins">Group admins</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSettingsModal(false);
                  toast({
                    title: "Settings saved",
                    description: "Your message preferences have been updated.",
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