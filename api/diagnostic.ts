import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@libsql/client";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const start = Date.now();
  try {
    const url = process.env.TURSO_DATABASE_URL || "";
    const token = process.env.TURSO_AUTH_TOKEN || "";
    
    if (!url || !token) {
      return res.status(500).json({
        success: false,
        message: "Missing environment variables",
        env: {
          hasUrl: !!url,
          hasToken: !!token
        }
      });
    }

    const httpsUrl = url.replace(/^libsql:\/\//, "https://");
    
    // Create an isolated client just for this test
    const client = createClient({
      url: httpsUrl,
      authToken: token,
      fetch: (url, init) => {
        const headers = new Headers(init?.headers);
        headers.set('Connection', 'close');
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort("Hard timeout"), 3000);
        
        return fetch(url, { ...init, headers, signal: controller.signal })
          .finally(() => clearTimeout(timeout));
      }
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Query hard timeout (4s)")), 4000)
    );
    
    const queryPromise = client.execute("SELECT 1 as val");
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;
    const duration = Date.now() - start;
    
    res.status(200).json({ 
      success: true,
      message: `Turso connected successfully in ${duration}ms!`,
      result: result.rows
    });
  } catch (error: any) {
    const duration = Date.now() - start;
    res.status(500).json({
      success: false,
      message: "Turso connection failed",
      error: error.message,
      stack: error.stack,
      durationMs: duration
    });
  }
}
