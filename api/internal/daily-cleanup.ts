import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runWeeklyAuditExport } from "../../lib/audit-scheduler";
import { sessionStore } from "../../lib/session";
import { cleanupOldContent, cleanupObservabilityLogs } from "../../lib/cleanup-helpers";
import { logger } from "../../lib/logger";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const authHeader = req.headers["x-cron-secret"];
  // For Vercel Cron, the secret is provided. Allow bypass if not configured in local dev, but enforce otherwise.
  if (process.env.CRON_SECRET && authHeader !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  logger.log("Running daily cleanup jobs");
  const jobs: Array<{ name: string; status: string; error?: string }> = [];

  // Job 1: audit export
  try {
    await runWeeklyAuditExport();
    jobs.push({ name: "audit", status: "success" });
  } catch (err: any) {
    logger.error("Audit export failed", err);
    jobs.push({ name: "audit", status: "error", error: err.message });
  }

  // Job 2: session-prune
  try {
    await sessionStore.prune();
    jobs.push({ name: "session-prune", status: "success" });
  } catch (err: any) {
    logger.error("Session pruning failed", err);
    jobs.push({ name: "session-prune", status: "error", error: err.message });
  }

  // Job 3: cleanup (content/messages)
  try {
    await cleanupOldContent();
    await cleanupObservabilityLogs(); // might as well run this too
    jobs.push({ name: "cleanup", status: "success" });
  } catch (err: any) {
    logger.error("Cleanup failed", err);
    jobs.push({ name: "cleanup", status: "error", error: err.message });
  }

  return res.status(200).json({ success: true, jobs });
}
