import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
function exists(p: string) { return existsSync(path.join(ROOT, p)); }

function scanAll(dir: string, ext = ".ts"): string[] {
  const results: string[] = [];
  function recurse(d: string) {
    if (!existsSync(d)) return;
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.isDirectory() && !["node_modules", ".next", "dist"].includes(entry.name)) {
        recurse(path.join(d, entry.name));
      } else if (entry.name.endsWith(ext) || entry.name.endsWith(".tsx")) {
        results.push(path.join(d, entry.name));
      }
    }
  }
  recurse(dir);
  return results;
}

describe("Phase 8: Dead code and Render-specific files are gone", () => {

  const SHOULD_NOT_EXIST = [
    "Dockerfile",
    "docker-compose.yml",
    "ecosystem.config.cjs",
    "start.sh",
    "findateammate-backend/backend/socket.ts",
    "findateammate-backend/backend/index.ts",
    "findateammate-backend/renderenvcontent.env",
  ];

  for (const file of SHOULD_NOT_EXIST) {
    it(`${file} does NOT exist`, () => {
      expect(exists(file)).toBe(false);
    });
  }

  it("no active source file imports from express-rate-limit", () => {
    const checkDirs = ["api", "lib", "src"];
    const offenders: string[] = [];
    for (const dir of checkDirs) {
      const dirPath = path.join(ROOT, dir);
      if (!existsSync(dirPath)) continue;
      
      const files = scanAll(dirPath);
      for (const file of files) {
        const content = readFileSync(file, "utf-8");
        if (content.includes("express-rate-limit")) {
          offenders.push(file);
        }
      }
    }
    expect(offenders, `express-rate-limit found in: ${offenders.join(", ")}`).toHaveLength(0);
  });

  it("no active source file imports from connect-pg-simple", () => {
    const checkDirs = ["api", "lib", "src"];
    const offenders: string[] = [];
    for (const dir of checkDirs) {
      const dirPath = path.join(ROOT, dir);
      if (!existsSync(dirPath)) continue;
      
      const files = scanAll(dirPath);
      for (const file of files) {
        const content = readFileSync(file, "utf-8");
        if (content.includes("connect-pg-simple")) {
          offenders.push(file);
        }
      }
    }
    expect(offenders, `connect-pg-simple found in: ${offenders.join(", ")}`).toHaveLength(0);
  });

  it("TypeScript compiles cleanly: tsc --noEmit on api/ and lib/", () => {
    const { execSync } = require("child_process");
    expect(() =>
      // Use npx.cmd for Windows compatibility
      execSync(process.platform === 'win32' ? "npx.cmd tsc --noEmit" : "npx tsc --noEmit", { cwd: ROOT, stdio: "pipe" })
    ).not.toThrow();
  }, 30000);
});
