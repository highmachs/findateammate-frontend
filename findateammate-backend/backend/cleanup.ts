import { db } from "./db";
import { posts, messages, analytics, auditLogs, postInteractions, userSearches } from "@shared/schema.sqlite";
import { lt, and, inArray, isNull, lte, isNotNull, sql } from "drizzle-orm";
import { logger } from "./lib/logger";
import cron from "node-cron";

/**
 * Cleanup old content to keep the database fresh and save storage:
 * - Chats & messages: deleted after 36 hours
 * - Teammate posts: deleted after 48 hours
 * - Event posts: deleted after their event date OR 48 hours if no date set
 */
export async function cleanupOldContent() {
  const now = new Date();

  try {
    // 1. Delete messages older than 36 hours
    const chatCutoff = new Date(now.getTime() - 36 * 60 * 60 * 1000);
    const deletedMessages = await db
      .delete(messages)
      .where(lt(messages.timestamp, chatCutoff))
      .returning({ id: messages.id });

    // 2. Delete old posts (Simplified query to avoid complex OR conditions)
    // First: Get teammate posts older than 48 hours
    const teammateCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    const oldTeammatePosts = await db
      .select({ id: posts.id, eventImage: posts.eventImage })
      .from(posts)
      .where(
        and(
          isNull(posts.eventName),
          lt(posts.createdAt, teammateCutoff)
        )
      );

    // Second: Get event posts past their event date
    // Use sql`unixepoch()` to let SQLite handle timezone, not JS Date
    const oldEventPosts = await db
      .select({ id: posts.id, eventImage: posts.eventImage })
      .from(posts)
      .where(
        and(
          isNotNull(posts.eventName),
          isNotNull(posts.eventDate),
          lte(posts.eventDate, sql`unixepoch()`)
        )
      );

    // Third: Get event posts with no date set, older than 48 hours
    const oldEventPostsNoDate = await db
      .select({ id: posts.id, eventImage: posts.eventImage })
      .from(posts)
      .where(
        and(
          isNotNull(posts.eventName),
          isNull(posts.eventDate),
          lt(posts.createdAt, teammateCutoff)
        )
      );

    const postsToDelete = [...oldTeammatePosts, ...oldEventPosts, ...oldEventPostsNoDate];

    if (postsToDelete.length > 0) {
      const postIds = postsToDelete.map(p => p.id);
      
      // Delete from DB
      await db.delete(posts).where(inArray(posts.id, postIds));

      // Delete associated Cloudinary assets (images are stored on Cloudinary, not disk)
      const { deleteFromCloudinary } = await import("./lib/cloudinary");
      for (const post of postsToDelete) {
        if (post.eventImage?.startsWith("https://res.cloudinary.com/")) {
          deleteFromCloudinary(post.eventImage).catch((err: any) =>
            logger.error(`[Cleanup] Failed to delete Cloudinary asset for post ${post.id}`, err)
          );
        }
      }
    }

    const summary = {
      messages: deletedMessages.length,
      chats: 0,
      posts: postsToDelete.length,
      endedEvents: oldEventPosts.length,
      oldTeammatePosts: oldTeammatePosts.length,
      oldEventPostsNoDate: oldEventPostsNoDate.length,
      timestamp: now.toISOString(),
    };

    if (summary.messages > 0 || summary.posts > 0) {
      console.log(
        `[Cleanup] Deleted: ${summary.messages} messages, ${summary.posts} posts (${summary.endedEvents} ended events, ${summary.oldTeammatePosts} old teammate, ${summary.oldEventPostsNoDate} events without dates) at ${now.toISOString()}`
      );
    } else {
      console.log("[Cleanup] No old content to delete");
    }

    return summary;
  } catch (error) {
    logger.error("Cleanup job failed", error);
    // Don't throw - let scheduled cleanup continue even if one fails
    return { messages: 0, chats: 0, posts: 0, timestamp: now.toISOString() };
  }
}

/**
 * Weekly cleanup of observability and analytics logs to save database storage.
 * Retention policy:
 * - Analytics: 30 days
 * - Audit Logs: 90 days (longer retention for compliance)
 * - Post Interactions: 60 days
 * - User Searches: 30 days
 */
export async function cleanupObservabilityLogs() {
  const now = new Date();
  console.log(`[Weekly Cleanup] Starting observability logs cleanup at ${now.toISOString()}`);

  try {
    // 1. Delete analytics older than 30 days
    const analyticsCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deletedAnalytics = await db
      .delete(analytics)
      .where(lt(analytics.timestamp, analyticsCutoff))
      .returning({ id: analytics.id });

    // 2. Delete audit logs older than 90 days (longer retention for compliance)
    const auditLogsCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const deletedAuditLogs = await db
      .delete(auditLogs)
      .where(lt(auditLogs.timestamp, auditLogsCutoff))
      .returning({ id: auditLogs.id });

    // 3. Delete post interactions older than 60 days
    const interactionsCutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const deletedInteractions = await db
      .delete(postInteractions)
      .where(lt(postInteractions.createdAt, interactionsCutoff))
      .returning({ id: postInteractions.id });

    // 4. Delete user searches older than 30 days
    const searchesCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deletedSearches = await db
      .delete(userSearches)
      .where(lt(userSearches.createdAt, searchesCutoff))
      .returning({ id: userSearches.id });

    const summary = {
      analytics: deletedAnalytics.length,
      auditLogs: deletedAuditLogs.length,
      postInteractions: deletedInteractions.length,
      userSearches: deletedSearches.length,
      timestamp: now.toISOString(),
    };

    console.log(
      `[Weekly Cleanup] ✅ Deleted: ${summary.analytics} analytics, ${summary.auditLogs} audit logs, ${summary.postInteractions} post interactions, ${summary.userSearches} user searches`
    );

    return summary;
  } catch (error) {
    logger.error("[Weekly Cleanup] Failed to clean observability logs", error);
    return {
      analytics: 0,
      auditLogs: 0,
      postInteractions: 0,
      userSearches: 0,
      timestamp: now.toISOString(),
    };
  }
}

/**
 * Start the cleanup scheduler with retry logic.
 * - Hourly cleanup: runs every hour for posts and messages
 * - Weekly cleanup: runs every Sunday at 11:00 PM for observability/analytics logs
 */
export function startCleanupScheduler() {
  const ONE_HOUR = 60 * 60 * 1000;

  // Retry initial cleanup with exponential backoff (max 3 attempts)
  async function runInitialCleanup(attempt = 1) {
    try {
      await cleanupOldContent();
      console.log("[Cleanup] Initial cleanup completed successfully");
    } catch (err) {
      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 5000; // 10s, 20s, 40s
        console.log(`[Cleanup] Initial cleanup failed (attempt ${attempt}/3), retrying in ${delay}ms...`);
        setTimeout(() => runInitialCleanup(attempt + 1), delay);
      } else {
        logger.error("Initial cleanup failed after 3 attempts", err);
      }
    }
  }

  // Start initial cleanup with retry
  runInitialCleanup();

  // Hourly cleanup: run every hour for posts and messages
  const intervalId = setInterval(() => {
    cleanupOldContent().catch((err) =>
      logger.error("Scheduled cleanup failed", err)
    );
  }, ONE_HOUR);

  console.log("[Cleanup] Hourly scheduler started - runs every hour");
  console.log("[Cleanup] Teammate posts: auto-delete after 48 hours");
  console.log("[Cleanup] Event posts: auto-delete after event date (or 48 hours if no date set)");

  // Weekly cleanup: run every Sunday at 11:00 PM (23:00) for observability/analytics logs
  // Cron expression: "0 23 * * 0" (minute=0, hour=23, day-of-month=any, month=any, day-of-week=0=Sunday)
  const cronJob = cron.schedule("0 23 * * 0", () => {
    console.log("[Weekly Cleanup] Triggered: Sunday 11:00 PM");
    cleanupObservabilityLogs().catch((err) =>
      logger.error("[Weekly Cleanup] Failed", err)
    );
  }, {
    timezone: "Asia/Kolkata" // IST timezone for consistent Sunday 11pm
  });

  console.log("[Weekly Cleanup] Scheduler started - runs every Sunday at 11:00 PM IST");
  console.log("[Weekly Cleanup] Retention: Analytics (30d), Audit Logs (90d), Post Interactions (60d), User Searches (30d)");

  return { intervalId, cronJob };
}
