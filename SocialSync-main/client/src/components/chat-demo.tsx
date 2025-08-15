import FriendChat from './friend-chat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { 
  Users, 
  MessageCircle,
  Wifi,
  WifiOff,
  Circle,
  ArrowRight
} from 'lucide-react';

export default function ChatDemo() {
  const { user } = useAuth();
  const [showFriendChat, setShowFriendChat] = useState(false);

  const {
    isConnected,
    onlineUsers,
    typingUsers
  } = useWebSocket();

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p>Please log in to access the chat demo</p>
      </Card>
    );
  }

  if (showFriendChat) {
    return <FriendChat onBack={() => setShowFriendChat(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Real-Time Chat Demo</h1>
        <p className="text-muted-foreground mb-6">
          Experience real-time messaging with your friends using WebSocket technology
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <MessageCircle className="h-8 w-8 text-blue-500 mr-3" />
            <h3 className="text-xl font-semibold">Friend Chat</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Chat with your actual friends from your friend list. Send messages, see typing indicators, and get real-time updates.
          </p>
          <Button 
            onClick={() => setShowFriendChat(true)}
            className="w-full"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Start Chatting with Friends
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-green-500 mr-3" />
            <h3 className="text-xl font-semibold">Features</h3>
          </div>
          <ul className="text-muted-foreground space-y-2">
            <li>• Real-time message delivery</li>
            <li>• Typing indicators</li>
            <li>• Read receipts</li>
            <li>• Online/offline status</li>
            <li>• File sharing</li>
            <li>• Auto-reconnection</li>
          </ul>
        </Card>
      </div>

      {/* Connection Info */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <Circle className={`h-4 w-4 mr-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
          Connection Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
            <span>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span>Online Users: {onlineUsers.size}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-purple-500" />
            <span>Active Conversations: {typingUsers.size}</span>
          </div>
        </div>
      </Card>
    </div>
  );
} 