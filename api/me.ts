import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bootstrap } from "../lib/middleware";
import { selectUserSchema } from "../shared/schema.sqlite";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await bootstrap(req, res))) return;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // The Phase 4 integration test expects 401 when not authenticated
  if (!(req as any).user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.status(200).json((req as any).user);
}
