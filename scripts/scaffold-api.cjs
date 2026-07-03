const fs = require('fs');
const path = require('path');

const files = [
  'api/register.ts',
  'api/login.ts',
  'api/posts/index.ts',
  'api/posts/[id].ts',
  'api/posts/[id]/upvote.ts',
  'api/posts/[id]/downvote.ts',
  'api/users/[id].ts',
  'api/users/profile.ts',
  'api/connection-requests/index.ts',
  'api/connection-requests/[id].ts',
  'api/chats/index.ts',
  'api/chats/[id]/messages.ts',
  'api/notifications/index.ts',
  'api/notifications/read.ts',
  'api/analytics.ts',
  'api/events/[id]/registrations.ts',
  'api/events/[id]/register.ts',
  'api/admin/[...path].ts'
];

const template = `import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bootstrap } from "../../lib/middleware";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await bootstrap(req, res))) return;
  res.status(200).json({ status: "ok", message: "Migrated to standalone Vercel function." });
}
`;

for (const file of files) {
  const fullPath = path.join(__dirname, '..', file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, template.replace('../../lib', file.split('/').map(() => '..').join('/').slice(3) + 'lib'));
}
