const fs = require('fs');
const p = 'lib/middleware.ts';
let c = fs.readFileSync(p, 'utf-8');
c = c.replace(
  'export async function bootstrap(req: any, res: any): Promise<boolean> {',
  'export async function bootstrap(req: any, res: any): Promise<boolean> {\n  if (!res.cookie) {\n    res.cookie = (name, val, opts) => {\n      const str = `${name}=${val}; Path=/` + (opts?.httpOnly ? "; HttpOnly" : "");\n      res.setHeader("Set-Cookie", str);\n    };\n  }'
);
fs.writeFileSync(p, c);
