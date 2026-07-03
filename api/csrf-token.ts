import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bootstrap, generateCsrfToken } from "../lib/middleware";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await bootstrap(req, res))) return;
  if (!(res as any).cookie) {
    (res as any).cookie = (name: string, val: string, opts?: any) => {
      const str = `${name}=${val}; Path=/` + (opts?.httpOnly ? "; HttpOnly" : "");
      res.setHeader("Set-Cookie", str);
    };
  }
  const token = generateCsrfToken(req as any, res as any);
  res.status(200).json({ csrfToken: token });
}
