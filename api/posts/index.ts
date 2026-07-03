import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app, registerRoutes } from "../../lib/routes";
import { bootstrap } from "../../lib/middleware";

// Initialize the Express routes once per cold start
registerRoutes();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Run serverless middleware (session, user, CSRF, CORS)
  if (!(await bootstrap(req, res))) return;

  // 2. Delegate to the Express app
  return app(req as any, res as any);
}
