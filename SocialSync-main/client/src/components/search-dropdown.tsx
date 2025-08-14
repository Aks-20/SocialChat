import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserInitials } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { 
  Search, 
  Clock, 
  TrendingUp, 
  Hash, 
  X,
  UserIcon,
  FileText
} from "lucide-react";
import type { User as UserType, PostWithUser } from "@shared/schema";

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function SearchDropdown({ 
  isOpen, 
  onClose, 
  searchQuery, 
  onSearchChange 
}: SearchDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "john doe", "react tutorial", "nature photography"
  ]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { users: [], posts: [] };
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      console.log('Search results:', data); // Debug log
      return data;
    },
    enabled: searchQuery.length > 0,
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

  const addToRecentSearches = (query: string) => {
    if (query.trim() && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  const removeFromRecentSearches = (query: string) => {
    setRecentSearches(prev => prev.filter(item => item !== query));
  };

  const trendingTopics = [
    { tag: "technology", posts: "125k posts" },
    { tag: "photography", posts: "89k posts" },
    { tag: "travel", posts: "67k posts" },
    { tag: "food", posts: "45k posts" }
  ];

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
    >
      {searchQuery.length === 0 ? (
        <div className="p-4">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">Recent</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 text-xs h-auto p-0"
                  onClick={() => setRecentSearches([])}
                >
                  Clear all
                </Button>
              </div>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer group"
                    onClick={() => {
                      onSearchChange(search);
                      addToRecentSearches(search);
                    }}
                  >
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-700">{search}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-auto p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromRecentSearches(search);
                      }}
                    >
                      <X className="h-3 w-3 text-gray-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Topics */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Trending</h3>
            <div className="space-y-2">
              {trendingTopics.map((topic, index) => (
                <div 
                  key={index}
                  className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => {
                    onSearchChange(`#${topic.tag}`);
                    addToRecentSearches(`#${topic.tag}`);
                  }}
                >
                  <TrendingUp className="h-4 w-4 text-orange-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">#{topic.tag}</div>
                    <div className="text-xs text-gray-500">{topic.posts}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {(searchResults as any)?.users?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    People
                  </h4>
                  {(searchResults as any)?.users?.map((user: UserType) => (
                    <div 
                      key={user.id} 
                      className="block cursor-pointer"
                      onClick={() => {
                        addToRecentSearches(user.name || user.username);
                        onClose();
                        setLocation(`/profile/${user.id}`);
                      }}
                    >
                      <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={user.avatar || ""} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {user.name || user.username}
                          </div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                        <UserIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(searchResults as any)?.posts?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Posts
                  </h4>
                  {(searchResults as any).posts.map((post: PostWithUser) => (
                    <div 
                      key={post.id}
                      className="flex items-start p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => {
                        addToRecentSearches(post.content?.substring(0, 30) + "..." || "Post");
                        onClose();
                        setLocation(`/posts/${post.id}`);
                      }}
                    >
                      <Avatar className="h-8 w-8 mr-3 mt-1">
                        <AvatarImage src={post.user.avatar || ""} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {getUserInitials(post.user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 mb-1">
                          {post.user.name || post.user.username}
                        </div>
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {post.content}
                        </div>
                      </div>
                      <FileText className="h-4 w-4 text-gray-400 mt-1" />
                    </div>
                  ))}
                </div>
              )}

              {(!(searchResults as any)?.users?.length && !(searchResults as any)?.posts?.length) && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-sm text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Try searching for people, posts, or hashtags
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}