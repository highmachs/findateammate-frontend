import { Router } from "express";
import { waitUntil } from "@vercel/functions";
import { db } from "../db";
import { users } from "../../shared/schema.sqlite";
import { eq } from "drizzle-orm";
import { logger } from "../logger";

export const diagnosticRouter = Router();

diagnosticRouter.get("/test-waituntil", async (req, res) => {
  // Test Turso directly from Vercel bypassing all middleware
  const start = Date.now();
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Turso query hard timeout (5s)")), 5000)
    );
    const queryPromise = db.select().from(users).limit(1);
    
    await Promise.race([queryPromise, timeoutPromise]);
    const duration = Date.now() - start;
    
    res.status(200).json({ 
      success: true,
      message: `Turso connected successfully in ${duration}ms!`,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.TURSO_DATABASE_URL,
        dbUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 15) + "...",
        hasAuthToken: !!process.env.TURSO_AUTH_TOKEN
      }
    });
  } catch (error: any) {
    const duration = Date.now() - start;
    res.status(500).json({
      success: false,
      message: "Turso connection failed",
      error: error.message,
      stack: error.stack,
      durationMs: duration,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.TURSO_DATABASE_URL,
        dbUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 15) + "...",
        hasAuthToken: !!process.env.TURSO_AUTH_TOKEN
      }
    });
  }
});
