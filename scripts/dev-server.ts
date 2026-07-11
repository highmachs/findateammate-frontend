import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function start() {
  const express = (await import("express")).default;
  const cookieParser = (await import("cookie-parser")).default;
  const { app, registerRoutes } = await import("../lib/routes");
  const { sessionMiddleware } = await import("../lib/middleware");

  // Apply cookieParser and sessionMiddleware before route handlers
  app.use(cookieParser());
  app.use(sessionMiddleware);

  // Register API routes
  registerRoutes();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Local API Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
