import { users, posts, connectionRequests, messages, analytics, notifications, eventVotes, reports, systemSettings, auditLogs, feedback, eventRegistrations, postInteractions, userSearches, type User, type InsertUser, type Post, type InsertPost, type ConnectionRequest, type InsertConnectionRequest, type EventRegistration, type InsertEventRegistration, type Message, type InsertMessage, type Notification, type InsertNotification, type Analytics, type InsertAnalytics, type ChatWithDetails, type Report, type InsertReport, type SystemSetting, type AuditLog, type InsertAuditLog, type Feedback, type InsertFeedback } from "@shared/schema";
import { db } from "./db";
import { logger } from "./lib/logger";
import { MemoryCache } from "./lib/cache";
import { eq, desc, asc, and, or, inArray, gt, lt, sql, isNotNull } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
// nanoid import removed as db uses text keys, but we might need to gen IDs if schema doesn't auto-gen them.
// Looking at schema: id: text("id").primaryKey() -> No default. We MUST generate ID.



export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUsers(limit?: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  createOAuthUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  verifyUser(id: string): Promise<User>;
  updateLastActive(id: string): Promise<void>;

  // Posts
  getPosts(cursor?: Date, limit?: number, viewerId?: string): Promise<{ items: (Post & { myVote?: number; organizerDepartment?: string | null })[], nextCursor: Date | null }>;
  getPostsByUser(userId: string): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  deletePost(id: string): Promise<void>;
  updatePost(id: string, post: Partial<InsertPost>): Promise<Post>;
  upvoteEvent(id: string, userId: string): Promise<void>;
  downvoteEvent(id: string, userId: string): Promise<void>;

  // Chat Authorization
  isUserInChat(chatId: string, userId: string): Promise<boolean>;

  // Connection Requests
  getConnectionRequests(userId: string): Promise<ConnectionRequest[]>;
  getConnectionRequest(id: string): Promise<ConnectionRequest | undefined>;
  getExistingRequest(fromUserId: string, toUserId: string, postId: string): Promise<ConnectionRequest | undefined>;
  createConnectionRequest(request: InsertConnectionRequest): Promise<ConnectionRequest>;
  updateConnectionRequestStatus(id: string, status: string): Promise<void>;
  deleteConnectionRequest(id: string): Promise<void>;

  // Event Registrations (for intra-college events with cross-department participation)
  getEventRegistrations(postId: string): Promise<EventRegistration[]>;
  getEventRegistration(id: string): Promise<EventRegistration | undefined>;
  getExistingRegistration(postId: string, userId: string): Promise<EventRegistration | undefined>;
  getUserEventRegistrations(userId: string): Promise<EventRegistration[]>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  updateEventRegistrationStatus(id: string, status: string, rejectionReason?: string): Promise<EventRegistration>;
  deleteEventRegistration(id: string): Promise<void>;
  getPendingRegistrationsForEvent(postId: string): Promise<EventRegistration[]>;

  // Chats & Messages
  // Chats & Messages
  getChats(userId: string): Promise<ChatWithDetails[]>;
  getMessages(chatId: string, userId?: string, beforeTimestamp?: Date): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearChatHistory(chatId: string, userId: string): Promise<void>;
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationsRead(userId: string, ids: string[]): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotifications(userId: string, ids: string[]): Promise<void>;
  deleteAllNotifications(userId: string): Promise<void>;
  getUnreadNotificationsCount(userId: string): Promise<number>;

  // Analytics
  logEvent(event: InsertAnalytics): Promise<void>;

  // Analytics
  getAnalytics(startDate?: Date, endDate?: Date, limit?: number, offset?: number): Promise<Analytics[]>;

  // Observability & Auditing
  logAudit(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number, startDate?: Date, endDate?: Date): Promise<AuditLog[]>;
  clearAuditLogs(): Promise<void>;

  // Feedback
  createFeedback(data: InsertFeedback): Promise<Feedback>;
  getFeedback(limit?: number): Promise<(Feedback & { userName: string | null })[]>;

  // Admin
  getAdminStats(): Promise<any>;
  promoteUser(id: string, isAdmin: boolean): Promise<User>;
  promoteOrganiser(id: string, isOrganiser: boolean): Promise<User>;
  deleteUser(id: string): Promise<void>;
  banUser(id: string, reason: string): Promise<User>;
  unbanUser(id: string): Promise<User>;
  adminDeletePost(id: string): Promise<void>;

  // Reports
  createReport(report: InsertReport): Promise<Report>;
  getReports(status?: string, type?: string, search?: string): Promise<Report[]>;
  updateReportStatus(id: string, status: string, resolvedBy?: string, adminNotes?: string): Promise<Report>;
  deleteReport(id: string): Promise<void>;
  deleteReports(ids: string[]): Promise<void>;
  deleteAllReports(): Promise<void>;

  // System Settings
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  setSystemSetting(key: string, value: any, userId: string): Promise<SystemSetting>;

  // Behavioral Tracking & Recommendations
  trackPostInteraction(userId: string, postId: string, interactionType: string, durationSeconds?: number, metadata?: any): Promise<void>;
  trackUserSearch(userId: string, query: string, filters: any, resultsCount: number, clickedPostIds: string[]): Promise<void>;
  getRecommendedPostIds(userId: string, limit?: number): Promise<string[]>;
  getSearchSuggestions(userId: string, limit?: number): Promise<string[]>;
  getPersonalizationMetrics(days?: number): Promise<{ ctr: number; connectionRate: number; trackedSearches: number; trackedInteractions: number }>;
}

export class DatabaseStorage implements IStorage {
  private settingCache = new Map<string, { value: SystemSetting | undefined, expires: number }>();
  private pendingSettings = new Map<string, Promise<SystemSetting | undefined>>();
  
  // Cache for Users (TTL: 30 seconds) - heavily hit by session middleware
  private userCache = new MemoryCache<User>(30);
  
  // Cache for Posts (TTL: 60 seconds) - heavily hit by viral content
  private postCache = new MemoryCache<Post>(60);

  // Cache for Admin Stats (TTL: 300 seconds/5 mins) - heavy aggregation
  private adminStatsCache = new MemoryCache<any>(300);


  // Users
  async getUser(id: string): Promise<User | undefined> {
    const cached = this.userCache.get(id);
    if (cached) return cached;

    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user) this.userCache.set(id, user);
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUsers(limit?: number): Promise<User[]> {
    const query = db.select().from(users).orderBy(asc(users.name));
    return limit ? await query.limit(limit) : await query;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    this.adminStatsCache.delete("stats");
    return newUser;
  }

  async createOAuthUser(user: InsertUser): Promise<User> {
    // Create OAuth user - email verification not required since provider confirmed it
    const [newUser] = await db.insert(users).values(user).returning();
    this.adminStatsCache.delete("stats");
    return newUser;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    return await db.transaction(async (tx) => {
      const [updatedUser] = await tx
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();

      this.userCache.delete(id); // Invalidate cache

      // BUG #4 FIX: Invalidate admin stats cache if role fields changed
      if (userData.isBanned !== undefined || userData.isAdmin !== undefined || userData.isOrganiser !== undefined) {
        this.adminStatsCache.delete("stats");
      }


      // Cascade updates for denormalized data
      if (userData.name) {
        await tx.update(posts)
          .set({ userName: userData.name })
          .where(eq(posts.userId, id));

        await tx.update(connectionRequests)
          .set({ fromUserName: userData.name })
          .where(eq(connectionRequests.fromUserId, id));

        await tx.update(connectionRequests)
          .set({ toUserName: userData.name })
          .where(eq(connectionRequests.toUserId, id));
      }

      if (userData.skills && userData.skills.length > 0) {
        const primarySkill = userData.skills[0];
        await tx.update(posts)
          .set({ userSkill: primarySkill })
          .where(eq(posts.userId, id));

        await tx.update(connectionRequests)
          .set({ fromUserSkill: primarySkill })
          .where(eq(connectionRequests.fromUserId, id));
      }

      return updatedUser;
    });
  }

  async verifyUser(id: string): Promise<User> {
    // DEPRECATED: Email verification removed - users no longer need to verify email
    const [user] = await db
      .update(users)
      .set({ 
        isVerified: true
      })
      .where(eq(users.id, id))
      .returning();
      
    this.userCache.delete(id);
    return user;
  }

  async updateLastActive(id: string): Promise<void> {
    // Update lastActive timestamp without cache invalidation (performance optimization)
    // Fire and forget - we don't await this in the hot path
    db.update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, id))
      .execute()
      .catch(err => logger.error("Failed to update lastActive", err));
  }



  // Posts
  async getPosts(cursor?: Date, limit: number = 20, viewerId?: string): Promise<{ items: (Post & { myVote?: number; organizerDepartment?: string | null })[], nextCursor: Date | null }> {
    const columns = {
        id: posts.id,
        title: posts.title,
        skillsOffered: posts.skillsOffered,
        skillsWanted: posts.skillsWanted,
        description: posts.description,
        availability: posts.availability,
        city: posts.city,
        university: posts.university,
        eventName: posts.eventName,
        eventType: posts.eventType,
        hostCollege: posts.hostCollege,
        eventDate: posts.eventDate,
        eventWebsite: posts.eventWebsite,
        eventImage: posts.eventImage,
        eventDetails: posts.eventDetails,
        eventUpvotes: posts.eventUpvotes,
        isEventOrganiser: posts.isEventOrganiser,
        allowedDepartments: posts.allowedDepartments,
        requiredSkills: posts.requiredSkills,
        requiredInterests: posts.requiredInterests,
        specialRequirements: posts.specialRequirements,
        maxCrossDeptParticipants: posts.maxCrossDeptParticipants,
        crossDeptRequiresApproval: posts.crossDeptRequiresApproval,
        userId: posts.userId,
        userName: posts.userName,
        userSkill: posts.userSkill,
        createdAt: posts.createdAt
    };

    let query = db.select({
        ...columns,
      organizerDepartment: users.department,
        myVote: viewerId ? eventVotes.voteType : sql<number>`null`
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.userId))
    .limit(limit + 1)
    // BUG #48 FIX: Sort by createdAt DESC only so cursor-based pagination is consistent.
    // Sorting by eventUpvotes first broke pagination: a post with createdAt > cursor but
    // fewer upvotes than the last page-1 item would be skipped entirely by the cursor filter.
    // Upvote counts remain visible in the UI so popular events still surface naturally.
    .orderBy(desc(posts.createdAt));

    if (viewerId) {
        query = query.leftJoin(
            eventVotes, 
            and(
                eq(eventVotes.postId, posts.id),
                eq(eventVotes.userId, viewerId)
            )
        ) as typeof query;
    }
    
    if (cursor) {
      query = query.where(lt(posts.createdAt, cursor)) as typeof query;
    }

    const items = await query;
    let nextCursor: Date | null = null;

    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.createdAt || null;
    }

    // Personalized ranking: if viewerId is provided and no cursor (first page),
    // apply hybrid recommendation ranking (content + collaborative)
    if (viewerId && !cursor && items.length > 0) {
      try {
        const { getRecommendedPosts } = await import("./lib/recommendations");
        const recentlySeen = await db
          .select({ postId: postInteractions.postId })
          .from(postInteractions)
          .where(eq(postInteractions.userId, viewerId))
          .orderBy(desc(postInteractions.createdAt))
          .limit(100);

        const excludePostIds = recentlySeen.map((r) => r.postId);
        const scores = await getRecommendedPosts(viewerId, excludePostIds, Math.max(limit * 4, 50));
        
        // Create score map
        const scoreMap = new Map(scores.map((s) => [s.postId, s.score]));
        
        // Sort by recommendation score, then by recency as tiebreaker
        items.sort((a, b) => {
          const scoreA = scoreMap.get(a.id) || 0;
          const scoreB = scoreMap.get(b.id) || 0;
          
          if (Math.abs(scoreA - scoreB) > 0.1) {
            // Significant score difference - sort by score
            return scoreB - scoreA;
          } else {
            // Similar scores - sort by recency
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        });
      } catch (error) {
        logger.error("Failed to apply personalized ranking", { error, viewerId });
        // Fall back to chronological ordering (already applied)
      }
    }

    // Cast the result to match the expected return type (the join returns a flattened object which works)
    return { items: items as (Post & { myVote?: number; organizerDepartment?: string | null })[], nextCursor };
  }

  async getPost(id: string): Promise<Post | undefined> {
    const cached = this.postCache.get(id);
    if (cached) return cached;

    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (post) this.postCache.set(id, post);

    return post;
  }

  async getPostsByUser(userId: string): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.userId, userId));
  }

  async createPost(post: InsertPost): Promise<Post> {
    const safePost: InsertPost = {
      ...post,
      // Defensive normalization for clients that may send malformed optional values.
      allowedDepartments: Array.isArray((post as any).allowedDepartments)
        ? (post as any).allowedDepartments
            .filter((dept: unknown): dept is string => typeof dept === "string")
            .map((dept: string) => dept.trim())
            .filter((dept: string) => dept.length > 0)
        : null,
      requiredSkills: Array.isArray((post as any).requiredSkills) ? (post as any).requiredSkills : [],
      requiredInterests: Array.isArray((post as any).requiredInterests) ? (post as any).requiredInterests : [],
      crossDeptRequiresApproval:
        typeof (post as any).crossDeptRequiresApproval === "boolean"
          ? (post as any).crossDeptRequiresApproval
          : true,
      isEventOrganiser:
        typeof (post as any).isEventOrganiser === "boolean"
          ? (post as any).isEventOrganiser
          : false,
    };

    const [newPost] = await db.insert(posts).values(safePost).returning();
    this.adminStatsCache.delete("stats");
    return newPost;
  }

  async deletePost(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. Delete connection requests referencing this post
      const requests = await tx.select().from(connectionRequests).where(eq(connectionRequests.postId, id));
      
      // 2. Delete messages for these requests/chats
      if (requests.length > 0) {
        const chatIds = requests.map(r => r.id);
        await tx.delete(messages).where(inArray(messages.chatId, chatIds));
      }

      // 3. Delete the requests
      await tx.delete(connectionRequests).where(eq(connectionRequests.postId, id));

      // 4. Delete the post
      await tx.delete(posts).where(eq(posts.id, id));
      
      this.postCache.delete(id);
      this.adminStatsCache.delete("stats");
    });
  }

  async updatePost(id: string, postData: Partial<InsertPost>): Promise<Post> {
    const [updatedPost] = await db
      .update(posts)
      .set(postData)
      .where(eq(posts.id, id))
      .returning();
      
    this.postCache.delete(id);
    return updatedPost;
  }

  async upvoteEvent(id: string, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Check if user already voted
      const [existingVote] = await tx.select().from(eventVotes).where(
        and(eq(eventVotes.postId, id), eq(eventVotes.userId, userId))
      );

      if (existingVote) {
        if (existingVote.voteType === 1) {
          // Already upvoted, remove it (toggle off)
          await tx.delete(eventVotes).where(eq(eventVotes.id, existingVote.id));
          // FIX: Use COALESCE to handle NULL eventUpvotes (initialize to 0 if NULL)
          await tx.update(posts).set({ eventUpvotes: sql`COALESCE(${posts.eventUpvotes}, 0) - 1` }).where(eq(posts.id, id));
        } else {
          // Switch from downvote to upvote
          await tx.update(eventVotes).set({ voteType: 1 }).where(eq(eventVotes.id, existingVote.id));
          await tx.update(posts).set({ eventUpvotes: sql`COALESCE(${posts.eventUpvotes}, 0) + 2` }).where(eq(posts.id, id));
        }
      } else {
        // New upvote
        await tx.insert(eventVotes).values({ postId: id, userId, voteType: 1 });
        await tx.update(posts).set({ eventUpvotes: sql`COALESCE(${posts.eventUpvotes}, 0) + 1` }).where(eq(posts.id, id));
      }
      this.postCache.delete(id);
    });
  }

  async downvoteEvent(id: string, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Check if user already voted
      const [existingVote] = await tx.select().from(eventVotes).where(
        and(eq(eventVotes.postId, id), eq(eventVotes.userId, userId))
      );

      if (existingVote) {
        if (existingVote.voteType === -1) {
          // Already downvoted, remove it (toggle off)
          await tx.delete(eventVotes).where(eq(eventVotes.id, existingVote.id));
          // FIX: Use COALESCE to handle NULL eventUpvotes (initialize to 0 if NULL)
          await tx.update(posts).set({ eventUpvotes: sql`COALESCE(${posts.eventUpvotes}, 0) + 1` }).where(eq(posts.id, id));
        } else {
          // Switch from upvote to downvote
          await tx.update(eventVotes).set({ voteType: -1 }).where(eq(eventVotes.id, existingVote.id));
          await tx.update(posts).set({ eventUpvotes: sql`COALESCE(${posts.eventUpvotes}, 0) - 2` }).where(eq(posts.id, id));
        }
      } else {
        // New downvote
        await tx.insert(eventVotes).values({ postId: id, userId, voteType: -1 });
        await tx.update(posts).set({ eventUpvotes: sql`COALESCE(${posts.eventUpvotes}, 0) - 1` }).where(eq(posts.id, id));
      }
      this.postCache.delete(id);
    });
  }

  async isUserInChat(chatId: string, userId: string): Promise<boolean> {
    const [request] = await db.select().from(connectionRequests).where(eq(connectionRequests.id, chatId));
    if (!request) return false;
    return request.fromUserId === userId || request.toUserId === userId;
  }

  // Connection Requests
  async getConnectionRequests(userId: string, limit: number = 50): Promise<ConnectionRequest[]> {
    return await db.select().from(connectionRequests).where(
      or(
        eq(connectionRequests.toUserId, userId),
        eq(connectionRequests.fromUserId, userId)
      )
    ).limit(limit).orderBy(desc(connectionRequests.createdAt));
  }

  async getConnectionRequest(id: string): Promise<ConnectionRequest | undefined> {
    const [request] = await db.select().from(connectionRequests).where(eq(connectionRequests.id, id));
    return request;
  }

  async getExistingRequest(fromUserId: string, toUserId: string, postId: string): Promise<ConnectionRequest | undefined> {
    const [request] = await db.select().from(connectionRequests)
      .where(
        and(
          eq(connectionRequests.fromUserId, fromUserId),
          eq(connectionRequests.toUserId, toUserId),
          eq(connectionRequests.postId, postId)
        )
      );
    return request;
  }

  async createConnectionRequest(request: InsertConnectionRequest): Promise<ConnectionRequest> {
    const [newReq] = await db.insert(connectionRequests).values(request).returning();
    return newReq;
  }

  async updateConnectionRequestStatus(id: string, status: string): Promise<void> {
    await db.update(connectionRequests).set({ status }).where(eq(connectionRequests.id, id));
  }

  async deleteConnectionRequest(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete all messages in this chat first
      await tx.delete(messages).where(eq(messages.chatId, id));
      await tx.delete(connectionRequests).where(eq(connectionRequests.id, id));
    });
  }

  // Event Registrations
  async getEventRegistrations(postId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.postId, postId));
  }

  async getEventRegistration(id: string): Promise<EventRegistration | undefined> {
    const result = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, id)).limit(1);
    return result[0];
  }

  async getExistingRegistration(postId: string, userId: string): Promise<EventRegistration | undefined> {
    const result = await db.select().from(eventRegistrations)
      .where(and(eq(eventRegistrations.postId, postId), eq(eventRegistrations.userId, userId)))
      .limit(1);
    return result[0];
  }

  async getUserEventRegistrations(userId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations)
      .where(eq(eventRegistrations.userId, userId))
      .orderBy(desc(eventRegistrations.createdAt));
  }

  async createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration> {
    const [created] = await db.insert(eventRegistrations).values(registration).returning();
    return created;
  }

  async updateEventRegistrationStatus(id: string, status: string, rejectionReason?: string): Promise<EventRegistration> {
    const updateData: any = { status, updatedAt: new Date() };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    const [updated] = await db.update(eventRegistrations)
      .set(updateData)
      .where(eq(eventRegistrations.id, id))
      .returning();
    return updated;
  }

  async deleteEventRegistration(id: string): Promise<void> {
    await db.delete(eventRegistrations).where(eq(eventRegistrations.id, id));
  }

  async getPendingRegistrationsForEvent(postId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations)
      .where(and(eq(eventRegistrations.postId, postId), eq(eventRegistrations.status, "pending")))
      .orderBy(desc(eventRegistrations.createdAt));
  }

  // Chats & Messages
  async getChats(userId: string): Promise<ChatWithDetails[]> {
    try {
      const reqs = await this.getConnectionRequests(userId);
      if (reqs.length === 0) return [];

      const chatIds = reqs.map(r => r.id);
      
      // 2. Optimization: Batch fetch last messages using DISTINCT ON (Postgres specific)
      // We fetch the most recent message for each chat directly in one query.
      const lastMessagesResult = await db.execute(sql`
        SELECT DISTINCT ON (${messages.chatId}) *
        FROM ${messages}
        WHERE ${inArray(messages.chatId, chatIds)}
        ORDER BY ${messages.chatId}, ${messages.timestamp} DESC
      `);
      
      const lastMessagesMap = new Map();
      lastMessagesResult.rows.forEach((msg: any) => {
        lastMessagesMap.set(msg.chat_id, msg);
      });

      // 3. BUG #51 FIX: Fetch ALL partner users so we can resolve both missing names AND
      // avatars. Previously only users with partnerName === "User" were fetched, which
      // left partnerAvatar hardcoded to null for everyone.
      const allPartnerIds = new Set<string>();
      reqs.forEach(req => {
        const isIncoming = req.toUserId === userId;
        const partnerId = isIncoming ? req.fromUserId : req.toUserId;
        allPartnerIds.add(partnerId);
      });

      const userMap = new Map<string, User>();
      if (allPartnerIds.size > 0) {
        const usersFound = await db.select().from(users).where(inArray(users.id, Array.from(allPartnerIds)));
        usersFound.forEach(u => userMap.set(u.id, u));
      }

      // 4. Map to Chat format
      const chats = reqs.map((req) => {
        const isIncoming = req.toUserId === userId;
        const partnerId = isIncoming ? req.fromUserId : req.toUserId;
        const partnerUser = userMap.get(partnerId);

        // Resolve name: prefer denormalized field, fall back to live DB lookup
        const partnerName = isIncoming
          ? (req.fromUserName || partnerUser?.name || "Unknown User")
          : (req.toUserName || partnerUser?.name || "Unknown User");

        // BUG #51 FIX: Use live avatar from userMap (previously hardcoded to null)
        const partnerAvatar = partnerUser?.avatar || null;

        const lastMsg = lastMessagesMap.get(req.id);

        return {
          id: req.id,
          partnerName,
          partnerId,
          partnerAvatar,
          lastMessage: lastMsg ? lastMsg.text : null,
          timestamp: lastMsg ? new Date(lastMsg.timestamp) : req.createdAt,
          unreadCount: 0
        };
      });

      return chats.sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return bTime - aTime;
      });
    } catch (error) {
      logger.error("Error in getChats", error);
      throw error;
    }
  }
  async getMessages(chatId: string, userId?: string, beforeTimestamp?: Date): Promise<Message[]> {
    let cutoffDate = new Date(0); // Default to beginning of time

    if (userId) {
      // Check if user has cleared chat history
      const request = await this.getConnectionRequest(chatId);
      if (request) {
        if (request.fromUserId === userId && request.fromUserLastCleared) {
          cutoffDate = request.fromUserLastCleared;
        } else if (request.toUserId === userId && request.toUserLastCleared) {
          cutoffDate = request.toUserLastCleared;
        }
      }
    }

    const conditions = [
      eq(messages.chatId, chatId),
      gt(messages.timestamp, cutoffDate)
    ];

    if (beforeTimestamp) {
      conditions.push(lt(messages.timestamp, beforeTimestamp));
    }

    return await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.timestamp)) // Get newest first
      .limit(50) // Reduce limit to 50 for faster paging
      .then(msgs => msgs.reverse()); // Reverse back to chronological order for UI
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
        
        // BUG FIX: Update the connection request's timestamp so it floats to the top of the inbox
        await db.update(connectionRequests)
            .set({ updatedAt: new Date() })
            .where(eq(connectionRequests.id, insertMessage.chatId));

        // Also update the connection request to show activity (optional, but good for sorting)
        // Check if there is a 'cleared' status that needs resetting? 
        // No, new messages should just appear. One-sided clear only hides OLD messages.
        // If a user cleared chat, and a NEW message comes, they should see it.
        // Since we filter by > lastCleared, this works automatically.

        return message;
    }

    async clearChatHistory(chatId: string, userId: string): Promise<void> {
        const request = await this.getConnectionRequest(chatId);
        if (!request) throw new Error("Chat not found");

        const now = new Date();

        if (request.fromUserId === userId) {
            await db.update(connectionRequests)
                .set({ fromUserLastCleared: now })
                .where(eq(connectionRequests.id, chatId));
        } else if (request.toUserId === userId) {
            await db.update(connectionRequests)
                .set({ toUserLastCleared: now })
                .where(eq(connectionRequests.id, chatId));
        } else {
            throw new Error("User is not part of this chat");
        }
    }

  // Notifications
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationsRead(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          inArray(notifications.id, ids)
        )
      );
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async deleteNotifications(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          inArray(notifications.id, ids)
        )
      );
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(notifications).where(eq(notifications.userId, userId));
    });
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result?.count || 0);
  }

  // Analytics
  async logEvent(event: InsertAnalytics): Promise<void> {
    await db.insert(analytics).values(event);
  }

  // Admin
  async promoteUser(id: string, isAdmin: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isAdmin })
      .where(eq(users.id, id))
      .returning();
    this.userCache.delete(id);
    this.adminStatsCache.delete("stats");
    return user;
  }

  async promoteOrganiser(id: string, isOrganiser: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isOrganiser })
      .where(eq(users.id, id))
      .returning();
    this.userCache.delete(id);
    this.adminStatsCache.delete("stats");
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. Nullify system_settings.updatedBy to avoid FK constraint (no onDelete set)
      await tx.update(systemSettings)
        .set({ updatedBy: null })
        .where(eq(systemSettings.updatedBy, id));

      // 2. Nullify analytics userId to dissociate user history
      await tx.update(analytics)
        .set({ userId: null })
        .where(eq(analytics.userId, id));

      // 3. Cascade delete everything related to user
      await tx.delete(posts).where(eq(posts.userId, id));
      
      // Get all connection requests involving this user to delete their messages
      const userRequests = await tx.select().from(connectionRequests).where(or(
        eq(connectionRequests.fromUserId, id),
        eq(connectionRequests.toUserId, id)
      ));
      
      // Delete all messages in chats where user was involved
      if (userRequests.length > 0) {
        const chatIds = userRequests.map(r => r.id);
        await tx.delete(messages).where(inArray(messages.chatId, chatIds));
      }
      
      // Delete connection requests
      await tx.delete(connectionRequests).where(or(
        eq(connectionRequests.fromUserId, id),
        eq(connectionRequests.toUserId, id)
      ));
      
      // Delete notifications received by this user
      await tx.delete(notifications).where(eq(notifications.userId, id));

      // Delete notifications SENT by this user (where metadata->senderId = id)
      await tx.delete(notifications).where(
        sql`metadata->>'senderId' = ${id}`
      );
      
      await tx.delete(users).where(eq(users.id, id));
    });
    this.userCache.delete(id);
    this.adminStatsCache.delete("stats");
  }

  async banUser(id: string, reason: string): Promise<User> {
    const now = new Date();
    const [user] = await db
      .update(users)
      .set({ 
        isBanned: true, 
        banReason: reason,
        bannedAt: now
      })
      .where(eq(users.id, id))
      .returning();
    this.userCache.delete(id);
    this.adminStatsCache.delete("stats");
    return user;
  }

  async unbanUser(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        isBanned: false, 
        banReason: null,
        bannedAt: null
      })
      .where(eq(users.id, id))
      .returning();
    this.userCache.delete(id);
    this.adminStatsCache.delete("stats");
    return user;
  }

  async adminDeletePost(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Audit Fix: Prevent orphaned messages
      // 1. Find all connection requests (chats) related to this post
      const requests = await tx.select().from(connectionRequests).where(eq(connectionRequests.postId, id));
      
      // 2. Delete all messages for these chats
      if (requests.length > 0) {
        const chatIds = requests.map(r => r.id);
        await tx.delete(messages).where(inArray(messages.chatId, chatIds));
      }

      // 3. Delete the requests
      await tx.delete(connectionRequests).where(eq(connectionRequests.postId, id));
      
      // 4. Delete the post
      await tx.delete(posts).where(eq(posts.id, id));
    });

    this.postCache.delete(id);
    this.adminStatsCache.delete("stats");
  }

  async getAdminStats(): Promise<any> {
    // Live stats (User requested "live stuff when refreshed")
    // Admins can tolerate slower load times for accuracy.
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const postCount = await db.select({ count: sql<number>`count(*)` }).from(posts);
    const eventCount = await db.select({ count: sql<number>`count(*)` }).from(posts).where(isNotNull(posts.eventName));
    const reportCount = await db.select({ count: sql<number>`count(*)` }).from(reports);
    const pendingReportCount = await db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "pending"));

    const postRows = await db
      .select({
        createdAt: posts.createdAt,
        userSkill: posts.userSkill,
        requiredSkills: posts.requiredSkills,
        skillsWanted: posts.skillsWanted,
        skillsOffered: posts.skillsOffered,
      })
      .from(posts);

    const postsByDate: Record<string, number> = {};
    const skills: Record<string, number> = {};
    const canonicalSkillLabel = new Map<string, string>();

    const addSkill = (raw: unknown) => {
      if (typeof raw !== "string") return;
      const trimmed = raw.trim();
      if (!trimmed) return;
      const normalized = trimmed.toLowerCase();
      const label = canonicalSkillLabel.get(normalized) || trimmed;
      canonicalSkillLabel.set(normalized, label);
      skills[label] = (skills[label] || 0) + 1;
    };

    for (const row of postRows) {
      if (row.createdAt) {
        const dateKey = row.createdAt.toISOString().slice(0, 10);
        postsByDate[dateKey] = (postsByDate[dateKey] || 0) + 1;
      }

      addSkill(row.userSkill);

      if (Array.isArray(row.requiredSkills)) {
        for (const skill of row.requiredSkills) addSkill(skill);
      }

      if (Array.isArray(row.skillsWanted)) {
        for (const skill of row.skillsWanted) {
          if (typeof skill === "string") {
            addSkill(skill);
            continue;
          }
          if (skill && typeof skill === "object" && "name" in skill) {
            addSkill((skill as { name?: unknown }).name);
          }
        }
      }

      if (Array.isArray(row.skillsOffered)) {
        for (const skill of row.skillsOffered) {
          if (typeof skill === "string") {
            addSkill(skill);
            continue;
          }
          if (skill && typeof skill === "object" && "name" in skill) {
            addSkill((skill as { name?: unknown }).name);
          }
        }
      }
    }
    
    const stats = {
      totalUsers: Number(userCount[0].count),
      totalPosts: Number(postCount[0].count),
      totalEvents: Number(eventCount[0].count),
      totalReports: Number(reportCount[0].count),
      pendingReports: Number(pendingReportCount[0].count),
      postsByDate,
      skills,
    };

    return stats;
  }

  async getAnalytics(startDate?: Date, endDate?: Date, limit: number = 100, offset: number = 0): Promise<Analytics[]> {
    let query = db.select().from(analytics).orderBy(desc(analytics.timestamp));
    
    const conditions: SQL<unknown>[] = [];
    if (startDate) conditions.push(sql`${analytics.timestamp} >= ${startDate}`);
    if (endDate) conditions.push(sql`${analytics.timestamp} <= ${endDate}`);

    if (conditions.length === 1) {
      return await query.where(conditions[0]).limit(limit).offset(offset);
    }

    if (conditions.length > 1) {
      const whereClause = conditions.slice(1).reduce((acc, condition) => and(acc, condition)!, conditions[0]);
      return await query.where(whereClause).limit(limit).offset(offset);
    }
    
    return await query.limit(limit).offset(offset);
  }

  // Auditing
  async logAudit(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(limit: number = 100, startDate?: Date, endDate?: Date): Promise<AuditLog[]> {
    const query = db.select().from(auditLogs);
    const conditions: SQL<unknown>[] = [];
    if (startDate) conditions.push(gt(auditLogs.timestamp, startDate));
    if (endDate) conditions.push(lt(auditLogs.timestamp, endDate));
    if (conditions.length === 1) {
      return await query.where(conditions[0]).limit(limit).orderBy(desc(auditLogs.timestamp));
    }
    if (conditions.length > 1) {
      const whereClause = conditions.slice(1).reduce((acc, condition) => and(acc, condition)!, conditions[0]);
      return await query.where(whereClause).limit(limit).orderBy(desc(auditLogs.timestamp));
    }
    return await query.limit(limit).orderBy(desc(auditLogs.timestamp));
  }

  async clearAuditLogs(): Promise<void> {
    await db.delete(auditLogs);
  }

  // Reports
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReports(status?: string, type?: string, search?: string): Promise<Report[]> {
    let query = db.select().from(reports);
    const conditions: SQL<unknown>[] = [];

    if (status) conditions.push(eq(reports.status, status));
    if (type) conditions.push(eq(reports.type, type));
    if (search) {
      // Safely escape search term for LIKE queries
      const escapedSearch = search.replace(/[%_]/g, '\\$&'); // Escape LIKE wildcards
      const searchPattern = `%${escapedSearch}%`;
      const searchCondition = or(
        sql`LOWER(${reports.subject}) LIKE LOWER(${searchPattern}) ESCAPE '\\'`,
        sql`LOWER(${reports.description}) LIKE LOWER(${searchPattern}) ESCAPE '\\'`
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (conditions.length === 1) {
      return await query.where(conditions[0]).orderBy(desc(reports.createdAt));
    }
    if (conditions.length > 1) {
      const whereClause = conditions.slice(1).reduce((acc, condition) => and(acc, condition)!, conditions[0]);
      return await query.where(whereClause).orderBy(desc(reports.createdAt));
    }
    return await query.orderBy(desc(reports.createdAt));
  }

  async updateReportStatus(id: string, status: string, resolvedBy?: string, adminNotes?: string): Promise<Report> {
    const [updatedReport] = await db
      .update(reports)
      .set({ 
        status, 
        adminNotes: adminNotes || null,
        resolvedAt: status === 'resolved' ? new Date() : null,
        resolvedBy: status === 'resolved' ? resolvedBy : null
      })
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteReport(id: string): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  async deleteReports(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(reports).where(inArray(reports.id, ids));
  }

  async deleteAllReports(): Promise<void> {
    await db.delete(reports);
  }
  // Feedback
  async createFeedback(data: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedback).values(data).returning();
    return newFeedback;
  }

  async getFeedback(limit: number = 100): Promise<(Feedback & { userName: string | null })[]> {
    return await db
      .select({
        id: feedback.id,
        userId: feedback.userId,
        rating: feedback.rating,
        comment: feedback.comment,
        timestamp: feedback.timestamp,
        userName: users.name
      })
      .from(feedback)
      .leftJoin(users, eq(feedback.userId, users.id))
      .orderBy(desc(feedback.timestamp))
      .limit(limit);
  }

  // System Settings
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const cached = this.settingCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    // Request Coalescing: Prevent cache stampede
    const pending = this.pendingSettings.get(key);
    if (pending) {
      // FIX BUG #5: Await pending promise before returning to avoid returning unresolved promise
      return await pending;
    }

    const fetchPromise = (async () => {
      try {
        const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
        // Cache for 60 seconds
        this.settingCache.set(key, { value: setting, expires: Date.now() + 60000 });
        return setting;
      } finally {
        this.pendingSettings.delete(key);
      }
    })();

    this.pendingSettings.set(key, fetchPromise);
    return await fetchPromise;
  }

  async setSystemSetting(key: string, value: any, userId: string): Promise<SystemSetting> {
    const [setting] = await db
      .insert(systemSettings)
      .values({ key, value, updatedBy: userId })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedBy: userId, updatedAt: new Date() }
      })
      .returning();
      
    // Update cache immediately
    this.settingCache.set(key, { value: setting, expires: Date.now() + 60000 });
    
    return setting;
  }

  // Behavioral Tracking & Recommendations

  async trackPostInteraction(
    userId: string,
    postId: string,
    interactionType: string,
    durationSeconds?: number,
    metadata?: any
  ): Promise<void> {
    try {
      await db.insert(postInteractions).values({
        userId,
        postId,
        interactionType,
        durationSeconds: durationSeconds || 0,
        metadata: metadata || null,
      });

      // High-intent interactions should influence recommendations quickly.
      if (
        interactionType === "connection_request" ||
        interactionType === "click" ||
        interactionType === "interested" ||
        interactionType === "not_interested"
      ) {
        const { updateUserPreferencesFromInteractions } = await import("./lib/recommendations");
        updateUserPreferencesFromInteractions(userId).catch((error) => {
          logger.error("Failed immediate preference refresh", { error, userId, interactionType });
        });
      }

      // Update user preferences asynchronously (don't await)
      this.updateUserPreferencesDebounced(userId);
    } catch (error) {
      logger.error("Failed to track post interaction", { error, userId, postId, interactionType });
      // Don't throw - tracking failures shouldn't break user experience
    }
  }

  async trackUserSearch(
    userId: string,
    query: string,
    filters: any,
    resultsCount: number,
    clickedPostIds: string[]
  ): Promise<void> {
    try {
      const normalizedQuery = (query || "").trim().toLowerCase();
      const normalizedFilters = filters && typeof filters === "object" ? filters : {};
      const uniqueClickedPostIds = Array.from(new Set((clickedPostIds || []).filter(Boolean)));

      // Ignore completely empty/no-op searches to keep learning signal clean.
      const hasFilter = Object.values(normalizedFilters).some((value) =>
        typeof value === "string" ? value.trim().length > 0 : Boolean(value)
      );
      if (!normalizedQuery && !hasFilter && uniqueClickedPostIds.length === 0) {
        return;
      }

      await db.insert(userSearches).values({
        userId,
        query: normalizedQuery,
        filters: normalizedFilters,
        resultsCount,
        clickedPostIds: uniqueClickedPostIds,
      });
    } catch (error) {
      logger.error("Failed to track user search", { error, userId, query });
      // Don't throw - tracking failures shouldn't break user experience
    }
  }

  async getRecommendedPostIds(userId: string, limit: number = 20): Promise<string[]> {
    try {
      const { getRecommendedPosts } = await import("./lib/recommendations");
      
      // Get posts user has already interacted with to exclude
      const recentInteractions = await db
        .select({ postId: postInteractions.postId })
        .from(postInteractions)
        .where(eq(postInteractions.userId, userId))
        .orderBy(desc(postInteractions.createdAt))
        .limit(100);

      const excludeIds = recentInteractions.map((i) => i.postId);

      // Get recommended post scores
      const recommendations = await getRecommendedPosts(userId, excludeIds, limit);

      return recommendations.map((r) => r.postId.toString());
    } catch (error) {
      logger.error("Failed to get recommendations", { error, userId });
      return [];
    }
  }

  async getSearchSuggestions(userId: string, limit: number = 5): Promise<string[]> {
    try {
      const { getSearchSuggestions: getSuggestions } = await import("./lib/recommendations");
      return await getSuggestions(userId, limit);
    } catch (error) {
      logger.error("Failed to get search suggestions", { error, userId });
      return [];
    }
  }

  async getPersonalizationMetrics(days: number = 30): Promise<{ ctr: number; connectionRate: number; trackedSearches: number; trackedInteractions: number }> {
    const safeDays = Number.isFinite(days) ? Math.min(Math.max(days, 1), 365) : 30;

    const [interactionAgg] = await db
      .select({
        views: sql<number>`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'view')`,
        clicks: sql<number>`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'click')`,
        connections: sql<number>`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'connection_request')`,
        total: sql<number>`COUNT(*)`,
      })
      .from(postInteractions)
      .where(sql`${postInteractions.createdAt} > NOW() - (${safeDays} * INTERVAL '1 day')`);

    const [searchAgg] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(userSearches)
      .where(sql`${userSearches.createdAt} > NOW() - (${safeDays} * INTERVAL '1 day')`);

    const views = Number(interactionAgg?.views || 0);
    const clicks = Number(interactionAgg?.clicks || 0);
    const connections = Number(interactionAgg?.connections || 0);

    const ctr = views > 0 ? clicks / views : 0;
    const connectionRate = clicks > 0 ? connections / clicks : 0;

    return {
      ctr,
      connectionRate,
      trackedSearches: Number(searchAgg?.total || 0),
      trackedInteractions: Number(interactionAgg?.total || 0),
    };
  }

  // Debounce user preference updates (update at most once per 60 seconds per user)
  private preferenceUpdateTimers = new Map<string, NodeJS.Timeout>();

  private updateUserPreferencesDebounced(userId: string): void {
    // Clear existing timer
    const existingTimer = this.preferenceUpdateTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        const { updateUserPreferencesFromInteractions } = await import("./lib/recommendations");
        await updateUserPreferencesFromInteractions(userId);
        this.preferenceUpdateTimers.delete(userId);
      } catch (error) {
        logger.error("Failed to update user preferences", { error, userId });
      }
    }, 60000); // 60 seconds debounce

    this.preferenceUpdateTimers.set(userId, timer);
  }


}

export const storage: IStorage = new DatabaseStorage();
