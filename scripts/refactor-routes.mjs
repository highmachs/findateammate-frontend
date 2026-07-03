import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'lib/routes.ts');
let content = fs.readFileSync(file, 'utf-8');

// 1. Fix Imports
content = content.replace(/from "\.\.\/shared\//g, 'from "../shared/');
content = content.replace(/from "\.\/lib\//g, 'from "./');
content = content.replace(/import \{ setupSocketIO \} from "\.\/socket";/g, '');
content = content.replace(/import \{ broadcastToParty \} from "\.\/party-client";/g, '');
content = `import { broadcastToParty } from "./party-client";\n` + content;
content = content.replace(/from "\.\/middleware\/auth"/g, 'from "./middleware"');

// 2. Remove socket io references
content = content.replace(/const io = app\.get\('io'\);/g, '');
content = content.replace(/if \(io\) \{(.*?)\}/gs, (match, p1) => {
  // Replace io.emit('maintenance_update', value)
  return p1.replace(/io\.emit\('([^']+)',\s*(.*?)\);/g, 'await broadcastToParty("global", "$1", $2);');
});

content = content.replace(/const io = req\.app\.get\('io'\);/g, '');
content = content.replace(/req\.app\.get\('io'\)\.to\([^)]+\)\.emit\([^)]+\);/g, ''); // Will fix manually or with simple regex
content = content.replace(/if \(req\.app\.get\('io'\)\) \{(.*?)\}/gs, (match, p1) => {
    return p1.replace(/req\.app\.get\('io'\)\.to\(([^)]+)\)\.emit\('([^']+)',\s*(.*?)\);/g, 'await broadcastToParty($1, "$2", $3);');
});

// 3. Fix the registerRoutes export to just return standard Express app
const expressAppCode = `
import express from 'express';
export const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

export function registerRoutes() {
  // Routes are attached to the exported \`app\`
`;
content = content.replace(/export async function registerRoutes\([\s\S]*?\) \: Promise<Server> \{[\s\S]*?app\.use\(maintenanceMiddleware\);/m, expressAppCode);
content = content.replace(/return httpServer;/g, 'return app;');

fs.writeFileSync(file, content);
console.log('Processed lib/routes.ts');
