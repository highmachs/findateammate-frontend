const fs = require('fs');
const p = 'api/csrf-token.ts';
let c = fs.readFileSync(p, 'utf-8');
c = c.replace(
  'const token = generateCsrfToken(req as any, res as any);',
  'if (!(res as any).cookie) {\n    (res as any).cookie = (name, val, opts) => {\n      const str = `${name}=${val}; Path=/` + (opts?.httpOnly ? "; HttpOnly" : "");\n      res.setHeader("Set-Cookie", str);\n    };\n  }\n  const token = generateCsrfToken(req as any, res as any);'
);
fs.writeFileSync(p, c);
