/**
 * Global Error Monitor
 * Intercepts window errors, promise rejections, and console.errors
 * and keeps local error context for debugging.
 */

const MAX_ERRORS_PER_SESSION = 50;
let errorCount = 0;

interface ErrorPayload {
  message: string;
  source: string;
  stack?: string;
  metadata?: Record<string, any>;
}

const sendError = async (_payload: ErrorPayload) => {
  if (errorCount >= MAX_ERRORS_PER_SESSION) return;
  errorCount++;
};

export const initMonitor = () => {
  // 1. Global Window Errors
  window.onerror = (message, source, lineno, colno, error) => {
    sendError({
      message: typeof message === 'string' ? message : "Unknown Window Error",
      source: "frontend-window",
      stack: error?.stack,
      metadata: { source, lineno, colno }
    });
  };

  // 2. Unhandled Promise Rejections
  window.onunhandledrejection = (event) => {
    sendError({
      message: event.reason?.message || String(event.reason),
      source: "frontend-promise",
      stack: event.reason?.stack
    });
  };

  // 3. Console Error Override (Production Only)
  if (import.meta.env.PROD) {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Send to backend
      const message = args.map(a => (a instanceof Error ? a.message : String(a))).join(" ");
      const stack = args.find(a => a instanceof Error)?.stack;
      
      sendError({
        message,
        source: "frontend-console-error",
        stack
      });

      originalConsoleError.apply(console, args);
    };
  }
};
