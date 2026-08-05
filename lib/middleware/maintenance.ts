import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { logger } from "../logger";

export async function maintenanceMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Check Payload/Env Override (Highest Priority)
    if (process.env.MAINTENANCE_MODE === 'true') {
       // Super Admin bypass — admins are NEVER blocked
       if (req.user && req.user.isAdmin) {
         return next();
       }
       // Bypass for admin bypass header
       if (req.headers['x-maintenance-bypass'] === process.env.MAINTENANCE_SECRET) {
          return next();
       }
       return res.status(503).json({
          message: "System is in maintenance mode.",
          mode: "FULL",
          eta: "Unknown"
       });
    }

    // 2. Public Whitelist (Skip DB/Cache check for performance)
    const publicPaths = [
      "/api/status",
      "/api/auth/logout",
      "/api/maintenance" // Status check itself
    ];
    
    // Allow static uploads or non-api routes (already handled by express static, but good to be safe)
    if (!req.path.startsWith("/api")) return next();
    
    if (publicPaths.includes(req.path)) return next();

    // 3. Admin User Bypass (If session loaded)
    // Note: Middleware must be placed AFTER session keys are loaded
    if (req.user && req.user.isAdmin) {
      return next(); 
    }
    
    // 4. Check Bypass Header
    // Requires a set secret to work
    if (process.env.MAINTENANCE_SECRET && req.headers['x-maintenance-bypass'] === process.env.MAINTENANCE_SECRET) {
      return next();
    }

    // 5. Fetch Setting (Cached)
    const withTimeout = <T>(promise: Promise<T>, ms: number, label: string = 'Operation'): Promise<T> => {
      let timer: NodeJS.Timeout;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      });
      return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
    };

    const setting = await withTimeout(storage.getSystemSetting('maintenance_mode'), 1500, "maintenance_mode_fetch");
    if (!setting || !setting.value) {
      return next();
    }

    const { enabled, mode, message, eta } = setting.value as any;

    if (!enabled || mode === 'OFF') {
      return next();
    }

    // 6. Enforce Modes
    if (mode === 'FULL') {
      logger.log(`Maintenance block (FULL): ${req.method} ${req.path} - User: ${req.user?.id || 'anonymous'} - IP: ${req.ip}`);
      return res.status(503).json({
        message: message || "System is under maintenance.",
        mode: "FULL",
        eta
      });
    }

    if (mode === 'PARTIAL') {
      // Allow GET requests (Read-only)
      if (req.method === 'GET') {
        return next();
      }
      
      logger.log(`Maintenance block (PARTIAL): ${req.method} ${req.path} - User: ${req.user?.id || 'anonymous'} - IP: ${req.ip}`);
      return res.status(503).json({
        message: message || "System is in read-only mode.",
        mode: "PARTIAL",
        eta
      });
    }

    next();
  } catch (error) {
    console.error("Maintenance middleware error:", error);
    next(); // Fail open to avoid accidental lockout
  }
}
