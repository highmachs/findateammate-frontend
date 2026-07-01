import "./load-env";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import { runMigrations } from "./migrate";
import { ensureCriticalSchemaCompat } from "./db";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { sessionMiddleware } from "./session";
import { logger } from "./lib/logger";
import { requestLogger } from "./lib/production-logger";
import { startCleanupScheduler } from "./cleanup";
import compression from "compression";
import cookieParser from "cookie-parser";
import { doubleCsrf } from "csrf-csrf";
import crypto from "crypto";

export const app = express();
const httpServer = createServer(app);

// Trust proxy for Render/production deployment
// 'true' trusts the leftmost IP in X-Forwarded-For locally, 
// seeing the Load Balancer as the client. Crucial for req.protocol == 'https'
app.set('trust proxy', true);

// Gzip compression for I/O optimization
app.use(compression());

declare module "http" {
  interface IncomingMessage {
    rawBody: Buffer;
  }
}

// Security headers
// Security headers
app.use((_req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (_req: any, res: any) => `'nonce-${(res as any).locals.nonce}'`],
      styleSrc: ["'self'", (_req: any, res: any) => `'nonce-${(res as any).locals.nonce}'`, "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "https://images.unsplash.com", "https://www.transparenttextures.com", "https://findateammate-rpqh.onrender.com"],
      connectSrc: ["'self'", "ws:", "wss:", "https://findateammate-rpqh.onrender.com", "https://findateammate.online", "https://findateammate.info"],
    },
  },
}));

// Hardened Production Check for Render
const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

// CORS configuration - Dynamic origins for Vercel + Render split deployment
const allowedOrigins = [
  process.env.FRONTEND_URL,           // Vercel frontend (e.g. https://findateammate.vercel.app)
  "https://findateammate.online",     // Custom domain
  "https://findateammate.info",       // Alternate domain
  ...(isProduction ? [] : [
    "http://localhost:5000",          // Local dev (monolith)
    "http://localhost:5173",          // Local dev (Vite)
  ]),
].filter(Boolean) as string[];

// Dynamic CORS: permissive for public endpoints, strict for everything else
app.use((req, res, next) => {
  const publicEndpoints = ['/api/analytics'];
  
  if (publicEndpoints.includes(req.path)) {
    // Allow all origins for public endpoints
    cors({
      origin: true,
      credentials: false, // Public endpoints don't need credentials
    })(req, res, next);
  } else {
    // Strict CORS for all other endpoints
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, Postman, mobile)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS blocked: Origin not allowed'));
        }
      },
      credentials: true,
    })(req, res, next);
  }
});

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 5000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});
app.use(limiter);

app.use(cookieParser());
app.use(sessionMiddleware);
import { setupAuth } from "./auth";
setupAuth(app);

// Hardened Production Check for Render
// isProduction declared above for CORS and CSRF

// CSRF Protection with csrf-csrf (Double Submit Cookie Pattern)
const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "dev-csrf-secret-change-in-prod",
  cookieName: "x-csrf-token",
  cookieOptions: {
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    secure: isProduction,
    httpOnly: false, // Must be false for double-submit cookie pattern in cross-origin setup
  },
  size: 64, // The size of the generated tokens in bits
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req: any) => req.headers["x-csrf-token"],
  getSessionIdentifier: (req: any) => {
    // Use raw sessionID for stability — req.user may not be loaded yet during login
    // sessionID is stable across requests within the same browser session
    return req.sessionID || "anonymous";
  },
});


// Endpoint to fetch CSRF token
app.get("/api/csrf-token", (req, res) => {
  try {
    // Force-save session for anonymous users (saveUninitialized: false means
    // cross-origin first requests won't have a persisted session otherwise)
    if (req.session && !req.session.csrfInit) {
      req.session.csrfInit = true;
      req.session.save((err: any) => {
        if (err) console.error("Session save error:", err);
      });
    }
    const csrfToken = generateCsrfToken(req, res);
    res.json({ csrfToken });
  } catch (error: any) {
    console.error("CSRF token generation failed:", error.message);
    res.status(500).json({ message: "Failed to generate CSRF token" });
  }
});

// CSRF Middleware for mutating requests
// Exempt POST endpoint from CSRF:
// /api/analytics - uses navigator.sendBeacon which CANNOT set custom headers, so CSRF always fails
app.use((req, res, next) => {
  if (req.method === 'POST' && (req.path === '/api/analytics' || req.path === '/api/auth/mock')) {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
});

// Redundant user loading middleware removed (logic is in routes.ts)

// Production logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(requestLogger);
}

// Socket.IO is initialized within registerRoutes in routes.ts

app.use(
  express.json({
    limit: "100kb", // Hardened limit for standard JSON payloads
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// NOTE: /uploads static route removed — files are now stored on Cloudinary CDN,
// not on the ephemeral Render filesystem. Cloudinary returns permanent https:// URLs.

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      log(logLine);
    }
  });

  next();
});

(async () => {
  // CRITICAL: Add startup timeout to prevent hanging on Render
  // If the server doesn't start within 60 seconds, force exit
  const startupTimeout = setTimeout(() => {
    console.error("❌ STARTUP TIMEOUT: Server did not start within 60 seconds. Force exiting.");
    process.exit(1);
  }, 60000);

  try {
    // Block startup briefly for critical schema compatibility to avoid auth crashes
    // when background migrations have not completed yet.
    console.log("Running critical schema compatibility checks...");
    await ensureCriticalSchemaCompat();

    // IMPORTANT: Start listening IMMEDIATELY so Render's health check doesn't timeout
    // All initialization can happen in parallel while the server is ready
    const port = parseInt(process.env.PORT || "5000", 10);
    
    console.log(`📡 Attempting to listen on port ${port}...`);

    // Register routes FIRST (without waiting for migrations)
    console.log("Registering routes...");
    await registerRoutes(httpServer, app);
    console.log("Routes registered.");

    // Global error handler - MUST be last middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;

      // Log detailed error server-side ONLY
      logger.error(`Unhandled Error [${status}]: ${err.message}`, err);

      if (res.headersSent) {
        return;
      }

      // Return generic message for 5xx, or safe message for 4xx
      const isPublicError = status >= 400 && status < 500;
      const message = isPublicError ? err.message : "Internal Server Error";

      res.status(status).json({ message });
    });

    // 404 handler
    app.use((_req: Request, res: Response) => {
      res.status(404).json({ message: "Not Found" });
    });

    // START THE SERVER IMMEDIATELY - This is critical for Render deployment
    // Render's health check will timeout if we don't start listening within ~10 seconds
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        // Clear the startup timeout since we've successfully started
        clearTimeout(startupTimeout);

        log(`✅ Server is RUNNING on port ${port}`);
        console.log("Server ready to accept connections!");

        // Global error handlers (must be after server starts)
        // Catch unhandled exceptions
        process.on('uncaughtException', (err: Error) => {
          console.error('✗ UNCAUGHT EXCEPTION:', err);
          logger.error('Uncaught Exception:', err);
          // Give warnings a moment to flush, then exit
          setTimeout(() => process.exit(1), 100);
        });

        // Catch unhandled promise rejections
        process.on('unhandledRejection', (reason: any, promise: any) => {
          console.error('✗ UNHANDLED REJECTION at:', promise, 'reason:', reason);
          logger.error('Unhandled Promise Rejection:', reason);
        });

        // Graceful shutdown for httpServer as well
        const gracefulHttpShutdown = () => {
          console.log('\n✓ Shutting down HTTP server...');
          httpServer.close(() => {
            console.log('✓ HTTP server closed');
            process.exit(0);
          });
          // Force close after 30 seconds
          setTimeout(() => {
            console.error('✗ Forcing shutdown after timeout');
            process.exit(1);
          }, 30000);
        };

        // Override SIGTERM/SIGINT to close both HTTP server and DB pool
        process.removeAllListeners('SIGTERM');
        process.removeAllListeners('SIGINT');
        process.on('SIGTERM', gracefulHttpShutdown);
        process.on('SIGINT', gracefulHttpShutdown);
      },
    );

    // RUN MIGRATIONS AND SETUP IN THE BACKGROUND (don't block server startup)
    // These can happen while the server is already listening and serving requests
    (async () => {
      try {
        console.log("Starting migrations in background...");
        await runMigrations();
        console.log("Migrations finished.");

        // Seed admin account if it doesn't exist
        const { seedAdminOnce } = await import("./seed-admin");
        await seedAdminOnce();
        
        // Start cleanup scheduler after server is ready
        startCleanupScheduler();
        
        console.log("✅ Server fully initialized!");
      } catch (error) {
        console.error("❌ Background initialization failed:", error);
        // Server is still up and can serve requests, but some features may be unavailable
      }
    })();

  } catch (error) {
    clearTimeout(startupTimeout);
    console.error("CRITICAL SERVER STARTUP ERROR:", error);
    process.exit(1);
  }
})();
