import { trackEvent } from "./analytics";

/**
 * Production-ready logger for FindATeammate
 * Built by Antigravity for AhiLight
 */

const isDev = import.meta.env.DEV;

export const logger = {
    log: (...args: any[]) => {
        if (isDev) {
            console.log(...args);
        }
        // Never log to console in production
    },

    warn: (message: string, ...args: any[]) => {
        if (isDev) {
            console.warn(message, ...args);
        }
        // Track warnings in production
        trackEvent("app_warning", { message, details: args });
    },

    error: (message: string, error?: any, ...args: any[]) => {
        if (isDev) {
            console.error(message, error, ...args);
        }

        // Proper error logging for production
        const errorDetails = {
            message,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : error,
            details: args
        };

        trackEvent("app_error", errorDetails);
    }
};
