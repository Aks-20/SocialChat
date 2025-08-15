import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VideoCallButton from './video-call-button';
import { useAuth } from '@/hooks/use-auth';

// Mock user for testing
const mockUser = {
  id: 2,
  name: "Test User",
  username: "testuser",
  avatar: null
};

export default function VideoCallTest() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testVideoCall = () => {
    addTestResult("Testing video call functionality...");
    
    // Test if WebRTC is supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      addTestResult("✅ WebRTC is supported");
    } else {
      addTestResult("❌ WebRTC is not supported");
    }

    // Test if WebSocket is supported
    if (typeof WebSocket !== 'undefined') {
      addTestResult("✅ WebSocket is supported");
    } else {
      addTestResult("❌ WebSocket is not supported");
    }

    // Test if RTCPeerConnection is supported
    if (typeof RTCPeerConnection !== 'undefined') {
      addTestResult("✅ RTCPeerConnection is supported");
    } else {
      addTestResult("❌ RTCPeerConnection is not supported");
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Video Call Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to test video calls</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Video Call System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={testVideoCall}>
              Run System Test
            </Button>
            <VideoCallButton
              user={mockUser}
              variant="default"
              size="default"
            />
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <div className="bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No tests run yet. Click "Run System Test" to start.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">How to Test:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Run System Test" to check browser compatibility</li>
              <li>Click "Video Call" to test the video call modal</li>
              <li>Allow camera/microphone permissions when prompted</li>
              <li>Test the video call controls (mute, video toggle, etc.)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 