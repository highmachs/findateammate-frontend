import serverless from "serverless-http";

let handler: any = null;
let bootstrapFn: any = null;

async function initialize() {
  if (handler) return;

  // Lazily import to catch any startup/env-var errors in the try-catch block
  const { app, registerRoutes } = await import("../lib/routes");
  registerRoutes();
  handler = serverless(app, { binary: [] });

  const { bootstrap } = await import("../lib/middleware");
  bootstrapFn = bootstrap;
}

export default async function (req: any, res: any) {
  try {
    // 1. Initialize routes and dependencies lazily
    await initialize();

    // 2. Run serverless middleware (session, user, CSRF, CORS)
    if (!(await bootstrapFn(req, res))) return;

    // 3. Delegate to the Express app via serverless-http adapter
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
