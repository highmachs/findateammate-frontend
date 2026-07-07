import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runWeeklyAuditExport } from "../../lib/audit-scheduler";
import { logger } from "../../lib/logger";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Option B: verify our own CRON_SECRET header to decouple from Vercel's exact Cron invocation
  const secret = req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) {
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
}
