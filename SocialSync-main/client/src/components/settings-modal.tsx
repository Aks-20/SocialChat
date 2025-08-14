import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Bell,
  Eye,
  Users,
  Lock,
  Mail,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Globe,
  Volume2,
  Download,
  Trash2,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { useLocation } from 'wouter';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'settings' | 'privacy' | 'help' | 'display';
}

export default function SettingsModal({ isOpen, onClose, type }: SettingsModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loginActivity, setLoginActivity] = useState<any>(null);
  const [showLoginActivity, setShowLoginActivity] = useState(false);
  const [selectedHelpTopic, setSelectedHelpTopic] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    email: false,
    push: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    whoCanMessage: 'everyone',
    whoCanFollow: 'everyone',
    showOnlineStatus: true,
    showLastSeen: true,
    twoFactorAuth: false,
  });

  const [display, setDisplay] = useState({
    theme: 'system',
    language: 'en',
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
    autoplay: true,
  });

  const [tempDisplay, setTempDisplay] = useState({
    theme: 'system',
    language: 'en',
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
    autoplay: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('displaySettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setDisplay(parsed);
      setTempDisplay(parsed);
      applySettings(parsed);
    }
  }, []);

  // Reset temp settings when modal opens
  useEffect(() => {
    if (isOpen && type === 'display') {
      setTempDisplay(display);
    }
  }, [isOpen, type, display]);

  // Apply settings to the document
  const applySettings = (settings: typeof display) => {
    // Apply theme
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Apply font size
    root.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large');
    root.classList.add(`text-${settings.fontSize}`);

    // Apply accessibility settings
    if (settings.reducedMotion) {
      root.classList.add('motion-reduced');
    } else {
      root.classList.remove('motion-reduced');
    }

    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Store language preference
    document.documentElement.lang = settings.language;
  };

  // Save settings and apply them
  const saveDisplaySettings = () => {
    setDisplay(tempDisplay);
    localStorage.setItem('displaySettings', JSON.stringify(tempDisplay));
    applySettings(tempDisplay);
    
    toast({
      title: "Settings saved",
      description: "Your display preferences have been updated.",
    });
  };

  // Cancel changes and revert to saved settings
  const cancelDisplaySettings = () => {
    setTempDisplay(display);
  };

  const helpTopics = {
    'getting-started': {
      title: 'Getting Started Guide',
      content: [
        'Welcome to our social platform! Here are the basics:',
        '• Create your profile by adding a photo and bio',
        '• Start following friends and discover new content',
        '• Share posts, stories, and engage with others',
        '• Customize your privacy settings',
        '• Explore different features like live streaming and events'
      ]
    },
    'account-privacy': {
      title: 'Account & Privacy',
      content: [
        'Manage your account security and privacy:',
        '• Change your password regularly',
        '• Enable two-factor authentication',
        '• Control who can see your posts and profile',
        '• Manage your data and download information',
        '• Block or report users if needed',
        '• Review login sessions and devices'
      ]
    },
    'posts-stories': {
      title: 'Posts & Stories',
      content: [
        'Learn about sharing content:',
        '• Create posts with text, images, or videos',
        '• Add reactions and comments to interact',
        '• Share temporary stories that disappear',
        '• Use hashtags to reach more people',
        '• Edit or delete your content anytime',
        '• Save posts to collections for later'
      ]
    },
    'messages-notifications': {
      title: 'Messages & Notifications',
      content: [
        'Stay connected with messaging:',
        '• Send private messages to other users',
        '• Create group conversations and rooms',
        '• Customize notification preferences',
        '• Control who can message you',
        '• Manage read receipts and online status',
        '• Mute conversations when needed'
      ]
    },
    'troubleshooting': {
      title: 'Troubleshooting',
      content: [
        'Common issues and solutions:',
        '• Check your internet connection',
        '• Clear browser cache and cookies',
        '• Try refreshing the page',
        '• Ensure you have the latest browser version',
        '• Contact support if problems persist',
        '• Report bugs through the feedback system'
      ]
    }
  };

  const handleHelpTopicClick = (topicKey: string) => {
    setSelectedHelpTopic(topicKey);
  };

  const getModalContent = () => {
    switch (type) {
      case 'settings':
        return {
          title: 'Settings',
          description: 'Manage your account settings and preferences',
        };
      case 'privacy':
        return {
          title: 'Settings & Privacy',
          description: 'Control your privacy and security settings',
        };
      case 'help':
        return {
          title: 'Help & Support',
          description: 'Get help and support for your account',
        };
      case 'display':
        return {
          title: 'Display & Accessibility',
          description: 'Customize your display and accessibility preferences',
        };
      default:
        return {
          title: 'Settings',
          description: 'Manage your account settings',
        };
    }
  };

  const modalContent = getModalContent();

  if (type === 'help') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>{modalContent.title}</span>
            </DialogTitle>
            <DialogDescription>{modalContent.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Help Center */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Help Center</CardTitle>
                <CardDescription>Find answers to common questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleHelpTopicClick('getting-started')}
                >
                  Getting Started Guide
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleHelpTopicClick('account-privacy')}
                >
                  Account & Privacy
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleHelpTopicClick('posts-stories')}
                >
                  Posts & Stories
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleHelpTopicClick('messages-notifications')}
                >
                  Messages & Notifications
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleHelpTopicClick('troubleshooting')}
                >
                  Troubleshooting
                </Button>
              </CardContent>
            </Card>

            {/* Selected Help Topic Content */}
            {selectedHelpTopic && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{helpTopics[selectedHelpTopic as keyof typeof helpTopics].title}</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedHelpTopic(null)}
                    >
                      Back
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {helpTopics[selectedHelpTopic as keyof typeof helpTopics].content.map((item, index) => (
                      <p key={index} className="text-sm text-gray-700 leading-relaxed">
                        {item}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Support</CardTitle>
                <CardDescription>Get personalized help from our team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    window.open('mailto:support@chunumunu.com?subject=Support Request&body=Please describe your issue or question:', '_blank');
                    toast({
                      title: "Email Support",
                      description: "Opening your email client to contact support",
                    });
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    toast({
                      title: "Live Chat",
                      description: "Live chat support will be available soon. Please use email support for now.",
                    });
                  }}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Live Chat
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    toast({
                      title: "Report a Problem",
                      description: "Please use email support to report any issues you're experiencing.",
                    });
                    window.open('mailto:support@chunumunu.com?subject=Problem Report&body=Please describe the problem you encountered:', '_blank');
                  }}
                >
                  Report a Problem
                </Button>
              </CardContent>
            </Card>

            {/* Community */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community</CardTitle>
                <CardDescription>Connect with other users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    onClose();
                    setLocation('/community-guidelines');
                    toast({
                      title: "Community Guidelines",
                      description: "Navigating to community guidelines",
                    });
                  }}
                >
                  Community Guidelines
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    onClose();
                    setLocation('/terms');
                    toast({
                      title: "Terms of Service",
                      description: "Navigating to terms of service",
                    });
                  }}
                >
                  Terms of Service
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    onClose();
                    setLocation('/privacy');
                    toast({
                      title: "Privacy Policy",
                      description: "Navigating to privacy policy",
                    });
                  }}
                >
                  Privacy Policy
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (type === 'display') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Monitor className="w-5 h-5" />
              <span>{modalContent.title}</span>
            </DialogTitle>
            <DialogDescription>{modalContent.description}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Theme</CardTitle>
                <CardDescription>Choose your preferred color scheme</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={tempDisplay.theme} onValueChange={(value) => setTempDisplay({...tempDisplay, theme: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center space-x-2">
                        <Sun className="w-4 h-4" />
                        <span>Light</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center space-x-2">
                        <Moon className="w-4 h-4" />
                        <span>Dark</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center space-x-2">
                        <Monitor className="w-4 h-4" />
                        <span>System</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Language */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Language</CardTitle>
                <CardDescription>Select your preferred language</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={tempDisplay.language} onValueChange={(value) => setTempDisplay({...tempDisplay, language: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Font Size */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Font Size</CardTitle>
                <CardDescription>Adjust text size for better readability</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={tempDisplay.fontSize} onValueChange={(value) => setTempDisplay({...tempDisplay, fontSize: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Accessibility */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Accessibility</CardTitle>
                <CardDescription>Options to improve accessibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reduced-motion">Reduced Motion</Label>
                    <p className="text-sm text-muted-foreground">Reduce animations and transitions</p>
                  </div>
                  <Switch
                    id="reduced-motion"
                    checked={tempDisplay.reducedMotion}
                    onCheckedChange={(checked) => setTempDisplay({...tempDisplay, reducedMotion: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="high-contrast">High Contrast</Label>
                    <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                  </div>
                  <Switch
                    id="high-contrast"
                    checked={tempDisplay.highContrast}
                    onCheckedChange={(checked) => setTempDisplay({...tempDisplay, highContrast: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoplay">Autoplay Videos</Label>
                    <p className="text-sm text-muted-foreground">Automatically play videos in feed</p>
                  </div>
                  <Switch
                    id="autoplay"
                    checked={tempDisplay.autoplay}
                    onCheckedChange={(checked) => setTempDisplay({...tempDisplay, autoplay: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Apply and Cancel Buttons - Fixed at bottom */}
          <div className="flex justify-end space-x-2 pt-4 border-t mt-4 bg-background">
            <Button variant="outline" onClick={() => {
              cancelDisplaySettings();
              onClose();
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              saveDisplaySettings();
              onClose();
            }}>
              Apply Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>{modalContent.title}</span>
          </DialogTitle>
          <DialogDescription>{modalContent.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage your basic account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    onClose();
                    window.location.href = '/settings';
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    toast({
                      title: "Change Email",
                      description: "Please visit the Settings page to change your email address.",
                    });
                    onClose();
                    window.location.href = '/settings';
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Change Email
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    toast({
                      title: "Change Password",
                      description: "Please visit the Settings page to change your password.",
                    });
                    onClose();
                    window.location.href = '/settings';
                  }}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Separator />
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      toast({
                        title: "Preparing Download",
                        description: "Your data is being prepared for download...",
                      });

                      const response = await fetch('/api/user/export', {
                        method: 'GET',
                        credentials: 'include',
                      });

                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'user-data-export.json';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);

                        toast({
                          title: "Download Complete",
                          description: "Your data has been downloaded successfully",
                        });
                      } else {
                        throw new Error('Failed to download data');
                      }
                    } catch (error) {
                      toast({
                        title: "Download Failed",
                        description: "Failed to download your data. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Your Data
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={() => {
                    toast({
                      title: "Account Deactivation",
                      description: "Please visit the Settings page to deactivate your account.",
                    });
                    onClose();
                    window.location.href = '/settings';
                  }}
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Deactivate Account
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={() => {
                    toast({
                      title: "Account Deletion",
                      description: "Please visit the Settings page to delete your account.",
                    });
                    onClose();
                    window.location.href = '/settings';
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Privacy</CardTitle>
                <CardDescription>Control who can see your profile and posts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <Select value={privacy.profileVisibility} onValueChange={(value) => setPrivacy({...privacy, profileVisibility: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="who-can-message">Who Can Message You</Label>
                  <Select value={privacy.whoCanMessage} onValueChange={(value) => setPrivacy({...privacy, whoCanMessage: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="nobody">Nobody</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="who-can-follow">Who Can Follow You</Label>
                  <Select value={privacy.whoCanFollow} onValueChange={(value) => setPrivacy({...privacy, whoCanFollow: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="approval">Require Approval</SelectItem>
                      <SelectItem value="nobody">Nobody</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-online">Show Online Status</Label>
                    <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                  </div>
                  <Switch
                    id="show-online"
                    checked={privacy.showOnlineStatus}
                    onCheckedChange={(checked) => setPrivacy({...privacy, showOnlineStatus: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-last-seen">Show Last Seen</Label>
                    <p className="text-sm text-muted-foreground">Let others see when you were last active</p>
                  </div>
                  <Switch
                    id="show-last-seen"
                    checked={privacy.showLastSeen}
                    onCheckedChange={(checked) => setPrivacy({...privacy, showLastSeen: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="likes-notif">Likes</Label>
                    <p className="text-sm text-muted-foreground">When someone likes your posts</p>
                  </div>
                  <Switch
                    id="likes-notif"
                    checked={notifications.likes}
                    onCheckedChange={(checked) => setNotifications({...notifications, likes: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="comments-notif">Comments</Label>
                    <p className="text-sm text-muted-foreground">When someone comments on your posts</p>
                  </div>
                  <Switch
                    id="comments-notif"
                    checked={notifications.comments}
                    onCheckedChange={(checked) => setNotifications({...notifications, comments: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="follows-notif">New Followers</Label>
                    <p className="text-sm text-muted-foreground">When someone starts following you</p>
                  </div>
                  <Switch
                    id="follows-notif"
                    checked={notifications.follows}
                    onCheckedChange={(checked) => setNotifications({...notifications, follows: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="messages-notif">Messages</Label>
                    <p className="text-sm text-muted-foreground">When you receive new messages</p>
                  </div>
                  <Switch
                    id="messages-notif"
                    checked={notifications.messages}
                    onCheckedChange={(checked) => setNotifications({...notifications, messages: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notif">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="email-notif"
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>Keep your account safe and secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    id="two-factor"
                    checked={privacy.twoFactorAuth}
                    onCheckedChange={(checked) => setPrivacy({...privacy, twoFactorAuth: checked})}
                  />
                </div>
                <Separator />
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/user/login-activity', {
                        method: 'GET',
                        credentials: 'include',
                      });

                      if (response.ok) {
                        const data = await response.json();
                        const lastLoginFormatted = data.lastLogin 
                          ? new Date(data.lastLogin).toLocaleString()
                          : 'Unknown';
                        
                        // Show detailed login activity modal
                        const deviceList = data.devices?.map((device: any) => 
                          `${device.device} - ${device.location} (${new Date(device.timestamp).toLocaleString()})`
                        ).join('\n') || 'No recent devices found';
                        
                        toast({
                          title: "Login Activity",
                          description: `Recent logins: ${data.recentLogins || 0}\nLast login: ${lastLoginFormatted}\n\nRecent devices:\n${deviceList}`,
                        });
                      } else {
                        throw new Error('Failed to load login activity');
                      }
                    } catch (error) {
                      toast({
                        title: "Login Activity",
                        description: "Unable to load login activity at this time.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  View Login Activity
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/user/devices', {
                        method: 'GET',
                        credentials: 'include',
                      });

                      if (response.ok) {
                        const data = await response.json();
                        toast({
                          title: "Manage Devices",
                          description: `You have ${data.devices?.length || 0} active devices. Visit Settings for full management.`,
                        });
                      } else {
                        throw new Error('Failed to load devices');
                      }
                    } catch (error) {
                      toast({
                        title: "Device Management",
                        description: "Visit the full Settings page to manage your devices.",
                      });
                    }
                    onClose();
                    window.location.href = '/settings';
                  }}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Manage Devices
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    toast({
                      title: "Apps and Websites",
                      description: "Manage connected apps and websites in the full Settings page.",
                    });
                    onClose();
                    window.location.href = '/settings';
                  }}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Apps and Websites
                </Button>
                <Separator />
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/auth/logout-all-devices', {
                        method: 'POST',
                        credentials: 'include',
                      });

                      if (response.ok) {
                        toast({
                          title: "Logged Out",
                          description: "You have been logged out of all devices.",
                        });
                        onClose();
                        // Redirect to login after logging out all devices
                        setTimeout(() => {
                          window.location.href = '/';
                        }, 2000);
                      } else {
                        throw new Error('Failed to logout all devices');
                      }
                    } catch (error) {
                      toast({
                        title: "Logout Failed",
                        description: "Failed to logout from all devices. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Log Out All Devices
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}