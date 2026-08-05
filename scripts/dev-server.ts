import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });
import fs from "fs";
const localEnvPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath, override: true });
}

async function start() {
  const express = (await import("express")).default;
  const cookieParser = (await import("cookie-parser")).default;
  const { app, registerRoutes } = await import("../lib/routes");

  // Register API routes (which now include all middleware)
  registerRoutes();

  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Local API Server running on http://localhost:${PORT}`);
  });

  function shutdown(signal: string) {
    console.log(`[dev-server] Received ${signal}, shutting down...`);
    server.close(() => process.exit(0));
    // Force-exit if close hangs
    setTimeout(() => process.exit(1), 3000).unref();
  }
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch(console.error);
