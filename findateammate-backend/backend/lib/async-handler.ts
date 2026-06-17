import { Request, Response, NextFunction } from "express";

/**
 * Wraps async route handlers to catch promise rejections
 * Prevents "Cannot set headers after they are sent" errors
 * and ensures proper error propagation to Express error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
