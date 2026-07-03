const fs = require('fs');
const p = 'scripts/test-server.ts';
let c = fs.readFileSync(p, 'utf-8');
c = c.replace(
  'const vercelReq = Object.assign(req, {',
  'req.headers["x-forwarded-proto"] = "https";\n      const vercelReq = Object.assign(req, {'
);
fs.writeFileSync(p, c);
