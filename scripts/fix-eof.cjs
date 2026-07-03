const fs = require('fs');
let c = fs.readFileSync('lib/routes.ts', 'utf8');
c = c.replace(/\}\r?\n\}\r?\n?$/, '  return app;\n}\n');
fs.writeFileSync('lib/routes.ts', c);
