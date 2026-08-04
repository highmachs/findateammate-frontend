import { Router } from "express";
import { runWeeklyAuditExport } from "../audit-scheduler";
import { sessionStore } from "../session";
import { cleanupOldContent, cleanupObservabilityLogs } from "../cleanup-helpers";
import { logger } from "../logger";

export const internalRouter = Router();

internalRouter.get("/run-audit-export", async (req: any, res: any) => {
  const secret = req.headers["x-cron-secret"];
  const authHeader = req.headers.authorization;
  const isAuthorized = secret === process.env.CRON_SECRET || authHeader === `Bearer ${process.env.CRON_SECRET}`;
  
  if (!isAuthorized) {
    logger.warn(`Unauthorized cron attempt: invalid CRON_SECRET`);
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    await runWeeklyAuditExport();
    return res.status(200).json({ ok: true, message: "Weekly audit export completed" });
  } catch (err: any) {
    logger.error("[audit-export-route] failed:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

internalRouter.use("/daily-cleanup", async (req: any, res: any) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const secret = req.headers["x-cron-secret"];
  const bearerHeader = req.headers.authorization;
  const isAuthorized = secret === process.env.CRON_SECRET || bearerHeader === `Bearer ${process.env.CRON_SECRET}`;
  
  if (process.env.CRON_SECRET && !isAuthorized) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  logger.log("Running daily cleanup jobs");
  const jobs: Array<{ name: string; status: string; error?: string }> = [];

  try {
    await runWeeklyAuditExport();
    jobs.push({ name: "audit", status: "success" });
  } catch (err: any) {
    logger.error("Audit export failed", err);
    jobs.push({ name: "audit", status: "error", error: err.message });
  }

  try {
    await sessionStore.prune();
    jobs.push({ name: "session-prune", status: "success" });
  } catch (err: any) {
    logger.error("Session pruning failed", err);
    jobs.push({ name: "session-prune", status: "error", error: err.message });
  }

  try {
    await cleanupOldContent();
    await cleanupObservabilityLogs();
    jobs.push({ name: "cleanup", status: "success" });
  } catch (err: any) {
    logger.error("Cleanup failed", err);
    jobs.push({ name: "cleanup", status: "error", error: err.message });
  }

  return res.status(200).json({ success: true, jobs });
});
