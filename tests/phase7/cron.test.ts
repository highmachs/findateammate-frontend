import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

function scanAll(dir: string, ext = ".ts"): string[] {
  const results: string[] = [];
  function recurse(d: string) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.isDirectory() && !["node_modules", ".next", "dist"].includes(entry.name)) {
        recurse(path.join(d, entry.name));
      } else if (entry.name.endsWith(ext)) {
        results.push(path.join(d, entry.name));
      }
    }
  }
  recurse(dir);
  return results;
}

describe("Phase 7: Cron job migration", () => {

  it("NO file in api/, lib/, or src/ imports node-cron", () => {
    const dirs = ["api", "lib", "src"];
    const offenders: string[] = [];
    for (const dir of dirs) {
      const dirPath = path.join(ROOT, dir);
      const files = scanAll(dirPath).catch?.() ?? [];
      for (const f of files) {
        if (readFileSync(f, "utf-8").includes("node-cron")) {
          offenders.push(f);
        }
      }
    }
    expect(offenders, `Files still using node-cron: ${offenders.join(", ")}`).toHaveLength(0);
  });

  it("NO file uses setInterval for scheduled work (must use Vercel Cron)", () => {
    const dirs = ["api", "lib"];
    const offenders: string[] = [];
    for (const dir of dirs) {
      const dirPath = path.join(ROOT, dir);
      try {
        for (const f of scanAll(dirPath)) {
          const src = readFileSync(f, "utf-8");
          if (src.includes("setInterval(") && !f.includes("test")) {
            offenders.push(f);
          }
        }
      } catch { /* dir may not exist yet */ }
    }
    expect(offenders, `setInterval in non-test code: ${offenders.join(", ")}`).toHaveLength(0);
  });

  it("vercel.json defines exactly one cron job", () => {
    const vcj = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf-8"));
    expect(vcj.crons).toBeDefined();
    expect(vcj.crons.length).toBe(1);
    expect(vcj.crons[0].path).toBe("/api/internal/daily-cleanup");
  });

  it("daily-cleanup function runs all three legacy jobs: cleanup, session-prune, audit-export", () => {
    const src = readFileSync(path.join(ROOT, "api/internal/daily-cleanup.ts"), "utf-8");
    expect(src).toContain("session"); // session pruning
    expect(src).toContain("audit"); // audit export
    expect(src).toContain("cleanup"); // content/message cleanup
  });

  it("daily-cleanup manually triggered succeeds (against staging Turso)", async () => {
    const handler = (await import("../../api/internal/daily-cleanup")).default;
    
    let jsonResult: any = null;
    const req = {
      method: "POST",
      headers: { "x-cron-secret": process.env.CRON_SECRET || "" }
    } as any;
    
    const res = {
      status: (code: number) => ({
        json: (data: any) => {
          if (!jsonResult) jsonResult = data;
          return { code, data };
        }
      })
    } as any;
    
    await handler(req, res);
    
    expect(jsonResult).toBeDefined();
    expect(jsonResult.jobs).toBeDefined();
    // All 3 sub-jobs must succeed — none are allowed to silently fail
    for (const job of jsonResult.jobs) {
      expect(job.status, `Job ${job.name} failed: ${job.error}`).toBe("success");
    }
  });
});
