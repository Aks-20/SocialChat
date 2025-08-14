import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Eye, Users, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface PublicPost {
  id: number;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
  likesCount: number;
  viewsCount: number;
  commentsCount?: number;
  user: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  feeling?: string;
  activity?: string;
  location?: string;
  taggedUsers?: Array<{ id: number; name: string; username: string }>;
}

interface PublicComment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
}

export default function PublicPostPage() {
  const { id } = useParams();
  const postId = parseInt(id || "0");

  const { data: post, isLoading: postLoading, error: postError } = useQuery({
    queryKey: [`/api/posts/${postId}/public`],
    enabled: !!postId,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: [`/api/posts/${postId}/comments/public`],
    enabled: !!postId,
  });

  if (postLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded"></div>
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-200 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Post not found</h1>
          <p className="text-gray-600">This post may have been deleted or doesn't exist.</p>
          <Link href="/">
            <Button>
              <ArrowRight className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-blue-600">SocialConnect</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Join SocialConnect
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Post Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.user.avatar || undefined} />
                <AvatarFallback>
                  {post.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{post.user.name}</h3>
                  <span className="text-gray-500">@{post.user.username}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                  {post.feeling && (
                    <>
                      <span>•</span>
                      <span>feeling {post.feeling}</span>
                    </>
                  )}
                  {post.activity && (
                    <>
                      <span>•</span>
                      <span>{post.activity}</span>
                    </>
                  )}
                  {post.location && (
                    <>
                      <span>•</span>
                      <span>at {post.location}</span>
                    </>
                  )}
                </div>
                {post.taggedUsers && post.taggedUsers.length > 0 && (
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-sm text-gray-500">with</span>
                    {post.taggedUsers.map((taggedUser, index) => (
                      <span key={taggedUser.id} className="text-sm text-blue-600">
                        {taggedUser.name}
                        {index < post.taggedUsers!.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {post.content && (
              <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
            )}

            {post.imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={post.imageUrl} 
                  alt="Post content" 
                  className="w-full h-auto max-h-96 object-cover"
                />
              </div>
            )}

            {post.videoUrl && (
              <div className="rounded-lg overflow-hidden">
                <video 
                  controls 
                  src={post.videoUrl}
                  className="w-full h-auto max-h-96"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            <Separator />

            {/* Engagement Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{post.likesCount || 0} likes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{comments.length || 0} comments</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewsCount || 0} views</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        {comments.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <h4 className="font-semibold">Comments</h4>
            </CardHeader>
            <CardContent className="space-y-4">
              {commentsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-24 h-3 bg-gray-200 rounded"></div>
                        <div className="w-full h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                comments.map((comment: PublicComment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{comment.user.name}</span>
                        <span className="text-xs text-gray-500">@{comment.user.username}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="shadow-sm bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Join the conversation on SocialConnect
              </h3>
              <p className="text-gray-600">
                Connect with friends, share your thoughts, and discover amazing content.
              </p>
            </div>
            <div className="flex justify-center space-x-3">
              <Link href="/">
                <Button variant="outline">
                  Sign In
                </Button>
              </Link>
              <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  Join SocialConnect
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}