import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bootstrap } from "../lib/middleware";
import { logger } from "../lib/logger";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await bootstrap(req, res))) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const session = (req as any).session;
  
  if (session) {
    session.destroy((err: any) => {
      if (err) {
        logger.error("Session destruction failed during logout", err);
      }
      const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
      res.setHeader(
        "Set-Cookie",
        `connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; ${isProduction ? "Secure; SameSite=None" : "SameSite=Lax"}`
      );
      res.status(200).json({ message: "Logged out successfully" });
    });
  } else {
    res.status(200).json({ message: "Logged out successfully" });
  }
}
