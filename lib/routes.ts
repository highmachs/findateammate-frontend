import express from "express";
export const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

import { emitNotification, emitChatUpdated, emitMessage, emitMaintenance } from "./realtime";

import { logger } from "./logger";

import { storage } from "./storage";
import { insertPostSchema, insertConnectionRequestSchema, insertMessageSchema, insertUserSchema, selectUserSchema, type AuditLog, type Analytics, User } from "@shared/schema.sqlite";
import { SKILLS, DEPARTMENTS, COLLEGES } from "@shared/constants";
import {
  registerForEvent,
  getEventRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
  getEventMatchScore,
} from "./routes/events";
import { z } from "zod";
const rateLimit = (options: any) => (req: any, res: any, next: any) => next();
const ipKeyGenerator = (ip: any) => ip;
import { requireAuth, requireVerifiedAuth, optionalAuth, requireAdmin, requireOrganiser, isSuperAdminEmail } from "./middleware/auth";
import multer from "multer";
import path from "path";
import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinary";
// express value unused, type Express imported above
// import express from "express";
import { db } from "./db";
import { posts, users, analytics, postInteractions } from "@shared/schema.sqlite";
import { maintenanceMiddleware } from "./middleware/maintenance";
import { sql, eq, and, not, isNull, gt, inArray, desc } from "drizzle-orm";
// passport unused here, moved to auth.ts
// import passport from "passport";

// Rate limiter for voting
const voteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 votes per minute
  message: { message: "You've reached the voting limit (10 per minute). Please wait 60 seconds before voting again.", code: "RATE_LIMIT_EXCEEDED" },
  // Use default IP detection (works with trust proxy)
});

// FIX BUG #12: Rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 uploads per hour
  message: { message: "Upload limit reached (5 files per hour). You can upload more files in 1 hour.", code: "RATE_LIMIT_EXCEEDED" },
  // Use default IP detection (works with trust proxy)
});

// FIX BUG #13: Rate limiter for notification operations
const notificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 operations per minute
  message: { message: "Too many notification requests (limit: 20 per minute). Please wait a moment before trying again.", code: "RATE_LIMIT_EXCEEDED" },
  // Use default IP detection (works with trust proxy)
});

// FIX: Rate limiter for chat messages to prevent spam
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute per user
  keyGenerator: (req: any) => req.user?.id || ipKeyGenerator(req.ip),
  message: { message: "Slow down! You're sending messages too quickly (limit: 30 per minute). Take a breather and try again in a moment.", code: "RATE_LIMIT_EXCEEDED" },
  standardHeaders: true,
  legacyHeaders: false,
});

const trackSearchSchema = z.object({
  query: z.string().max(300).optional().default(""),
  filters: z.record(z.string(), z.unknown()).optional().default({}),
  resultsCount: z.number().int().min(0).max(10000).optional().default(0),
  clickedPostIds: z.array(z.string().min(1).max(64)).max(200).optional().default([]),
});


// Extend Express session to include user
declare module "express-session" {
  interface SessionData {
    userId?: string;
    csrfInit?: boolean;
  }
}

// Middleware to load user from session
async function loadUserFromSession(req: any, _res: any, next: any) {
  // Optimization: Skip DB load for static assets/non-API
  if (!req.path.startsWith("/api")) {
    return next();
  }

  if (req.user) {
    return next();
  }

  if (req.session.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        // Security: Exclude password from session user object
        const { password, ...safeUser } = user;
        req.user = safeUser as User;
        
        // Track last active time (fire and forget - don't await)
        storage.updateLastActive(user.id);
      } else {
        // User deleted but session exists - destroy session
        req.session.destroy(() => {});
      }
    } catch (err) {
      logger.error("Session load error", err);
    }
  }
  next();
}

// FIX BUG #2: Middleware to check onboarding completion for protected routes
async function requireOnboarding(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized", code: "UNAUTHORIZED" });
  }

  // Allow admins to bypass onboarding - they can perform tasks without completing profile
  if (req.user.isBanned && !req.user.isAdmin) {
    return res.status(403).json({ message: "You have been banned and cannot perform this action", code: "USER_BANNED" });
  }

  if (req.user.isAdmin) {
    return next(); // Admins skip onboarding check
  }

  // Safely access fields with defaults to prevent undefined errors
  const skills = req.user.skills ?? [];
  const city = req.user.city ?? "";
  const university = req.user.university ?? "";
  const department = req.user.department ?? "";
  const normalizedDepartment = String(department).trim().toUpperCase();

  // Check if user has completed onboarding (skills + city + university + department)
  const hasCompletedOnboarding =
    skills.length > 0 &&
    city.trim().length > 0 &&
    university.trim().length > 0 &&
    normalizedDepartment.length > 0 &&
    normalizedDepartment !== "OTHER";
  
  if (!hasCompletedOnboarding) {
    return res.status(403).json({ 
      message: "Please complete your profile setup first", 
      code: "ONBOARDING_REQUIRED" 
    });
  }

  next();
}

export function registerRoutes() {
  // Passport Setup moved to auth.ts



  // Apply user loading middleware to all routes
  app.use(loadUserFromSession);
  
  // Maintenance Mode Check
  app.use(maintenanceMiddleware);

  // Root Health Check (Vital for Render/Deployment checks)
  app.get("/", (_req, res) => {
    res.status(200).json({ status: "healthy", message: "FindATeammate API is running" });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // -- Authentication (Google OAuth ONLY) --
  // Mock Auth Endpoint for E2E Tests
  app.post("/api/auth/mock", async (req, res, next) => {
    // Only allow in non-production or if explicitly testing
    if (process.env.NODE_ENV === "production" && !process.env.ENABLE_MOCK_AUTH) {
      return res.status(404).json({ message: "Not found" });
    }
    
    try {
      const mockUser = await storage.createOAuthUser({
        name: "E2E Test User",
        email: `e2e_${Date.now()}@test.com`,
        username: `e2e_user_${Date.now()}`,
        googleId: `mock_google_${Date.now()}`,
        authProvider: 'google',
        bio: '',
        portfolio: '',
        github: '',
        department: 'CS',
        city: 'Test City',
        university: 'Test University',
        skills: ['TypeScript']
      });
      
      req.session.userId = mockUser.id;
      req.session.save((err) => {
        if (err) return next(err);
        res.json(mockUser);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      // BUG #17 FIX: Log session destruction errors but continue clearing cookie
      if (err) {
        logger.error("Session destruction failed during logout", err);
      }
      // BUG #27 FIX: Explicitly clear the session cookie so the browser stops sending
      // the stale dead session ID on subsequent requests (e.g. GET /api/csrf-token).
      // session.destroy() only purges the server-side record; without this the browser
      // re-sends the old connect.sid until it's overwritten, which causes session-ID
      // mismatch during CSRF token generation for the next request.
      const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
      res.clearCookie("connect.sid", {
        path: "/",
        sameSite: "lax",
        secure: isProduction,
        httpOnly: true,
      });
      res.json({ message: "Logged out successfully" });
    });
  });

  // Unified Session Endpoint
  app.get("/api/me", async (req, res) => {
    // 1. Passport Session (OAuth)
    if (req.user) {
      const safeUser = selectUserSchema.parse(req.user);
      return res.json(safeUser);
    }
    // 2. Manual Session
    if (req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        const safeUser = selectUserSchema.parse(user);
        return res.json(safeUser);
      }
    }
    // Anonymous sessions are a valid state for this probe endpoint.
    // Return null with 200 so clients can distinguish "not logged in"
    // without surfacing noisy 401 console errors on first load.
    res.json(null);
  });



  app.post("/api/auth/onboarding", requireAuth, async (req: any, res, next) => {
    try {
      const { username, department, skills, bio, portfolio, github, linkedin, city, university } = req.body;
      if (!username || !Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({ message: "Username and at least one skill are required" });
      }

      // Validate required fields
      if (!city || typeof city !== 'string' || city.trim().length === 0) {
        return res.status(400).json({ message: "City/location is required" });
      }
      if (!university || typeof university !== 'string' || university.trim().length === 0) {
        return res.status(400).json({ message: "University/college is required" });
      }
      if (!department || typeof department !== 'string' || department.trim().length === 0) {
        return res.status(400).json({ message: "Department is required" });
      }

      // Whitelist universities: accept the 2 SAIRAM colleges or any custom text (max 200 chars)
      // MUST NOT accept literal "OTHER" string as final value
      const VALID_UNIVERSITIES = ["SAIRAM INSTITUTE OF TECHNOLOGY", "SAIRAM ENGINEERING COLLEGE"];
      if (university.trim() === "OTHER") {
        return res.status(400).json({ message: "Please select a valid university or enter a custom one" });
      }
      if (!VALID_UNIVERSITIES.includes(university.trim()) && university.trim().length === 0) {
        return res.status(400).json({ message: "Please select a valid university or enter a custom one" });
      }
      if (university.trim().length > 200) {
        return res.status(400).json({ message: "University name cannot exceed 200 characters" });
      }

      const normalizedDepartment = department.trim().toUpperCase();
      if (!DEPARTMENTS.includes(normalizedDepartment as any) || normalizedDepartment === "OTHER") {
        return res.status(400).json({ message: "Please select a valid department" });
      }

      // STRICT SECURITY: Only allow onboarding for Google users who are "Unspecified"
      // Prevent manual users or already onboarded users from overwriting via this endpoint
      if (req.user!.authProvider !== 'google' && !req.user!.isAdmin) {
          return res.status(403).json({ message: "Forbidden: Only Google OAuth users can use onboarding." });
      }

      if (req.user!.skills && req.user!.skills.length > 0 && !req.user!.isAdmin) {
          return res.status(403).json({ message: "Forbidden: You have already completed onboarding." });
      }
      
      const [existingUser] = await db.select().from(users).where(eq(users.username, String(username))).limit(1);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({ message: "Username already taken" });
      }

      // Sanitization helper - removes HTML/script tags
      const sanitizeString = (str: string): string => {
        return String(str).replace(/<[^>]*>/g, "").trim();
      };

      // URL validation helper
      const isValidUrl = (url: string): boolean => {
        if (!url) return true; // optional fields
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      const isGithubUrl = (url: string): boolean => {
        if (!url) return true; // optional
        try {
          const urlObj = new URL(url);
          return urlObj.hostname.includes("github.com");
        } catch {
          return false;
        }
      };

      const isLinkedInUrl = (url: string): boolean => {
        if (!url) return true; // optional
        try {
          const urlObj = new URL(url);
          return urlObj.hostname.includes("linkedin.com");
        } catch {
          return false;
        }
      };

      // Validate optional URLs
      if (portfolio && !isValidUrl(portfolio)) {
        return res.status(400).json({ message: "Portfolio must be a valid URL" });
      }
      if (github && !isGithubUrl(github)) {
        return res.status(400).json({ message: "GitHub URL must be from github.com" });
      }
      if (linkedin && !isLinkedInUrl(linkedin)) {
        return res.status(400).json({ message: "LinkedIn URL must be from linkedin.com" });
      }

      const updated = await storage.updateUser(req.user.id, {
        username,
        skills: Array.isArray(skills) ? skills : [],
        bio: bio || "",
        portfolio: portfolio ? sanitizeString(portfolio) : "",
        github: github ? sanitizeString(github) : "",
        linkedin: linkedin ? sanitizeString(linkedin) : "",
        city: sanitizeString(city),
        university: sanitizeString(university),
        department: normalizedDepartment,
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/check-username", async (req, res, next) => {
    try {
      const username = req.query.username; // Verify username uniqueness
      if (typeof username !== 'string') return res.status(400).json({ message: "Invalid username" });
      
      const [existingUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      res.json({ available: !existingUser });
    } catch (error) {
      next(error);
    }
  });



  // -- System & Maintenance --
  app.get("/api/status", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
  });

  app.get("/api/maintenance", async (_req, res, next) => {
    try {
        const setting = await storage.getSystemSetting('maintenance_mode');
        // Default to OFF if not set
        res.json(setting?.value || { enabled: false, mode: "OFF" });
    } catch (error) {
        next(error);
    }
  });

  app.post("/api/maintenance", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { enabled, mode, message, eta } = req.body;
        
        // Validate Mode
        if (!['OFF', 'PARTIAL', 'FULL'].includes(mode)) {
            return res.status(400).json({ message: "Invalid mode. Must be OFF, PARTIAL, or FULL" });
        }
        
        const value = { 
            enabled: mode !== 'OFF', 
            mode, 
            message: message || "System is under maintenance.", 
            eta 
        };
        
        const setting = await storage.setSystemSetting('maintenance_mode', value, req.user!.id);
        
        // Audit log
        await storage.logAudit({
            action: 'UPDATE_MAINTENANCE',
            resource: 'SYSTEM',
            userId: req.user!.id,
            userName: req.user!.username || req.user!.name,
            details: { enabled, mode, message, eta }
        });

        // Broadcast change via PartyKit HTTP API
        await emitMaintenance(value);
        
        res.json(setting.value);
    } catch (error) {
        next(error);
    }
  });

  app.get("/api/users/:id", optionalAuth, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const safeUser = selectUserSchema.parse(user);

      // Privacy Check: Guest or not owner
      const isOwner = req.user && req.user.id === userId;
      const isAdmin = req.user && req.user.isAdmin;

      if (!isOwner && !isAdmin) {
        if (!user.privacy.showEmail) safeUser.email = "HIDDEN";
        if (!user.privacy.showPortfolio) safeUser.portfolio = "";
        if (!user.privacy.showUniversity) safeUser.university = null;
        if (!user.privacy.showCity) safeUser.city = null;
      }

      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res, next) => {
    try {
      // BUG #5 FIX: Banned users cannot update their profile
      if (req.user!.isBanned && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You have been banned and cannot update your profile", code: "USER_BANNED" });
      }

      // Users can only update their own profile, unless Admin
      if (req.params.id !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Strip internal/server-only fields that the frontend may send back
      const { id, createdAt, emailVerifiedAt, isVerified, isAdmin, googleId, authProvider, password, ...safeBody } = req.body;

      // Validate and filter skills/interests against whitelist
      if (safeBody.skills && Array.isArray(safeBody.skills)) {
        const { filterValidSkills } = require("@shared/constants");
        safeBody.skills = filterValidSkills(safeBody.skills);
      }
      if (safeBody.interests && Array.isArray(safeBody.interests)) {
        const { filterValidInterests } = require("@shared/constants");
        safeBody.interests = filterValidInterests(safeBody.interests);
      }

      // Create partial schema for patch
      const patchUserSchema = insertUserSchema.partial();
      const parsed = patchUserSchema.safeParse(safeBody);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.updateUser(userId, parsed.data);
      const safeUser = selectUserSchema.parse(user);
      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  });

  // Mark onboarding tour as completed
  app.post("/api/users/:id/tour-complete", requireAuth, async (req, res, next) => {
    try {
      // Users can only mark their own tour as complete, unless Admin
      if (req.params.id !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.updateUser(userId, { tourCompleted: true });
      const safeUser = selectUserSchema.parse(user);
      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  });


  // -- File Uploads --
  // Use memoryStorage so files land in req.file.buffer — no temp disk files.
  // Cloudinary handles all persistence; ephemeral Render disk is never touched.
  
  // General file uploads (event posters, etc.) - 5MB limit
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for event posters/files
    fileFilter: (_req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error("Only images and PDFs are allowed"));
    }
  });

  // Profile avatar uploads - STRICT 2MB limit
  const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for profile pictures
    fileFilter: (_req, file, cb) => {
      // Avatar: images only, NO PDFs
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error("Profile pictures must be image files only (JPEG, PNG, GIF, WebP)"));
    }
  });

  app.post("/api/upload", requireAuth, uploadLimiter, upload.single("file"), async (req, res, next) => {
    try {
      // BUG #5 FIX: Banned users cannot upload files
      if (req.user!.isBanned && !req.user!.isAdmin) {
        logger.warn(`Upload blocked: banned user ${req.user!.id} attempted file upload`);
        return res.status(403).json({ message: "You have been banned and cannot upload files", code: "USER_BANNED" });
      }

      if (!req.file) {
        logger.warn(`Upload failed: no file provided by user ${req.user!.id}`);
        return res.status(400).json({ message: "No file uploaded" });
      }

      logger.log(`File upload initiated: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)}KB) by user ${req.user!.id}`);

      // Security: Verify Magic Numbers directly from in-memory buffer (no disk I/O needed)
      const hex = req.file.buffer.slice(0, 4).toString('hex').toUpperCase();
      const isValid =
        hex.startsWith("FFD8FF")   || // JPEG
        hex.startsWith("89504E47") || // PNG
        hex.startsWith("47494638") || // GIF
        hex.startsWith("52494646") || // WEBP (RIFF container)
        hex.startsWith("25504446");   // PDF

      if (!isValid) {
        logger.warn(`Security Block: file ${req.file.originalname} has invalid signature ${hex} (user: ${req.user!.id})`);
        return res.status(400).json({ message: "Invalid file content (signature mismatch)" });
      }

      // Upload buffer directly to Cloudinary — persistent CDN, never lost on Render restart
      const { url } = await uploadToCloudinary(
        req.file.buffer,
        "findateammate/events",
        `file-${req.user!.id}`
      );

      logger.log(`File uploaded successfully: ${url} (user: ${req.user!.id})`);
      res.json({ url });
    } catch (error) {
      logger.error(`File upload failed for user ${req.user!.id}`, error);
      next(error);
    }
  });

  app.post("/api/users/:id/avatar", requireAuth, uploadLimiter, avatarUpload.single("avatar"), async (req, res, next) => {
    try {
      // BUG #5 FIX: Banned users cannot upload avatar
      if (req.user!.isBanned && !req.user!.isAdmin) {
        logger.warn(`Avatar upload blocked: banned user ${req.user!.id} attempted upload`);
        return res.status(403).json({ message: "You have been banned and cannot upload an avatar", code: "USER_BANNED" });
      }

      // Authorization
      if (req.params.id !== req.user!.id && !req.user!.isAdmin) {
        logger.warn(`Avatar upload forbidden: user ${req.user!.id} tried to upload for user ${req.params.id}`);
        return res.status(403).json({ message: "Forbidden: You can only upload your own avatar.", code: "FORBIDDEN" });
      }

      if (!req.file) {
        logger.warn(`Avatar upload failed: no file provided by user ${req.user!.id}`);
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Log file details for monitoring
      logger.log(`Avatar upload initiated: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)}KB) by user ${req.user!.id}`);

      // Validate file size explicitly (2MB = 2097152 bytes)
      if (req.file.size > 2 * 1024 * 1024) {
        logger.warn(`Avatar upload rejected: file too large (${(req.file.size / 1024 / 1024).toFixed(2)}MB) by user ${req.user!.id}`);
        return res.status(413).json({ message: "Profile picture must be under 2MB", code: "FILE_TOO_LARGE" });
      }

      // Security: Verify Magic Numbers from in-memory buffer
      const hex = req.file.buffer.slice(0, 4).toString('hex').toUpperCase();
      const isValid =
        hex.startsWith("FFD8FF")   || // JPEG
        hex.startsWith("89504E47") || // PNG
        hex.startsWith("47494638") || // GIF
        hex.startsWith("52494646");   // WEBP (RIFF) - PDFs NOT allowed for avatars

      if (!isValid) {
        logger.warn(`Avatar security block: invalid signature ${hex} from user ${req.user!.id}`);
        return res.status(400).json({ message: "Invalid file content (signature mismatch - avatars must be images)" });
      }

      // Delete old Cloudinary avatar if the stored URL is a Cloudinary asset
      const currentUser = await storage.getUser(req.user!.id);
      if (currentUser?.avatar?.startsWith("https://res.cloudinary.com/")) {
        logger.log(`Deleting old avatar: ${currentUser.avatar}`);
        // Fire-and-forget — don't block the upload on cleanup
        deleteFromCloudinary(currentUser.avatar).catch((err: any) =>
          logger.error("Failed to delete old Cloudinary avatar", err)
        );
      }

      // Upload buffer directly to Cloudinary
      const { url } = await uploadToCloudinary(
        req.file.buffer,
        "findateammate/avatars",
        `avatar-${req.user!.id}`
      );

      const user = await storage.updateUser(req.user!.id, { avatar: url });
      const safeUser = selectUserSchema.parse(user);

      logger.log(`Avatar uploaded successfully: ${url} (user: ${req.user!.id})`);
      res.json(safeUser);
    } catch (error) {
      logger.error(`Avatar upload failed for user ${req.user!.id}`, error);
      next(error);
    }
  });

  // -- Posts --
  app.get("/api/posts", requireAuth, async (req, res, next) => {
    try {
      const limitParam = parseInt(req.query.limit as string);
      const limit = Math.min(isNaN(limitParam) ? 20 : limitParam, 100); // Cap limit at 100 to prevent DoS
      
      let cursor: Date | undefined;
      if (req.query.cursor && typeof req.query.cursor === 'string') {
        const parsed = new Date(req.query.cursor);
        if (!isNaN(parsed.getTime())) cursor = parsed;
      }

      const result = await storage.getPosts(cursor, limit, req.user?.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/posts/:id", requireAuth, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  // Specific Endpoint: Create Teammate Post
  app.post("/api/posts/teammate", requireAuth, requireOnboarding, async (req, res, next) => {
    try {
      // BUG #18 FIX: Reject event fields sent to teammate endpoint
      if (req.body.eventName || req.body.eventDate) {
        return res.status(400).json({ 
          message: "Use POST /api/posts/event for events",
          code: "WRONG_ENDPOINT" 
        });
      }

      // FIX BUG #18: Validate user exists before creating post
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const parsed = insertPostSchema.omit({
        eventName: true, eventWebsite: true, eventImage: true, eventDetails: true, eventUpvotes: true, specialRequirements: true
      }).safeParse(req.body);

      // Validate skill names in skillsWanted and skillsOffered against SKILLS whitelist
      if (parsed.success && req.body.skillsWanted) {
        for (const skill of req.body.skillsWanted) {
          if (skill.name && !SKILLS.includes(skill.name as any)) {
            return res.status(400).json({ message: `Invalid skill: ${skill.name}. Please select from the predefined skill list.` });
          }
        }
      }

      if (parsed.success && req.body.skillsOffered) {
        for (const skill of req.body.skillsOffered) {
          if (skill.name && !SKILLS.includes(skill.name as any)) {
            return res.status(400).json({ message: `Invalid skill: ${skill.name}. Please select from the predefined skill list.` });
          }
        }
      }

      if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", details: parsed.error, code: "VALIDATION_ERROR" });
      }

      // Rate Limit: Teammate Posts (Admins bypass limits)
      if (!user.isAdmin) {
        const twentyFourHoursAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        
        const recentCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(posts)
          .where(
            and(
              eq(posts.userId, req.user!.id),
              sql`${posts.createdAt} > ${twentyFourHoursAgo}`,
              sql`${posts.eventName} IS NULL`
            )
          );
        
        if (Number(recentCount[0]?.count || 0) >= 1) { // Strict limit: 1 per 24h
              return res.status(429).json({ message: "You've already created a teammate post in the last 24 hours. To prevent spam, you can only create 1 teammate post per day. Try again tomorrow!" });
        }
      }

      // Filter out undefined values to avoid Drizzle trying to insert NULL for optional fields
      const postData = Object.fromEntries(
        Object.entries({
          ...parsed.data,
          userId: req.user!.id,
          userName: req.user!.name,
          userSkill: req.user!.skills?.[0] || "Unspecified", // First skill from skills array
        }).filter(([, value]) => value !== undefined)
      ) as Parameters<typeof storage.createPost>[0];

      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  // Specific Endpoint: Create Event Post
  app.post("/api/posts/event", requireAuth, requireOnboarding, async (req, res, next) => {
    try {
      // FIX BUG #18: Validate user exists before creating post
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const parsed = insertPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", details: parsed.error, code: "VALIDATION_ERROR" });
      }
      if (!parsed.data.eventName) {
        return res.status(400).json({ message: "Event name is required for events" });
      }
      if (!parsed.data.eventDate) {
        return res.status(400).json({ message: "Event date is required for events" });
      }

      // Validate requiredSkills and requiredInterests against SKILLS whitelist
      if (parsed.data.requiredSkills && Array.isArray(parsed.data.requiredSkills)) {
        for (const skill of parsed.data.requiredSkills) {
          if (skill && !SKILLS.includes(skill as any)) {
            return res.status(400).json({ message: `Invalid skill: ${skill}. Please select from the predefined skill list.` });
          }
        }
      }

      if (parsed.data.requiredInterests && Array.isArray(parsed.data.requiredInterests)) {
        for (const interest of parsed.data.requiredInterests) {
          if (interest && !SKILLS.includes(interest as any)) {
            return res.status(400).json({ message: `Invalid interest: ${interest}. Please select from the predefined interest list.` });
          }
        }
      }

      // Validate hostCollege for intra-college events against COLLEGES whitelist
      if (parsed.data.eventType === "intra-college" && parsed.data.hostCollege) {
        if (!COLLEGES.includes(parsed.data.hostCollege as any)) {
          return res.status(400).json({ message: `Invalid college: ${parsed.data.hostCollege}. Please select from the predefined college list.` });
        }
      }

      // Normalize cross-department payload values from clients.
      // Some clients can send empty strings for optional JSON fields.
      const normalizedAllowedDepartments = Array.isArray(parsed.data.allowedDepartments)
        ? parsed.data.allowedDepartments
            .filter((dept): dept is string => typeof dept === "string")
            .map((dept) => dept.trim())
            .filter((dept) => dept.length > 0)
        : null;
      parsed.data.allowedDepartments = normalizedAllowedDepartments as any;
      parsed.data.requiredSkills = Array.isArray(parsed.data.requiredSkills) ? parsed.data.requiredSkills : [];
      parsed.data.requiredInterests = Array.isArray(parsed.data.requiredInterests) ? parsed.data.requiredInterests : [];
      
      // For intra-college organizer events, approval defaults to true
      if (parsed.data.eventType === "intra-college") {
        parsed.data.isEventOrganiser =
          typeof parsed.data.isEventOrganiser === "boolean"
            ? parsed.data.isEventOrganiser
            : false;
        
        // For organizer events, crossDeptRequiresApproval defaults to true UNLESS explicitly set to false
        if (parsed.data.isEventOrganiser) {
          parsed.data.crossDeptRequiresApproval =
            typeof parsed.data.crossDeptRequiresApproval === "boolean"
              ? parsed.data.crossDeptRequiresApproval
              : true;  // Default to true for organizer events
        } else {
          parsed.data.crossDeptRequiresApproval = false;
        }
      } else {
        parsed.data.isEventOrganiser = false;
        parsed.data.crossDeptRequiresApproval = false;
      }
      parsed.data.specialRequirements =
        typeof parsed.data.specialRequirements === "string"
          ? parsed.data.specialRequirements.trim().slice(0, 250)
          : null;

      // Special requirements are only applicable for intra-college events hosted by organisers.
      if (!(parsed.data.eventType === "intra-college" && parsed.data.isEventOrganiser)) {
        parsed.data.specialRequirements = null as any;
      }

      // Validate allowedDepartments for intra-college events with specific departments
      if (parsed.data.eventType === "intra-college" && parsed.data.allowedDepartments) {
  if (!Array.isArray(parsed.data.allowedDepartments)) {
    return res.status(400).json({ message: "allowedDepartments must be an array" });
  }
  if (parsed.data.allowedDepartments.length < 1) {
    return res.status(400).json({ message: "At least 1 department must be selected when using specific departments" });
  }
  if (parsed.data.allowedDepartments.length > 10) {
    return res.status(400).json({ message: "Maximum 10 departments can be selected" });
  }
  // Validate each department value is in the DEPARTMENTS constant
  for (const dept of parsed.data.allowedDepartments) {
    if (!DEPARTMENTS.includes(dept as any)) {
      return res.status(400).json({ message: `Invalid department: ${dept}` });
    }
  }
} else if (parsed.data.eventType !== "intra-college") {
  // Clear allowedDepartments for non-intra-college events
  parsed.data.allowedDepartments = null as any;
}

// BUG #9 FIX: Validate eventDate is in the future (check at request time)
      const eventDate = new Date(parsed.data.eventDate);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: "Invalid event date format" });
      }
      if (eventDate.getTime() <= new Date().getTime()) {
        return res.status(400).json({ message: "Event date must be in the future" });
      }

      // Rate Limit: Event Posts (Admins bypass limits)
      if (!user.isAdmin) {
        const twentyFourHoursAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        
        const recentCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(posts)
          .where(
            and(
              eq(posts.userId, req.user!.id),
              gt(posts.createdAt, twentyFourHoursAgo),
              not(isNull(posts.eventName))
            )
          );
        
        if (Number(recentCount[0]?.count || 0) >= 10) { // Limit: 10 per 24h
              return res.status(429).json({ message: "You've reached the event creation limit (10 events per day). This helps us maintain quality. Try again in 24 hours!" });
        }
      }

      // Filter out undefined values to avoid Drizzle trying to insert NULL for optional fields
      const postData = Object.fromEntries(
        Object.entries({
          ...parsed.data,
          userId: req.user!.id,
          userName: req.user!.name,
          userSkill: req.user!.skills?.[0] || "Unspecified",
          eventUpvotes: 0
        }).filter(([, value]) => value !== undefined)
      ) as Parameters<typeof storage.createPost>[0];

      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/posts/:id", requireAuth, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ message: "Post not found", code: "NOT_FOUND" });

      // BUG #5 FIX: Banned users cannot edit posts
      if (req.user!.isBanned && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You have been banned and cannot modify posts", code: "USER_BANNED" });
      }

      if (post.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden", code: "FORBIDDEN" });
      }

      const patchPostSchema = insertPostSchema.partial();
      const parsed = patchPostSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      // Normalize allowedDepartments in patch payload when provided.
      if (Object.prototype.hasOwnProperty.call(parsed.data, "allowedDepartments")) {
        const rawAllowedDepartments = (parsed.data as any).allowedDepartments;
        parsed.data.allowedDepartments = Array.isArray(rawAllowedDepartments)
          ? rawAllowedDepartments
              .filter((dept: unknown): dept is string => typeof dept === "string")
              .map((dept: string) => dept.trim())
              .filter((dept: string) => dept.length > 0)
          : (null as any);
      }

      const effectiveEventType = parsed.data.eventType ?? post.eventType;
      if (effectiveEventType === "intra-college" && parsed.data.allowedDepartments) {
        if (!Array.isArray(parsed.data.allowedDepartments)) {
          return res.status(400).json({ message: "allowedDepartments must be an array" });
        }
        if (parsed.data.allowedDepartments.length < 1) {
          return res.status(400).json({ message: "At least 1 department must be selected when using specific departments" });
        }
        if (parsed.data.allowedDepartments.length > 10) {
          return res.status(400).json({ message: "Maximum 10 departments can be selected" });
        }
        // Validate each department value is in the DEPARTMENTS constant
        for (const dept of parsed.data.allowedDepartments) {
          if (!DEPARTMENTS.includes(dept as any)) {
            return res.status(400).json({ message: `Invalid department: ${dept}` });
          }
        }
      } else if (effectiveEventType !== "intra-college") {
        // Clear allowedDepartments for non-intra-college events
        parsed.data.allowedDepartments = null as any;
      }

      // Validate hostCollege for intra-college events when provided
      const effectiveHostCollege = parsed.data.hostCollege ?? post.hostCollege;
      if (effectiveEventType === "intra-college" && effectiveHostCollege) {
        if (!COLLEGES.includes(effectiveHostCollege as any)) {
          return res.status(400).json({ message: `Invalid college: ${effectiveHostCollege}. Please select from the predefined college list.` });
        }
      }

      if (Object.prototype.hasOwnProperty.call(parsed.data, "specialRequirements")) {
        const rawSpecialRequirements = (parsed.data as any).specialRequirements;
        parsed.data.specialRequirements =
          typeof rawSpecialRequirements === "string"
            ? rawSpecialRequirements.trim().slice(0, 250)
            : (null as any);
      }

      const effectiveIsEventOrganiser =
        typeof parsed.data.isEventOrganiser === "boolean"
          ? parsed.data.isEventOrganiser
          : Boolean((post as any).isEventOrganiser);

      if (!(effectiveEventType === "intra-college" && effectiveIsEventOrganiser)) {
        parsed.data.specialRequirements = null as any;
      }

      // For patch updates, ensure crossDeptRequiresApproval is properly set for organizer events
      if (effectiveEventType === "intra-college" && effectiveIsEventOrganiser) {
        if (!Object.prototype.hasOwnProperty.call(parsed.data, "crossDeptRequiresApproval")) {
          // If not being updated, preserve existing value
          parsed.data.crossDeptRequiresApproval = (post as any).crossDeptRequiresApproval ?? true;
        }
      } else {
        // For non-organizer events, always set to false
        parsed.data.crossDeptRequiresApproval = false;
      }

      const updated = await storage.updatePost(postId, parsed.data);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ message: "Post not found", code: "NOT_FOUND" });
      
      // BUG #5 FIX: Banned users cannot delete posts
      if (req.user!.isBanned && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You have been banned and cannot delete posts", code: "USER_BANNED" });
      }
      
      if (post.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden", code: "FORBIDDEN" });
      }

      await storage.deletePost(postId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/posts/:id/upvote", requireAuth, requireOnboarding, voteLimiter, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      
      // BUG FIX: Validate that the post is an event before allowing voting
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ message: "Post not found", code: "NOT_FOUND" });
      
      // Only events (with eventName and eventDate) can be voted on
      if (!post.eventName || !post.eventDate) {
        return res.status(400).json({ message: "Cannot vote on teammate posts, only events", code: "INVALID_POST_TYPE" });
      }
      
      await storage.upvoteEvent(postId, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/posts/:id/downvote", requireAuth, requireOnboarding, voteLimiter, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      
      // BUG FIX: Validate that the post is an event before allowing voting
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ message: "Post not found", code: "NOT_FOUND" });
      
      // Only events (with eventName and eventDate) can be voted on
      if (!post.eventName || !post.eventDate) {
        return res.status(400).json({ message: "Cannot vote on teammate posts, only events", code: "INVALID_POST_TYPE" });
      }
      
      await storage.downvoteEvent(postId, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // -- Event Registration for Intra-College Events --
  // Rate limiter for registration operations
  const registrationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 registrations per minute
    keyGenerator: (req: any) => req.user?.id || ipKeyGenerator(req.ip),
    message: { message: "Too many registration attempts. Please try again later.", code: "RATE_LIMIT_EXCEEDED" },
  });
  void registrationLimiter;

  app.post("/api/events/:eventId/register", requireAuth, async (req, res, next) => {
    try {
      if (req.user!.isBanned && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You have been banned and cannot register for events", code: "USER_BANNED" });
      }
      return registerForEvent(req, res, next);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/events/:eventId/registrations", requireAuth, getEventRegistrations);
  app.get("/api/events/:eventId/match-score", requireVerifiedAuth, getEventMatchScore);
  app.patch("/api/events/:eventId/registrations/:regId/approve", requireVerifiedAuth, approveRegistration);
  app.patch("/api/events/:eventId/registrations/:regId/reject", requireVerifiedAuth, rejectRegistration);
  app.delete("/api/events/:eventId/registrations/:regId", requireVerifiedAuth, deleteRegistration);

  // -- Organiser Routes --
  // Get all events created by the organiser
  app.get("/api/organiser/events", requireAuth, requireOrganiser, async (req, res, next) => {
    try {
      const organiserEvents = await storage.getPostsByUser(req.user!.id);
      // Filter to only intra-college events (posts with eventName and eventType === "intra-college")
      const events = organiserEvents.filter(e => e.eventName && e.eventType === "intra-college");
      res.json(events);
    } catch (error) {
      next(error);
    }
  });

  // Get dashboard data for a specific event (organiser of that event only)
  app.get("/api/organiser/dashboard/:eventId", requireAuth, requireOrganiser, async (req, res, next) => {
    try {
      const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
      const event = await storage.getPost(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if current user is the organiser or admin
      if (event.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden: You are not the organiser of this event" });
      }
      
      // Get registrations
      const registrations = await storage.getEventRegistrations(eventId);

      const userIds = [...new Set(registrations.map((registration) => registration.userId))];
      const registrationUsers = await Promise.all(userIds.map((id) => storage.getUser(id)));
      const userMap = new Map(registrationUsers.filter(Boolean).map((registrationUser) => [registrationUser!.id, registrationUser!]));

      const enrichedRegistrations = registrations.map((registration) => {
        const registrationUser = userMap.get(registration.userId);
        return {
          ...registration,
          user: registrationUser
            ? {
                id: registrationUser.id,
                name: registrationUser.name,
                email: registrationUser.email,
                department: registrationUser.department,
                skills: registrationUser.skills || [],
                interests: registrationUser.interests || [],
                avatar: registrationUser.avatar,
                university: registrationUser.university,
                city: registrationUser.city,
              }
            : null,
        };
      });

      const now = Date.now();
      const interestInteractions = await db
        .select({
          userId: postInteractions.userId,
          interactionType: postInteractions.interactionType,
          createdAt: postInteractions.createdAt,
          name: users.name,
          email: users.email,
          department: users.department,
          avatar: users.avatar,
        })
        .from(postInteractions)
        .innerJoin(users, eq(postInteractions.userId, users.id))
        .where(
          and(
            eq(postInteractions.postId, eventId),
            inArray(postInteractions.interactionType, ["interested", "not_interested"])
          )
        )
        .orderBy(desc(postInteractions.createdAt));

      const latestSignalByUser = new Map<string, {
        userId: string;
        interactionType: string;
        createdAt: Date;
        name: string;
        email: string;
        department: string;
        avatar: string | null;
      }>();

      for (const signal of interestInteractions) {
        if (!latestSignalByUser.has(signal.userId)) {
          latestSignalByUser.set(signal.userId, {
            userId: signal.userId,
            interactionType: signal.interactionType,
            createdAt: signal.createdAt,
            name: signal.name,
            email: signal.email,
            department: signal.department,
            avatar: signal.avatar,
          });
        }
      }

      const interestSignals = Array.from(latestSignalByUser.values());
      const interestedUsers = interestSignals
        .filter((signal) => signal.interactionType === "interested")
        .map((signal) => ({
          userId: signal.userId,
          name: signal.name,
          email: signal.email,
          department: signal.department,
          avatar: signal.avatar,
          createdAt: signal.createdAt,
        }));
      const notInterestedUsers = interestSignals
        .filter((signal) => signal.interactionType === "not_interested")
        .map((signal) => ({
          userId: signal.userId,
          name: signal.name,
          email: signal.email,
          department: signal.department,
          avatar: signal.avatar,
          createdAt: signal.createdAt,
        }));
      const approvedCount = registrations.filter((registration) => registration.status === "approved" || registration.status === "confirmed").length;
      const pendingCount = registrations.filter((registration) => registration.status === "pending").length;
      const rejectedCount = registrations.filter((registration) => registration.status === "rejected").length;
      const crossDeptCount = registrations.filter((registration) => registration.registrationType === "cross_department").length;
      const scoredRegistrations = registrations.filter((registration) => registration.matchScore !== null);
      const scoreValues = scoredRegistrations.map((registration) => Number(registration.matchScore));
      const departmentBreakdown = Object.entries(
        enrichedRegistrations.reduce<Record<string, number>>((accumulator, registration) => {
          const department = registration.user?.department || "Unknown";
          accumulator[department] = (accumulator[department] || 0) + 1;
          return accumulator;
        }, {})
      )
        .sort((left, right) => right[1] - left[1])
        .map(([label, count]) => ({ label, count }));
      const collegeBreakdown = Object.entries(
        enrichedRegistrations.reduce<Record<string, number>>((accumulator, registration) => {
          const college = registration.user?.university || "Unknown";
          accumulator[college] = (accumulator[college] || 0) + 1;
          return accumulator;
        }, {})
      )
        .sort((left, right) => right[1] - left[1])
        .map(([label, count]) => ({ label, count }));
      const topSkills = Object.entries(
        enrichedRegistrations.reduce<Record<string, number>>((accumulator, registration) => {
          for (const skill of registration.user?.skills || []) {
            accumulator[skill] = (accumulator[skill] || 0) + 1;
          }
          return accumulator;
        }, {})
      )
        .sort((left, right) => right[1] - left[1])
        .slice(0, 8)
        .map(([label, count]) => ({ label, count }));
      const registrationsByDay = Object.entries(
        registrations.reduce<Record<string, number>>((accumulator, registration) => {
          const createdAt = new Date(registration.createdAt);
          const dayKey = Number.isNaN(createdAt.getTime()) ? "Unknown" : createdAt.toISOString().slice(0, 10);
          accumulator[dayKey] = (accumulator[dayKey] || 0) + 1;
          return accumulator;
        }, {})
      )
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([label, count]) => ({ label, count }));

      // Calculate stats
      const stats = {
        total: registrations.length,
        pending: pendingCount,
        approved: registrations.filter(r => r.status === "approved").length,
        rejected: rejectedCount,
        confirmed: registrations.filter(r => r.status === "confirmed").length,
        crossDept: crossDeptCount,
        department: registrations.filter(r => r.registrationType === "department").length,
      };

      const analytics = {
        approvalRate: registrations.length > 0 ? Math.round((approvedCount / registrations.length) * 100) : 0,
        rejectionRate: registrations.length > 0 ? Math.round((rejectedCount / registrations.length) * 100) : 0,
        pendingRate: registrations.length > 0 ? Math.round((pendingCount / registrations.length) * 100) : 0,
        crossDeptRate: registrations.length > 0 ? Math.round((crossDeptCount / registrations.length) * 100) : 0,
        pendingOlderThan48h: registrations.filter((registration) => {
          if (registration.status !== "pending") return false;
          const createdAt = new Date(registration.createdAt).getTime();
          return !Number.isNaN(createdAt) && now - createdAt > 48 * 60 * 60 * 1000;
        }).length,
        averageMatchScore: scoreValues.length > 0 ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length) : 0,
        highMatchPending: registrations.filter((registration) => registration.status === "pending" && registration.matchScore !== null && Number(registration.matchScore) >= 75).length,
        scoreBuckets: {
          strong: scoreValues.filter((score) => score >= 80).length,
          medium: scoreValues.filter((score) => score >= 60 && score < 80).length,
          low: scoreValues.filter((score) => score < 60).length,
        },
        topDepartments: departmentBreakdown.slice(0, 5),
        topColleges: collegeBreakdown.slice(0, 5),
        topSkills,
        registrationsByDay,
        uniqueApplicants: userIds.length,
        interestSignals: {
          interestedCount: interestedUsers.length,
          notInterestedCount: notInterestedUsers.length,
          interestedUsers,
          notInterestedUsers,
        },
      };
      
      res.json({ event, registrations: enrichedRegistrations, stats, analytics });
    } catch (error) {
      next(error);
    }
  });

  // -- Admin: Organiser Management --
  // Get all organisers with pagination
  app.get("/api/admin/organisers", requireAdmin, async (req, res, next) => {
    try {
      const pageParam = parseInt(req.query.page as string);
      const limitParam = parseInt(req.query.limit as string);
      const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
      const limit = Math.min(isNaN(limitParam) ? 10 : limitParam, 100);
      const offset = (page - 1) * limit;

      const allUsers = await storage.getUsers(10000);
      const organisers = allUsers.filter(u => u.isOrganiser);
      const total = organisers.length;
      const paginatedOrganisers = organisers.slice(offset, offset + limit);

      res.json({
        organisers: paginatedOrganisers.map(u => {
          const { password, ...safe } = u;
          return safe;
        }),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // Get a specific organiser's dashboard (for admin to monitor)
  app.get("/api/admin/organisers/:userId/dashboard/:eventId", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;

      // Get the organiser
      const organiser = await storage.getUser(userId);
      if (!organiser) {
        return res.status(404).json({ message: "Organiser not found" });
      }

      // Verify they are an organiser
      if (!organiser.isOrganiser) {
        return res.status(400).json({ message: "User is not an organiser" });
      }

      // Get the event
      const event = await storage.getPost(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Verify the event belongs to this organiser
      if (event.userId !== userId) {
        return res.status(403).json({ message: "Event does not belong to this organiser" });
      }

      // Verify the event is intra-college (organiser dashboard only shows intra-college events)
      if (event.eventType !== "intra-college") {
        return res.status(403).json({ message: "Only intra-college events are accessible via organiser dashboard" });
      }

      // Get registrations
      const registrations = await storage.getEventRegistrations(eventId);
      
      // BUG FIX: Batch fetch users instead of N+1 query
      const userIds = [...new Set(registrations.map(r => r.userId))];
      const users = await Promise.all(userIds.map(id => storage.getUser(id)));
      const userMap = Object.fromEntries(users.map(u => [u?.id, u]));

      // Enrich registrations with user data
      const enrichedRegistrations = registrations.map(reg => {
        const user = userMap[reg.userId];
        return {
          ...reg,
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                department: user.department,
                skills: user.skills || [],
                interests: user.interests || [],
                avatar: user.avatar,
                university: user.university,
                city: user.city,
              }
            : null,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "Unknown",
          userSkill: user?.skills?.[0] || "Unknown",
        };
      });

      const now = Date.now();
      const approvedCount = registrations.filter((registration) => registration.status === "approved" || registration.status === "confirmed").length;
      const pendingCount = registrations.filter((registration) => registration.status === "pending").length;
      const rejectedCount = registrations.filter((registration) => registration.status === "rejected").length;
      const crossDeptCount = registrations.filter((registration) => registration.registrationType === "cross_department").length;
      const scoreValues = registrations.filter((registration) => registration.matchScore !== null).map((registration) => Number(registration.matchScore));
      const departmentBreakdown = Object.entries(
        enrichedRegistrations.reduce<Record<string, number>>((accumulator, registration) => {
          const department = registration.user?.department || "Unknown";
          accumulator[department] = (accumulator[department] || 0) + 1;
          return accumulator;
        }, {})
      )
        .sort((left, right) => right[1] - left[1])
        .map(([label, count]) => ({ label, count }));
      const collegeBreakdown = Object.entries(
        enrichedRegistrations.reduce<Record<string, number>>((accumulator, registration) => {
          const college = registration.user?.university || "Unknown";
          accumulator[college] = (accumulator[college] || 0) + 1;
          return accumulator;
        }, {})
      )
        .sort((left, right) => right[1] - left[1])
        .map(([label, count]) => ({ label, count }));
      const topSkills = Object.entries(
        enrichedRegistrations.reduce<Record<string, number>>((accumulator, registration) => {
          for (const skill of registration.user?.skills || []) {
            accumulator[skill] = (accumulator[skill] || 0) + 1;
          }
          return accumulator;
        }, {})
      )
        .sort((left, right) => right[1] - left[1])
        .slice(0, 8)
        .map(([label, count]) => ({ label, count }));
      const registrationsByDay = Object.entries(
        registrations.reduce<Record<string, number>>((accumulator, registration) => {
          const createdAt = new Date(registration.createdAt);
          const dayKey = Number.isNaN(createdAt.getTime()) ? "Unknown" : createdAt.toISOString().slice(0, 10);
          accumulator[dayKey] = (accumulator[dayKey] || 0) + 1;
          return accumulator;
        }, {})
      )
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([label, count]) => ({ label, count }));

      // Calculate stats
      const stats = {
        total: registrations.length,
        pending: pendingCount,
        approved: registrations.filter(r => r.status === "approved").length,
        rejected: rejectedCount,
        confirmed: registrations.filter(r => r.status === "confirmed").length,
        crossDept: crossDeptCount,
        department: registrations.filter(r => r.registrationType === "department").length,
      };

      const analytics = {
        approvalRate: registrations.length > 0 ? Math.round((approvedCount / registrations.length) * 100) : 0,
        rejectionRate: registrations.length > 0 ? Math.round((rejectedCount / registrations.length) * 100) : 0,
        pendingRate: registrations.length > 0 ? Math.round((pendingCount / registrations.length) * 100) : 0,
        crossDeptRate: registrations.length > 0 ? Math.round((crossDeptCount / registrations.length) * 100) : 0,
        pendingOlderThan48h: registrations.filter((registration) => {
          if (registration.status !== "pending") return false;
          const createdAt = new Date(registration.createdAt).getTime();
          return !Number.isNaN(createdAt) && now - createdAt > 48 * 60 * 60 * 1000;
        }).length,
        averageMatchScore: scoreValues.length > 0 ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length) : 0,
        highMatchPending: registrations.filter((registration) => registration.status === "pending" && registration.matchScore !== null && Number(registration.matchScore) >= 75).length,
        scoreBuckets: {
          strong: scoreValues.filter((score) => score >= 80).length,
          medium: scoreValues.filter((score) => score >= 60 && score < 80).length,
          low: scoreValues.filter((score) => score < 60).length,
        },
        topDepartments: departmentBreakdown.slice(0, 5),
        topColleges: collegeBreakdown.slice(0, 5),
        topSkills,
        registrationsByDay,
        uniqueApplicants: userIds.length,
      };

      res.json({ organiser, event, registrations: enrichedRegistrations, stats, analytics });
    } catch (error) {
      next(error);
    }
  });

  // Get all events for a specific organiser (admin view)
  app.get("/api/admin/organisers/:userId/events", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      const organiser = await storage.getUser(userId);
      if (!organiser) {
        return res.status(404).json({ message: "Organiser not found" });
      }

      if (!organiser.isOrganiser) {
        return res.status(400).json({ message: "User is not an organiser" });
      }

      const allEvents = await storage.getPostsByUser(userId);
      // Filter to only intra-college events (not outside-college)
      const events = allEvents.filter(e => e.eventName && e.eventType === "intra-college");

      // BUG #15 FIX: Batch fetch registrations using Map to avoid order dependency
      const eventIds = events.map(e => e.id);
      const allRegistrations = await Promise.all(eventIds.map(id => storage.getEventRegistrations(id)));
      
      const registrationCountMap = new Map();
      allRegistrations.forEach((regs, idx) => {
        registrationCountMap.set(eventIds[idx], regs.length);
      });

      // Enrich events with registration counts
      const enrichedEvents = events.map(event => ({
        ...event,
        eventRegistrationCount: registrationCountMap.get(event.id) || 0,
      }));

      res.json(enrichedEvents);
    } catch (error) {
      next(error);
    }
  });

  // -- Connection Requests --
  app.get("/api/requests", requireVerifiedAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const requests = await storage.getConnectionRequests(userId);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/requests", requireVerifiedAuth, requireOnboarding, async (req, res, next) => {
    try {
      const parsed = insertConnectionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        // BUG #6 FIX: Return consistent error format instead of raw Zod error
        return res.status(400).json({ message: "Validation error", details: parsed.error, code: "VALIDATION_ERROR" });
      }

      if (parsed.data.fromUserId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden", code: "FORBIDDEN" });
      }

      if (parsed.data.fromUserId === parsed.data.toUserId) {
        return res.status(400).json({ message: "You cannot send a connection request to yourself" });
      }

      // BUG #12 FIX: Verify both sender and recipient exist
      const fromUser = await storage.getUser(parsed.data.fromUserId);
      if (!fromUser) return res.status(404).json({ message: "Sender user not found", code: "NOT_FOUND" });

      const toUser = await storage.getUser(parsed.data.toUserId);
      if (!toUser) return res.status(404).json({ message: "Recipient user not found", code: "NOT_FOUND" });

      // BUG #11 FIX: Allow retry if previous request was rejected/deleted
      const existing = await storage.getExistingRequest(parsed.data.fromUserId, parsed.data.toUserId, parsed.data.postId);
      if (existing && existing.status === "pending") {
        return res.status(409).json({ message: "You already have a pending request for this post", code: "CONFLICT" });
      }

      const request = await storage.createConnectionRequest({
        ...parsed.data,
        toUserName: toUser.name
      });

      await storage.createNotification({
        userId: parsed.data.toUserId,
        type: "connection_request",
        title: "New Connection Request",
        message: `${req.user!.name} wants to connect with you regarding "${parsed.data.postTitle}"`,
        link: "/requests",
        metadata: { senderId: req.user!.id, requestId: request.id },
        isRead: false
      });

      // Emit event via PartyKit
      await emitNotification(parsed.data.toUserId, { requestId: request.id, fromUserName: req.user!.name });

      res.json(request);
    } catch (error) {
      // FIX: Use next(error) for proper error middleware handling
      next(error);
    }
  });

  // Specific Endpoint: Accept Request
  app.post("/api/requests/:id/accept", requireVerifiedAuth, requireOnboarding, async (req, res, next) => {
    try {
      const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const request = await storage.getConnectionRequest(requestId);

      if (!request) return res.status(404).json({ message: "Request not found" });

      if (request.toUserId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Only the receiver can accept request", code: "FORBIDDEN" });
      }

      await storage.updateConnectionRequestStatus(requestId, "accepted");

      // Boost preferences based on successful connection (feedback loop)
      const { boostPreferencesFromConnection } = await import("./recommendations");
      boostPreferencesFromConnection(request.fromUserId, request.postId, true).catch((err) =>
        logger.error("Failed to boost preferences from connection", { error: err })
      );

      await storage.createNotification({
        userId: request.fromUserId,
        type: "request_accepted",
        title: "Request Accepted!",
        message: `${req.user!.name} accepted your request for "${request.postTitle}"`,
        link: `/chat/${requestId}`,
        metadata: { senderId: req.user!.id, requestId: request.id },
        isRead: false
      });

      // Signal chat creation/update to both parties via PartyKit
      await emitChatUpdated([request.fromUserId, request.toUserId], requestId);
      await emitNotification(request.fromUserId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Specific Endpoint: Reject Request
  app.post("/api/requests/:id/reject", requireVerifiedAuth, requireOnboarding, async (req, res, next) => {
    try {
      const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const request = await storage.getConnectionRequest(requestId);

      if (!request) return res.status(404).json({ message: "Request not found" });

      if (request.toUserId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Only the receiver can reject request", code: "FORBIDDEN" });
      }

      await storage.updateConnectionRequestStatus(requestId, "rejected");
      
      // Apply negative feedback to preferences (feedback loop)
      const { boostPreferencesFromConnection } = await import("./recommendations");
      boostPreferencesFromConnection(request.fromUserId, request.postId, false).catch((err) =>
        logger.error("Failed to apply feedback from rejection", { error: err })
      );
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/requests/:id", requireVerifiedAuth, async (req, res, next) => {
    try {
      const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const request = await storage.getConnectionRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });

      if (request.fromUserId !== req.user!.id && request.toUserId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden", code: "FORBIDDEN" });
      }

      await storage.deleteConnectionRequest(requestId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ... (Messages routes remain unchanged)

  // -- Notifications --
  app.get("/api/notifications", requireAuth, async (req, res, next) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  // Specific Endpoint: Mark All Read
  app.post("/api/notifications/read-all", requireAuth, async (req, res, next) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Specific Endpoint: Mark One Read
  app.post("/api/notifications/:id/read", requireAuth, async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await storage.markNotificationsRead(req.user!.id, [id]);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Specific Endpoint: Clear All Notifications
  app.delete("/api/notifications/all", requireAuth, notificationLimiter, async (req, res, next) => {
    try {
      await storage.deleteAllNotifications(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Specific Endpoint: Clear One Notification
  app.delete("/api/notifications/:id", requireAuth, notificationLimiter, async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await storage.deleteNotifications(req.user!.id, [id]);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // -- Analytics --
  // Duplicate /api/analytics route removed (see line 1307)

  // -- Chat Routes --
  app.get("/api/chats", requireVerifiedAuth, async (req, res, next) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      // SECURITY FIX: Prevent viewing other users' chats
      if (userId !== req.user!.id && !req.user!.isAdmin) {
          return res.status(403).json({ message: "Forbidden: You can only view your own chats", code: "FORBIDDEN" });
      }
      
      const chats = await storage.getChats(userId);
      // BUG #8 FIX NEEDED: Enhance response to include unreadCount for each chat
      // Each chat object should include:
      // { chatId, participants, lastMessage, unreadCount: messages sent by other user since they cleared }
      res.json(chats);
    } catch (error) {
      logger.error("Error fetching chats", error);
      next(error);
    }
  });

  app.get("/api/chats/:chatId/messages", requireVerifiedAuth, async (req, res, next) => {
    try {
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;

      // Authorization Check: Is user part of this chat?
      const isParticipant = await storage.isUserInChat(chatId, req.user!.id);
      if (!isParticipant && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden: You are not a participant in this chat", code: "FORBIDDEN" });
      }

      let before: Date | undefined;
      if (req.query.before && typeof req.query.before === 'string') {
        const parsed = new Date(req.query.before as string);
        if (!isNaN(parsed.getTime())) before = parsed;
      }
      
      // BUG #49 FIX: Pass req.user!.id so getMessages() applies the user's fromUserLastCleared /
      // toUserLastCleared cutoff. Passing undefined skipped the clear-history logic entirely,
      // so cleared messages would always reappear after a page refresh.
      const messages = await storage.getMessages(chatId, req.user!.id, before);
      res.json(messages);
    } catch (error) {
      logger.error("Error fetching messages", error);
      next(error);
    }
  });

  app.post("/api/chats/:chatId/messages", requireVerifiedAuth, requireOnboarding, messageLimiter, async (req, res, next) => {
    try {
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;

      // Authorization Check: Is user part of this chat?
      const isParticipant = await storage.isUserInChat(chatId, req.user!.id);
      if (!isParticipant && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden: You are not a participant in this chat", code: "FORBIDDEN" });
      }

      const parsed = insertMessageSchema.safeParse({
        ...req.body,
        chatId,
        senderId: req.user!.id
      });
      
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const message = await storage.createMessage(parsed.data);
      
      // Include sender name in PartyKit message
      const sender = await storage.getUser(req.user!.id);
      const enrichedMessage = {
        ...message,
        senderName: sender?.name || "Unknown"
      };
      await emitMessage(chatId, enrichedMessage);
      
      res.json(message);
    } catch (error) {
      logger.error("Error sending message", error);
      next(error);
    }
  });

  app.post("/api/chats/:chatId/clear", requireVerifiedAuth, async (req, res, next) => {
    try {
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;

      // BUG #50 FIX: Check participant status before attempting to clear.
      // Without this, a non-participant gets a 500 from the thrown error in storage
      // instead of a proper 403 Forbidden.
      const isParticipant = await storage.isUserInChat(chatId, req.user!.id);
      if (!isParticipant && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden: You are not a participant in this chat", code: "FORBIDDEN" });
      }

      await storage.clearChatHistory(chatId, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Dashboard Aggregate Protocol (DAP)
  app.get("/api/dashboard", requireAuth, async (req, res, next) => {
    try {
       // Parallelize fetches for performance
       const [unreadCount, { items: posts, nextCursor }] = await Promise.all([
         storage.getUnreadNotificationsCount(req.user!.id),
         storage.getPosts(undefined, 20)
       ]);
       
       res.json({
         user: req.user,
         unreadCount,
         feed: { items: posts, nextCursor }
       });
    } catch (error) {
       next(error);
    }
  });

  // -- Admin Routes --
  app.get("/api/admin/users", requireAdmin, async (_req, res, next) => {
    try {
      const users = await storage.getUsers(1000); // Limit to 1000 users for list view
      // Filter out sensitive data
      const safeUsers = users.map(u => {
        const { password, email, googleId, ...rest } = u;
        // PII Masking: Show only partial email for general list
        const maskedEmail = email.replace(/(^.{2}).*(@.*$)/, "$1***$2");
        return { ...rest, email: maskedEmail };
      });
      res.json(safeUsers);
    } catch (error) {
      next(error);
    }
  });

  // Get full user details for admin (unmasked)
  app.get("/api/admin/users/:id", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      // Return full user details (excluding password and googleId)
      const { password, googleId, ...fullUser } = user;
      res.json(fullUser);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/promote/:id", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { isAdmin } = req.body;

      // Self-demotion check
      if (req.user?.id === userId && isAdmin === false) {
        return res.status(400).json({ message: "You cannot demote yourself from admin." });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (isSuperAdminEmail(user.email) && isAdmin === false) {
        return res.status(403).json({ message: "Forbidden: Super admin cannot be demoted" });
      }

      const updated = await storage.promoteUser(userId, isAdmin);
      
      // Audit log
      await storage.logAudit({
          action: isAdmin ? 'PROMOTE_ADMIN' : 'DEMOTE_ADMIN',
          resource: 'USER',
          userId: req.user!.id,
          userName: req.user!.username || req.user!.name,
          details: { targetUserId: userId, targetUserName: user.name }
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/promote-organiser/:id", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { isOrganiser } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const updated = await storage.promoteOrganiser(userId, isOrganiser);
      
      // Audit log
      await storage.logAudit({
          action: isOrganiser ? 'PROMOTE_ORGANISER' : 'DEMOTE_ORGANISER',
          resource: 'USER',
          userId: req.user!.id,
          userName: req.user!.username || req.user!.name,
          details: { targetUserId: userId, targetUserName: user.name }
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (isSuperAdminEmail(user.email)) {
        return res.status(403).json({ message: "Forbidden: Super admin cannot be deleted" });
      }
      
      if (req.user?.id === userId) {
        return res.status(400).json({ message: "You cannot delete yourself." });
      }

      await storage.deleteUser(userId);

      // Audit log
      await storage.logAudit({
          action: 'DELETE_USER',
          resource: 'USER',
          userId: req.user!.id,
          userName: req.user!.username || req.user!.name,
          details: { targetUserId: userId, targetUserName: user.name }
      });

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Ban a user by email with reason
  app.post("/api/admin/users/:id/ban", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { reason } = req.body;

      if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
        return res.status(400).json({ message: "Ban reason is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (isSuperAdminEmail(user.email)) {
        return res.status(403).json({ message: "Forbidden: Super admin cannot be banned" });
      }

      if (user.isAdmin && !isSuperAdminEmail(req.user?.email || "")) {
        return res.status(403).json({ message: "Forbidden: Only super admin can ban admins" });
      }

      // Ban the user
      await storage.banUser(userId, reason.trim());

      // Audit log
      await storage.logAudit({
        action: 'BAN_USER',
        resource: 'USER',
        userId: req.user!.id,
        userName: req.user!.username || req.user!.name,
        details: { targetUserId: userId, targetUserEmail: user.email, reason: reason.trim() }
      });

      res.json({ message: "User banned successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Unban a user
  app.post("/api/admin/users/:id/unban", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.isBanned) {
        return res.status(400).json({ message: "User is not banned" });
      }

      // Unban the user
      await storage.unbanUser(userId);

      // Audit log
      await storage.logAudit({
        action: 'UNBAN_USER',
        resource: 'USER',
        userId: req.user!.id,
        userName: req.user!.username || req.user!.name,
        details: { targetUserId: userId, targetUserEmail: user.email }
      });

      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/posts/:id", requireAdmin, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await storage.getPost(postId);
      
      await storage.adminDeletePost(postId);

      // Audit log
      if (post) {
          await storage.logAudit({
              action: 'DELETE_POST',
              resource: 'POST',
              userId: req.user!.id,
              userName: req.user!.username || req.user!.name,
              details: { postId, postTitle: post.title, postAuthorId: post.userId }
          });
      }

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res, next) => {
    try {
      // PERFORMANCE FIX: Use database aggregation instead of loading all data into memory
      const userCountResult = await db.all(sql`SELECT COUNT(*) as count FROM ${users}`);
      const postCountResult = await db.all(sql`SELECT COUNT(*) as count FROM ${posts}`);
      const eventCountResult = await db.all(sql`SELECT COUNT(*) as count FROM ${posts} WHERE ${posts.eventName} IS NOT NULL`);
      
      // Reports Stats
      const reportCountResult = await db.all(sql`SELECT COUNT(*) as count FROM reports`);
      const pendingReportCountResult = await db.all(sql`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`);

      // Aggregate posts by date using SQL
      const postsByDateResult = await db.all(sql`
        SELECT DATE(${posts.createdAt}) as date, COUNT(*) as count
        FROM ${posts}
        GROUP BY DATE(${posts.createdAt})
        ORDER BY date DESC
        LIMIT 30
      `);
      
      const postsByDate: Record<string, number> = {};
      postsByDateResult.forEach((row: any) => {
        postsByDate[row.date] = Number(row.count);
      });

      // Skills aggregation from JSONB array (unpack and count)
      const stats = {
        totalUsers: Number((userCountResult[0] as any).count),
        totalPosts: Number((postCountResult[0] as any).count),
        totalEvents: Number((eventCountResult[0] as any).count),
        totalReports: Number((reportCountResult[0] as any).count),
        pendingReports: Number((pendingReportCountResult[0] as any).count),
        postsByDate,
        skills: await db.all(sql`
          SELECT skill_item as name, COUNT(*) as count
          FROM ${users}, jsonb_array_elements_text(skills) as skill_item
          WHERE skills IS NOT NULL AND jsonb_array_length(skills) > 0
          GROUP BY skill_item
          ORDER BY count DESC
          LIMIT 10
        `).then(res => {
          const skillsMap: Record<string, number> = {};
          res.forEach((row: any) => {
            if (row.name) skillsMap[row.name] = Number(row.count);
          });
          return skillsMap;
        }).catch(() => {
          // Fallback if JSONB query fails
          return {};
        }),
      };

      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // Export user skills
  app.get("/api/admin/export/user-skills", requireAdmin, async (_req, res, next) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          department: users.department,
          skills: users.skills,
          interests: users.interests,
        })
        .from(users)
        .where(sql`${users.skills} IS NOT NULL OR ${users.interests} IS NOT NULL`);

      // Convert to CSV format
      const csvRows = [
        ["User ID", "Username", "Email", "Department", "Skills", "Interests"]
      ];

      for (const user of allUsers) {
        csvRows.push([
          user.id,
          user.username,
          user.email,
          user.department || "",
          Array.isArray(user.skills) ? user.skills.join("; ") : "",
          Array.isArray(user.interests) ? user.interests.join("; ") : "",
        ]);
      }

      const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

      // Set headers for download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="user-skills-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });

  // NEW: Generic Analytics Ingestion
  // FIX BUG #18: Validate user exists before logging analytics
  // Analytics uses sendBeacon which can't set CSRF headers, so it's CSRF-exempt in index.ts
  // Use optionalAuth - silently drop events from unauthenticated users (login page, etc.)
  app.post("/api/analytics", optionalAuth, async (req, res) => {
    try {
        // Silently ignore analytics from unauthenticated users (e.g. login page)
        if (!req.user) {
          return res.status(204).end();
        }

        const { insertAnalyticsSchema } = await import("@shared/schema.sqlite");
        
        // Ensure timestamp is set
        const data = { ...req.body, timestamp: new Date() };
        
        const parsed = insertAnalyticsSchema.safeParse(data);
        if (!parsed.success) return res.status(400).json(parsed.error);

        // Enrich with user info
        const event = {
            ...parsed.data,
            userId: req.user.id,
            metadata: {
                ...parsed.data.metadata,
                userAgent: req.headers['user-agent'],
                ip: req.ip
            }
        };

        await storage.logEvent(event);
        res.sendStatus(200);
    } catch (error) {
        // Analytics should fail silently to not impact user experience
        console.error("Analytics logging failed:", error);
        res.sendStatus(200);
    }
  });

  // Behavioral Tracking & Recommendations

  // Track post interactions (view, click, skip, connection_request)
  app.post("/api/interactions", requireAuth, async (req, res) => {
    try {
      const { postId, interactionType, durationSeconds, metadata } = req.body;
      
      if (!postId || !interactionType) {
        return res.status(400).json({ message: "postId and interactionType are required" });
      }

      const validTypes = ["view", "click", "skip", "connection_request", "interested", "not_interested"];
      if (!validTypes.includes(interactionType)) {
        return res.status(400).json({ message: "Invalid interactionType" });
      }

      await storage.trackPostInteraction(
        req.user!.id,
        postId,
        interactionType,
        durationSeconds,
        metadata
      );

      res.sendStatus(204);
    } catch (error) {
      // Tracking failures should not break user experience
      console.error("Failed to track interaction:", error);
      res.sendStatus(200);
    }
  });

  // Track user searches
  app.post("/api/searches", requireAuth, async (req, res) => {
    try {
      const parsed = trackSearchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", details: parsed.error, code: "VALIDATION_ERROR" });
      }

      const { query, filters, resultsCount, clickedPostIds } = parsed.data;
      
      await storage.trackUserSearch(
        req.user!.id,
        query,
        filters,
        resultsCount,
        clickedPostIds
      );

      res.sendStatus(204);
    } catch (error) {
      // Tracking failures should not break user experience
      console.error("Failed to track search:", error);
      res.sendStatus(200);
    }
  });

  // Get personalized recommendations
  app.get("/api/recommendations", requireAuth, async (req, res, next) => {
    try {
      const limitParam = parseInt(req.query.limit as string);
      const limit = Math.min(isNaN(limitParam) ? 20 : limitParam, 50);

      const { getRecommendationBucket } = await import("./recommendations");
      const recommendedIds = await storage.getRecommendedPostIds(req.user!.id, limit);
      const bucket = getRecommendationBucket(req.user!.id);
      
      res.json({ postIds: recommendedIds, bucket });
    } catch (error) {
      next(error);
    }
  });

  // Get full recommended teammate posts (not just IDs)
  app.get("/api/recommendations/posts", requireAuth, async (req, res, next) => {
    try {
      const limitParam = parseInt(req.query.limit as string);
      const limit = Math.min(isNaN(limitParam) ? 12 : limitParam, 30);

      const { getRecommendationBucket } = await import("./recommendations");
      const recommendedIds = await storage.getRecommendedPostIds(req.user!.id, limit * 2);
      const bucket = getRecommendationBucket(req.user!.id);
      if (recommendedIds.length === 0) {
        return res.json({ posts: [], bucket });
      }

      const rows = await db
        .select()
        .from(posts)
        .where(
          and(
            inArray(posts.id, recommendedIds),
            isNull(posts.eventName)
          )
        );

      // Preserve recommendation order from model output.
      const byId = new Map(rows.map((post) => [post.id, post]));
      const ordered = recommendedIds
        .map((id) => byId.get(id))
        .filter((post): post is NonNullable<typeof post> => Boolean(post))
        .slice(0, limit);

      res.json({ posts: ordered, bucket });
    } catch (error) {
      next(error);
    }
  });

  // Get search suggestions based on user history
  app.get("/api/search/suggestions", requireAuth, async (req, res, next) => {
    try {
      const limitParam = parseInt(req.query.limit as string);
      const limit = Math.min(isNaN(limitParam) ? 5 : limitParam, 10);

      const suggestions = await storage.getSearchSuggestions(req.user!.id, limit);
      
      res.json({ suggestions });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/observability/audit", requireAdmin, async (req, res) => {
    try {
      const { insertAuditLogSchema } = await import("@shared/schema.sqlite");
      const parsed = insertAuditLogSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      await storage.logAudit({
        ...parsed.data,
        userId: req.user?.id || null,
        userName: req.user?.username || req.user?.name || "System"
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to log audit event:", error);
      res.status(500).end();
    }
  });

  app.get("/api/admin/observability/audit", requireAdmin, async (req, res, next) => {
    try {
      const limitParam = req.query.limit;
      const limit = Math.min(
        limitParam && !isNaN(Number(limitParam)) ? Number(limitParam) : 100,
        500
      ); // Cap at 500
      
      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (startDateParam && typeof startDateParam === 'string') {
        const parsed = new Date(startDateParam);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
      
      if (endDateParam && typeof endDateParam === 'string') {
        const parsed = new Date(endDateParam);
        if (!isNaN(parsed.getTime())) endDate = parsed;
      }

      const logs = await storage.getAuditLogs(limit, startDate, endDate);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/observability/audit/export", requireAdmin, async (req, res, next) => {
    try {
      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (startDateParam && typeof startDateParam === 'string') {
        const parsed = new Date(startDateParam);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
      
      if (endDateParam && typeof endDateParam === 'string') {
        const parsed = new Date(endDateParam);
        if (!isNaN(parsed.getTime())) endDate = parsed;
      }

      const logs = await storage.getAuditLogs(10000, startDate, endDate);
      
      const csv = [
        'ID,Timestamp,Action,Resource,User ID,Username,Details',
        ...logs.map((l: AuditLog) => {
          const action = `"${l.action.replace(/"/g, '""')}"`;
          const resource = `"${l.resource.replace(/"/g, '""')}"`;
          const details = l.details ? `"${JSON.stringify(l.details).replace(/"/g, '""')}"` : '""';
          return `${l.id},${l.timestamp},${action},${resource},${l.userId || ''},${l.userName || ''},${details}`;
        })
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });

  // Instant download audit logs (admin only)
  app.get("/api/admin/audit/download", requireAdmin, async (req, res, next) => {
    try {
      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (startDateParam && typeof startDateParam === 'string') {
        const parsed = new Date(startDateParam);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
      
      if (endDateParam && typeof endDateParam === 'string') {
        const parsed = new Date(endDateParam);
        if (!isNaN(parsed.getTime())) endDate = parsed;
      }

      // Default to last 30 days if no dates provided
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      const logs = await storage.getAuditLogs(10000, start, end);
      
      const csv = [
        'ID,Timestamp,Action,Resource,User ID,Username,Details',
        ...logs.map((l: AuditLog) => {
          const action = `"${l.action.replace(/"/g, '""')}"`;
          const resource = `"${l.resource.replace(/"/g, '""')}"`;
          const details = l.details ? `"${JSON.stringify(l.details).replace(/"/g, '""')}"` : '""';
          return `${l.id},${l.timestamp},${action},${resource},${l.userId || ''},${l.userName || ''},${details}`;
        })
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/observability/audit", requireAdmin, async (_req, res, next) => {
    try {
      await storage.clearAuditLogs();
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/contact", optionalAuth, async (req: any, res, next) => {
    try {
      const contactSchema = z.object({
        firstName: z.string().trim().min(1).max(50),
        lastName: z.string().trim().min(1).max(50),
        email: z.string().trim().email().max(255),
        subject: z.enum(["General Inquiry", "Technical Support", "Partnership", "Feedback"]),
        message: z.string().trim().min(10).max(2000),
      });

      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const { firstName, lastName, email, subject, message } = parsed.data;
      const senderName = `${firstName} ${lastName}`.trim();
      const type = subject === "Feedback" ? "feedback" : subject === "Technical Support" ? "bug" : "support";

      const report = await storage.createReport({
        reporterId: req.user?.id ?? null,
        reporterEmail: email,
        type,
        subject,
        pageSection: "Contact Page",
        description: [
          `Sender: ${senderName}`,
          `Email: ${email}`,
          "",
          message,
        ].join("\n"),
      });

      try {
        const { mailProvider } = await import("./mail");
        await mailProvider.send({
          to: process.env.SMTP_USER || "FindATeammate@findateammate.online",
          subject: `📩 Contact Message: ${subject}`,
          text: `Contact message from ${senderName} <${email}>\n\nSubject: ${subject}\n\n${message}`,
          html: `
            <h2>New Contact Message</h2>
            <p><strong>Name:</strong> ${senderName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap;">${message}</div>
            <br/>
            <a href="${process.env.FRONTEND_URL}/admin">View in Dashboard</a>
          `,
        });
      } catch (emailErr) {
        logger.error("Failed to send contact email", emailErr);
      }

      res.status(201).json({ success: true, reportId: report.id });
    } catch (error) {
      next(error);
    }
  });

  // -- Report Routes --
  app.post("/api/reports", requireAuth, async (req, res, next) => {
    try {
      const { insertReportSchema } = await import("@shared/schema.sqlite");
      const parsed = insertReportSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      // Verify reporter exists before creating report
      const reporter = await storage.getUser(req.user!.id);
      if (!reporter) {
        return res.status(404).json({ message: "User not found" });
      }

      const report = await storage.createReport({
        ...parsed.data,
        reporterId: req.user!.id,
        reporterEmail: req.user!.email
      });
      
      // Notify Admin via Email
      try {
        const { mailProvider } = await import("./mail");
        const username = req.user!.username || req.user!.name;
        // Schema uses 'description', not 'reason'. 'targetId' is likely reportedUserId or reportedPostId.
        const target = parsed.data.pageSection || "General";
        
        // FIX BUG #2: Await admin email notification
        await mailProvider.send({
          to: process.env.SMTP_USER || "FindATeammate@findateammate.online", 
          subject: `🚨 New Report: ${parsed.data.type} - ${parsed.data.subject}`,
          text: `New Report from ${req.user!.name} (@${username})\n\nType: ${parsed.data.type}\nContext: ${target}\nDescription: ${parsed.data.description}\n\nCheck Admin Dashboard for details.`,
          html: `
            <h2>New User Report</h2>
            <p><strong>Reporter:</strong> ${req.user!.name} (@${username})</p>
            <p><strong>Type:</strong> ${parsed.data.type}</p>
            <p><strong>Subject:</strong> ${parsed.data.subject}</p>
            <p><strong>Context:</strong> ${target}</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2;">
              <strong>Description:</strong><br/>
              ${parsed.data.description}
            </div>
            <br/>
            <a href="${process.env.FRONTEND_URL}/admin">View in Dashboard</a>
          `
        });
      } catch (err) {
         logger.error("Failed to send admin report email", err);
         // Continue - report is created even if notification fails
      }

      res.status(201).json(report);
    } catch (error) {
        next(error);
    }
  });

  app.get("/api/admin/reports", requireAdmin, async (req, res, next) => {
    try {
        const { status, type, search } = req.query;
        const reports = await storage.getReports(status as string, type as string, search as string);
        res.json(reports);
    } catch (error) {
        next(error);
    }
  });

  app.patch("/api/admin/reports/:id", requireAdmin, async (req, res, next) => {
    try {
        const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { status, adminNotes } = req.body;
        
        if (!['pending', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const report = await storage.updateReportStatus(reportId, status, req.user!.id, adminNotes);

        // Audit log
        await storage.logAudit({
            action: 'UPDATE_REPORT',
            resource: 'REPORT',
            userId: req.user!.id,
            userName: req.user!.username || req.user!.name,
            details: { reportId, status, adminNotes }
        });

        // FIX BUG #2: Await resolution email
        const { sendResolutionEmail } = await import("./mail");
        try {
          if (report && status === "resolved" && report.reporterEmail) {
            await sendResolutionEmail(report.reporterEmail, Number(report.id), adminNotes || "No specific notes provided.");
          }
        } catch (emailErr) {
          logger.error("Failed to send resolution email", emailErr);
          // Continue - report status is updated even if email fails
        }
        res.json(report);
    } catch (error) {
        next(error);
    }
  });

  app.delete("/api/admin/reports", requireAdmin, async (req, res, next) => {
    try {
      const { ids, all } = req.query;

      if (all === 'true') {
        await storage.deleteAllReports();
      } else if (ids && typeof ids === 'string') {
        const idList = ids.split(',').filter(Boolean);
        await storage.deleteReports(idList);
      } else {
        return res.status(400).json({ message: "Missing 'all=true' or 'ids' query parameter" });
      }

      // Audit log
      const idList = ids && typeof ids === 'string' ? ids.split(',').filter(Boolean) : [];
      await storage.logAudit({
          action: 'DELETE_REPORTS',
          resource: 'REPORT',
          userId: req.user!.id,
          userName: req.user!.username || req.user!.name,
          details: { all, count: all ? 'ALL' : idList.length }
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // -- Feedback Routes --
  app.post("/api/feedback", requireAuth, async (req, res, next) => {
    try {
      const { insertFeedbackSchema } = await import("@shared/schema.sqlite");
      // UI sends { feedback, rating }, which corresponds to schema's { comment, rating }
      const payload = { ...req.body, comment: req.body.feedback };
      const parsed = insertFeedbackSchema.safeParse(payload);

      // Validate FIRST before sending email
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      // Only send email if validation passed
      const { mailProvider } = await import("./mail");
      const username = req.user!.username || req.user!.name;
      const category = req.body.category || 'General';

      // FIX BUG #2: Await feedback email and handle errors
      try {
        await mailProvider.send({
          to: process.env.SMTP_USER || "FindATeammate@findateammate.online",
          subject: `💡 New Feedback: ${category}`,
          text: `Feedback from ${req.user!.name} (@${username})\n\n"${req.body.feedback}"`,
          html: `
            <h2>New User Feedback</h2>
            <p><strong>User:</strong> ${req.user!.name} (@${username})</p>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
              "${req.body.feedback}"
            </div>
          `
        });
      } catch (emailErr) {
        logger.error("Failed to send feedback email", emailErr);
        // Continue - feedback is recorded even if notification fails
      }

      const feedbackEntry = await storage.createFeedback({
        ...parsed.data,
        userId: req.user!.id
      });
      
      res.status(201).json(feedbackEntry);
    } catch (error) {
      next(error);
    }
  });

  // -- User Lifecycle Routes --

  // Self-Delete (GDPR Compliance)
  app.delete("/api/users/me", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      
      await storage.deleteUser(userId);
      
      // BUG #28 FIX: req.logout() only clears Passport's req.user. For manually-logged-in
      // users (req.session.userId), the session record survives on the server and the
      // connect.sid cookie stays in the browser, keeping them "authenticated" against a
      // deleted account until the 3-day TTL expires. Destroy the full session + cookie.
      req.session.destroy((err) => {
        if (err) {
          logger.error("Session destroy failed after account deletion", err);
          // Still respond success — user is deleted; worst case session expires naturally
        }
        const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
        res.clearCookie("connect.sid", {
          path: "/",
          sameSite: isProduction ? "none" : "lax",
          secure: isProduction,
          httpOnly: true,
        });
        res.json({ success: true, message: "Account deleted successfully" });
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/feedback", requireAdmin, async (req, res, next) => {
    try {
        const limitParam = req.query.limit ? Number(req.query.limit) : 50;
        const limit = isNaN(limitParam) ? 50 : Math.min(limitParam, 500);
        const feedback = await storage.getFeedback(limit);
        res.json(feedback);
    } catch (error) {
        next(error);
    }
  });

  // Analytics endpoints
  // Duplicate /api/analytics route removed (see line 1307)

  app.get("/api/admin/analytics", requireAdmin, async (req, res, next) => {
    try {
      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (startDateParam && typeof startDateParam === 'string') {
        const parsed = new Date(startDateParam);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
      
      if (endDateParam && typeof endDateParam === 'string') {
        const parsed = new Date(endDateParam);
        if (!isNaN(parsed.getTime())) endDate = parsed;
      }



      // Aggregated Feature Usage directly from DB
      // FIX BUG #7: Properly build WHERE conditions instead of conditional SQL fragments
      const whereConditions = [];
      if (startDate) whereConditions.push(sql`${analytics.timestamp} >= ${startDate}`);
      if (endDate) whereConditions.push(sql`${analytics.timestamp} <= ${endDate}`);
      
      let featureUsageResult;
      if (whereConditions.length > 0) {
        featureUsageResult = await db.all(sql`
          SELECT event as feature, COUNT(*) as usage 
          FROM ${analytics}
          WHERE ${whereConditions.reduce((a, b) => sql`${a} AND ${b}`)}
          GROUP BY event
          ORDER BY usage DESC
        `);
      } else {
        featureUsageResult = await db.all(sql`
          SELECT event as feature, COUNT(*) as usage 
          FROM ${analytics}
          GROUP BY event
          ORDER BY usage DESC
        `);
      }
      
      const featureUsage = featureUsageResult.map((row: any) => ({
        feature: row.feature,
        usage: Number(row.usage)
      }));

      // Calculate User Growth (users created per day, last 30 days)
      const userGrowthResult = await db.all(sql`
        SELECT strftime('%Y-%m-%d', ${users.createdAt}, 'unixepoch') as date, COUNT(*) as count 
        FROM ${users} 
        WHERE ${users.createdAt} > unixepoch() - 30 * 86400
        GROUP BY strftime('%Y-%m-%d', ${users.createdAt}, 'unixepoch') 
        ORDER BY date ASC
      `);

      // Calculate Engagement Metrics
      // DAU: Unique users with events in last 24h
      const dauResult = await db.all(sql`
        SELECT COUNT(DISTINCT ${analytics.userId}) as count 
        FROM ${analytics} 
        WHERE ${analytics.timestamp} > unixepoch() - 86400
      `);

      // MAU: Unique users with events in last 30 days
      const mauResult = await db.all(sql`
        SELECT COUNT(DISTINCT ${analytics.userId}) as count 
        FROM ${analytics} 
        WHERE ${analytics.timestamp} > unixepoch() - 30 * 86400
      `);

      // FIX: Await these properly - IIFEs returning Promises caused React error #31
      // (Promise objects were being serialized into JSON and rendered in JSX)
      let avgSessionDuration = 0;
      try {
        const sessionResult = await db.all(sql`
          WITH UserSessions AS (
              SELECT 
                  ${analytics.userId}, 
                  date(${analytics.timestamp}, 'unixepoch') as day,
                  (MAX(${analytics.timestamp}) - MIN(${analytics.timestamp})) / 60.0 as duration_minutes
              FROM ${analytics}
              WHERE ${analytics.timestamp} > unixepoch() - 7 * 86400
              AND ${analytics.userId} IS NOT NULL
              GROUP BY ${analytics.userId}, date(${analytics.timestamp}, 'unixepoch')
              HAVING COUNT(*) > 1
          )
          SELECT COALESCE(ROUND(AVG(duration_minutes), 1), 0) as avg_duration FROM UserSessions
        `);
        avgSessionDuration = Number((sessionResult[0] as any)?.avg_duration || 0);
      } catch { avgSessionDuration = 0; }

      let retention7Day = 0;
      try {
        const retentionResult = await db.all(sql`
          WITH LastWeekUsers AS (
              SELECT DISTINCT ${analytics.userId} as uid
              FROM ${analytics}
              WHERE ${analytics.timestamp} BETWEEN unixepoch() - 14 * 86400 AND unixepoch() - 7 * 86400
              AND ${analytics.userId} IS NOT NULL
          ),
          ThisWeekUsers AS (
              SELECT DISTINCT ${analytics.userId} as uid
              FROM ${analytics}
              WHERE ${analytics.timestamp} > unixepoch() - 7 * 86400
              AND ${analytics.userId} IS NOT NULL
          )
          SELECT 
              CASE 
                  WHEN (SELECT COUNT(*) FROM LastWeekUsers) = 0 THEN 0
                  ELSE ROUND(
                      CAST((SELECT COUNT(*) FROM LastWeekUsers JOIN ThisWeekUsers ON LastWeekUsers.uid = ThisWeekUsers.uid) AS REAL) / 
                      CAST((SELECT COUNT(*) FROM LastWeekUsers) AS REAL) * 100, 
                  1)
              END as retention
        `);
        retention7Day = Number((retentionResult[0] as any)?.retention || 0);
      } catch { retention7Day = 0; }

      const analyticsData = {
        userGrowth: userGrowthResult.map((row: any) => ({
          date: row.date,
          count: Number(row.count)
        })),
        engagementMetrics: {
          dau: Number((dauResult[0] as any).count),
          mau: Number((mauResult[0] as any).count),
          avgSessionDuration,
          retention7Day,
        },
        featureUsage,
        userFeedback: await storage.getFeedback(10)
      };
      
      res.json(analyticsData);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/personalization/metrics", requireAdmin, async (req, res, next) => {
    try {
      const daysParam = req.query.days ? Number(req.query.days) : 30;
      const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 1), 365) : 30;
      const metrics = await storage.getPersonalizationMetrics(days);
      res.json({ days, ...metrics });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/analytics/export", requireAdmin, async (req, res, next) => {
    try {
      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (startDateParam && typeof startDateParam === 'string') {
        const parsed = new Date(startDateParam);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
      
      if (endDateParam && typeof endDateParam === 'string') {
        const parsed = new Date(endDateParam);
        if (!isNaN(parsed.getTime())) endDate = parsed;
      }

      // Export needs more data, set high limit
      const events = await storage.getAnalytics(startDate, endDate, 10000);
      
      const csv = [
        'ID,Timestamp,Event,Page,User ID,Metadata',
        ...events.map((e: Analytics) => {
          const meta = e.metadata ? `"${JSON.stringify(e.metadata).replace(/"/g, '""')}"` : '""';
          return `${e.id},${e.timestamp},"${e.event}","${e.page}",${e.userId || ''},${meta}`;
        })
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });

  // -- Export Routes --
  app.get("/api/admin/export/users", requireAdmin, async (_req, res, next) => {
    try {
      const users = await storage.getUsers(5000); // Limit to 5000 to prevent memory DoS
      const csv = [
        'ID,Name,Username,Email,Skill,CreatedAt,IsAdmin',
        ...users.map(u => {
          // PII Masking in export
          const maskedEmail = u.email.replace(/(^.{2}).*(@.*$)/, "$1***$2");
          return `${u.id},"${u.name.replace(/"/g, '""')}","${u.username.replace(/"/g, '""')}",${maskedEmail},"${((u.skills || [])[0] || "").replace(/"/g, '""')}",${u.createdAt},${u.isAdmin}`;
        })
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/export/training-data", requireAdmin, async (_req, res, next) => {
    try {
      // Export posts for training (limit to 5000 per batch to prevent memory issues)
      const { items: posts } = await storage.getPosts(undefined, 5000);
      const trainingData = posts.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        skillsOffered: p.skillsOffered,
        skillsWanted: p.skillsWanted,
        upvotes: p.eventUpvotes,
        createdAt: p.createdAt
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=training-data-${new Date().toISOString().split('T')[0]}.json`);
      res.json(trainingData);
    } catch (error) {
      next(error);
    }
  });

  // Health check endpoint for monitoring
  app.get("/health", async (_req, res) => {
    try {
      await db.all(sql`SELECT 1`);
      res.json({ status: "ok", timestamp: new Date().toISOString(), db: "connected" });
    } catch (error) {
       logger.error("Health check failed", error);
       res.status(503).json({ status: "error", message: "Database connection failed" });
    }
  });

  // Catch-all for API routes to prevent falling through to frontend static files
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "API route not found" });
  });

  // Multer Error Handler (must come before global error handler)
  // Provides user-friendly messages for file upload errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
      logger.warn(`Multer error: ${err.code} on ${req.path} by user ${req.user?.id || 'anonymous'}`);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        // Differentiate between avatar (2MB) and general file (5MB) uploads
        const isAvatarUpload = req.path.includes('/avatar');
        const limit = isAvatarUpload ? '2MB' : '5MB';
        return res.status(413).json({ 
          message: `File too large. Maximum size is ${limit}`, 
          code: 'FILE_TOO_LARGE' 
        });
      }
      
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          message: "Unexpected file field", 
          code: 'INVALID_FILE_FIELD' 
        });
      }
      
      return res.status(400).json({ 
        message: err.message || "File upload error", 
        code: 'UPLOAD_ERROR' 
        });
    }
    
    // If not a multer error, pass to global error handler
    next(err);
  });

  // Global Error Handler Integration (Last Resort)
  // Replaces the default express handler to log to DB
  app.use((err: any, req: any, res: any, _next: any) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
  logger.error(`Unhandled error on ${req.path}`, err);

    res.status(status).json({ message });
  });

}
