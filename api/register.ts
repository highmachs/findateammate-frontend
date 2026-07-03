import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bootstrap } from "../lib/middleware";
import { db } from "../lib/db";
import { users } from "../shared/schema.sqlite";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { logger } from "../lib/logger";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await bootstrap(req, res))) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = hashPassword(password);
    
    // Create new user
    const username = `user_${crypto.randomBytes(4).toString('hex')}`;
    const [newUser] = await db.insert(users).values({
      email,
      name,
      username,
      password: hashedPassword,
      authProvider: "local",
      skills: [],
      bio: "",
      portfolio: "",
      github: "",
      department: "OTHER",
      city: "",
      university: "",
      privacy: { showEmail: false, showPortfolio: false, showUniversity: false, showCity: false }
    }).returning();

    res.status(201).json(newUser);
  } catch (error) {
    logger.error("Registration error", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
