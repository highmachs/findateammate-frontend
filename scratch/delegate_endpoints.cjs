const fs = require('fs');
const path = require('path');

const filesToDelegate = [
  "auth/google.ts",
  "auth/google/callback.ts",
  "posts/index.ts",
  "posts/[id].ts",
  "posts/[id]/upvote.ts",
  "posts/[id]/downvote.ts",
  "users/[id].ts",
  "users/profile.ts",
  "connection-requests/index.ts",
  "connection-requests/[id].ts",
  "chats/index.ts",
  "chats/[id]/messages.ts",
  "notifications/index.ts",
  "notifications/read.ts",
  "analytics.ts",
  "events/[id]/register.ts",
  "events/[id]/registrations.ts",
  "admin/[...path].ts"
];

const apiDir = path.join(__dirname, '../api');

filesToDelegate.forEach(relPath => {
  // Fix path separator for Windows
  const osPath = relPath.replace(/\//g, path.sep);
  const fullPath = path.join(apiDir, osPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${relPath} - doesn't exist`);
    return;
  }

  // Calculate relative depth to lib folder based on forward slashes in relPath
  const depth = relPath.split('/').length - 1;
  const relativePrefix = depth === 0 ? "../" : "../".repeat(depth + 1);

  const content = `import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app, registerRoutes } from "${relativePrefix}lib/routes";
import { bootstrap } from "${relativePrefix}lib/middleware";

// Initialize the Express routes once per cold start
registerRoutes();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Run serverless middleware (session, user, CSRF, CORS)
  if (!(await bootstrap(req, res))) return;

  // 2. Delegate to the Express app
  return app(req as any, res as any);
}
`;

  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${relPath} to delegate to Express.`);
});
