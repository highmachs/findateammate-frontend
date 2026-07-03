import { db } from './db';
import { auditLogs } from '../shared/schema.sqlite';
import { and, gte, lt } from 'drizzle-orm';
import { logger } from './logger';
import { NodemailerProvider } from './mail';
const mailProvider = new NodemailerProvider();

/**
 * Export audit logs for a given date range to CSV format
 */
export async function exportAuditLogsToCSV(startDate: Date, endDate: Date): Promise<string> {
  const logs = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        gte(auditLogs.timestamp, startDate),
        lt(auditLogs.timestamp, endDate)
      )
    )
    .orderBy(auditLogs.timestamp);

  // Generate CSV
  const headers = 'ID,Timestamp,Action,Resource,User ID,Username,Details';
  const rows = logs.map(log => {
    const action = `"${log.action.replace(/"/g, '""')}"`;
    const resource = `"${log.resource.replace(/"/g, '""')}"`;
    const details = log.details ? `"${JSON.stringify(log.details).replace(/"/g, '""')}"` : '""';
    return `${log.id},${log.timestamp},${action},${resource},${log.userId || ''},${log.userName || ''},${details}`;
  });

  return [headers, ...rows].join('\n');
}

/**
 * Clean up audit logs older than 30 days
 */
export async function cleanupOldAuditLogs(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deleted = await db
    .delete(auditLogs)
    .where(lt(auditLogs.timestamp, thirtyDaysAgo))
    .returning({ id: auditLogs.id });

  logger.log(`[Audit Cleanup] Deleted ${deleted.length} audit logs older than 30 days`);
  return deleted.length;
}

/**
 * Weekly audit export job
 * Runs every Sunday at 11:59 PM IST
 */
export async function runWeeklyAuditExport() {
  try {
    logger.log('[Audit Export] Starting weekly audit export job');

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Format dates for report
    const weekLabel = `${startDate.toLocaleDateString('en-IN')} to ${endDate.toLocaleDateString('en-IN')}`;

    // Export audit logs
    const csvContent = await exportAuditLogsToCSV(startDate, endDate);
    
    // Count logs
    const logCount = csvContent.split('\n').length - 1; // Subtract header

    // IMPORTANT: Use dedicated admin email, NOT SMTP_USER
    const ADMIN_REPORT_EMAIL = 'findateammate.ahilight@gmail.com';

    // Send email with CSV attachment
    await mailProvider.send({
      to: ADMIN_REPORT_EMAIL,
      subject: `📊 Weekly Audit Report: ${weekLabel}`,
      text: `Weekly Audit Trail Report\n\nPeriod: ${weekLabel}\nTotal Audit Entries: ${logCount}\n\nPlease find the attached CSV file with all audit trail entries for this week.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📊 Weekly Audit Trail Report</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Report Period:</strong> ${weekLabel}</p>
            <p><strong>Total Audit Entries:</strong> ${logCount}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
          <p>Please find the attached CSV file with all audit trail entries for this week.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            This is an automated weekly report from FindATeammate Audit System.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `audit-logs-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`,
          content: csvContent,
          contentType: 'text/csv'
        }
      ]
    });

    logger.log(`[Audit Export] Successfully exported ${logCount} audit logs for week: ${weekLabel}`);

    // Clean up old audit logs (older than 30 days)
    const deletedCount = await cleanupOldAuditLogs();
    logger.log(`[Audit Export] Cleanup completed: ${deletedCount} old logs removed`);

  } catch (error) {
    logger.error('[Audit Export] Weekly export job failed', error);
    throw error;
  }
}

