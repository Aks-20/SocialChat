import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Use HTTP connection instead of WebSocket to avoid connection issues
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Create a simpler pool for session storage
import { Pool } from "pg";
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

// Add graceful error handling
pool.on("error", (err) => {
  console.error("Database pool error:", err);
});

// Add process-level unhandled rejection handler to prevent crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process, just log the error
});
