import { Request, Response, NextFunction } from "express";
import type { User as AppUser } from "@shared/schema.sqlite";

// Extend Express Request to include user session
declare module "express-serve-static-core" {
    interface Request {
        user?: AppUser & {
            isNewUser?: boolean;
        };
    }
}

// Authentication required
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }
    // Allow admins to bypass ban restrictions for administrative tasks
    if (req.user.isBanned && !req.user.isAdmin) {
        return res.status(403).json({ message: "You have been banned and cannot perform this action", code: "USER_BANNED" });
    }
    next();
}

// Alias for requireAuth (email verification was removed - kept for backwards compatibility)
export const requireVerifiedAuth = requireAuth;

// Admin role required
export function getSuperAdminEmails() {
    return (process.env.SUPER_ADMIN_EMAILS || "")
        .split(",")
        .map(email => email.trim().toLowerCase())
        .filter(Boolean);
}

export function isSuperAdminEmail(email?: string) {
    if (!email) return false;
    const superAdminEmails = getSuperAdminEmails();
    return superAdminEmails.length > 0 && superAdminEmails.includes(email.toLowerCase());
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }
    // Allow admins to bypass ban restrictions - they can perform admin tasks even if flagged
    if (req.user.isBanned && !req.user.isAdmin) {
        return res.status(403).json({ message: "You have been banned and cannot perform this action", code: "USER_BANNED" });
    }
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Admin access only" });
    }
    next();
}

// Organiser role required
export function requireOrganiser(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }
    // Allow admins to bypass ban restrictions - they can organize events
    if (req.user.isBanned && !req.user.isAdmin) {
        return res.status(403).json({ message: "You have been banned and cannot perform this action", code: "USER_BANNED" });
    }
    if (!req.user.isOrganiser && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Organiser access only" });
    }
    next();
}

// Optional authentication - sets user if available but doesn't require it
export function optionalAuth(_req: Request, _res: Response, next: NextFunction) {
    // User will be set by session middleware if available
    next();
}
