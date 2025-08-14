import { apiRequest } from './queryClient';
import { User, Post, PostWithUser, Comment, Story, Message, Notification } from '@shared/schema';

export const api = {
  // Auth
  sendOTP: (email: string) => apiRequest('POST', '/api/auth/send-otp', { email }),
  verifyOTP: (email: string, code: string, name?: string, username?: string) => 
    apiRequest('POST', '/api/auth/verify-otp', { email, code, name, username }),
  logout: () => apiRequest('POST', '/api/auth/logout'),
  getMe: () => apiRequest('GET', '/api/auth/me'),

  // Users
  getUser: (id: number) => apiRequest('GET', `/api/users/${id}`),
  updateUser: (id: number, data: Partial<User>) => apiRequest('PUT', `/api/users/${id}`, data),
  searchUsers: (query: string) => apiRequest('GET', `/api/users/search?q=${encodeURIComponent(query)}`),
  followUser: (id: number) => apiRequest('POST', `/api/users/${id}/follow`),
  getFollowers: (id: number) => apiRequest('GET', `/api/users/${id}/followers`),
  getFollowing: (id: number) => apiRequest('GET', `/api/users/${id}/following`),



  // Posts
  getPosts: (userId?: number, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId.toString());
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    return apiRequest('GET', `/api/posts?${params.toString()}`);
  },
  getPost: (id: number) => apiRequest('GET', `/api/posts/${id}`),
  createPost: (data: FormData) => apiRequest('POST', '/api/posts', data),
  deletePost: (id: number) => apiRequest('DELETE', `/api/posts/${id}`),
  likePost: (id: number) => apiRequest('POST', `/api/posts/${id}/like`),

  // Comments
  getComments: (postId: number) => apiRequest('GET', `/api/posts/${postId}/comments`),
  createComment: (postId: number, content: string) => 
    apiRequest('POST', `/api/posts/${postId}/comments`, { content }),

  // Stories
  getStories: (userId?: number) => {
    const params = userId ? `?userId=${userId}` : '';
    return apiRequest('GET', `/api/stories${params}`);
  },
  createStory: (data: FormData) => apiRequest('POST', '/api/stories', data),

  // Messages
  getConversations: () => apiRequest('GET', '/api/conversations'),
  getConversation: (userId: number) => apiRequest('GET', `/api/conversations/${userId}`),
  sendMessage: (receiverId: number, content: string) => 
    apiRequest('POST', '/api/messages', { receiverId, content }),

  // Notifications
  getNotifications: () => apiRequest('GET', '/api/notifications'),
  markNotificationRead: (id: number) => apiRequest('PUT', `/api/notifications/${id}/read`),
  markAllNotificationsRead: () => apiRequest('PUT', '/api/notifications/read-all'),

  // Search
  search: (query: string, type?: string) => {
    const params = new URLSearchParams();
    params.append('q', query);
    if (type) params.append('type', type);
    return apiRequest('GET', `/api/search?${params.toString()}`);
  },
};
