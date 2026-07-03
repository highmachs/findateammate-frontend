const fs = require('fs');
let c = fs.readFileSync('lib/routes.ts', 'utf8');

c = c.replace(/const enrichedMessage = \{\s*\.\.\.message,\s*senderName: sender\?\.name \|\| "Unknown"\s*;/g, 'const enrichedMessage = { ...message, senderName: sender?.name || "Unknown" };');
c = c.replace(/\}\s*res\.json\(message\);/g, 'await broadcastToParty(chatId, "receive_message", enrichedMessage);\n      res.status(201).json(enrichedMessage);');
c = c.replace(/\}\n\}$/g, '  return app;\n}');

fs.writeFileSync('lib/routes.ts', c);
