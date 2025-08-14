import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Type, 
  BarChart3, 
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Send,
  Camera,
  Palette
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface NewStatusState {
  content: string;
  backgroundColor: string;
  fontStyle: string;
  pollOptions: string[];
  question: string;
  privacy: string;
  mediaFile: File | null;
  mediaFiles: File[];
}

interface StatusUpdate {
  id: number;
  userId: number;
  type: 'photo' | 'video' | 'text' | 'poll' | 'question';
  content?: string;
  mediaUrl?: string;
  backgroundColor?: string;
  fontStyle?: string;
  pollOptions?: string[];
  pollVotes?: string[];
  question?: string;
  privacy: string;
  viewsCount: number;
  reactionsCount: number;
  expiresAt: string;
  isHighlighted: boolean;
  highlightCategory?: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  hasViewed?: boolean;
  userReaction?: string;
}



const backgroundColors = [
  '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#06B6D4', '#8B5CF6', '#F97316', '#84CC16'
];

const fontStyles = [
  'font-sans', 'font-serif', 'font-mono', 'font-bold', 'font-light'
];

export default function StatusPage() {
  const [selectedStatus, setSelectedStatus] = useState<StatusUpdate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'photo' | 'video' | 'text' | 'poll' | 'question'>('text');
  const [newStatus, setNewStatus] = useState<NewStatusState>({
    content: '',
    backgroundColor: backgroundColors[0],
    fontStyle: fontStyles[0],
    pollOptions: ['', ''],
    question: '',
    privacy: 'public',
    mediaFile: null,
    mediaFiles: [],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch status updates
  const { data: statusUpdates = [], isLoading, error } = useQuery<StatusUpdate[]>({
    queryKey: ['/api/status'],
  });

  // Log for debugging
  console.log("Status updates data:", statusUpdates);
  console.log("Status updates loading:", isLoading);
  console.log("Status updates error:", error);

  // Create status mutation
  const createStatusMutation = useMutation({
    mutationFn: async (statusData: FormData) => {
      return apiRequest('POST', '/api/status', statusData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      setShowCreateModal(false);
      resetNewStatus();
      toast({
        title: "Status Posted",
        description: "Your status has been shared successfully!",
      });
    },
    onError: (error: any) => {
      console.error("Status creation error:", error);
      toast({
        title: "Post Failed",
        description: error.message || "Failed to post your status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // React to status mutation
  const reactToStatusMutation = useMutation({
    mutationFn: async ({ statusId, reaction }: { statusId: number; reaction: string }) => {
      return apiRequest('POST', `/api/status/${statusId}/react`, { reaction });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      toast({
        title: "Reaction Added",
        description: `You reacted with ${variables.reaction}`,
        duration: 2000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to React",
        description: error.message || "Could not add reaction. Try again.",
        variant: "destructive",
      });
    },
  });

  // Vote on poll mutation
  const votePollMutation = useMutation({
    mutationFn: async ({ statusId, optionIndex }: { statusId: number; optionIndex: number }) => {
      return apiRequest('POST', `/api/status/${statusId}/vote`, { optionIndex });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      toast({
        title: "Vote Recorded",
        description: "Your poll vote has been counted!",
        duration: 2000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Vote Failed",
        description: error.message || "Could not record your vote. Try again.",
        variant: "destructive",
      });
    },
  });

  // Mark status as viewed
  const markViewedMutation = useMutation({
    mutationFn: async (statusId: number) => {
      return apiRequest('POST', `/api/status/${statusId}/view`, {});
    },
  });

  const resetNewStatus = () => {
    setNewStatus({
      content: '',
      backgroundColor: backgroundColors[0],
      fontStyle: fontStyles[0],
      pollOptions: ['', ''],
      question: '',
      privacy: 'public',
      mediaFile: null,
      mediaFiles: [],
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (createType === 'photo' && files.length > 1) {
        // Multiple images for photo status
        setNewStatus({ ...newStatus, mediaFiles: files, mediaFile: null });
      } else {
        // Single file for other types
        setNewStatus({ ...newStatus, mediaFile: files[0], mediaFiles: [] });
      }
    }
  };

  const addPollOption = () => {
    if (newStatus.pollOptions.length < 4) {
      setNewStatus({
        ...newStatus,
        pollOptions: [...newStatus.pollOptions, '']
      });
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const options = [...newStatus.pollOptions];
    options[index] = value;
    setNewStatus({ ...newStatus, pollOptions: options });
  };

  const removePollOption = (index: number) => {
    if (newStatus.pollOptions.length > 2) {
      const options = newStatus.pollOptions.filter((_: string, i: number) => i !== index);
      setNewStatus({ ...newStatus, pollOptions: options });
    }
  };

  const handleSubmitStatus = () => {
    const formData = new FormData();
    formData.append('type', createType);
    formData.append('privacy', newStatus.privacy);

    if (createType === 'text') {
      formData.append('content', newStatus.content);
      formData.append('backgroundColor', newStatus.backgroundColor);
      formData.append('fontStyle', newStatus.fontStyle);
    } else if (createType === 'poll') {
      formData.append('content', newStatus.content);
      formData.append('pollOptions', JSON.stringify(newStatus.pollOptions.filter((opt: string) => opt.trim())));
    } else if (createType === 'question') {
      formData.append('question', newStatus.question);
    } else if (createType === 'photo' && newStatus.mediaFiles.length > 0) {
      // Multiple images for photo status
      newStatus.mediaFiles.forEach((file: File, index: number) => {
        formData.append(`media${index}`, file);
      });
      formData.append('mediaCount', newStatus.mediaFiles.length.toString());
      if (newStatus.content) {
        formData.append('content', newStatus.content);
      }
    } else if (newStatus.mediaFile) {
      // Single file for other types
      formData.append('media', newStatus.mediaFile);
      if (newStatus.content) {
        formData.append('content', newStatus.content);
      }
    }

    console.log('Submitting status with type:', createType);
    console.log('FormData entries:', Object.fromEntries(formData.entries()));
    createStatusMutation.mutate(formData);
  };

  const openStatusViewer = (status: StatusUpdate) => {
    console.log("Opening status viewer for:", status);
    setSelectedStatus(status);
    if (!status.hasViewed) {
      markViewedMutation.mutate(status.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Status error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load status updates</p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Status</h1>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Status
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Status</DialogTitle>
                </DialogHeader>
                <Tabs value={createType} onValueChange={(value: any) => setCreateType(value)}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="text" className="p-2">
                      <Type className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="photo" className="p-2">
                      <ImageIcon className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="video" className="p-2">
                      <Video className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="poll" className="p-2">
                      <BarChart3 className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="question" className="p-2">
                      <HelpCircle className="w-4 h-4" />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-4">
                    <div>
                      <Textarea
                        placeholder="What's on your mind?"
                        value={newStatus.content}
                        onChange={(e) => setNewStatus({ ...newStatus, content: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Background Color</label>
                      <div className="flex space-x-2 flex-wrap">
                        {backgroundColors.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${
                              newStatus.backgroundColor === color ? 'border-blue-500' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewStatus({ ...newStatus, backgroundColor: color })}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="photo" className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-600">
                          {newStatus.mediaFiles.length > 0 ? `${newStatus.mediaFiles.length} photos selected` : 
                           newStatus.mediaFile ? newStatus.mediaFile.name : 'Click to upload photos (multiple allowed)'}
                        </span>
                      </label>
                    </div>
                    <Textarea
                      placeholder="Add a caption..."
                      value={newStatus.content}
                      onChange={(e) => setNewStatus({ ...newStatus, content: e.target.value })}
                      rows={2}
                    />
                  </TabsContent>

                  <TabsContent value="video" className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="video-upload"
                      />
                      <label htmlFor="video-upload" className="cursor-pointer">
                        <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-600">
                          {newStatus.mediaFile ? newStatus.mediaFile.name : 'Click to upload video'}
                        </span>
                      </label>
                    </div>
                    <Textarea
                      placeholder="Add a caption..."
                      value={newStatus.content}
                      onChange={(e) => setNewStatus({ ...newStatus, content: e.target.value })}
                      rows={2}
                    />
                  </TabsContent>

                  <TabsContent value="poll" className="space-y-4">
                    <Textarea
                      placeholder="Ask a question..."
                      value={newStatus.content}
                      onChange={(e) => setNewStatus({ ...newStatus, content: e.target.value })}
                      rows={2}
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2">Poll Options</label>
                      {newStatus.pollOptions.map((option: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                          />
                          {newStatus.pollOptions.length > 2 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removePollOption(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {newStatus.pollOptions.length < 4 && (
                        <Button variant="outline" onClick={addPollOption} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Option
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="question" className="space-y-4">
                    <Textarea
                      placeholder="Ask your followers a question..."
                      value={newStatus.question}
                      onChange={(e) => setNewStatus({ ...newStatus, question: e.target.value })}
                      rows={3}
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitStatus}
                    disabled={createStatusMutation.isPending}
                    className="flex-1"
                  >
                    {createStatusMutation.isPending ? 'Posting...' : 'Share'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Status Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {statusUpdates.map((status: StatusUpdate) => (
            <Card
              key={status.id}
              className="cursor-pointer hover:shadow-lg transition-shadow aspect-[9/16] relative overflow-hidden"
              onClick={() => openStatusViewer(status)}
            >
              <CardContent className="p-0 h-full">
                {status.type === 'text' ? (
                  <div
                    className={`h-full flex items-center justify-center p-4 text-white ${status.fontStyle}`}
                    style={{ backgroundColor: status.backgroundColor }}
                  >
                    <p className="text-center font-semibold">{status.content}</p>
                  </div>
                ) : status.mediaUrl ? (
                  status.type === 'video' ? (
                    <video
                      src={status.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={status.mediaUrl}
                      alt="Status"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4">
                    <p className="text-center font-semibold">
                      {status.type === 'poll' ? status.content : status.question}
                    </p>
                  </div>
                )}

                {/* User Avatar */}
                <div className="absolute top-2 left-2">
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={status.user.avatar} />
                    <AvatarFallback className="text-xs">{status.user.name[0]}</AvatarFallback>
                  </Avatar>
                </div>

                {/* View Indicator */}
                {!status.hasViewed && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                )}

                {/* Stats */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{status.viewsCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{status.reactionsCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {statusUpdates && statusUpdates.length === 0 && (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Status Updates</h2>
            <p className="text-gray-600 mb-4">Share your moments with status updates!</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Status
            </Button>
          </div>
        )}

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
            <p>Status updates count: {statusUpdates?.length || 0}</p>
            <p>Selected status: {selectedStatus ? selectedStatus.id : 'none'}</p>
          </div>
        )}
      </div>

      {/* Status Viewer Modal */}
      {selectedStatus && (
        <Dialog open={!!selectedStatus} onOpenChange={() => setSelectedStatus(null)}>
          <DialogContent className="max-w-md p-0 h-[80vh] overflow-hidden" aria-describedby="status-viewer-description">
            <div id="status-viewer-description" className="sr-only">
              Viewing status update from {selectedStatus.user.name}
            </div>
            <div className="relative h-full">
              {selectedStatus.type === 'text' ? (
                <div
                  className={`h-full flex items-center justify-center p-6 text-white ${selectedStatus.fontStyle}`}
                  style={{ backgroundColor: selectedStatus.backgroundColor }}
                >
                  <p className="text-center text-lg font-semibold">{selectedStatus.content}</p>
                </div>
              ) : selectedStatus.mediaUrl ? (
                selectedStatus.type === 'video' ? (
                  <video
                    src={selectedStatus.mediaUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    controls
                  />
                ) : (
                  <img
                    src={selectedStatus.mediaUrl}
                    alt="Status"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6">
                  <div className="text-center">
                    {selectedStatus.type === 'poll' ? (
                      <div>
                        <p className="text-lg font-semibold mb-4">{selectedStatus.content}</p>
                        <div className="space-y-2">
                          {selectedStatus.pollOptions?.map((option, index) => {
                            const voteCount = parseInt(selectedStatus.pollVotes?.[index] as string) || 0;
                            const totalVotes = selectedStatus.pollVotes?.reduce((sum: number, count: string) => sum + (parseInt(count) || 0), 0) || 0;
                            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                            
                            return (
                              <Button
                                key={index}
                                variant="outline"
                                className="w-full bg-white/20 border-white/30 text-white hover:bg-white/30 relative overflow-hidden transition-all duration-200 hover:scale-105"
                                onClick={() => votePollMutation.mutate({ statusId: selectedStatus.id, optionIndex: index })}
                                disabled={votePollMutation.isPending}
                              >
                                <div 
                                  className="absolute left-0 top-0 h-full bg-white/20 transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                                <span className="relative z-10 flex justify-between w-full">
                                  <span>{option}</span>
                                  <span className="text-sm opacity-80">{percentage}%</span>
                                </span>
                                {votePollMutation.isPending && (
                                  <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                              </Button>
                            );
                          })}
                          <p className="text-center text-sm opacity-70 mt-2">
                            {(() => {
                              const total = selectedStatus.pollVotes?.reduce((sum: number, count: string) => sum + (parseInt(count) || 0), 0) || 0;
                              return `${total} ${total === 1 ? 'vote' : 'votes'}`;
                            })()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-semibold mb-4">{selectedStatus.question}</p>
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Type your answer..."
                            className="bg-white/20 border-white/30 text-white placeholder-white/70"
                          />
                          <Button size="icon" variant="ghost" className="text-white">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={selectedStatus.user.avatar} />
                    <AvatarFallback>{selectedStatus.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-white font-semibold text-sm">
                    {selectedStatus.user.username}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => setSelectedStatus(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Reaction Bar */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between bg-black/50 rounded-full px-4 py-2">
                  <div className="flex items-center space-x-3">
                    {['❤️', '😂', '😮', '😢', '😡', '👍'].map((emoji) => (
                      <button
                        key={emoji}
                        className="text-2xl hover:scale-110 transition-all duration-200 hover:bg-white/20 rounded-full p-1"
                        onClick={() => reactToStatusMutation.mutate({
                          statusId: selectedStatus.id,
                          reaction: emoji
                        })}
                        disabled={reactToStatusMutation.isPending}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="text-white text-sm">
                    {selectedStatus.reactionsCount} reactions
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}