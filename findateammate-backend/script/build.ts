/**
 * Backend-Only Build Script for Render Deployment
 * 
 * This script bundles ONLY the backend into dist/index.cjs
 * Frontend is deployed separately on Vercel
 */

import { build as esbuild } from "esbuild";
import fs from "fs";
import path from "path";

async function buildBackend() {
  console.log("🔨 Building backend for Render...");
  console.log("Current working directory:", process.cwd());

  try {
    // Clean dist directory
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      console.log("Removing existing dist directory...");
      fs.rmSync(distPath, { recursive: true, force: true });
    }
    fs.mkdirSync(distPath, { recursive: true });
    console.log("Created dist directory");

    // Bundle backend
    console.log("Bundling backend/index.ts...");
    const result = await esbuild({
      entryPoints: ["backend/index.ts"],
      platform: "node",
      target: "node20",
      bundle: true,
      format: "cjs",
      outfile: "dist/index.cjs",
      external: [
        "argon2",
        "pg-native",
        "@node-rs/argon2",
        "@node-rs/bcrypt",
        "bufferutil",
        "utf-8-validate",
      ],
      logLevel: "info",
      sourcemap: true,
    });

    // Check if build was successful
    if (!fs.existsSync("dist/index.cjs")) {
      throw new Error("Build produced no output file: dist/index.cjs");
    }

    const stats = fs.statSync("dist/index.cjs");
    console.log(`✅ Backend build complete: dist/index.cjs (${(stats.size / 1024).toFixed(2)}KB)`);
    console.log("Build metadata:", result);
  } catch (err) {
    console.error("❌ Build failed:", err);
    process.exit(1);
  }
}

buildBackend();
