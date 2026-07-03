import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bootstrap } from "../../../lib/middleware";
import { storage } from "../../../lib/storage";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "../../../lib/logger";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

const fallbackLimiter = new Map<string, number[]>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await bootstrap(req, res))) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const user = (req as any).user;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const identifier = `vote_${user?.id || 'anon'}_${ip}`;
  
  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
    
    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", reset.toString());

    if (!success) {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }
  } catch (error) {
    logger.error("Rate limiting error, using fallback");
    const now = Date.now();
    const timestamps = fallbackLimiter.get(identifier) || [];
    const valid = timestamps.filter(t => now - t < 10000);
    valid.push(now);
    fallbackLimiter.set(identifier, valid);
    if (valid.length > 10) {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }
  }

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const postId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    await storage.upvoteEvent(postId, user.id);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Error upvoting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
