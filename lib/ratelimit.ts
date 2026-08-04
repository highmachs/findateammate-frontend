import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "./logger";
import type { Request, Response, NextFunction, RequestHandler } from "express";

// Graceful fallback for local development if Upstash isn't configured
const isConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export function rateLimit(opts: {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  message: { message: string; code: string };
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}): RequestHandler {
  if (!redis) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  // Convert windowMs to seconds with 's' suffix
  const windowStr = `${Math.ceil(opts.windowMs / 1000)}s` as any;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(opts.max, windowStr),
    analytics: false,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = opts.keyGenerator ? opts.keyGenerator(req) : (req.ip || "unknown-ip");
      const { success, limit, remaining, reset } = await limiter.limit(key);
      
      if (opts.standardHeaders) {
        res.setHeader("RateLimit-Limit", limit);
        res.setHeader("RateLimit-Remaining", remaining);
        res.setHeader("RateLimit-Reset", reset);
      }
      
      if (!success) {
        res.status(429).json(opts.message);
        return;
      }
      next();
    } catch (error) {
      // Fail open on Redis errors but log loudly
      logger.error("Rate limiting error (failing open)", error);
      next();
    }
  };
}
