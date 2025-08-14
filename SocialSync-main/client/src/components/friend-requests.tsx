import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserPlus, UserCheck, UserX, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  message: string | null;
  status: string;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  };
  receiver: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  };
}

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
}

export function FriendRequests() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [requestMessages, setRequestMessages] = useState<Record<number, string>>({});
  const [showSendDialog, setShowSendDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch friend requests
  const { data: receivedRequests = [], isLoading: loadingReceived } = useQuery<FriendRequest[]>({
    queryKey: ["/api/friend-requests/received"],
  });

  const { data: sentRequests = [], isLoading: loadingSent } = useQuery<FriendRequest[]>({
    queryKey: ["/api/friend-requests/sent"],
  });

  const { data: friendSuggestions = [], isLoading: loadingSuggestions } = useQuery<User[]>({
    queryKey: ["/api/friend-suggestions"],
  });

  const { data: friends = [], isLoading: loadingFriends } = useQuery<User[]>({
    queryKey: ["/api/friends"],
    staleTime: 0, // Force fresh data
    refetchOnMount: true,
  });



  // Mutations
  const sendRequestMutation = useMutation({
    mutationFn: async ({ receiverId, message }: { receiverId: number; message?: string }) => {
      return apiRequest("POST", "/api/friend-requests", { receiverId, message });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/sent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-suggestions"] });
      setShowSendDialog(false);
      if (selectedUser) {
        setRequestMessages(prev => ({ ...prev, [selectedUser.id]: "" }));
      }
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: 'accept' | 'decline' }) => {
      return apiRequest("PUT", `/api/friend-requests/${requestId}`, { action });
    },
    onSuccess: (_, { action }) => {
      toast({
        title: action === 'accept' ? "Friend request accepted" : "Friend request declined",
        description: action === 'accept' 
          ? "You are now friends!" 
          : "Friend request has been declined.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to friend request",
        variant: "destructive",
      });
    },
  });

  const handleSendRequest = (user: User) => {
    setSelectedUser(user);
    setShowSendDialog(true);
  };

  const handleConfirmSendRequest = () => {
    if (!selectedUser) return;
    
    const message = requestMessages[selectedUser.id] || "";
    sendRequestMutation.mutate({
      receiverId: selectedUser.id,
      message: message.trim() || undefined,
    });
  };

  const handleRespondToRequest = (requestId: number, action: 'accept' | 'decline') => {
    respondToRequestMutation.mutate({ requestId, action });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Friends & Connections</h1>
      </div>

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Received
            {receivedRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {receivedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Sent
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends ({friends.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>People You May Know</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSuggestions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-lg h-32"></div>
                    </div>
                  ))}
                </div>
              ) : friendSuggestions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No friend suggestions available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendSuggestions.map((user: User) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <Link href={`/profile/${user.id}`} className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{user.name}</h3>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                            {user.bio && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{user.bio}</p>
                            )}
                          </div>
                        </Link>
                        <Button
                          onClick={() => handleSendRequest(user)}
                          disabled={sendRequestMutation.isPending}
                          size="sm"
                          className="w-full"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add Friend
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Friend Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReceived ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                      <div className="bg-gray-200 rounded-full h-12 w-12"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-200 h-4 rounded w-1/4"></div>
                        <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : receivedRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending friend requests</p>
              ) : (
                <div className="space-y-4">
                  {receivedRequests.map((request: FriendRequest) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Link href={`/profile/${request.sender.id}`} className="cursor-pointer hover:opacity-80">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.sender.avatar || undefined} />
                            <AvatarFallback>{request.sender.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div>
                          <Link href={`/profile/${request.sender.id}`} className="cursor-pointer hover:opacity-80">
                            <h3 className="font-semibold">{request.sender.name}</h3>
                            <p className="text-sm text-gray-500">@{request.sender.username}</p>
                          </Link>
                          {request.message && (
                            <p className="text-sm text-gray-600 mt-1 italic">"{request.message}"</p>
                          )}
                          <p className="text-xs text-gray-400">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleRespondToRequest(request.id, 'accept')}
                          disabled={respondToRequestMutation.isPending}
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleRespondToRequest(request.id, 'decline')}
                          disabled={respondToRequestMutation.isPending}
                          variant="outline"
                          size="sm"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sent Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSent ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                      <div className="bg-gray-200 rounded-full h-12 w-12"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-200 h-4 rounded w-1/4"></div>
                        <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sentRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No sent friend requests</p>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((request: FriendRequest) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Link href={`/profile/${request.receiver.id}`} className="cursor-pointer hover:opacity-80">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.receiver.avatar || undefined} />
                            <AvatarFallback>{request.receiver.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div>
                          <Link href={`/profile/${request.receiver.id}`} className="cursor-pointer hover:opacity-80">
                            <h3 className="font-semibold">{request.receiver.name}</h3>
                            <p className="text-sm text-gray-500">@{request.receiver.username}</p>
                          </Link>
                          {request.message && (
                            <p className="text-sm text-gray-600 mt-1 italic">"{request.message}"</p>
                          )}
                          <p className="text-xs text-gray-400">
                            Sent {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Friends</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFriends ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-lg h-40"></div>
                    </div>
                  ))}
                </div>
              ) : friends.length === 0 ? (
                <p className="text-gray-500 text-center py-8">You haven't added any friends yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend: User) => (
                    <Card key={friend.id} className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <Link href={`/profile/${friend.id}`} className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={friend.avatar || undefined} />
                            <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{friend.name}</h3>
                            <p className="text-sm text-gray-500">@{friend.username}</p>
                            {friend.bio && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{friend.bio}</p>
                            )}
                          </div>
                        </Link>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          Friends
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Friend Request Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Friend Request</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser.avatar || undefined} />
                  <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Optional Message</Label>
                <Textarea
                  id="message"
                  placeholder="Say something nice..."
                  value={requestMessages[selectedUser.id] || ""}
                  onChange={(e) => setRequestMessages(prev => ({ 
                    ...prev, 
                    [selectedUser.id]: e.target.value 
                  }))}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSendDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSendRequest}
                  disabled={sendRequestMutation.isPending}
                >
                  {sendRequestMutation.isPending ? "Sending..." : "Send Request"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}