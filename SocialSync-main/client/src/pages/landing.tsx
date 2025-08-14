import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Users, 
  TrendingUp, 
  Play,
  Eye,
  ArrowRight,
  Star,
  Globe,
  Video,
  Camera,
  UserPlus
} from 'lucide-react';

interface PublicPost {
  id: number;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
}

interface PublicStats {
  totalUsers: number;
  totalPosts: number;
  activeToday: number;
  totalCommunities: number;
}

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('trending');

  // Fetch public posts (trending content)
  const { data: publicPosts = [] } = useQuery({
    queryKey: ['/api/public/posts'],
    retry: false,
  });

  // Fetch platform stats
  const { data: stats } = useQuery({
    queryKey: ['/api/public/stats'],
    retry: false,
  });

  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Connect with Friends",
      description: "Build meaningful relationships and stay connected with people who matter."
    },
    {
      icon: <Camera className="h-6 w-6" />,
      title: "Share Your Story",
      description: "Post photos, videos, and thoughts to express yourself authentically."
    },
    {
      icon: <Video className="h-6 w-6" />,
      title: "Create Reels",
      description: "Share short videos and discover trending content from the community."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Join Communities",
      description: "Find your tribe and engage in discussions about your interests."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SocialConnect</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Sign In clicked');
                  window.location.href = '/auth';
                }}
              >
                Sign In
              </Button>
              <Button 
                className="facebook-blue"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Get Started clicked');
                  window.location.href = '/auth';
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect with friends and the
              <span className="text-blue-600"> world around you</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Share moments, discover communities, and build meaningful relationships on SocialConnect.
              Join millions of people sharing their stories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="facebook-blue"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Join SocialConnect clicked');
                  window.location.href = '/auth';
                }}
              >
                Join SocialConnect
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                setActiveSection('explore');
                // Scroll to content section
                const contentSection = document.getElementById('content-preview');
                if (contentSection) {
                  contentSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}>
                <Eye className="h-4 w-4 mr-2" />
                Explore Platform
              </Button>
            </div>
            
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalPosts.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Posts Shared</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.activeToday.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Active Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalCommunities.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Communities</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why SocialConnect?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to connect, share, and discover in one beautiful platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-blue-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Public Content Preview */}
      <section id="content-preview" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Discover Amazing Content</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See what's trending on SocialConnect right now.
            </p>
          </div>

          {/* Content Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-1 bg-white rounded-lg p-1">
              <Button
                variant={activeSection === 'trending' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection('trending')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Trending
              </Button>
              <Button
                variant={activeSection === 'explore' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection('explore')}
              >
                <Globe className="h-4 w-4 mr-2" />
                Explore
              </Button>
            </div>
          </div>

          {/* Public Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {activeSection === 'trending' && publicPosts.slice(0, 6).map((post: PublicPost) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {post.imageUrl && (
                    <div className="aspect-square bg-gray-200 relative">
                      <img
                        src={post.imageUrl}
                        alt="Post content"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.viewsCount}</span>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.user.avatar} />
                        <AvatarFallback>{post.user.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{post.user.name}</p>
                        <p className="text-gray-500 text-xs">@{post.user.username}</p>
                      </div>
                    </div>
                    <p className="text-gray-800 text-sm mb-3 line-clamp-2">{post.content}</p>
                    <div className="flex items-center justify-between text-gray-500 text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likesCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.commentsCount}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Join?</h3>
                <p className="text-gray-600 mb-6">
                  Create your account to start sharing, connecting, and discovering amazing content.
                </p>
                <Button 
                  size="lg" 
                  className="facebook-blue"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Get Started Now clicked');
                    window.location.href = '/auth';
                  }}
                >
                  Get Started Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SocialConnect</span>
            </div>
            <p className="text-gray-600 mb-4">Connect with friends and the world around you</p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-900">About</a>
              <a href="#" className="hover:text-gray-900">Privacy</a>
              <a href="#" className="hover:text-gray-900">Terms</a>
              <a href="#" className="hover:text-gray-900">Help</a>
            </div>
            <Separator className="my-6" />
            <p className="text-sm text-gray-500">
              © 2025 SocialConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}