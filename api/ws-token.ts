import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import { bootstrap } from "../lib/middleware";

const WS_JWT_SECRET = process.env.WS_JWT_SECRET!;
const WS_JWT_EXPIRES_IN = "8h"; // Long enough for a full session

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await bootstrap(req, res))) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: "Account suspended" });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      name: user.name,
      isBanned: user.isBanned ?? false,
    },
    WS_JWT_SECRET,
    { expiresIn: WS_JWT_EXPIRES_IN }
  );

  // Short cache — token is valid 8h but we don't want stale banned-user tokens
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({ token });
}
