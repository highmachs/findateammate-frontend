import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { execSync } from "child_process";

const FRONTEND_SRC = path.resolve(__dirname, "../../src");

function scanAllTsxFiles(): string[] {
  const results: string[] = [];
  function recurse(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== "node_modules") {
        recurse(path.join(dir, entry.name));
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        results.push(path.join(dir, entry.name));
      }
    }
  }
  recurse(FRONTEND_SRC);
  return results;
}

describe("Phase 6: Frontend socket migration", () => {

  it("src/lib/socket.ts exists and uses partysocket NOT socket.io-client", () => {
    const socketFile = path.join(FRONTEND_SRC, "lib/socket.ts");
    expect(existsSync(socketFile)).toBe(true);
    const src = readFileSync(socketFile, "utf-8");
    expect(src).toContain("partysocket");
    expect(src).not.toContain("socket.io-client");
    expect(src).not.toContain("onrender.com");
  });

  it("no frontend .ts/.tsx file imports from socket.io-client", () => {
    const offenders = scanAllTsxFiles().filter((f) =>
      readFileSync(f, "utf-8").includes("socket.io-client")
    );
    expect(offenders, `Files still using socket.io-client: ${offenders.join(", ")}`).toHaveLength(0);
  });

  it("no frontend file hardcodes the Render URL (onrender.com)", () => {
    const offenders = scanAllTsxFiles().filter((f) =>
      readFileSync(f, "utf-8").includes("onrender.com")
    );
    expect(offenders, `Files still referencing Render URL: ${offenders.join(", ")}`).toHaveLength(0);
  });

  it("src/lib/socket.ts exports connectSocket, getSocket, disconnectSocket", () => {
    const src = readFileSync(path.join(FRONTEND_SRC, "lib/socket.ts"), "utf-8");
    for (const exported of ["connectSocket", "getSocket", "disconnectSocket"]) {
      expect(src, `Missing export: ${exported}`).toContain(exported);
    }
  });

  it("Chat.tsx uses PartySocket (not socket.emit / socket.on from socket.io)", () => {
    const chatPage = readFileSync(path.join(FRONTEND_SRC, "pages/Chat.tsx"), "utf-8");
    expect(chatPage).not.toContain("socket.emit(");
    expect(chatPage).not.toContain("from \"socket.io-client\"");
  });

  it("frontend Vite build succeeds with PartySocket integration", () => {
    expect(() =>
      execSync("npx vite build --mode test 2>&1", {
        cwd: path.resolve(__dirname, "../.."),
        stdio: "pipe",
      })
    ).not.toThrow();
  }, 30000);
});
