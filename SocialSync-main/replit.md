# Social Media Platform - Architecture Overview

## Overview

This is a full-stack social media platform built with a React frontend, Express backend, and PostgreSQL database. The application features real-time messaging, post creation with media support, user authentication via OTP, comprehensive social features (likes, comments, follows), stories, live streaming capabilities, wellness tracking, community groups, and admin functionality.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with Shadcn/UI components
- **Build Tool**: Vite for development and build process
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with PostgreSQL store
- **Real-time Features**: WebSocket integration for live messaging and notifications
- **File Upload**: Multer for handling media uploads
- **Email Service**: Nodemailer for OTP delivery

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless PostgreSQL with HTTP connections
- **Schema**: Comprehensive social media schema including users, posts, comments, likes, follows, messages, stories, notifications, wellness tracking, and more

## Key Components

### Authentication System
- **OTP-based Authentication**: Email-based one-time password system
- **Session Management**: Server-side sessions with PostgreSQL storage
- **User Roles**: Support for regular users, admins, and super admins
- **Impersonation**: Admin capability to impersonate users

### Content Management
- **Post Creation**: Text, image, and video posts with privacy controls
- **Media Handling**: AWS S3 integration for file storage and management
- **Content Types**: Regular posts, stories (ephemeral content), live streams
- **Reactions**: Extended reaction system beyond simple likes
- **Comments**: Nested commenting with reactions

### Real-time Features
- **Live Messaging**: WebSocket-based real-time chat system
- **Notifications**: Real-time push notifications for user interactions
- **Live Streaming**: Basic live video streaming capabilities
- **Online Status**: Real-time user presence tracking

### Social Features
- **Follow System**: User following and follower relationships
- **Friend Requests**: Formal friendship system with requests
- **Community Groups**: User-created communities with moderation
- **Privacy Controls**: Granular privacy settings for posts and profiles

### Wellness & Lifestyle
- **Wellness Tracking**: Mood, energy, stress, sleep, and exercise tracking
- **Habit Tracking**: Goal setting and progress monitoring
- **Beauty & Shopping**: Product reviews, wishlists, and shopping posts
- **Events**: Event creation and attendance management

## Data Flow

### Authentication Flow
1. User enters email address
2. Server generates and sends OTP via email
3. User enters OTP for verification
4. New users complete profile setup
5. Session established with persistent login

### Post Creation Flow
1. User creates post with optional media
2. Media files uploaded to AWS S3
3. Post metadata stored in PostgreSQL
4. Real-time updates pushed to followers
5. Notifications sent to relevant users

### Real-time Messaging Flow
1. WebSocket connection established on login
2. Messages sent through WebSocket server
3. Messages persisted to database
4. Delivery confirmations and read receipts
5. Offline message queuing

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **File Storage**: AWS S3 for media file storage
- **Email Service**: SMTP configuration for OTP delivery
- **Session Store**: PostgreSQL-based session storage

### Development Tools
- **Type Safety**: Full TypeScript implementation
- **Code Quality**: ESLint and Prettier configuration
- **Build Process**: Vite for fast development and optimized builds
- **Environment**: Replit-optimized development environment

### Third-party Services
- **AWS SDK**: S3 client for file operations with presigned URLs
- **Nodemailer**: Email delivery service integration
- **WebSocket**: Native WebSocket implementation for real-time features

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: Neon PostgreSQL with automatic provisioning
- **File Serving**: Local development with Vite dev server
- **Hot Reload**: Vite HMR with React Fast Refresh

### Production Deployment
- **Build Process**: Vite production build with asset optimization
- **Server Bundle**: ESBuild for backend compilation
- **Static Assets**: Served from dist/public directory
- **Database Deployment**: Drizzle migrations with schema versioning
- **Environment Variables**: Secure configuration management

### Scalability Considerations
- **Database**: Connection pooling with optimized query patterns
- **File Storage**: CDN-ready S3 integration with proper caching
- **Real-time**: WebSocket scaling considerations for multiple instances
- **Session Storage**: PostgreSQL-based sessions for horizontal scaling

## Changelog

- June 28, 2025: Fixed Reels functionality comprehensively (AN001) - resolved like/unlike feedback always showing "Unliked" by implementing proper response handling with immediate UI updates, enhanced Create Reel feature with improved file validation and upload handling, added Instagram/Facebook-like smooth interactions including double-tap to like with heart animation, improved visual feedback with better button styles and animations, and ensured seamless video playback experience
- June 27, 2025: Fixed Friends tab display issue (AN029) - resolved Friends tab showing 0 friends despite database containing friendship records by fixing JavaScript initialization error in getFriends function, adding proper TypeScript types, and ensuring React Query properly renders friend data, Puja Keshori now displays correctly in Friends list
- June 27, 2025: Fixed top navigation search bar functionality (AN028) - resolved issue where search results showed posts but couldn't be opened by adding proper navigation to post detail pages, corrected routing from /post/:id to /posts/:id to match existing routes, search bar now properly opens both users and posts
- June 27, 2025: Fixed events visibility issue (AN027) - resolved events not visible to other users by removing user ID filter from events API endpoint, all public events now display properly to all users regardless of who created them, verified with 3 active events from different creators
- June 27, 2025: Fixed profile message button functionality (AN026) - resolved non-working Message button on user profiles by adding proper onClick handler, implemented conversation creation API endpoint with duplicate checking, added navigation to messages page, users can now start conversations directly from any profile
- June 27, 2025: Fixed virtual room access issue (AN025) - created dedicated Virtual Rooms page to view and join created live streams, added navigation link in sidebar, implemented proper room listing with user details and join functionality, resolved issue where created virtual rooms were not accessible anywhere in the interface
- June 27, 2025: Fixed post expiration system comprehensively (AN024) - implemented complete post expiration filtering across all endpoints (getPosts, getPublicPosts, getPost, searchPosts), expired posts are now properly hidden from all feeds and search results, verified with database testing showing 2 expired posts out of 20 total are correctly filtered
- June 27, 2025: Enhanced notification system with comprehensive reaction details (AN023) - added reaction_type and metadata columns to notifications table, implemented detailed reaction viewing with emoji-specific grouping, enhanced notification display to show specific reaction types instead of generic "liked your post"
- June 27, 2025: Fixed post reactions API and viewing functionality (AN022) - created comprehensive post reactions endpoint with proper user data and reaction type filtering, implemented reaction viewing modal with grouped reactions by emoji type, added proper TypeScript interfaces and database querying
- June 27, 2025: Fixed Reels like and share functionality (AN021) - enhanced like button responsiveness with loading states and feedback, improved share feature with platform-specific options (WhatsApp, Instagram, Twitter) and copy link functionality, fixed TypeScript errors and added proper mutation handling
- June 27, 2025: Fixed Community page routing from Settings (AN020) - replaced window.open() with proper navigation using wouter's setLocation, community buttons now close modal and navigate to correct pages instead of showing "page not found"
- June 25, 2025: Fixed Status interaction feedback (AN019) - added visible confirmation for status reactions and poll voting with toast notifications, implemented poll voting API endpoint with loading states, enhanced reaction buttons with hover effects and disabled states during requests, added vote percentage display and loading animations
- June 25, 2025: Fixed Status posting functionality (AN018) - resolved "Post Failed" error by correcting API request format in createStatusMutation, updated all status mutations to use proper apiRequest method signature, added better error handling and validation on both frontend and backend
- June 25, 2025: Fixed landing page authentication buttons (PA19) - resolved non-working Sign In and Get Started buttons by replacing Link components with direct navigation using window.location.href, fixed routing logic in App.tsx to properly handle auth navigation from landing page
- June 25, 2025: Fixed Reels interactive buttons (AN017) - added proper onClick handlers for Like, Comment, Share, Bookmark, and More buttons in Reels section, implemented like/share/save mutations with API calls and user feedback, buttons now respond correctly to clicks
- June 25, 2025: Fixed Explore Platform functionality (PA18) - enhanced Explore Platform button to scroll to content section and show dedicated explore content with platform features showcase, different content from trending section, and proper visual feedback
- June 25, 2025: Created legal pages - added comprehensive Community Guidelines, Terms of Service, and Privacy Policy pages with proper routing, detailed sections covering safety, data protection, user rights, and legal compliance
- June 25, 2025: Fixed virtual room visibility (AN012) - implemented live streams API and backend functionality, virtual rooms are now properly stored and can be accessed through direct links or other UI sections (removed from main feed per user preference)
- June 25, 2025: Fixed Groups page functionality (AN016) - resolved unresponsive Join and Message buttons by adding proper onClick handlers, fixed blank My Groups tab by adding proper filtering logic and empty state handling, improved user experience with functional group interactions
- June 25, 2025: Enhanced username validation (PA17) - updated username creation to allow dots between characters with rules: no consecutive dots, cannot start or end with dots, improved user experience with real-time input filtering and clear validation messages
- June 25, 2025: Added guest exploration mode (PA16) - implemented landing page with public content preview, platform statistics, and feature showcase allowing new users to explore before signup, plus updated authentication flow to support guest browsing
- June 25, 2025: Fixed habit streak calculation (AN015) - implemented proper streak calculation algorithm that counts consecutive completed days, updated logHabit method to automatically calculate and update streaks when habits are marked complete, and fixed frontend to display actual streak counts from database
- June 25, 2025: Fixed Community option in Settings section (AN014) - added missing Community tab with functional buttons for Community Guidelines, Terms of Service, Privacy Policy, Report Content, and Join Community Groups, plus community participation settings
- June 25, 2025: Fixed Contact Support functionality (AN013) - added missing onClick handlers to Email Support, Live Chat, and Report a Problem buttons in Help & Support modal, enabling proper contact support actions
- June 25, 2025: Fixed messages page blank screen issue (AN012) - resolved missing imports for Select, ScrollArea, and DropdownMenu components in MessagesDropdown, preventing ReferenceError crashes when clicking message icon
- June 25, 2025: Successfully implemented persistent video storage for Reels - Videos are now saved to disk and database permanently, with working upload functionality, proper file serving, and database persistence ensuring uploaded reels remain accessible across sessions with proper user data display. Fixed file filter to support all video formats including MP4 and MKV files.
- June 25, 2025: Enhanced Reels interface with Instagram/TikTok-style design - Added prominent upload buttons, floating action button, improved video cards with user avatars, trending badges, and smooth interaction buttons for a professional social media experience
- June 25, 2025: Fixed storage methods for new features - Added complete implementations for Reels, Status, and Groups storage methods, resolving upload errors and enabling full functionality for all three major new sections
- June 25, 2025: Successfully tested and validated all new API endpoints - Reels, Status, and Groups APIs are fully functional with proper JSON responses, authentication, and interactive features including likes, views, reactions, and RSVP functionality
- June 24, 2025: Implemented Reels, Status, and Groups features - added three major new sections with comprehensive functionality including video reels with TikTok-style interface, story-like status updates with polls and reactions, and enhanced community groups with events and file sharing capabilities
- June 24, 2025: Fixed Settings and Privacy security section buttons (AN011) - added missing onClick handlers to security buttons in settings modal, enabling View Login Activity, Manage Devices, Apps and Websites, and Log Out All Devices functionality
- June 24, 2025: Fixed Settings and Privacy account section buttons (AN010) - added missing onClick handlers to account buttons in settings modal, enabling proper navigation and functionality for Edit Profile, Change Email, Change Password, Download Data, and Delete Account features
- June 24, 2025: Fixed messages page blank screen (AN009) - corrected undefined selectedFile variable reference to use selectedFiles array, preventing component crash when clicking message icon
- June 24, 2025: Fixed duplicate share icons (AN008) - removed redundant SharePostButton component from enhanced post card, keeping only ShareDropdown to prevent duplicate share buttons
- June 24, 2025: Fixed community group category filtering (AN007) - corrected React Query implementation to properly pass category parameters to server-side filtering API
- June 24, 2025: Fixed explore page post opening functionality (AN006) - created full-size post detail modal with media display, video controls, and interactive features for trending posts
- June 24, 2025: Fixed messages three dots menu functionality (AN005) - replaced Popover with DropdownMenu component, added proper click handlers for mark all as read and refresh functionality
- June 24, 2025: Fixed saved posts functionality (AN004) - created proper saved posts database table, API endpoints, and updated frontend to use dedicated save system instead of confusing it with likes
- June 24, 2025: Fixed events functionality (AN003) - removed duplicate API endpoints, fixed database schema requirements, and created comprehensive Events page
- June 24, 2025: Fixed public post sharing functionality - resolved table import issues in server routes
- June 24, 2025: Fixed community join functionality - added authentication middleware and membership validation
- June 24, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.