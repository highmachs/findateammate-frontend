let isInitialized = false;
let handler: any = null;
let bootstrapFn: any = null;

async function initialize() {
  if (isInitialized) return;
  
  // Use explicit .js extension to avoid ESM directory import conflicts
  const { registerRoutes, app } = await import("../lib/routes.js");
  registerRoutes();
  
  const serverless = (await import("serverless-http")).default;
  handler = serverless(app, { binary: [] });
  
  const { bootstrap } = await import("../lib/middleware.js");
  bootstrapFn = bootstrap;
  
  isInitialized = true;
}

export default async function (req: any, res: any) {
  try {
    // Lazy load imports and routes to catch initialization errors (e.g. missing env vars)
    await initialize();
    
    // 1. Run serverless middleware (session, user, CSRF, CORS)
    if (!(await bootstrapFn(req, res))) return;

    // 2. Delegate to the Express app via serverless-http adapter
    return await handler(req, res);
  } catch (error: any) {
    console.error("Serverless Function Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      stack: error.stack
    });
  }
}
