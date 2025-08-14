import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertOtpCodeSchema,
  insertPostSchema,
  insertLikeSchema,
  insertCommentSchema,
  insertFollowSchema,
  insertStorySchema,
  insertMessageSchema,
  insertNotificationSchema,
} from "@shared/schema";
import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";
import fs from "fs";

// Extend Express Session interface
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
});

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587"),
  secure: (process.env.EMAIL_PORT || process.env.SMTP_PORT) === "465", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
async function sendOtpEmail(
  email: string,
  otp: string,
  purpose: string = "Verification"
): Promise<void> {
  // Check if email configuration is properly set up
  const isEmailConfigured =
    (process.env.EMAIL_HOST || process.env.SMTP_HOST) &&
    (process.env.EMAIL_USER || process.env.SMTP_USER) &&
    (process.env.EMAIL_PASS || process.env.SMTP_PASS) &&
    (process.env.FROM_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_FROM);

  if (!isEmailConfigured) {
    throw new Error(
      "Email configuration incomplete. Please configure EMAIL_HOST, EMAIL_USER, EMAIL_PASS, and FROM_EMAIL environment variables."
    );
  }

  await transporter.sendMail({
    from:
      process.env.FROM_EMAIL ||
      process.env.SMTP_FROM ||
      process.env.EMAIL_FROM ||
      "noreply@socialconnect.com",
    to: email,
    subject: `Your SocialConnect ${purpose} Code`,
    text: `Your ${purpose.toLowerCase()} code is: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #333;">Your ${purpose} Code</h2>
        <p>Use this code to complete your ${purpose.toLowerCase()}:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${otp}</span>
        </div>
        <p style="color: #666;">This code will expire in 10 minutes.</p>
      </div>
    `,
  });

  console.log(`✓ ${purpose} email sent successfully to ${email}`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);

      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtpCode({ email, code, expiresAt, used: false });

      // Send OTP via email using the dedicated function
      await sendOtpEmail(email, code, "Login");

      res.json({ message: "OTP sent successfully" });
    } catch (error: any) {
      console.error("Send OTP error:", error);

      // Provide specific error messages for email configuration issues
      if (error.message.includes("Email configuration incomplete")) {
        res.status(500).json({
          message:
            "Email service not configured. Please contact administrator.",
          error: "EMAIL_CONFIG_MISSING",
        });
      } else if (error.code === "EAUTH" || error.code === "ECONNECTION") {
        res.status(500).json({
          message: "Email service unavailable. Please try again later.",
          error: "EMAIL_SERVICE_ERROR",
        });
      } else {
        res.status(500).json({ message: "Failed to send OTP" });
      }
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      // Log the request body for debugging
      console.log("Verify OTP request body:", req.body);

      const { email, code, name, username } = z
        .object({
          email: z.string().email(),
          code: z.string().length(6),
          name: z.string().optional(),
          username: z.string().optional(),
        })
        .parse(req.body);

      const validOtp = await storage.getValidOtpCode(email, code);
      if (!validOtp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      let user = await storage.getUserByEmail(email);

      if (!user) {
        // New user - check if name and username are provided
        if (name && username) {
          // Create new user with provided details
          user = await storage.createUser({
            email,
            name,
            username,
            bio: null,
            avatar: null,
            coverPhoto: null,
            location: null,
            website: null,
            isVerified: false,
          });

          // Mark OTP as used only after successful account creation
          await storage.markOtpCodeUsed(validOtp.id);

          // Set session
          req.session.userId = user.id;

          // Save session explicitly
          req.session.save((err) => {
            if (err) {
              console.error("Session save error:", err);
              return res.status(500).json({ message: "Session error" });
            }

            console.log("Session saved successfully for new user:", user.id);
            res.json({
              user,
              isNewUser: true,
              message: "Account created successfully",
              redirectTo: "/",
            });
          });
        } else {
          // New user but missing details - return needsDetails flag
          // Don't mark OTP as used yet, keep it valid for the signup form
          res.json({
            needsDetails: true,
            message:
              "Please provide your name and username to complete registration",
          });
        }
        return;
      }

      // Existing user - log them in
      // Mark OTP as used for existing users
      await storage.markOtpCodeUsed(validOtp.id);

      req.session.userId = user.id;

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }

        console.log("Session saved successfully for user:", user.id);
        res.json({
          user,
          isNewUser: false,
          message: "Login successful",
          redirectTo: "/",
        });
      });
    } catch (error: any) {
      console.error("Verify OTP error:", error);

      // Provide specific error messages for validation issues
      if (error.name === "ZodError") {
        const missingFields = error.issues
          .filter(
            (issue: any) =>
              issue.code === "invalid_type" && issue.received === "undefined"
          )
          .map((issue: any) => issue.path[0]);

        if (missingFields.length > 0) {
          return res.status(400).json({
            message: `Missing required fields: ${missingFields.join(", ")}`,
            error: "VALIDATION_ERROR",
            missingFields,
          });
        }
      }

      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Logout error" });
      }
      console.log("Session destroyed successfully");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    // Log session info for debugging
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", req.session);
    console.log("User ID in session:", req.session.userId);

    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  });

  // Middleware to check authentication
  const requireAuth = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    req.user = await storage.getUser(req.session.userId);
    next();
  };

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (id !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, updates);

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }

      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Post routes
  app.get("/api/posts", async (req, res) => {
    try {
      const userId = req.query.userId
        ? parseInt(req.query.userId as string)
        : undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const posts = await storage.getPosts(userId, limit, offset);

      // Add isLiked flag for authenticated user
      if (req.session.userId) {
        const userLikes = await storage.getUserLikes(req.session.userId);
        const likedPostIds = new Set(userLikes.map((like) => like.postId));

        posts.forEach((post) => {
          post.isLiked = likedPostIds.has(post.id);
        });
      }

      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get posts" });
    }
  });

  app.post(
    "/api/posts",
    requireAuth,
    upload.single("media"),
    async (req, res) => {
      try {
        let postData = {
          userId: req.session.userId,
          content: req.body.content || null,
          imageUrl: null as string | null,
          videoUrl: null as string | null,
          privacy: req.body.privacy || "public",
        };

        // Handle file upload
        if (req.file) {
          const fileExtension = path.extname(req.file.originalname);
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}${fileExtension}`;
          const filePath = path.join("uploads", fileName);

          // Move file to permanent location
          fs.renameSync(req.file.path, filePath);

          // Determine if it's an image or video
          const isVideo = /\.(mp4|mov|avi)$/i.test(fileExtension);
          if (isVideo) {
            postData.videoUrl = `/uploads/${fileName}`;
          } else {
            postData.imageUrl = `/uploads/${fileName}`;
          }
        }

        const post = await storage.createPost(postData);
        const postWithUser = await storage.getPost(post.id);

        res.json(postWithUser);
      } catch (error) {
        console.error("Create post error:", error);
        res.status(500).json({ message: "Failed to create post" });
      }
    }
  );

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Add isLiked flag for authenticated user
      if (req.session.userId) {
        const userLikes = await storage.getUserLikes(req.session.userId);
        post.isLiked = userLikes.some((like) => like.postId === id);
      }

      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to get post" });
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getPost(id);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deletePost(id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Like routes
  app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.session.userId;

      // Check if already liked
      const userLikes = await storage.getUserLikes(userId);
      const existingLike = userLikes.find((like) => like.postId === postId);

      if (existingLike) {
        await storage.deleteLike(userId, postId);

        // Create notification for unlike (remove notification)
        // In a real app, you might want to remove the notification

        res.json({ liked: false });
      } else {
        await storage.createLike({ userId, postId });

        // Create notification for like
        const post = await storage.getPost(postId);
        if (post && post.userId !== userId) {
          await storage.createNotification({
            userId: post.userId,
            type: "like",
            fromUserId: userId,
            postId,
            isRead: false,
          });
        }

        res.json({ liked: true });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Comment routes
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get comments" });
    }
  });

  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { content } = z
        .object({ content: z.string().min(1) })
        .parse(req.body);

      const comment = await storage.createComment({
        userId: req.session.userId,
        postId,
        content,
      });

      // Create notification for comment
      const post = await storage.getPost(postId);
      if (post && post.userId !== req.session.userId) {
        await storage.createNotification({
          userId: post.userId,
          type: "comment",
          fromUserId: req.session.userId,
          postId,
          isRead: false,
        });
      }

      const commentWithUser = {
        ...comment,
        user: req.user,
      };

      res.json(commentWithUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Follow routes
  app.post("/api/users/:id/follow", requireAuth, async (req, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const followerId = req.session.userId;

      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const isAlreadyFollowing = await storage.isFollowing(
        followerId,
        followingId
      );

      if (isAlreadyFollowing) {
        await storage.deleteFollow(followerId, followingId);
        res.json({ following: false });
      } else {
        await storage.createFollow({ followerId, followingId });

        // Create notification for follow
        await storage.createNotification({
          userId: followingId,
          type: "follow",
          fromUserId: followerId,
          isRead: false,
        });

        res.json({ following: true });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const followers = await storage.getFollowers(userId);
      res.json(followers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get followers" });
    }
  });

  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      res.status(500).json({ message: "Failed to get following" });
    }
  });

  // Story routes
  app.get("/api/stories", async (req, res) => {
    try {
      const userId = req.query.userId
        ? parseInt(req.query.userId as string)
        : undefined;
      const stories = await storage.getActiveStories(userId);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stories" });
    }
  });

  app.post(
    "/api/stories",
    requireAuth,
    upload.single("media"),
    async (req, res) => {
      try {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        let storyData = {
          userId: req.session.userId,
          text: req.body.text || null,
          imageUrl: null as string | null,
          videoUrl: null as string | null,
          expiresAt,
        };

        // Handle file upload
        if (req.file) {
          const fileExtension = path.extname(req.file.originalname);
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}${fileExtension}`;
          const filePath = path.join("uploads", fileName);

          fs.renameSync(req.file.path, filePath);

          const isVideo = /\.(mp4|mov|avi)$/i.test(fileExtension);
          if (isVideo) {
            storyData.videoUrl = `/uploads/${fileName}`;
          } else {
            storyData.imageUrl = `/uploads/${fileName}`;
          }
        }

        const story = await storage.createStory(storyData);
        res.json(story);
      } catch (error) {
        res.status(500).json({ message: "Failed to create story" });
      }
    }
  );

  // Message routes
  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const conversations = await storage.getConversations(req.session.userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  app.get("/api/conversations/:userId", requireAuth, async (req, res) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      const messages = await storage.getConversation(
        req.session.userId,
        otherUserId
      );
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get conversation" });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const { receiverId, content } = z
        .object({
          receiverId: z.number(),
          content: z.string().min(1),
        })
        .parse(req.body);

      const message = await storage.createMessage({
        senderId: req.session.userId,
        receiverId,
        content,
      });

      // Create notification for message
      await storage.createNotification({
        userId: receiverId,
        type: "message",
        fromUserId: req.session.userId,
        isRead: false,
      });

      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(
        req.session.userId
      );
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.put("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.session.userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Search routes
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const type = (req.query.type as string) || "all";

      if (!query) {
        return res.json({ users: [], posts: [] });
      }

      let users = [];
      let posts = [];

      if (type === "all" || type === "users") {
        users = await storage.searchUsers(query);
      }

      if (type === "all" || type === "posts") {
        posts = await storage.searchPosts(query);
      }

      res.json({ users, posts });
    } catch (error) {
      res.status(500).json({ message: "Failed to search" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  const httpServer = createServer(app);
  return httpServer;
}
