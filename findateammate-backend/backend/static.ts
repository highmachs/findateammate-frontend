import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Robust path resolution for Docker
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Optimization: Serve immutable assets with long-term caching
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "1y",
    immutable: true
  }));

  // Optimization: Serve other static files (like index.html) with NO caching to ensure updates are seen immediately
  app.use(express.static(distPath, {
    maxAge: "0",
    etag: true,
    lastModified: true
  }));

  // fall through to index.html if the file doesn't exist
  app.use((_req, res) => {
    // Read the file every time to ensure freshness (or cache in memory if performant enough)
    // For now, read to inject the nonce
    try {
        const indexHtml = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");
        // CSP Nonce Injection
         // @ts-ignore - res.locals.nonce is set by helmet middleware in index.ts
        const nonce = res.locals.nonce || "";
        const page = indexHtml.replace(/%NONCE%/g, nonce);
        res.status(200).set({ "Content-Type": "text/html" }).send(page);
    } catch (err) {
        // Fallback if read fails
        res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
