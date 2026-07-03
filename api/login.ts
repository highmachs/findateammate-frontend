import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bootstrap } from "../lib/middleware";
import { db } from "../lib/db";
import { users, selectUserSchema } from "../shared/schema.sqlite";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { logger } from "../lib/logger";

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return key === derivedKey;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await bootstrap(req, res))) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = existingUsers[0];

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set user ID in session
    const session = (req as any).session;
    session.userId = user.id;
    
    // Explicitly save the session
    await new Promise<void>((resolve, reject) => {
      session.save((err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { password: _, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (error) {
    logger.error("Login error", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
