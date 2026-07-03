import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders } from "../lib/middleware";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
}
