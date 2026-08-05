import serverless from "serverless-http";
import { app, registerRoutes } from "../lib/routes";
import { bootstrap } from "../lib/middleware";

// Initialize the Express routes once per cold start
registerRoutes();

// Custom handler to run our bootstrap middleware before passing to serverless-http
const handler = serverless(app, { binary: [] });

export default async function (req: any, res: any) {
  // Bypass bootstrap for pure diagnostic endpoints so they don't hang if DB is down
  if (req.url && req.url.includes("/api/internal/test-waituntil")) {
    return handler(req, res);
  }

  // 1. Run serverless middleware (session, user, CSRF, CORS)
  if (!(await bootstrap(req, res))) return;

  // 2. Delegate to the Express app via serverless-http adapter
  return handler(req, res);
}
