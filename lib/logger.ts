/**
 * Backend logging utility to centralize error and warning tracking.
 */
export const logger = {
    log: (message: string, ...args: any[]) => {
        // In backend, we typically want logs for process monitoring
        // but we can filter or format them here.
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] INFO: ${message}`, ...args);
    },

    warn: (message: string, ...args: any[]) => {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] WARN: ${message}`, ...args);
        // Integrate with error tracking service here in the future
    },

    error: (message: string, error?: any, ...args: any[]) => {
        const timestamp = new Date().toISOString();
        const errorData = error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : error;

        console.error(`[${timestamp}] ERROR: ${message}`, errorData, ...args);
        // Integrate with error tracking service here in the future
    }
};
