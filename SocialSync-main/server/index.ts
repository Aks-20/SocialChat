import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Add security headers for production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  } else {
    // Development headers - less restrictive for localhost
    res.setHeader("X-Content-Type-Options", "nosniff");
  }
  next();
});

app.use(express.json({ limit: "10mb" }));

// Configure PostgreSQL session store
const PgSession = connectPgSimple(session);

// Configure session middleware with PostgreSQL store
app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "fallback-secret-key-for-development",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure:
        process.env.NODE_ENV === "production" &&
        process.env.APP_URL?.startsWith("https"), // Only secure if HTTPS
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for persistent login
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax", // Use lax for cross-subdomain support
      domain: process.env.NODE_ENV === "production" ? undefined : undefined, // Allow all domains in production
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Health check endpoint for hosting platforms
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error("Server error:", err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Serve the app on the configured port
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    const host =
      process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

    // Log environment info for debugging
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Port: ${port}`);
    console.log(`Host: ${host}`);
    console.log(`App URL: ${process.env.APP_URL || "not set"}`);
    console.log(
      `Session Secret: ${process.env.SESSION_SECRET ? "set" : "not set"}`
    );

    server.listen(
      {
        port,
        host,
      },
      () => {
        log(
          `🚀 Server running on ${host}:${port} in ${
            process.env.NODE_ENV || "development"
          } mode`
        );
      }
    );

    // Graceful shutdown handling
    process.on("SIGTERM", () => {
      log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        log("Process terminated");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      log("SIGINT received, shutting down gracefully");
      server.close(() => {
        log("Process terminated");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
