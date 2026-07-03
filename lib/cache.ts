import { Redis } from "@upstash/redis";

const isTestEnv = process.env.NODE_ENV === "test" || process.env.UPSTASH_REDIS_REST_URL === "https://dummy";

export const redis = isTestEnv 
  ? { set: async () => "OK", get: async () => "pong" } as unknown as Redis
  : new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
