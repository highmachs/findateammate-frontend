import { logger } from "./logger";

/**
 * Utility to prevent open redirect vulnerabilities by validating
 * redirect URLs against an allowlist of internal routes.
 */

// Define allowed internal routes based on App.tsx
const ALLOWED_INTERNAL_ROUTES = [
    "/",
    "/teammates",
    "/create-post",
    "/my-posts",
    "/requests",
    "/chat",
    "/profile",
    "/events",
    "/privacy",
    "/terms",
    "/safety",
    "/guidelines",
    "/faq",
    "/about",
    "/contact",
    "/login",
    "/register",
    "/report",
];

// Helper to check if a path is internal or starts with a valid segment
const isInternalPath = (path: string): boolean => {
    if (!path) return false;

    // Rule 1: Must start with / and NOT with // (which is an absolute URL shorthand)
    if (!path.startsWith("/") || path.startsWith("//")) return false;

    // Rule 2: Check if it matches an exact allowed route or starts with one followed by / or ?
    // e.g. /chat/123 is allowed because it starts with /chat
    return ALLOWED_INTERNAL_ROUTES.some(route => {
        if (path === route) return true;
        if (route !== "/" && (path.startsWith(`${route}/`) || path.startsWith(`${route}?`))) return true;
        return false;
    });
};

/**
 * Validates a redirect URL and returns a safe fallback if invalid.
 */
export const getSafeRedirect = (url: string | null | undefined, fallback = "/teammates"): string => {
    if (!url) return fallback;

    // For safety, decoded URL before checking
    let decodedUrl = url;
    try {
        decodedUrl = decodeURIComponent(url);
    } catch (e) {
        // If decoding fails, it's safer to use the fallback
        return fallback;
    }

    if (isInternalPath(decodedUrl)) {
        return decodedUrl;
    }

    logger.warn(`Blocked potentially unsafe redirect to: ${url}`);
    return fallback;
};
