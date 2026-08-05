import { Router } from "express";
import { db } from "../db";
import { users } from "../../shared/schema.sqlite";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { logger } from "../logger";

export const authLocalRouter = Router();

import { promisify } from "util";
const scryptAsync = promisify(crypto.scrypt);

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return key === derivedKey.toString("hex");
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

authLocalRouter.post("/login", async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUsers = await withTimeout(
      db.select().from(users).where(eq(users.email, email)).limit(1),
      5000,
      "Turso DB Login Query"
    );
    const user = existingUsers[0];

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set user ID in session
    req.session.userId = user.id;
    
    // Explicitly save the session
    await new Promise<void>((resolve, reject) => {
      req.session.save((err: any) => {
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
});

authLocalRouter.post("/register", async (req: any, res: any) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }

    const existingUser = await withTimeout(
      db.select().from(users).where(eq(users.email, email)).limit(1),
      5000,
      "Turso DB Signup Check"
    );
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await hashPassword(password);
    
    // Create new user
    const username = `user_${crypto.randomBytes(4).toString('hex')}`;
    
    const insertData = {
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
    };
    
    const [newUser] = await withTimeout(
      db.insert(users).values(insertData as any).returning(),
      5000,
      "Turso DB Signup Insert"
    );

    res.status(201).json(newUser);
  } catch (error) {
    logger.error("Registration error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
