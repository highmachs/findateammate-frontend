import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Graceful fallback for local development if Upstash isn't configured
const isConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Serverless-safe rate limiter.
 * In production, uses Upstash Redis. In local dev without keys, it passes everything.
 */
export const voteLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1m"),
      analytics: false,
    })
  : { limit: async () => ({ success: true }) };

export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1m"),
      analytics: false,
    })
  : { limit: async () => ({ success: true }) };
