var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc4) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc4 = __getOwnPropDesc(from, key)) || desc4.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/logger.ts
var logger;
var init_logger = __esm({
  "lib/logger.ts"() {
    "use strict";
    logger = {
      log: (message, ...args) => {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        console.log(`[${timestamp}] INFO: ${message}`, ...args);
      },
      warn: (message, ...args) => {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        console.warn(`[${timestamp}] WARN: ${message}`, ...args);
      },
      error: (message, error, ...args) => {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const errorData = error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error;
        console.error(`[${timestamp}] ERROR: ${message}`, errorData, ...args);
      }
    };
  }
});

// shared/constants.ts
var constants_exports = {};
__export(constants_exports, {
  COLLEGES: () => COLLEGES,
  DEPARTMENTS: () => DEPARTMENTS,
  SKILLS: () => SKILLS,
  SYSTEM_CONSTANTS: () => SYSTEM_CONSTANTS
});
var SYSTEM_CONSTANTS, COLLEGES, DEPARTMENTS, SKILLS;
var init_constants = __esm({
  "shared/constants.ts"() {
    "use strict";
    SYSTEM_CONSTANTS = {
      VERSION: "1.0.0"
    };
    COLLEGES = [
      "RIT",
      "CET",
      "BARTON",
      "MITS"
    ];
    DEPARTMENTS = ["CSE", "ECE", "MECH", "CIVIL", "IT", "EEE", "OTHER"];
    SKILLS = ["JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "UI/UX", "Figma", "DevOps", "Docker", "AWS", "Machine Learning", "Data Science", "Other"];
  }
});

// shared/schema.sqlite.ts
var schema_sqlite_exports = {};
__export(schema_sqlite_exports, {
  analytics: () => analytics,
  auditLogs: () => auditLogs,
  connectionRequests: () => connectionRequests,
  eventRegistrations: () => eventRegistrations,
  eventVotes: () => eventVotes,
  feedback: () => feedback,
  insertAnalyticsSchema: () => insertAnalyticsSchema,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertConnectionRequestSchema: () => insertConnectionRequestSchema,
  insertEventRegistrationSchema: () => insertEventRegistrationSchema,
  insertFeedbackSchema: () => insertFeedbackSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertPostSchema: () => insertPostSchema,
  insertReportSchema: () => insertReportSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  notifications: () => notifications,
  postInteractions: () => postInteractions,
  posts: () => posts,
  reports: () => reports,
  selectUserSchema: () => selectUserSchema,
  session: () => session,
  systemSettings: () => systemSettings,
  userPreferences: () => userPreferences,
  userSearches: () => userSearches,
  users: () => users
});
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";
var users, posts, connectionRequests, eventRegistrations, messages, notifications, session, getURLSchema, insertUserSchema, selectUserSchema, insertPostSchema, insertConnectionRequestSchema, insertEventRegistrationSchema, insertMessageSchema, systemSettings, analytics, eventVotes, postInteractions, userSearches, userPreferences, auditLogs, feedback, insertAnalyticsSchema, insertAuditLogSchema, insertFeedbackSchema, reports, insertReportSchema;
var init_schema_sqlite = __esm({
  "shared/schema.sqlite.ts"() {
    "use strict";
    init_constants();
    users = sqliteTable("users", {
      id: text("id").primaryKey().$defaultFn(() => nanoid()),
      name: text("name").notNull(),
      username: text("username").notNull().unique(),
      email: text("email").notNull().unique(),
      bio: text("bio").notNull(),
      portfolio: text("portfolio").notNull(),
      github: text("github").notNull(),
      twitter: text("twitter"),
      linkedin: text("linkedin"),
      university: text("university"),
      city: text("city"),
      department: text("department").notNull().default("OTHER"),
      skills: text("skills", { mode: "json" }).$type().notNull().default([]),
      interests: text("interests", { mode: "json" }).$type().notNull().default([]),
      privacy: text("privacy", { mode: "json" }).$type().notNull().default({ showEmail: false, showPortfolio: false, showUniversity: false, showCity: false }),
      password: text("password"),
      // Nullable for OAuth-only users
      avatar: text("avatar"),
      // Base64 or URL
      googleId: text("google_id").unique(),
      authProvider: text("auth_provider").default("local").notNull(),
      skillLevel: text("skill_level"),
      // Beginner, Intermediate, Expert
      isAdmin: integer("is_admin", { mode: "boolean" }).default(false).notNull(),
      isOrganiser: integer("is_organiser", { mode: "boolean" }).default(false).notNull(),
      isVerified: integer("is_verified", { mode: "boolean" }).default(false).notNull(),
      emailVerifiedAt: integer("email_verified_at", { mode: "timestamp" }),
      isBanned: integer("is_banned", { mode: "boolean" }).default(false).notNull(),
      banReason: text("ban_reason"),
      // Reason for ban, displayed on banned page
      bannedAt: integer("banned_at", { mode: "timestamp" }),
      // When user was banned
      tourCompleted: integer("tour_completed", { mode: "boolean" }).default(false).notNull(),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
      lastActive: integer("last_active", { mode: "timestamp" })
      // Last time user made an authenticated request
    });
    posts = sqliteTable("posts", {
      id: text("id").primaryKey().$defaultFn(() => nanoid()),
      title: text("title").notNull(),
      skillsOffered: text("skills_offered", { mode: "json" }).$type().notNull(),
      skillsWanted: text("skills_wanted", { mode: "json" }).$type().notNull(),
      description: text("description").notNull(),
      availability: text("availability").notNull(),
      city: text("city").notNull(),
      university: text("university"),
      eventName: text("event_name"),
      eventType: text("event_type"),
      // 'intra-college' | 'outside-college' - null for teammate posts
      hostCollege: text("host_college"),
      // For intra-college events: which college is hosting
      eventWebsite: text("event_website"),
      eventImage: text("event_image"),
      eventDetails: text("event_details"),
      eventDate: integer("event_date", { mode: "timestamp" }),
      // When the event happens - events auto-delete after this date
      eventUpvotes: integer("event_upvotes").default(0),
      // Cross-department event participation fields (only for intra-college events)
      isEventOrganiser: integer("is_event_organiser", { mode: "boolean" }).notNull().default(false),
      // For intra-college: is user the event organiser/host?
      allowedDepartments: text("allowed_departments", { mode: "json" }).$type(),
      // null = all departments, array = specific departments (1-6)
      requiredSkills: text("required_skills", { mode: "json" }).$type().default([]),
      requiredInterests: text("required_interests", { mode: "json" }).$type().default([]),
      specialRequirements: text("special_requirements"),
      // Optional organiser-entered requirements (max 250 chars)
      maxCrossDeptParticipants: integer("max_cross_dept_participants"),
      crossDeptRequiresApproval: integer("cross_dept_requires_approval", { mode: "boolean" }).notNull().default(true),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      userName: text("user_name").notNull(),
      userSkill: text("user_skill").notNull(),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
    }, (table) => {
      return {
        userIdIdx: index("posts_user_id_idx").on(table.userId),
        createdAtIdx: index("posts_created_at_idx").on(table.createdAt),
        eventDateIdx: index("posts_event_date_idx").on(table.eventDate),
        // Optimization for rate limiting queries (where userId = ? AND createdAt > ?)
        rateLimitIdx: index("posts_rate_limit_idx").on(table.userId, table.createdAt)
        // GIN Indexes for fast JSONB search (Skills)
      };
    });
    connectionRequests = sqliteTable("connection_requests", {
      id: text("id").primaryKey().$defaultFn(() => nanoid()),
      postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
      postTitle: text("post_title").notNull(),
      fromUserId: text("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      fromUserName: text("from_user_name").notNull(),
      fromUserSkill: text("from_user_skill").notNull(),
      toUserId: text("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      toUserName: text("to_user_name"),
      // Added for data consistency
      status: text("status").notNull(),
      // pending, accepted, rejected
      message: text("message"),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
      updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
      fromUserLastCleared: integer("from_user_last_cleared", { mode: "timestamp" }),
      toUserLastCleared: integer("to_user_last_cleared", { mode: "timestamp" })
    }, (table) => {
      return {
        fromUserIdx: index("requests_from_user_idx").on(table.fromUserId),
        toUserIdx: index("requests_to_user_idx").on(table.toUserId),
        postIdx: index("requests_post_idx").on(table.postId),
        // Prevent duplicate requests: A user can only send one request per post to a specific user
        uniqueRequestIdx: uniqueIndex("requests_unique_idx").on(table.fromUserId, table.toUserId, table.postId)
      };
    });
    eventRegistrations = sqliteTable("event_registrations", {
      id: text("id").primaryKey().$defaultFn(() => nanoid()),
      postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      registrationType: text("registration_type").notNull(),
      // 'department' | 'cross_department'
      matchScore: integer("match_score"),
      // 0-100, null for department registrations
      status: text("status").notNull().default("pending"),
      // 'pending' | 'approved' | 'rejected' | 'confirmed'
      rejectionReason: text("rejection_reason"),
      // Reason if status is rejected
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
      updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
    }, (table) => {
      return {
        postIdIdx: index("event_registrations_post_id_idx").on(table.postId),
        userIdIdx: index("event_registrations_user_id_idx").on(table.userId),
        statusIdx: index("event_registrations_status_idx").on(table.status),
        registrationTypeIdx: index("event_registrations_type_idx").on(table.registrationType),
        // Prevent duplicate registrations
        uniqueRegistrationIdx: uniqueIndex("event_registrations_unique_idx").on(table.postId, table.userId),
        // Composite for organizer dashboard queries
        postIdStatusIdx: index("event_registrations_post_id_status_idx").on(table.postId, table.status),
        userIdStatusIdx: index("event_registrations_user_id_status_idx").on(table.userId, table.status)
      };
    });
    messages = sqliteTable("messages", {
      id: text("id").primaryKey().$defaultFn(() => nanoid()),
      chatId: text("chat_id").notNull().references(() => connectionRequests.id, { onDelete: "cascade" }),
      senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      text: text("text").notNull(),
      timestamp: integer("timestamp", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
    }, (table) => {
      return {
        chatIdx: index("messages_chat_idx").on(table.chatId),
        timestampIdx: index("messages_timestamp_idx").on(table.timestamp),
        // Optimization: Composite index for faster pagination
        messagesChatTimestampIdx: index("messages_chat_timestamp_idx").on(table.chatId, table.timestamp)
      };
    });
    notifications = sqliteTable("notifications", {
      id: text("id").primaryKey().$defaultFn(() => nanoid()),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      type: text("type").notNull(),
      // 'connection_request', 'message', 'alert', 'system'
      title: text("title").notNull(),
      message: text("message").notNull(),
      link: text("link"),
      // URL to redirect to
      isRead: integer("is_read", { mode: "boolean" }).default(false).notNull(),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
      metadata: text("metadata", { mode: "json" })
      // Extra data
    }, (table) => {
      return {
        userIdIdx: index("notifications_user_id_idx").on(table.userId),
        createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
        // Optimization: Composite index for faster retrieval
        notificationsUserCreatedIdx: index("notifications_user_created_idx").on(table.userId, table.createdAt)
        // GIN index for metadata queries (e.g. senderId)
      };
    });
    session = sqliteTable("session", {
      sid: text("sid").primaryKey(),
      sess: text("sess", { mode: "json" }).notNull(),
      expire: integer("expire", { mode: "timestamp" }).notNull()
    });
    getURLSchema = (fieldName, isNullable = false) => {
      const base = z.string().trim().optional();
      const refined = (isNullable ? base.nullable() : base).transform((v) => v || (isNullable ? null : "")).refine((v) => !v || !v.toLowerCase().startsWith("javascript:"), `Invalid ${fieldName} URL`).transform((v) => v && typeof v === "string" && v.startsWith("http://") ? v.replace("http://", "https://") : v).transform((v) => v && typeof v === "string" && !v.startsWith("http") && !v.startsWith("/") ? `https://${v}` : v);
      return refined;
    };
    insertUserSchema = createInsertSchema(users, {
      name: z.string().trim().min(1, "Name is required").max(100).transform((v) => v.replace(/[<>]/g, "")),
      username: z.string().trim().min(1, "Username is required").max(50).transform((v) => v.replace(/[<>]/g, "")),
      email: z.string().trim().email("Invalid email address").transform((v) => v.toLowerCase()),
      bio: z.string().trim().max(250, "Bio cannot exceed 250 characters").optional().or(z.literal("")).transform((v) => v ? v.replace(/[<>]/g, "") : ""),
      portfolio: getURLSchema("portfolio"),
      github: getURLSchema("github"),
      // Nullable fields in DB
      twitter: getURLSchema("Twitter", true),
      linkedin: getURLSchema("LinkedIn", true),
      university: z.string().trim().min(1, "University is required").max(200, "University name cannot exceed 200 characters").refine((val) => val !== "OTHER", "Please select a valid university or enter a custom one").transform((v) => v.replace(/<[^>]*>/g, "").trim()),
      city: z.string().trim().optional().nullable().transform((v) => v ? v.length > 100 ? v.substring(0, 100) : v : v),
      avatar: z.string().trim().optional().nullable(),
      skillLevel: z.enum(["Beginner", "Intermediate", "Expert"]).optional().nullable(),
      // Department and skills fields
      department: z.enum([
        "OTHER",
        "CYBER",
        "CSE",
        "CCE",
        "ECE",
        "CIVIL",
        "EEE",
        "MECHANICAL",
        "MECH AND AUTO",
        "EIE",
        "EICE",
        "IT",
        "AIDS",
        "AIML",
        "IOT",
        "MBA",
        "MECHATRONICS"
      ]).optional().default("OTHER"),
      skills: z.array(z.string().trim()).optional().default([]).transform((skills) => {
        return skills;
      }),
      interests: z.array(z.string().trim()).optional().default([]).transform((interests) => {
        return interests;
      }),
      privacy: z.object({
        showEmail: z.boolean(),
        showPortfolio: z.boolean(),
        showUniversity: z.boolean(),
        showCity: z.boolean()
      }),
      password: z.string().min(8, "Password must be at least 8 characters").optional().nullable(),
      authProvider: z.string().default("local")
    });
    selectUserSchema = createSelectSchema(users);
    insertPostSchema = createInsertSchema(posts, {
      title: z.string().trim().min(5, "Title must be at least 5 characters").max(300).transform((v) => v.replace(/[<>]/g, "")),
      description: z.string().trim().min(20, "Description must be at least 20 characters").max(500).transform((v) => v.replace(/[<>]/g, "")),
      city: z.string().trim().min(1, "City is required").max(100),
      availability: z.string().trim().min(1).max(200),
      skillsOffered: z.array(z.object({ name: z.string().trim().min(1), level: z.string().trim() })),
      skillsWanted: z.array(z.object({ name: z.string().trim().min(1), level: z.string().trim() })),
      // Event fields need to be nullable because the frontend sends null for teammates
      eventName: z.string().trim().nullable().optional(),
      eventType: z.enum(["intra-college", "outside-college"]).nullable().optional(),
      hostCollege: z.enum(COLLEGES).nullable().optional(),
      eventWebsite: getURLSchema("event website", true).nullable(),
      eventImage: getURLSchema("image", true).or(z.literal("")).nullable(),
      eventDetails: z.string().trim().nullable().optional(),
      eventDate: z.union([z.string(), z.date()]).nullable().optional().transform((val) => {
        if (!val) return null;
        if (val instanceof Date) return val;
        return new Date(val);
      }),
      // Cross-department event fields
      requiredSkills: z.array(z.string().trim()).optional().default([]),
      requiredInterests: z.array(z.string().trim()).optional().default([]),
      specialRequirements: z.string().trim().max(250, "Special requirements cannot exceed 250 characters").optional().nullable(),
      maxCrossDeptParticipants: z.number().int().min(1).optional().nullable(),
      crossDeptRequiresApproval: z.boolean().optional().default(true)
    });
    insertConnectionRequestSchema = createInsertSchema(connectionRequests, {
      postTitle: z.string().trim().transform((v) => v.replace(/[<>]/g, "")),
      fromUserName: z.string().trim().transform((v) => v.replace(/[<>]/g, "")),
      fromUserSkill: z.string().trim().transform((v) => v.replace(/[<>]/g, "")),
      message: z.string().trim().optional().transform((v) => v ? v.replace(/[<>]/g, "") : v),
      status: z.enum(["pending", "accepted", "rejected"]).default("pending")
    });
    insertEventRegistrationSchema = createInsertSchema(eventRegistrations, {
      registrationType: z.enum(["department", "cross_department"]),
      matchScore: z.number().int().min(0).max(100).optional().nullable(),
      status: z.enum(["pending", "approved", "rejected", "confirmed"]).default("pending"),
      rejectionReason: z.string().trim().optional().nullable()
    });
    insertMessageSchema = createInsertSchema(messages, {
      text: z.string().trim().min(1, "Message cannot be empty").max(1e3).transform((v) => v.replace(/[<>]/g, ""))
    });
    systemSettings = sqliteTable("system_settings", {
      key: text("key").primaryKey(),
      // e.g., 'maintenance_mode'
      value: text("value", { mode: "json" }).notNull(),
      // e.g., { enabled: true, mode: 'FULL', message: '...' }
      updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
      updatedBy: text("updated_by").references(() => users.id)
    });
    analytics = sqliteTable("analytics", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id"),
      // Optional
      event: text("event").notNull(),
      page: text("page").notNull(),
      metadata: text("metadata", { mode: "json" }).$type(),
      timestamp: integer("timestamp", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
    });
    eventVotes = sqliteTable("event_votes", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      voteType: integer("vote_type").notNull(),
      // 1 for upvote, -1 for downvote
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
    }, (table) => {
      return {
        uniqueVoteIdx: uniqueIndex("unique_vote_idx").on(table.postId, table.userId)
      };
    });
    postInteractions = sqliteTable("post_interactions", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
      interactionType: text("interaction_type").notNull(),
      // 'view', 'click', 'skip', 'connection_request'
      durationSeconds: integer("duration_seconds"),
      metadata: text("metadata", { mode: "json" }).$type(),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
    }, (table) => {
      return {
        userIdIdx: index("post_interactions_user_id_idx").on(table.userId),
        postIdIdx: index("post_interactions_post_id_idx").on(table.postId),
        typeIdx: index("post_interactions_type_idx").on(table.interactionType),
        createdAtIdx: index("post_interactions_created_at_idx").on(table.createdAt)
      };
    });
    userSearches = sqliteTable("user_searches", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      query: text("query").notNull(),
      filters: text("filters", { mode: "json" }).$type(),
      resultsCount: integer("results_count"),
      clickedPostIds: text("clicked_post_ids", { mode: "json" }).$type(),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
    }, (table) => {
      return {
        userIdIdx: index("user_searches_user_id_idx").on(table.userId),
        createdAtIdx: index("user_searches_created_at_idx").on(table.createdAt),
        queryIdx: index("user_searches_query_idx").on(table.query)
      };
    });
    userPreferences = sqliteTable("user_preferences", {
      userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
      preferredSkills: text("preferred_skills", { mode: "json" }).$type().default([]),
      preferredCities: text("preferred_cities", { mode: "json" }).$type().default([]),
      preferredEventTypes: text("preferred_event_types", { mode: "json" }).$type().default([]),
      interactionScore: text("interaction_score", { mode: "json" }).$type().default({}),
      updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
    });
    auditLogs = sqliteTable("audit_logs", {
      id: text("id").primaryKey().$defaultFn(() => nanoid()),
      userId: text("user_id"),
      // Can be null for system actions
      userName: text("user_name"),
      action: text("action").notNull(),
      // 'LOGIN', 'DELETE_POST', 'UPDATE_SETTINGS', etc.
      resource: text("resource").notNull(),
      // 'USER', 'POST', 'SYSTEM'
      details: text("details", { mode: "json" }),
      // Detailed payload
      timestamp: integer("timestamp", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
    }, (table) => {
      return {
        timestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
        userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
        actionIdx: index("audit_logs_action_idx").on(table.action)
        // GIN index for searching within details
      };
    });
    feedback = sqliteTable("feedback", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
      rating: integer("rating").notNull(),
      // 1-5
      comment: text("comment").notNull(),
      timestamp: integer("timestamp", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
    }, (table) => {
      return {
        timestampIdx: index("feedback_timestamp_idx").on(table.timestamp),
        ratingIdx: index("feedback_rating_idx").on(table.rating)
      };
    });
    insertAnalyticsSchema = createInsertSchema(analytics, {
      event: z.string().trim().min(1).max(100),
      page: z.string().trim().min(1).max(200),
      metadata: z.record(z.string(), z.any()).optional()
    });
    insertAuditLogSchema = createInsertSchema(auditLogs, {
      action: z.string().trim().min(1),
      resource: z.string().trim().min(1),
      details: z.record(z.string(), z.any()).optional()
    });
    insertFeedbackSchema = createInsertSchema(feedback, {
      rating: z.number().int().min(1).max(5),
      comment: z.string().trim().min(1).max(1e3)
    });
    reports = sqliteTable("reports", {
      id: text("id").primaryKey().$defaultFn(() => nanoid()),
      reporterId: text("reporter_id").references(() => users.id, { onDelete: "set null" }),
      reporterEmail: text("reporter_email"),
      reportedUserId: text("reported_user_id").references(() => users.id, { onDelete: "set null" }),
      reportedPostId: text("reported_post_id").references(() => posts.id, { onDelete: "set null" }),
      type: text("type").notNull(),
      // feedback, bug, support
      subject: text("subject").notNull(),
      pageSection: text("page_section"),
      // Where it happened
      description: text("description").notNull(),
      status: text("status").default("pending").notNull(),
      // pending, resolved, dismissed
      adminNotes: text("admin_notes"),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
      resolvedAt: integer("resolved_at", { mode: "timestamp" }),
      resolvedBy: text("resolved_by").references(() => users.id, { onDelete: "set null" })
    });
    insertReportSchema = createInsertSchema(reports, {
      type: z.enum(["feedback", "bug", "support"]),
      subject: z.string().trim().min(3, "Subject is too short").max(100),
      description: z.string().trim().min(10, "Description must be at least 10 characters").max(500, "Description cannot exceed 500 characters"),
      pageSection: z.string().trim().max(100).optional().nullable(),
      reporterEmail: z.string().email().optional().or(z.literal("")),
      status: z.enum(["pending", "resolved", "dismissed"]).default("pending")
    });
  }
});

// lib/db.ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
var dbUrl, tursoClient, db;
var init_db = __esm({
  "lib/db.ts"() {
    "use strict";
    init_schema_sqlite();
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.");
    }
    dbUrl = process.env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, "https://");
    tursoClient = createClient({
      url: dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
      // Fix Vercel Serverless Node 20 fetch keep-alive hanging bug
      fetch: (url, init) => {
        const headers = new Headers(init?.headers);
        headers.set("Connection", "close");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3e3);
        if (init?.signal) {
          init.signal.addEventListener("abort", () => controller.abort());
        }
        return fetch(url, { ...init, headers, signal: controller.signal }).finally(() => clearTimeout(timeout));
      }
    });
    db = drizzle(tursoClient, { schema: schema_sqlite_exports });
  }
});

// lib/recommendations.ts
var recommendations_exports = {};
__export(recommendations_exports, {
  boostPreferencesFromConnection: () => boostPreferencesFromConnection,
  findSimilarUsers: () => findSimilarUsers,
  getRecommendationBucket: () => getRecommendationBucket,
  getRecommendedPosts: () => getRecommendedPosts,
  getSearchSuggestions: () => getSearchSuggestions,
  scorePostsByPreferences: () => scorePostsByPreferences,
  updateUserPreferencesFromInteractions: () => updateUserPreferencesFromInteractions
});
import { eq, and, inArray, desc, gt, or, isNull, not, sql as sql2 } from "drizzle-orm";
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function getRecommendationBucket(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = hash * 31 + userId.charCodeAt(i) >>> 0;
  }
  return hash % 2 === 0 ? "control" : "variant";
}
function getDefaultWeights(bucket) {
  return bucket === "variant" ? { content: 0.5, collaborative: 0.4, explore: 0.1 } : { content: 0.56, collaborative: 0.36, explore: 0.08 };
}
async function getAdaptiveWeights(bucket) {
  const key = `recommendation_weights_${bucket}`;
  const [row] = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  if (!row || !row.value) {
    return getDefaultWeights(bucket);
  }
  const value = row.value;
  const defaults = getDefaultWeights(bucket);
  return {
    content: typeof value.content === "number" ? value.content : defaults.content,
    collaborative: typeof value.collaborative === "number" ? value.collaborative : defaults.collaborative,
    explore: typeof value.explore === "number" ? value.explore : defaults.explore
  };
}
async function tuneWeightsIfNeeded(bucket) {
  const inflight = tuneLocks.get(bucket);
  if (inflight) {
    return inflight;
  }
  const lock = (async () => {
    const metaKey = `recommendation_weights_meta_${bucket}`;
    const weightKey = `recommendation_weights_${bucket}`;
    const [meta] = await db.select().from(systemSettings).where(eq(systemSettings.key, metaKey)).limit(1);
    const lastTunedAt = meta?.value?.lastTunedAt;
    if (lastTunedAt) {
      const deltaMs = Date.now() - new Date(lastTunedAt).getTime();
      if (deltaMs < 6 * 60 * 60 * 1e3) {
        return getAdaptiveWeights(bucket);
      }
    }
    const lookback = /* @__PURE__ */ new Date();
    lookback.setDate(lookback.getDate() - 14);
    const [agg] = await db.select({
      views: sql2`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'view')`,
      clicks: sql2`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'click')`,
      connections: sql2`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'connection_request')`
    }).from(postInteractions).where(gt(postInteractions.createdAt, lookback));
    const views = Number(agg?.views || 0);
    const clicks = Number(agg?.clicks || 0);
    const connections = Number(agg?.connections || 0);
    const ctr = views > 0 ? clicks / views : 0;
    const connectionRate = clicks > 0 ? connections / clicks : 0;
    const base = await getAdaptiveWeights(bucket);
    const ctrTarget = 0.22;
    const connectionTarget = 0.16;
    const delta = (connectionRate - connectionTarget) * 0.08 + (ctr - ctrTarget) * 0.04;
    let collaborative = clamp(base.collaborative + delta, WEIGHT_BOUNDS.collaborative.min, WEIGHT_BOUNDS.collaborative.max);
    let content = clamp(base.content - delta * 0.7, WEIGHT_BOUNDS.content.min, WEIGHT_BOUNDS.content.max);
    let explore = clamp(1 - content - collaborative, WEIGHT_BOUNDS.explore.min, WEIGHT_BOUNDS.explore.max);
    const remainder = 1 - explore;
    const sumMain = content + collaborative || 1;
    content = content / sumMain * remainder;
    collaborative = collaborative / sumMain * remainder;
    const tuned = {
      content,
      collaborative,
      explore
    };
    await db.insert(systemSettings).values({ key: weightKey, value: tuned, updatedBy: null }).onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: tuned, updatedBy: null, updatedAt: /* @__PURE__ */ new Date() }
    });
    await db.insert(systemSettings).values({ key: metaKey, value: { lastTunedAt: (/* @__PURE__ */ new Date()).toISOString(), ctr, connectionRate }, updatedBy: null }).onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: { lastTunedAt: (/* @__PURE__ */ new Date()).toISOString(), ctr, connectionRate },
        updatedBy: null,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    return tuned;
  })();
  tuneLocks.set(bucket, lock);
  try {
    return await lock;
  } finally {
    tuneLocks.delete(bucket);
  }
}
async function findSimilarUsers(userId, limit = 10) {
  const targetPrefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  if (targetPrefs.length === 0) {
    return [];
  }
  const targetScores = targetPrefs[0].interactionScore;
  const targetPostIds = Object.keys(targetScores);
  if (targetPostIds.length === 0) {
    return [];
  }
  const similarUsers = await db.select({
    userId: userPreferences.userId,
    interactionScore: userPreferences.interactionScore
  }).from(userPreferences).where(not(eq(userPreferences.userId, userId))).limit(100);
  const similarities = similarUsers.map((user) => {
    const userScores = user.interactionScore;
    const similarity = calculateCosineSimilarity(targetScores, userScores);
    return { userId: user.userId, similarity };
  });
  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit).map((u) => u.userId);
}
function calculateCosineSimilarity(scores1, scores2) {
  const allPostIds = /* @__PURE__ */ new Set([...Object.keys(scores1), ...Object.keys(scores2)]);
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  for (const postId of allPostIds) {
    const score1 = scores1[postId] || 0;
    const score2 = scores2[postId] || 0;
    dotProduct += score1 * score2;
    magnitude1 += score1 * score1;
    magnitude2 += score2 * score2;
  }
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}
async function scorePostsByPreferences(userId, postIds) {
  if (postIds.length === 0) {
    return [];
  }
  const prefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  if (prefs.length === 0) {
    const [userProfile] = await db.select({ skills: users.skills, city: users.city, department: users.department }).from(users).where(eq(users.id, userId)).limit(1);
    const coldPosts = await db.select({
      id: posts.id,
      skillsWanted: posts.skillsWanted,
      city: posts.city,
      eventUpvotes: posts.eventUpvotes,
      createdAt: posts.createdAt
    }).from(posts).where(inArray(posts.id, postIds));
    const maxUpvotes = Math.max(...coldPosts.map((p) => Number(p.eventUpvotes || 0)), 1);
    const profileSkills = (userProfile?.skills || []).map((s) => s.toLowerCase());
    return coldPosts.map((post) => {
      const wantedSkills = (post.skillsWanted || []).map((s) => String(s?.name || "").toLowerCase());
      const skillMatch = profileSkills.length > 0 ? calculateArrayOverlap(profileSkills, wantedSkills) : 0;
      const cityMatch = userProfile?.city && post.city && userProfile.city.toLowerCase() === post.city.toLowerCase() ? 1 : 0;
      const popularity = Number(post.eventUpvotes || 0) / maxUpvotes;
      const ageDays = Math.max(0, (Date.now() - new Date(post.createdAt).getTime()) / 864e5);
      const recency = clamp(1 - ageDays / 30, 0, 1);
      const score = skillMatch * 0.5 + cityMatch * 0.2 + popularity * 0.15 + recency * 0.15;
      const reasons = ["Cold-start profile prior"];
      if (skillMatch > 0.35) reasons.push("Profile skill match");
      if (cityMatch > 0) reasons.push("Same city");
      if (popularity > 0.5) reasons.push("Popular post");
      return { postId: post.id, score, reasons };
    }).sort((a, b) => b.score - a.score);
  }
  const userPref = prefs[0];
  const postsToScore = await db.select({
    id: posts.id,
    skillsWanted: posts.skillsWanted,
    city: posts.city,
    eventType: posts.eventType
  }).from(posts).where(inArray(posts.id, postIds));
  const scored = postsToScore.map((post) => {
    let score = 0;
    const reasons = [];
    const skillMatch = calculateArrayOverlap(
      userPref.preferredSkills || [],
      (post.skillsWanted || []).map((s) => s.name)
    );
    score += skillMatch * 0.4;
    if (skillMatch > 0.5) {
      reasons.push(`${Math.round(skillMatch * 100)}% skill match`);
    }
    const cityMatch = (userPref.preferredCities || []).includes(post.city || "") ? 1 : 0;
    score += cityMatch * 0.3;
    if (cityMatch > 0) {
      reasons.push("Preferred city");
    }
    const eventTypeMatch = (userPref.preferredEventTypes || []).includes(post.eventType || "") ? 1 : 0;
    score += eventTypeMatch * 0.3;
    if (eventTypeMatch > 0) {
      reasons.push("Preferred event type");
    }
    const interactionScore = userPref.interactionScore[post.id] || 0;
    score += interactionScore * 0.2;
    if (interactionScore > 0.5) {
      reasons.push("Similar to posts you liked");
    }
    return {
      postId: post.id,
      score: Math.min(score, 1),
      // Cap at 1.0
      reasons
    };
  });
  return scored.sort((a, b) => b.score - a.score);
}
function calculateArrayOverlap(arr1, arr2) {
  if (arr1.length === 0 || arr2.length === 0) {
    return 0;
  }
  const set1 = new Set(arr1.map((s) => s.toLowerCase()));
  const set2 = new Set(arr2.map((s) => s.toLowerCase()));
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = /* @__PURE__ */ new Set([...set1, ...set2]);
  return intersection.size / union.size;
}
async function getRecommendedPosts(userId, excludePostIds = [], limit = 20) {
  const bucket = getRecommendationBucket(userId);
  const weights = await tuneWeightsIfNeeded(bucket);
  const exclusionClause = excludePostIds.length > 0 ? not(inArray(posts.id, excludePostIds)) : void 0;
  const activePosts = await db.select({ id: posts.id }).from(posts).where(
    and(
      exclusionClause,
      or(isNull(posts.eventDate), gt(posts.eventDate, /* @__PURE__ */ new Date()))
    )
  ).limit(200);
  const postIds = activePosts.map((p) => p.id);
  if (postIds.length === 0) {
    return [];
  }
  const contentScores = await scorePostsByPreferences(userId, postIds);
  const daySeed = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const explorationScore = (postId) => {
    const raw = `${postId}:${daySeed}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = hash * 31 + raw.charCodeAt(i) >>> 0;
    }
    return hash % 100 / 100;
  };
  const similarUsers = await findSimilarUsers(userId, 10);
  const collaborativeScores = {};
  if (similarUsers.length > 0) {
    const similarUserPrefs = await db.select().from(userPreferences).where(inArray(userPreferences.userId, similarUsers));
    for (const pref of similarUserPrefs) {
      const scores = pref.interactionScore;
      for (const [postId, score] of Object.entries(scores)) {
        if (postIds.includes(postId)) {
          collaborativeScores[postId] = (collaborativeScores[postId] || 0) + score;
        }
      }
    }
    const maxCollabScore = Math.max(...Object.values(collaborativeScores), 1);
    for (const postId in collaborativeScores) {
      collaborativeScores[postId] /= maxCollabScore;
    }
  }
  const finalScores = contentScores.map((post) => {
    const collabScore = collaborativeScores[post.postId] || 0;
    const exploreBoost = explorationScore(post.postId) * weights.explore;
    const finalScore = post.score * weights.content + collabScore * weights.collaborative + exploreBoost;
    const reasons = [...post.reasons];
    if (collabScore > 0.3) {
      reasons.push("Popular with similar users");
    }
    if (exploreBoost > weights.explore * 0.6) {
      reasons.push("Discovery pick");
    }
    reasons.push(`Bucket: ${bucket}`);
    return {
      postId: post.postId,
      score: finalScore,
      reasons
    };
  });
  return finalScores.sort((a, b) => b.score - a.score).slice(0, limit);
}
async function updateUserPreferencesFromInteractions(userId) {
  const ninetyDaysAgo = /* @__PURE__ */ new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const interactions = await db.select({
    postId: postInteractions.postId,
    interactionType: postInteractions.interactionType,
    durationSeconds: postInteractions.durationSeconds,
    post: {
      skillsWanted: posts.skillsWanted,
      city: posts.city,
      eventType: posts.eventType
    }
  }).from(postInteractions).innerJoin(posts, eq(postInteractions.postId, posts.id)).where(
    and(
      eq(postInteractions.userId, userId),
      gt(postInteractions.createdAt, ninetyDaysAgo)
    )
  );
  if (interactions.length === 0) {
    return;
  }
  const skillCounts = {};
  const cityCounts = {};
  const eventTypeCounts = {};
  const postScores = {};
  for (const interaction of interactions) {
    let value = 0;
    switch (interaction.interactionType) {
      case "view":
        value = 0.1;
        break;
      case "click":
        value = 0.3;
        break;
      case "connection_request":
        value = 1;
        break;
      case "interested":
        value = 1.2;
        break;
      case "not_interested":
        value = -0.8;
        break;
      case "skip":
        value = -0.2;
        break;
    }
    const timeBoost = Math.min((interaction.durationSeconds || 0) / 120, 1);
    value *= 1 + timeBoost;
    postScores[interaction.postId] = (postScores[interaction.postId] || 0) + value;
    if (value > 0) {
      const skills = (interaction.post.skillsWanted || []).map((s) => s.name);
      for (const skill of skills) {
        skillCounts[skill] = (skillCounts[skill] || 0) + value;
      }
      if (interaction.post.city) {
        cityCounts[interaction.post.city] = (cityCounts[interaction.post.city] || 0) + value;
      }
      if (interaction.post.eventType) {
        eventTypeCounts[interaction.post.eventType] = (eventTypeCounts[interaction.post.eventType] || 0) + value;
      }
    }
  }
  const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([skill]) => skill);
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([city]) => city);
  const topEventTypes = Object.entries(eventTypeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type]) => type);
  const maxScore = Math.max(...Object.values(postScores), 1);
  const normalizedPostScores = {};
  for (const [postId, score] of Object.entries(postScores)) {
    normalizedPostScores[postId] = Math.max(0, Math.min(1, score / maxScore));
  }
  await db.insert(userPreferences).values({
    userId,
    preferredSkills: topSkills,
    preferredCities: topCities,
    preferredEventTypes: topEventTypes,
    interactionScore: normalizedPostScores
  }).onConflictDoUpdate({
    target: userPreferences.userId,
    set: {
      preferredSkills: topSkills,
      preferredCities: topCities,
      preferredEventTypes: topEventTypes,
      interactionScore: normalizedPostScores,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function getSearchSuggestions(userId, limit = 5) {
  const recentSearches = await db.select({
    query: userSearches.query,
    resultsCount: userSearches.resultsCount,
    clickedPostIds: userSearches.clickedPostIds
  }).from(userSearches).where(eq(userSearches.userId, userId)).orderBy(desc(userSearches.createdAt)).limit(50);
  const searchScores = {};
  for (const search of recentSearches) {
    const query = search.query.toLowerCase().trim();
    if (!query) continue;
    let score = 1;
    if ((search.resultsCount || 0) > 0) {
      score += 2;
    }
    if ((search.clickedPostIds || []).length > 0) {
      score += 5;
    }
    searchScores[query] = (searchScores[query] || 0) + score;
  }
  return Object.entries(searchScores).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([query]) => query);
}
async function boostPreferencesFromConnection(userId, postId, wasAccepted) {
  const [post] = await db.select({
    skillsWanted: posts.skillsWanted,
    city: posts.city,
    eventType: posts.eventType
  }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return;
  const prefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  if (prefs.length === 0) {
    return;
  }
  const currentPrefs = prefs[0];
  const interactionScore = currentPrefs.interactionScore;
  const feedbackValue = wasAccepted ? 0.3 : -0.1;
  const currentScore = interactionScore[postId] || 0;
  const newScore = Math.max(0, Math.min(1, currentScore + feedbackValue));
  interactionScore[postId] = newScore;
  if (wasAccepted) {
    const skills = (post.skillsWanted || []).map((s) => s.name);
    const preferredSkills = currentPrefs.preferredSkills || [];
    const preferredCities = currentPrefs.preferredCities || [];
    const preferredEventTypes = currentPrefs.preferredEventTypes || [];
    for (const skill of skills) {
      if (!preferredSkills.includes(skill) && preferredSkills.length < 15) {
        preferredSkills.push(skill);
      }
    }
    if (post.city && !preferredCities.includes(post.city) && preferredCities.length < 10) {
      preferredCities.push(post.city);
    }
    if (post.eventType && !preferredEventTypes.includes(post.eventType) && preferredEventTypes.length < 10) {
      preferredEventTypes.push(post.eventType);
    }
    await db.update(userPreferences).set({
      preferredSkills,
      preferredCities,
      preferredEventTypes,
      interactionScore,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(userPreferences.userId, userId));
  } else {
    await db.update(userPreferences).set({
      interactionScore,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(userPreferences.userId, userId));
  }
}
var WEIGHT_BOUNDS, tuneLocks;
var init_recommendations = __esm({
  "lib/recommendations.ts"() {
    "use strict";
    init_db();
    init_schema_sqlite();
    WEIGHT_BOUNDS = {
      content: { min: 0.35, max: 0.7 },
      collaborative: { min: 0.2, max: 0.6 },
      explore: { min: 0.05, max: 0.2 }
    };
    tuneLocks = /* @__PURE__ */ new Map();
  }
});

// lib/cloudinary.ts
var cloudinary_exports = {};
__export(cloudinary_exports, {
  cloudinary: () => cloudinary,
  deleteFromCloudinary: () => deleteFromCloudinary,
  uploadToCloudinary: () => uploadToCloudinary
});
import { v2 as cloudinary } from "cloudinary";
async function uploadToCloudinary(buffer, folder, publicIdPrefix) {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: "auto",
      overwrite: false
    };
    if (publicIdPrefix) {
      options.public_id = `${publicIdPrefix}-${Date.now()}`;
    }
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        logger.error("Cloudinary upload failed", error);
        return reject(error || new Error("Cloudinary upload returned no result"));
      }
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}
async function deleteFromCloudinary(publicIdOrUrl) {
  try {
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.startsWith("https://res.cloudinary.com/")) {
      const parts = publicIdOrUrl.split("/upload/");
      if (parts.length === 2) {
        const afterUpload = parts[1].replace(/^v\d+\//, "");
        publicId = afterUpload.replace(/\.[^.]+$/, "");
      }
    }
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    logger.error("Cloudinary delete failed", err);
  }
}
var init_cloudinary = __esm({
  "lib/cloudinary.ts"() {
    "use strict";
    init_logger();
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL, secure: true });
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
    }
  }
});

// lib/mail.ts
var mail_exports = {};
__export(mail_exports, {
  NodemailerProvider: () => NodemailerProvider,
  mailProvider: () => mailProvider,
  sendConnectionRequestEmail: () => sendConnectionRequestEmail,
  sendEventRegistrationStatusEmail: () => sendEventRegistrationStatusEmail,
  sendNewChatMessageEmail: () => sendNewChatMessageEmail,
  sendPostExpiringEmail: () => sendPostExpiringEmail,
  sendResolutionEmail: () => sendResolutionEmail,
  sendWelcomeEmail: () => sendWelcomeEmail
});
import nodemailer from "nodemailer";
function getBaseTemplate(content, title) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: ${BRAND_COLOR}; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .logo-text-accent { color: #93c5fd; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; padding: 14px 28px; background-color: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; transition: background-color 0.2s; text-align: center; }
        .button:hover { background-color: #1d4ed8; }
        .footer { background: #f1f5f9; padding: 25px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .alert { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; color: #991b1b; border-radius: 4px; }
        .alert-title { font-weight: 700; display: block; margin-bottom: 4px; color: #7f1d1d; }
        h2 { color: #0f172a; margin-top: 0; font-size: 22px; }
        ul { padding-left: 20px; margin-bottom: 25px; }
        li { margin-bottom: 10px; }
        hr { border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Find<span class="logo-text-accent">A</span>Teammate</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>${FOOTER_TEXT}</p>
          <p>You received this email because you have an account on FindATeammate.<br/>
          <a href="${process.env.FRONTEND_URL}" style="color: #64748b; text-decoration: underline;">Unsubscribe options</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
async function sendWelcomeEmail(email, name) {
  const subject = "Welcome to the Community! \u{1F680}";
  const content = `
    <h2>Hello ${name},</h2>
    <p>Welcome to <strong>FindATeammate</strong>! You've just joined a community of builders, designers, and visionaries ready to create something amazing.</p>
    
    <p>Here is what you can do right now:</p>
    <ul>
      <li><strong>Complete Profile:</strong> Showcase your skills and portfolio.</li>
      <li><strong>Post a Request:</strong> Find the perfect teammate for your idea.</li>
      <li><strong>Connect:</strong> Chat with others in real-time.</li>
    </ul>

    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/teammates" class="button">Start Browsing</a>
    </div>
    
    <hr/>
    <p>We can't wait to see what you build!</p>
    <p>\u2014 The FindATeammate Team</p>
  `;
  return await mailProvider.send({
    to: email,
    subject,
    text: `Welcome to FindATeammate, ${name}! Log in to start browsing.`,
    html: getBaseTemplate(content, "Welcome!")
  });
}
async function sendResolutionEmail(email, reportId, notes) {
  const subject = `Update on Report #${reportId}`;
  const content = `
    <h2>Report Resolved</h2>
    <p>We're writing to let you know that your report (ID: <strong>#${reportId}</strong>) has been reviewed and resolved.</p>
    
    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <strong style="color: #475569; display: block; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Admin Notes</strong>
      ${notes}
    </div>

    <p>Thank you for helping keep our community safe.</p>
  `;
  return await mailProvider.send({
    to: email,
    subject,
    text: `Your report #${reportId} has been resolved. Notes: ${notes}`,
    html: getBaseTemplate(content, "Report Update")
  });
}
async function sendConnectionRequestEmail(recipientEmail, recipientName, senderName, postTitle, message) {
  const subject = `${senderName} wants to collaborate on "${postTitle}"`;
  const content = `
      <h2>Hello ${recipientName},</h2>
      <p><strong>${senderName}</strong> has sent you a connection request for your post:</p>
    
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <strong style="color: #0f172a; font-size: 18px; display: block; margin-bottom: 12px;">${postTitle}</strong>
        ${message ? `<p style="color: #475569; margin: 0;"><em>"${message}"</em></p>` : ""}
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/requests" class="button">View Request</a>
      </div>
    
      <p>Log in to accept or decline this request and start chatting!</p>
      <p>\u2014 The FindATeammate Team</p>
    `;
  return await mailProvider.send({
    to: recipientEmail,
    subject,
    text: `${senderName} sent you a connection request for "${postTitle}". Message: ${message}`,
    html: getBaseTemplate(content, "New Connection Request")
  });
}
async function sendEventRegistrationStatusEmail(userEmail, userName, eventName, status, rejectionReason) {
  const isApproved = status === "approved";
  const subject = isApproved ? `\u2705 You're in! Registration approved for "${eventName}"` : `Registration update for "${eventName}"`;
  const content = isApproved ? `
      <h2>Congratulations ${userName}! \u{1F389}</h2>
      <p>Your registration for <strong>${eventName}</strong> has been <span style="color: #16a34a; font-weight: 700;">approved</span>!</p>
    
      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="color: #15803d; margin: 0; font-weight: 600;">You're all set to participate! Check your dashboard for next steps.</p>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/events" class="button">View Event Details</a>
      </div>
    ` : `
      <h2>Hello ${userName},</h2>
      <p>Thank you for your interest in <strong>${eventName}</strong>.</p>
    
      <div class="alert">
        <span class="alert-title">Registration Not Approved</span>
        Unfortunately, your registration was not approved at this time.
        ${rejectionReason ? `<br/><br/><strong>Reason:</strong> ${rejectionReason}` : ""}
      </div>

      <p>Don't be discouraged! There are plenty of other amazing events and opportunities on FindATeammate.</p>
    
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/events" class="button">Browse More Events</a>
      </div>
    `;
  return await mailProvider.send({
    to: userEmail,
    subject,
    text: isApproved ? `Your registration for "${eventName}" has been approved!` : `Your registration for "${eventName}" was not approved. ${rejectionReason || ""}`,
    html: getBaseTemplate(content, "Event Registration Update")
  });
}
async function sendNewChatMessageEmail(recipientEmail, recipientName, senderName, messagePreview) {
  const subject = `New message from ${senderName}`;
  const truncatedMessage = messagePreview.length > 100 ? messagePreview.substring(0, 100) + "..." : messagePreview;
  const content = `
      <h2>Hello ${recipientName},</h2>
      <p><strong>${senderName}</strong> sent you a message:</p>
    
      <div style="background-color: #f8fafc; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; border-radius: 8px; margin: 25px 0; font-style: italic; color: #475569;">
        "${truncatedMessage}"
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/chat" class="button">Reply Now</a>
      </div>
    
      <p style="font-size: 13px; color: #64748b;">You're receiving this because you have chat notifications enabled.</p>
    `;
  return await mailProvider.send({
    to: recipientEmail,
    subject,
    text: `New message from ${senderName}: ${truncatedMessage}`,
    html: getBaseTemplate(content, "New Message")
  });
}
async function sendPostExpiringEmail(userEmail, userName, postTitle, _postId, daysLeft) {
  const subject = `\u23F0 Your post "${postTitle}" expires in ${daysLeft} days`;
  const content = `
      <h2>Hello ${userName},</h2>
      <p>Your post <strong>"${postTitle}"</strong> will expire in <strong>${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>.</p>
    
      <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="color: #92400e; margin: 0;">If you're still looking for teammates, consider updating your post or creating a new one to stay visible!</p>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/my-posts" class="button">Manage My Posts</a>
      </div>
    `;
  return await mailProvider.send({
    to: userEmail,
    subject,
    text: `Your post "${postTitle}" expires in ${daysLeft} days. Update it to stay visible!`,
    html: getBaseTemplate(content, "Post Expiring Soon")
  });
}
var NodemailerProvider, mailProvider, BRAND_COLOR, FOOTER_TEXT;
var init_mail = __esm({
  "lib/mail.ts"() {
    "use strict";
    init_logger();
    NodemailerProvider = class {
      transporter;
      constructor() {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
          logger.warn("WARNING: SMTP_USER or SMTP_PASS environment variables are not set. Email sending is disabled.");
          this.transporter = null;
          return;
        }
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "465"),
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === "production"
          }
        });
      }
      async send(options) {
        try {
          if (!this.transporter) {
            logger.warn(`[Mail Disabled] Logging Email: To: ${options.to}, Subject: ${options.subject}`);
            return true;
          }
          const from = process.env.SMTP_FROM || '"FindATeammate Support" <support@findateammate.online>';
          const info = await this.transporter.sendMail({
            from,
            ...options
          });
          logger.log(`Email sent: ${info.messageId}`);
          return true;
        } catch (error) {
          logger.error("Nodemailer send error:", error);
          return false;
        }
      }
    };
    mailProvider = new NodemailerProvider();
    BRAND_COLOR = "#2563eb";
    FOOTER_TEXT = "\xA9 2026 FindATeammate. All rights reserved.";
  }
});

// api/_entry.ts
import serverless from "serverless-http";

// lib/routes.ts
import express2 from "express";
import { waitUntil as waitUntil2 } from "@vercel/functions";

// lib/realtime.ts
var PARTYKIT_HOST = process.env.PARTYKIT_HOST;
var PARTYKIT_SECRET = process.env.PARTYKIT_SECRET;
async function publishToRoom(party, roomId, payload) {
  const url = `https://${PARTYKIT_HOST}/parties/${party}/${roomId}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-partykit-secret": PARTYKIT_SECRET
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error(`[Realtime] Failed to publish to ${party}/${roomId}: ${res.status}`);
    }
  } catch (err) {
    console.error(`[Realtime] Network error publishing to ${party}/${roomId}:`, err);
  }
}
async function emitNotification(userId, payload) {
  await publishToRoom("notifications", userId, { type: "notification", ...payload ?? {} });
}
async function emitChatUpdated(userIds, chatId) {
  await Promise.all(
    userIds.map((uid) => publishToRoom("notifications", uid, { type: "chat_updated", chatId }))
  );
}
async function emitMessage(chatId, enrichedMessage) {
  await publishToRoom("chat", chatId, { type: "receive_message", ...enrichedMessage });
}
async function emitMaintenance(value) {
  await publishToRoom("global", "global", { type: "maintenance_update", value });
}

// lib/routes.ts
init_logger();

// lib/storage.ts
init_schema_sqlite();
init_db();
init_logger();
import { waitUntil } from "@vercel/functions";
import { eq as eq2, desc as desc2, asc, and as and2, or as or2, inArray as inArray2, gt as gt2, lt, sql as sql3, isNotNull } from "drizzle-orm";
var MemoryCache = class {
  constructor(ttlSeconds = 60) {
    this.ttlSeconds = ttlSeconds;
  }
  cache = /* @__PURE__ */ new Map();
  get(key) {
    return this.cache.get(key);
  }
  set(key, value) {
    this.cache.set(key, value);
  }
  delete(key) {
    this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
};
var DatabaseStorage = class {
  settingCache = /* @__PURE__ */ new Map();
  pendingSettings = /* @__PURE__ */ new Map();
  // Cache for Users (TTL: 30 seconds) - heavily hit by session middleware
  userCache = new MemoryCache(30);
  // Cache for Posts (TTL: 60 seconds) - heavily hit by viral content
  postCache = new MemoryCache(60);
  // Cache for Admin Stats (TTL: 300 seconds/5 mins) - heavy aggregation
  adminStatsCache = new MemoryCache(300);
  // Users
  async getUser(id) {
    const cached = await this.userCache.get(id);
    if (cached) return cached;
    const [user] = await db.select().from(users).where(eq2(users.id, id));
    if (user) await this.userCache.set(id, user);
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq2(users.email, email));
    return user;
  }
  async getUserByGoogleId(googleId) {
    const [user] = await db.select().from(users).where(eq2(users.googleId, googleId));
    return user;
  }
  async getUsers(limit) {
    const query = db.select().from(users).orderBy(asc(users.name));
    return limit ? await query.limit(limit) : await query;
  }
  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    await this.adminStatsCache.delete("stats");
    return newUser;
  }
  async createOAuthUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    await this.adminStatsCache.delete("stats");
    return newUser;
  }
  async updateUser(id, userData) {
    return await db.transaction(async (tx) => {
      const [updatedUser] = await tx.update(users).set(userData).where(eq2(users.id, id)).returning();
      await this.userCache.delete(id);
      if (userData.isBanned !== void 0 || userData.isAdmin !== void 0 || userData.isOrganiser !== void 0) {
        await this.adminStatsCache.delete("stats");
      }
      if (userData.name) {
        await tx.update(posts).set({ userName: userData.name }).where(eq2(posts.userId, id));
        await tx.update(connectionRequests).set({ fromUserName: userData.name }).where(eq2(connectionRequests.fromUserId, id));
        await tx.update(connectionRequests).set({ toUserName: userData.name }).where(eq2(connectionRequests.toUserId, id));
      }
      if (userData.skills && userData.skills.length > 0) {
        const primarySkill = userData.skills[0];
        await tx.update(posts).set({ userSkill: primarySkill }).where(eq2(posts.userId, id));
        await tx.update(connectionRequests).set({ fromUserSkill: primarySkill }).where(eq2(connectionRequests.fromUserId, id));
      }
      return updatedUser;
    });
  }
  async verifyUser(id) {
    const [user] = await db.update(users).set({
      isVerified: true
    }).where(eq2(users.id, id)).returning();
    await this.userCache.delete(id);
    return user;
  }
  lastActiveUpdates = /* @__PURE__ */ new Map();
  async updateLastActive(id) {
    const now = Date.now();
    const lastUpdate = this.lastActiveUpdates.get(id) || 0;
    if (now - lastUpdate > 5 * 60 * 1e3) {
      this.lastActiveUpdates.set(id, now);
      waitUntil(
        db.update(users).set({ lastActive: /* @__PURE__ */ new Date() }).where(eq2(users.id, id)).execute().catch((err) => logger.error("Failed to update lastActive", err))
      );
    }
  }
  // Posts
  async getPosts(cursor, limit = 20, viewerId) {
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
      myVote: viewerId ? eventVotes.voteType : sql3`null`
    }).from(posts).leftJoin(users, eq2(users.id, posts.userId)).limit(limit + 1).orderBy(desc2(posts.createdAt));
    if (viewerId) {
      query = query.leftJoin(
        eventVotes,
        and2(
          eq2(eventVotes.postId, posts.id),
          eq2(eventVotes.userId, viewerId)
        )
      );
    }
    if (cursor) {
      query = query.where(lt(posts.createdAt, cursor));
    }
    const items = await query;
    let nextCursor = null;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.createdAt || null;
    }
    if (viewerId && !cursor && items.length > 0) {
      try {
        const { getRecommendedPosts: getRecommendedPosts2 } = await Promise.resolve().then(() => (init_recommendations(), recommendations_exports));
        const recentlySeen = await db.select({ postId: postInteractions.postId }).from(postInteractions).where(eq2(postInteractions.userId, viewerId)).orderBy(desc2(postInteractions.createdAt)).limit(100);
        const excludePostIds = recentlySeen.map((r) => r.postId);
        const scores = await getRecommendedPosts2(viewerId, excludePostIds, Math.max(limit * 4, 50));
        const scoreMap = new Map(scores.map((s) => [s.postId, s.score]));
        items.sort((a, b) => {
          const scoreA = scoreMap.get(a.id) || 0;
          const scoreB = scoreMap.get(b.id) || 0;
          if (Math.abs(scoreA - scoreB) > 0.1) {
            return scoreB - scoreA;
          } else {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        });
      } catch (error) {
        logger.error("Failed to apply personalized ranking", { error, viewerId });
      }
    }
    return { items, nextCursor };
  }
  async getPost(id) {
    const cached = await this.postCache.get(id);
    if (cached) return cached;
    const [post] = await db.select().from(posts).where(eq2(posts.id, id));
    if (post) await this.postCache.set(id, post);
    return post;
  }
  async getPostsByUser(userId) {
    return await db.select().from(posts).where(eq2(posts.userId, userId));
  }
  async createPost(post) {
    const safePost = {
      ...post,
      // Defensive normalization for clients that may send malformed optional values.
      allowedDepartments: Array.isArray(post.allowedDepartments) ? post.allowedDepartments.filter((dept) => typeof dept === "string").map((dept) => dept.trim()).filter((dept) => dept.length > 0) : null,
      requiredSkills: Array.isArray(post.requiredSkills) ? post.requiredSkills : [],
      requiredInterests: Array.isArray(post.requiredInterests) ? post.requiredInterests : [],
      crossDeptRequiresApproval: typeof post.crossDeptRequiresApproval === "boolean" ? post.crossDeptRequiresApproval : true,
      isEventOrganiser: typeof post.isEventOrganiser === "boolean" ? post.isEventOrganiser : false
    };
    const [newPost] = await db.insert(posts).values(safePost).returning();
    await this.adminStatsCache.delete("stats");
    return newPost;
  }
  async deletePost(id) {
    await db.transaction(async (tx) => {
      const requests = await tx.select().from(connectionRequests).where(eq2(connectionRequests.postId, id));
      if (requests.length > 0) {
        const chatIds = requests.map((r) => r.id);
        await tx.delete(messages).where(inArray2(messages.chatId, chatIds));
      }
      await tx.delete(connectionRequests).where(eq2(connectionRequests.postId, id));
      await tx.delete(posts).where(eq2(posts.id, id));
      await this.postCache.delete(id);
      await this.adminStatsCache.delete("stats");
    });
  }
  async updatePost(id, postData) {
    const [updatedPost] = await db.update(posts).set(postData).where(eq2(posts.id, id)).returning();
    await this.postCache.delete(id);
    return updatedPost;
  }
  async upvoteEvent(id, userId) {
    await db.transaction(async (tx) => {
      const [existingVote] = await tx.select().from(eventVotes).where(
        and2(eq2(eventVotes.postId, id), eq2(eventVotes.userId, userId))
      );
      if (existingVote) {
        if (existingVote.voteType === 1) {
          await tx.delete(eventVotes).where(eq2(eventVotes.id, existingVote.id));
          await tx.update(posts).set({ eventUpvotes: sql3`COALESCE(${posts.eventUpvotes}, 0) - 1` }).where(eq2(posts.id, id));
        } else {
          await tx.update(eventVotes).set({ voteType: 1 }).where(eq2(eventVotes.id, existingVote.id));
          await tx.update(posts).set({ eventUpvotes: sql3`COALESCE(${posts.eventUpvotes}, 0) + 2` }).where(eq2(posts.id, id));
        }
      } else {
        await tx.insert(eventVotes).values({ postId: id, userId, voteType: 1 });
        await tx.update(posts).set({ eventUpvotes: sql3`COALESCE(${posts.eventUpvotes}, 0) + 1` }).where(eq2(posts.id, id));
      }
      await this.postCache.delete(id);
    });
  }
  async downvoteEvent(id, userId) {
    await db.transaction(async (tx) => {
      const [existingVote] = await tx.select().from(eventVotes).where(
        and2(eq2(eventVotes.postId, id), eq2(eventVotes.userId, userId))
      );
      if (existingVote) {
        if (existingVote.voteType === -1) {
          await tx.delete(eventVotes).where(eq2(eventVotes.id, existingVote.id));
          await tx.update(posts).set({ eventUpvotes: sql3`COALESCE(${posts.eventUpvotes}, 0) + 1` }).where(eq2(posts.id, id));
        } else {
          await tx.update(eventVotes).set({ voteType: -1 }).where(eq2(eventVotes.id, existingVote.id));
          await tx.update(posts).set({ eventUpvotes: sql3`COALESCE(${posts.eventUpvotes}, 0) - 2` }).where(eq2(posts.id, id));
        }
      } else {
        await tx.insert(eventVotes).values({ postId: id, userId, voteType: -1 });
        await tx.update(posts).set({ eventUpvotes: sql3`COALESCE(${posts.eventUpvotes}, 0) - 1` }).where(eq2(posts.id, id));
      }
      await this.postCache.delete(id);
    });
  }
  async isUserInChat(chatId, userId) {
    const [request] = await db.select().from(connectionRequests).where(eq2(connectionRequests.id, chatId));
    if (!request) return false;
    return request.fromUserId === userId || request.toUserId === userId;
  }
  // Connection Requests
  async getConnectionRequests(userId, limit = 50) {
    return await db.select().from(connectionRequests).where(
      or2(
        eq2(connectionRequests.toUserId, userId),
        eq2(connectionRequests.fromUserId, userId)
      )
    ).limit(limit).orderBy(desc2(connectionRequests.createdAt));
  }
  async getConnectionRequest(id) {
    const [request] = await db.select().from(connectionRequests).where(eq2(connectionRequests.id, id));
    return request;
  }
  async getExistingRequest(fromUserId, toUserId, postId) {
    const [request] = await db.select().from(connectionRequests).where(
      and2(
        eq2(connectionRequests.fromUserId, fromUserId),
        eq2(connectionRequests.toUserId, toUserId),
        eq2(connectionRequests.postId, postId)
      )
    );
    return request;
  }
  async createConnectionRequest(request) {
    const [newReq] = await db.insert(connectionRequests).values(request).returning();
    return newReq;
  }
  async updateConnectionRequestStatus(id, status) {
    await db.update(connectionRequests).set({ status }).where(eq2(connectionRequests.id, id));
  }
  async deleteConnectionRequest(id) {
    await db.transaction(async (tx) => {
      await tx.delete(messages).where(eq2(messages.chatId, id));
      await tx.delete(connectionRequests).where(eq2(connectionRequests.id, id));
    });
  }
  // Event Registrations
  async getEventRegistrations(postId) {
    return await db.select().from(eventRegistrations).where(eq2(eventRegistrations.postId, postId));
  }
  async getEventRegistration(id) {
    const result = await db.select().from(eventRegistrations).where(eq2(eventRegistrations.id, id)).limit(1);
    return result[0];
  }
  async getExistingRegistration(postId, userId) {
    const result = await db.select().from(eventRegistrations).where(and2(eq2(eventRegistrations.postId, postId), eq2(eventRegistrations.userId, userId))).limit(1);
    return result[0];
  }
  async getUserEventRegistrations(userId) {
    return await db.select().from(eventRegistrations).where(eq2(eventRegistrations.userId, userId)).orderBy(desc2(eventRegistrations.createdAt));
  }
  async createEventRegistration(registration) {
    const [created] = await db.insert(eventRegistrations).values(registration).returning();
    return created;
  }
  async updateEventRegistrationStatus(id, status, rejectionReason) {
    const updateData = { status, updatedAt: /* @__PURE__ */ new Date() };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    const [updated] = await db.update(eventRegistrations).set(updateData).where(eq2(eventRegistrations.id, id)).returning();
    return updated;
  }
  async deleteEventRegistration(id) {
    await db.delete(eventRegistrations).where(eq2(eventRegistrations.id, id));
  }
  async getPendingRegistrationsForEvent(postId) {
    return await db.select().from(eventRegistrations).where(and2(eq2(eventRegistrations.postId, postId), eq2(eventRegistrations.status, "pending"))).orderBy(desc2(eventRegistrations.createdAt));
  }
  // Chats & Messages
  async getChats(userId) {
    try {
      const reqs = await this.getConnectionRequests(userId);
      if (reqs.length === 0) return [];
      const chatIds = reqs.map((r) => r.id);
      const lastMessagesResult = await db.all(sql3`
        WITH RankedMessages AS (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY ${messages.chatId} ORDER BY ${messages.timestamp} DESC) as rn
          FROM ${messages}
          WHERE ${inArray2(messages.chatId, chatIds)}
        )
        SELECT * FROM RankedMessages WHERE rn = 1
      `);
      const lastMessagesMap = /* @__PURE__ */ new Map();
      lastMessagesResult.forEach((msg) => {
        lastMessagesMap.set(msg.chat_id, msg);
      });
      const allPartnerIds = /* @__PURE__ */ new Set();
      reqs.forEach((req) => {
        const isIncoming = req.toUserId === userId;
        const partnerId = isIncoming ? req.fromUserId : req.toUserId;
        allPartnerIds.add(partnerId);
      });
      const userMap = /* @__PURE__ */ new Map();
      if (allPartnerIds.size > 0) {
        const usersFound = await db.select().from(users).where(inArray2(users.id, Array.from(allPartnerIds)));
        usersFound.forEach((u) => userMap.set(u.id, u));
      }
      const chats = reqs.map((req) => {
        const isIncoming = req.toUserId === userId;
        const partnerId = isIncoming ? req.fromUserId : req.toUserId;
        const partnerUser = userMap.get(partnerId);
        const partnerName = isIncoming ? req.fromUserName || partnerUser?.name || "Unknown User" : req.toUserName || partnerUser?.name || "Unknown User";
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
  async getMessages(chatId, userId, beforeTimestamp) {
    let cutoffDate = /* @__PURE__ */ new Date(0);
    if (userId) {
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
      eq2(messages.chatId, chatId),
      gt2(messages.timestamp, cutoffDate)
    ];
    if (beforeTimestamp) {
      conditions.push(lt(messages.timestamp, beforeTimestamp));
    }
    return await db.select().from(messages).where(and2(...conditions)).orderBy(desc2(messages.timestamp)).limit(50).then((msgs) => msgs.reverse());
  }
  async createMessage(insertMessage) {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    await db.update(connectionRequests).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq2(connectionRequests.id, insertMessage.chatId));
    return message;
  }
  async clearChatHistory(chatId, userId) {
    const request = await this.getConnectionRequest(chatId);
    if (!request) throw new Error("Chat not found");
    const now = /* @__PURE__ */ new Date();
    if (request.fromUserId === userId) {
      await db.update(connectionRequests).set({ fromUserLastCleared: now }).where(eq2(connectionRequests.id, chatId));
    } else if (request.toUserId === userId) {
      await db.update(connectionRequests).set({ toUserLastCleared: now }).where(eq2(connectionRequests.id, chatId));
    } else {
      throw new Error("User is not part of this chat");
    }
  }
  // Notifications
  async getNotifications(userId, limit = 50) {
    return await db.select().from(notifications).where(eq2(notifications.userId, userId)).orderBy(desc2(notifications.createdAt)).limit(limit);
  }
  async createNotification(notification) {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }
  async markNotificationsRead(userId, ids) {
    if (ids.length === 0) return;
    await db.update(notifications).set({ isRead: true }).where(
      and2(
        eq2(notifications.userId, userId),
        inArray2(notifications.id, ids)
      )
    );
  }
  async markAllNotificationsRead(userId) {
    await db.update(notifications).set({ isRead: true }).where(eq2(notifications.userId, userId));
  }
  async deleteNotifications(userId, ids) {
    if (ids.length === 0) return;
    await db.delete(notifications).where(
      and2(
        eq2(notifications.userId, userId),
        inArray2(notifications.id, ids)
      )
    );
  }
  async deleteAllNotifications(userId) {
    await db.transaction(async (tx) => {
      await tx.delete(notifications).where(eq2(notifications.userId, userId));
    });
  }
  async getUnreadNotificationsCount(userId) {
    const [result] = await db.select({ count: sql3`count(*)` }).from(notifications).where(and2(eq2(notifications.userId, userId), eq2(notifications.isRead, false)));
    return Number(result?.count || 0);
  }
  // Analytics
  async logEvent(event) {
    await db.insert(analytics).values(event);
  }
  // Admin
  async promoteUser(id, isAdmin) {
    const [user] = await db.update(users).set({ isAdmin }).where(eq2(users.id, id)).returning();
    await this.userCache.delete(id);
    await this.adminStatsCache.delete("stats");
    return user;
  }
  async promoteOrganiser(id, isOrganiser) {
    const [user] = await db.update(users).set({ isOrganiser }).where(eq2(users.id, id)).returning();
    await this.userCache.delete(id);
    await this.adminStatsCache.delete("stats");
    return user;
  }
  async deleteUser(id) {
    await db.transaction(async (tx) => {
      await tx.update(systemSettings).set({ updatedBy: null }).where(eq2(systemSettings.updatedBy, id));
      await tx.update(analytics).set({ userId: null }).where(eq2(analytics.userId, id));
      await tx.delete(posts).where(eq2(posts.userId, id));
      const userRequests = await tx.select().from(connectionRequests).where(or2(
        eq2(connectionRequests.fromUserId, id),
        eq2(connectionRequests.toUserId, id)
      ));
      if (userRequests.length > 0) {
        const chatIds = userRequests.map((r) => r.id);
        await tx.delete(messages).where(inArray2(messages.chatId, chatIds));
      }
      await tx.delete(connectionRequests).where(or2(
        eq2(connectionRequests.fromUserId, id),
        eq2(connectionRequests.toUserId, id)
      ));
      await tx.delete(notifications).where(eq2(notifications.userId, id));
      await tx.delete(notifications).where(
        sql3`json_extract(metadata, '$.senderId') = ${id}`
      );
      await tx.delete(users).where(eq2(users.id, id));
    });
    await this.userCache.delete(id);
    await this.adminStatsCache.delete("stats");
  }
  async banUser(id, reason) {
    const now = /* @__PURE__ */ new Date();
    const [user] = await db.update(users).set({
      isBanned: true,
      banReason: reason,
      bannedAt: now
    }).where(eq2(users.id, id)).returning();
    await this.userCache.delete(id);
    await this.adminStatsCache.delete("stats");
    return user;
  }
  async unbanUser(id) {
    const [user] = await db.update(users).set({
      isBanned: false,
      banReason: null,
      bannedAt: null
    }).where(eq2(users.id, id)).returning();
    await this.userCache.delete(id);
    await this.adminStatsCache.delete("stats");
    return user;
  }
  async adminDeletePost(id) {
    await db.transaction(async (tx) => {
      const requests = await tx.select().from(connectionRequests).where(eq2(connectionRequests.postId, id));
      if (requests.length > 0) {
        const chatIds = requests.map((r) => r.id);
        await tx.delete(messages).where(inArray2(messages.chatId, chatIds));
      }
      await tx.delete(connectionRequests).where(eq2(connectionRequests.postId, id));
      await tx.delete(posts).where(eq2(posts.id, id));
    });
    await this.postCache.delete(id);
    await this.adminStatsCache.delete("stats");
  }
  async getAdminStats() {
    const userCount = await db.select({ count: sql3`count(*)` }).from(users);
    const postCount = await db.select({ count: sql3`count(*)` }).from(posts);
    const eventCount = await db.select({ count: sql3`count(*)` }).from(posts).where(isNotNull(posts.eventName));
    const reportCount = await db.select({ count: sql3`count(*)` }).from(reports);
    const pendingReportCount = await db.select({ count: sql3`count(*)` }).from(reports).where(eq2(reports.status, "pending"));
    const postRows = await db.select({
      createdAt: posts.createdAt,
      userSkill: posts.userSkill,
      requiredSkills: posts.requiredSkills,
      skillsWanted: posts.skillsWanted,
      skillsOffered: posts.skillsOffered
    }).from(posts);
    const postsByDate = {};
    const skills = {};
    const canonicalSkillLabel = /* @__PURE__ */ new Map();
    const addSkill = (raw) => {
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
            addSkill(skill.name);
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
            addSkill(skill.name);
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
      skills
    };
    return stats;
  }
  async getAnalytics(startDate, endDate, limit = 100, offset = 0) {
    let query = db.select().from(analytics).orderBy(desc2(analytics.timestamp));
    const conditions = [];
    if (startDate) conditions.push(sql3`${analytics.timestamp} >= ${startDate}`);
    if (endDate) conditions.push(sql3`${analytics.timestamp} <= ${endDate}`);
    if (conditions.length === 1) {
      return await query.where(conditions[0]).limit(limit).offset(offset);
    }
    if (conditions.length > 1) {
      const whereClause = conditions.slice(1).reduce((acc, condition) => and2(acc, condition), conditions[0]);
      return await query.where(whereClause).limit(limit).offset(offset);
    }
    return await query.limit(limit).offset(offset);
  }
  // Auditing
  async logAudit(log) {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }
  async getAuditLogs(limit = 100, startDate, endDate) {
    const query = db.select().from(auditLogs);
    const conditions = [];
    if (startDate) conditions.push(gt2(auditLogs.timestamp, startDate));
    if (endDate) conditions.push(lt(auditLogs.timestamp, endDate));
    if (conditions.length === 1) {
      return await query.where(conditions[0]).limit(limit).orderBy(desc2(auditLogs.timestamp));
    }
    if (conditions.length > 1) {
      const whereClause = conditions.slice(1).reduce((acc, condition) => and2(acc, condition), conditions[0]);
      return await query.where(whereClause).limit(limit).orderBy(desc2(auditLogs.timestamp));
    }
    return await query.limit(limit).orderBy(desc2(auditLogs.timestamp));
  }
  async clearAuditLogs() {
    await db.delete(auditLogs);
  }
  // Reports
  async createReport(report) {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }
  async getReports(status, type, search) {
    let query = db.select().from(reports);
    const conditions = [];
    if (status) conditions.push(eq2(reports.status, status));
    if (type) conditions.push(eq2(reports.type, type));
    if (search) {
      const escapedSearch = search.replace(/[%_]/g, "\\$&");
      const searchPattern = `%${escapedSearch}%`;
      const searchCondition = or2(
        sql3`LOWER(${reports.subject}) LIKE LOWER(${searchPattern}) ESCAPE '\\'`,
        sql3`LOWER(${reports.description}) LIKE LOWER(${searchPattern}) ESCAPE '\\'`
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    if (conditions.length === 1) {
      return await query.where(conditions[0]).orderBy(desc2(reports.createdAt));
    }
    if (conditions.length > 1) {
      const whereClause = conditions.slice(1).reduce((acc, condition) => and2(acc, condition), conditions[0]);
      return await query.where(whereClause).orderBy(desc2(reports.createdAt));
    }
    return await query.orderBy(desc2(reports.createdAt));
  }
  async updateReportStatus(id, status, resolvedBy, adminNotes) {
    const [updatedReport] = await db.update(reports).set({
      status,
      adminNotes: adminNotes || null,
      resolvedAt: status === "resolved" ? /* @__PURE__ */ new Date() : null,
      resolvedBy: status === "resolved" ? resolvedBy : null
    }).where(eq2(reports.id, id)).returning();
    return updatedReport;
  }
  async deleteReport(id) {
    await db.delete(reports).where(eq2(reports.id, id));
  }
  async deleteReports(ids) {
    if (ids.length === 0) return;
    await db.delete(reports).where(inArray2(reports.id, ids));
  }
  async deleteAllReports() {
    await db.delete(reports);
  }
  // Feedback
  async createFeedback(data) {
    const [newFeedback] = await db.insert(feedback).values(data).returning();
    return newFeedback;
  }
  async getFeedback(limit = 100) {
    return await db.select({
      id: feedback.id,
      userId: feedback.userId,
      rating: feedback.rating,
      comment: feedback.comment,
      timestamp: feedback.timestamp,
      userName: users.name
    }).from(feedback).leftJoin(users, eq2(feedback.userId, users.id)).orderBy(desc2(feedback.timestamp)).limit(limit);
  }
  // System Settings
  async getSystemSetting(key) {
    const cached = this.settingCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
    const pending = this.pendingSettings.get(key);
    if (pending) {
      return await pending;
    }
    const fetchPromise = (async () => {
      try {
        const [setting] = await db.select().from(systemSettings).where(eq2(systemSettings.key, key));
        this.settingCache.set(key, { value: setting, expires: Date.now() + 6e4 });
        return setting;
      } finally {
        this.pendingSettings.delete(key);
      }
    })();
    this.pendingSettings.set(key, fetchPromise);
    return await fetchPromise;
  }
  async setSystemSetting(key, value, userId) {
    const [setting] = await db.insert(systemSettings).values({ key, value, updatedBy: userId }).onConflictDoUpdate({
      target: systemSettings.key,
      set: { value, updatedBy: userId, updatedAt: /* @__PURE__ */ new Date() }
    }).returning();
    this.settingCache.set(key, { value: setting, expires: Date.now() + 6e4 });
    return setting;
  }
  // Behavioral Tracking & Recommendations
  async trackPostInteraction(userId, postId, interactionType, durationSeconds, metadata) {
    try {
      await db.insert(postInteractions).values({
        userId,
        postId,
        interactionType,
        durationSeconds: durationSeconds || 0,
        metadata: metadata || null
      });
      if (interactionType === "connection_request" || interactionType === "click" || interactionType === "interested" || interactionType === "not_interested") {
        const { updateUserPreferencesFromInteractions: updateUserPreferencesFromInteractions2 } = await Promise.resolve().then(() => (init_recommendations(), recommendations_exports));
        waitUntil(
          updateUserPreferencesFromInteractions2(userId).catch((error) => {
            logger.error("Failed immediate preference refresh", { error, userId, interactionType });
          })
        );
      }
      this.updateUserPreferencesThrottled(userId);
    } catch (error) {
      logger.error("Failed to track post interaction", { error, userId, postId, interactionType });
    }
  }
  async trackUserSearch(userId, query, filters, resultsCount, clickedPostIds) {
    try {
      const normalizedQuery = (query || "").trim().toLowerCase();
      const normalizedFilters = filters && typeof filters === "object" ? filters : {};
      const uniqueClickedPostIds = Array.from(new Set((clickedPostIds || []).filter(Boolean)));
      const hasFilter = Object.values(normalizedFilters).some(
        (value) => typeof value === "string" ? value.trim().length > 0 : Boolean(value)
      );
      if (!normalizedQuery && !hasFilter && uniqueClickedPostIds.length === 0) {
        return;
      }
      await db.insert(userSearches).values({
        userId,
        query: normalizedQuery,
        filters: normalizedFilters,
        resultsCount,
        clickedPostIds: uniqueClickedPostIds
      });
    } catch (error) {
      logger.error("Failed to track user search", { error, userId, query });
    }
  }
  async getRecommendedPostIds(userId, limit = 20) {
    try {
      const { getRecommendedPosts: getRecommendedPosts2 } = await Promise.resolve().then(() => (init_recommendations(), recommendations_exports));
      const recentInteractions = await db.select({ postId: postInteractions.postId }).from(postInteractions).where(eq2(postInteractions.userId, userId)).orderBy(desc2(postInteractions.createdAt)).limit(100);
      const excludeIds = recentInteractions.map((i) => i.postId);
      const recommendations = await getRecommendedPosts2(userId, excludeIds, limit);
      return recommendations.map((r) => r.postId.toString());
    } catch (error) {
      logger.error("Failed to get recommendations", { error, userId });
      return [];
    }
  }
  async getSearchSuggestions(userId, limit = 5) {
    try {
      const { getSearchSuggestions: getSuggestions } = await Promise.resolve().then(() => (init_recommendations(), recommendations_exports));
      return await getSuggestions(userId, limit);
    } catch (error) {
      logger.error("Failed to get search suggestions", { error, userId });
      return [];
    }
  }
  async getPersonalizationMetrics(days = 30) {
    const safeDays = Number.isFinite(days) ? Math.min(Math.max(days, 1), 365) : 30;
    const [interactionAgg] = await db.select({
      views: sql3`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'view')`,
      clicks: sql3`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'click')`,
      connections: sql3`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'connection_request')`,
      total: sql3`COUNT(*)`
    }).from(postInteractions).where(sql3`${postInteractions.createdAt} > unixepoch() - (${safeDays} * 86400)`);
    const [searchAgg] = await db.select({ total: sql3`COUNT(*)` }).from(userSearches).where(sql3`${userSearches.createdAt} > unixepoch() - (${safeDays} * 86400)`);
    const views = Number(interactionAgg?.views || 0);
    const clicks = Number(interactionAgg?.clicks || 0);
    const connections = Number(interactionAgg?.connections || 0);
    const ctr = views > 0 ? clicks / views : 0;
    const connectionRate = clicks > 0 ? connections / clicks : 0;
    return {
      ctr,
      connectionRate,
      trackedSearches: Number(searchAgg?.total || 0),
      trackedInteractions: Number(interactionAgg?.total || 0)
    };
  }
  // Throttle user preference updates (update at most once per 60 seconds per user)
  preferenceUpdateTimestamps = /* @__PURE__ */ new Map();
  updateUserPreferencesThrottled(userId) {
    const now = Date.now();
    const lastUpdate = this.preferenceUpdateTimestamps.get(userId) || 0;
    if (now - lastUpdate > 6e4) {
      this.preferenceUpdateTimestamps.set(userId, now);
      waitUntil((async () => {
        try {
          const { updateUserPreferencesFromInteractions: updateUserPreferencesFromInteractions2 } = await Promise.resolve().then(() => (init_recommendations(), recommendations_exports));
          await updateUserPreferencesFromInteractions2(userId);
        } catch (error) {
          logger.error("Failed to update user preferences", { error, userId });
        }
      })());
    }
  }
};
var storage = new DatabaseStorage();

// lib/routes.ts
init_schema_sqlite();
init_constants();

// lib/routes/events.ts
init_db();
init_schema_sqlite();

// lib/matching.ts
function computeMatchScore(studentSkills = [], studentInterests = [], requiredSkills = [], requiredInterests = []) {
  if (requiredSkills.length === 0 && requiredInterests.length === 0) {
    return {
      score: 100,
      skillMatchPercentage: 100,
      interestMatchPercentage: 100,
      matchedSkills: [],
      matchedInterests: [],
      missingSkills: [],
      missingInterests: [],
      isEligible: true
    };
  }
  const normalizedStudentSkills = normalizeArray(studentSkills);
  const normalizedStudentInterests = normalizeArray(studentInterests);
  const normalizedRequiredSkills = normalizeArray(requiredSkills);
  const normalizedRequiredInterests = normalizeArray(requiredInterests);
  const skillMatches = findIntersection(
    normalizedStudentSkills,
    normalizedRequiredSkills
  );
  const skillMatchPercentage = normalizedRequiredSkills.length > 0 ? skillMatches.length / normalizedRequiredSkills.length * 100 : 100;
  const interestMatches = findIntersection(
    normalizedStudentInterests,
    normalizedRequiredInterests
  );
  const interestMatchPercentage = normalizedRequiredInterests.length > 0 ? interestMatches.length / normalizedRequiredInterests.length * 100 : 100;
  const score = skillMatchPercentage * 0.6 + interestMatchPercentage * 0.4;
  const isEligible = score >= 40;
  const missingSkills = normalizedRequiredSkills.filter(
    (skill) => !skillMatches.includes(skill)
  );
  const missingInterests = normalizedRequiredInterests.filter(
    (interest) => !interestMatches.includes(interest)
  );
  return {
    score: Math.round(score),
    skillMatchPercentage: Math.round(skillMatchPercentage),
    interestMatchPercentage: Math.round(interestMatchPercentage),
    matchedSkills: skillMatches,
    matchedInterests: interestMatches,
    missingSkills,
    missingInterests,
    isEligible
  };
}
function normalizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return Array.from(
    new Set(
      arr.filter((item) => typeof item === "string").map((item) => item.toLowerCase().trim()).filter((item) => item.length > 0)
    )
  );
}
function findIntersection(arr1, arr2) {
  const set1 = new Set(arr1.map((s) => s.toLowerCase()));
  return arr2.filter((item) => set1.has(item.toLowerCase()));
}

// lib/routes/events.ts
import { eq as eq3, and as and3, or as or3, sql as sql4, inArray as inArray3, asc as asc2 } from "drizzle-orm";
async function registerForEvent(req, res, next) {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const userId = req.user.id;
    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.eventType !== "intra-college") {
      return res.status(400).json({
        message: "Only intra-college events support cross-department registration"
      });
    }
    const existing = await storage.getExistingRegistration(eventId, userId);
    if (existing) {
      return res.status(409).json({ message: "Already registered for this event" });
    }
    const student = await storage.getUser(userId);
    if (!student) {
      return res.status(401).json({ message: "User not found" });
    }
    const eventOrganizer = await storage.getUser(event.userId);
    if (!eventOrganizer) {
      return res.status(400).json({ message: "Event organizer not found" });
    }
    const isCrossDept = student.department !== eventOrganizer.department;
    const registrationType = isCrossDept ? "cross_department" : "department";
    if (event.eventType === "intra-college" && event.allowedDepartments && Array.isArray(event.allowedDepartments)) {
      const isAllowed = event.allowedDepartments.includes(student.department);
      if (!isAllowed) {
        return res.status(403).json({
          message: "This event is only open to specific departments. Your department is not eligible.",
          allowedDepartments: event.allowedDepartments
        });
      }
    }
    const approvalRequired = Boolean(event.isEventOrganiser && event.crossDeptRequiresApproval);
    let matchScore = null;
    let status = approvalRequired ? "pending" : "confirmed";
    if (!isCrossDept) {
      if (event.requiredSkills?.length || event.requiredInterests?.length) {
        const matchResult = computeMatchScore(
          student.skills || [],
          student.interests || [],
          event.requiredSkills || [],
          event.requiredInterests || []
        );
        if (!matchResult.isEligible) {
          return res.status(400).json({
            message: "You don't meet the minimum requirements for this event",
            matchScoreResult: {
              score: matchResult.score,
              skillMatch: matchResult.skillMatchPercentage,
              interestMatch: matchResult.interestMatchPercentage,
              missingSkills: matchResult.missingSkills,
              missingInterests: matchResult.missingInterests
            }
          });
        }
      }
    }
    if (isCrossDept && event.eventType === "intra-college" && event.allowedDepartments && Array.isArray(event.allowedDepartments)) {
      const matchResult = computeMatchScore(
        student.skills || [],
        student.interests || [],
        event.requiredSkills || [],
        event.requiredInterests || []
      );
      matchScore = matchResult.score;
      if (!matchResult.isEligible) {
        return res.status(400).json({
          message: "You don't meet the minimum requirements for this event",
          matchScoreResult: {
            score: matchResult.score,
            skillMatch: matchResult.skillMatchPercentage,
            interestMatch: matchResult.interestMatchPercentage,
            missingSkills: matchResult.missingSkills,
            missingInterests: matchResult.missingInterests
          }
        });
      }
      status = approvalRequired ? "pending" : "confirmed";
    }
    let registration;
    let attempts = 0;
    while (attempts < 10) {
      try {
        registration = await db.transaction(async (tx) => {
          await tx.run(sql4`PRAGMA busy_timeout = 10000;`);
          if (event.maxCrossDeptParticipants) {
            const crossDeptCount = await tx.select({ count: sql4`count(*)` }).from(eventRegistrations).where(
              and3(
                eq3(eventRegistrations.postId, eventId),
                eq3(eventRegistrations.registrationType, "cross_department"),
                or3(
                  eq3(eventRegistrations.status, "confirmed"),
                  eq3(eventRegistrations.status, "approved")
                )
              )
            );
            if (Number(crossDeptCount[0]?.count || 0) >= event.maxCrossDeptParticipants) {
              throw new Error("CAPACITY_EXCEEDED");
            }
          }
          const [newReg] = await tx.insert(eventRegistrations).values({
            postId: eventId,
            userId,
            registrationType,
            matchScore,
            status,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).returning();
          return newReg;
        }, { behavior: "immediate" });
        break;
      } catch (txErr) {
        if (txErr.code === "SQLITE_BUSY" || txErr.message?.includes("SQLITE_BUSY") || txErr.message?.includes("database is locked")) {
          attempts++;
          if (attempts >= 10) throw txErr;
          await new Promise((r) => setTimeout(r, 10 + Math.random() * 40 * attempts));
          continue;
        }
        if (txErr.message === "CAPACITY_EXCEEDED") {
          return res.status(400).json({
            message: "This event has reached the maximum number of cross-department participants"
          });
        }
        throw txErr;
      }
    }
    await storage.logAudit({
      action: "EVENT_REGISTRATION",
      resource: "EVENT",
      userId,
      userName: student.name,
      details: {
        eventId,
        registrationType,
        matchScore,
        status
      }
    });
    if (status === "pending" || isCrossDept && status === "confirmed") {
      await db.insert(notifications).values({
        userId: event.userId,
        // Send to organizer
        type: "event_registration",
        title: `New ${isCrossDept ? "cross-department" : ""} registration`,
        message: `${student.name} from ${student.department} ${status === "pending" ? "requested to join" : "registered for"} ${event.eventName}${matchScore ? ` (${matchScore}% match)` : ""}`,
        metadata: {
          eventId,
          registrationId: registration?.id,
          studentId: userId,
          studentName: student.name,
          matchScore,
          status
        },
        isRead: false
      });
    }
    if (isCrossDept && status === "confirmed" && event.maxCrossDeptParticipants) {
      const confirmedCount = await db.select({ count: sql4`count(*)` }).from(eventRegistrations).where(
        and3(
          eq3(eventRegistrations.postId, eventId),
          eq3(eventRegistrations.registrationType, "cross_department"),
          or3(
            eq3(eventRegistrations.status, "confirmed"),
            eq3(eventRegistrations.status, "approved")
          )
        )
      );
      const currentCount = Number(confirmedCount[0]?.count || 0);
      const threshold = Math.floor(event.maxCrossDeptParticipants * 0.8);
      if (currentCount >= threshold && currentCount <= event.maxCrossDeptParticipants) {
        await db.insert(notifications).values({
          userId: event.userId,
          type: "event_cap_warning",
          title: "Event Nearing Capacity",
          message: `Your event "${event.eventName}" has ${currentCount} of ${event.maxCrossDeptParticipants} cross-department spots filled.`,
          metadata: {
            eventId,
            currentCount,
            maxCount: event.maxCrossDeptParticipants
          },
          isRead: false
        });
      }
    }
    res.status(201).json({
      message: status === "pending" ? "Registration submitted for approval" : "Successfully registered for event",
      registration
    });
  } catch (error) {
    next(error);
  }
}
async function getEventRegistrations(req, res, next) {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const registrations = await storage.getEventRegistrations(eventId);
    const enriched = await Promise.all(
      registrations.map(async (reg) => {
        const user = await storage.getUser(reg.userId);
        return {
          ...reg,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            skills: user.skills,
            interests: user.interests,
            avatar: user.avatar
          } : null
        };
      })
    );
    res.json({
      total: enriched.length,
      registrations: enriched,
      stats: {
        pending: enriched.filter((r) => r.status === "pending").length,
        approved: enriched.filter((r) => r.status === "approved").length,
        rejected: enriched.filter((r) => r.status === "rejected").length,
        confirmed: enriched.filter((r) => r.status === "confirmed").length,
        crossDept: enriched.filter(
          (r) => r.registrationType === "cross_department"
        ).length,
        department: enriched.filter(
          (r) => r.registrationType === "department"
        ).length
      }
    });
  } catch (error) {
    next(error);
  }
}
async function approveRegistration(req, res, next) {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const regId = Array.isArray(req.params.regId) ? req.params.regId[0] : req.params.regId;
    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const registration = await storage.getEventRegistration(regId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    if (registration.postId !== eventId) {
      return res.status(400).json({ message: "Registration does not belong to this event" });
    }
    if (registration.status !== "pending") {
      return res.status(400).json({ message: "Only pending registrations can be approved" });
    }
    let approvalTxError = null;
    const updated = await db.transaction(async (tx) => {
      const [pendingRegistration] = await tx.select().from(eventRegistrations).where(eq3(eventRegistrations.id, regId)).limit(1);
      if (!pendingRegistration) {
        throw new Error("REGISTRATION_NOT_FOUND");
      }
      if (pendingRegistration.postId !== eventId) {
        throw new Error("REGISTRATION_EVENT_MISMATCH");
      }
      if (pendingRegistration.status !== "pending") {
        throw new Error("REGISTRATION_NOT_PENDING");
      }
      if (pendingRegistration.registrationType === "cross_department" && event.maxCrossDeptParticipants) {
        const currentCrossDeptCount = await tx.select({ count: sql4`count(*)` }).from(eventRegistrations).where(
          and3(
            eq3(eventRegistrations.postId, eventId),
            eq3(eventRegistrations.registrationType, "cross_department"),
            or3(
              eq3(eventRegistrations.status, "confirmed"),
              eq3(eventRegistrations.status, "approved")
            )
          )
        );
        if (Number(currentCrossDeptCount[0]?.count || 0) >= event.maxCrossDeptParticipants) {
          throw new Error("CAPACITY_EXCEEDED");
        }
      }
      const [approvedRegistration] = await tx.update(eventRegistrations).set({
        status: "approved",
        updatedAt: /* @__PURE__ */ new Date(),
        rejectionReason: null
      }).where(eq3(eventRegistrations.id, regId)).returning();
      return approvedRegistration;
    }).catch((txErr) => {
      approvalTxError = txErr?.message || "UNKNOWN";
      return null;
    });
    if (!updated) {
      if (approvalTxError === "CAPACITY_EXCEEDED") {
        return res.status(400).json({
          message: "This event has reached the maximum number of cross-department participants"
        });
      }
      if (approvalTxError === "REGISTRATION_NOT_PENDING") {
        return res.status(400).json({ message: "Only pending registrations can be approved" });
      }
      if (approvalTxError === "REGISTRATION_EVENT_MISMATCH") {
        return res.status(400).json({ message: "Registration does not belong to this event" });
      }
      if (approvalTxError === "REGISTRATION_NOT_FOUND") {
        return res.status(404).json({ message: "Registration not found" });
      }
      return res.status(400).json({
        message: "Unable to approve registration"
      });
    }
    await storage.logAudit({
      action: "APPROVE_EVENT_REGISTRATION",
      resource: "EVENT",
      userId: req.user.id,
      userName: req.user.username || req.user.name,
      details: {
        eventId,
        registrationId: regId,
        approvedUserId: registration.userId
      }
    });
    const studentUserApprove = await storage.getUser(registration.userId);
    if (studentUserApprove) {
      await db.insert(notifications).values({
        userId: registration.userId,
        type: "event_approval",
        title: "Registration Approved!",
        message: `Your registration for ${event.eventName} has been approved. See you there!`,
        metadata: {
          eventId,
          registrationId: regId,
          eventName: event.eventName
        },
        isRead: false
      });
    }
    if (event.maxCrossDeptParticipants) {
      const approvedOrConfirmedCount = await db.select({ count: sql4`count(*)` }).from(eventRegistrations).where(
        and3(
          eq3(eventRegistrations.postId, eventId),
          eq3(eventRegistrations.registrationType, "cross_department"),
          or3(
            eq3(eventRegistrations.status, "confirmed"),
            eq3(eventRegistrations.status, "approved")
          )
        )
      );
      const currentCount = Number(approvedOrConfirmedCount[0]?.count || 0);
      const threshold = Math.floor(event.maxCrossDeptParticipants * 0.8);
      if (currentCount >= threshold && currentCount <= event.maxCrossDeptParticipants) {
        await db.insert(notifications).values({
          userId: event.userId,
          type: "event_cap_warning",
          title: "Event Nearing Capacity",
          message: `Your event "${event.eventName}" has ${currentCount} of ${event.maxCrossDeptParticipants} cross-department spots filled.`,
          metadata: {
            eventId,
            currentCount,
            maxCount: event.maxCrossDeptParticipants
          },
          isRead: false
        });
      }
    }
    res.json({
      message: "Registration approved",
      registration: updated
    });
  } catch (error) {
    next(error);
  }
}
async function rejectRegistration(req, res, next) {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const regId = Array.isArray(req.params.regId) ? req.params.regId[0] : req.params.regId;
    const { reason } = req.body;
    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const registration = await storage.getEventRegistration(regId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    if (registration.postId !== eventId) {
      return res.status(400).json({ message: "Registration does not belong to this event" });
    }
    if (registration.status !== "pending") {
      return res.status(400).json({ message: "Only pending registrations can be rejected" });
    }
    const updated = await storage.updateEventRegistrationStatus(
      regId,
      "rejected",
      reason
    );
    await storage.logAudit({
      action: "REJECT_EVENT_REGISTRATION",
      resource: "EVENT",
      userId: req.user.id,
      userName: req.user.username || req.user.name,
      details: {
        eventId,
        registrationId: regId,
        rejectedUserId: registration.userId,
        reason
      }
    });
    const studentUserReject = await storage.getUser(registration.userId);
    if (studentUserReject) {
      await db.insert(notifications).values({
        userId: registration.userId,
        type: "event_rejection",
        title: "Registration Not Approved",
        message: `Unfortunately, your registration for ${event.eventName} was not approved.${reason ? ` Reason: ${reason}` : ""}`,
        metadata: {
          eventId,
          registrationId: regId,
          eventName: event.eventName,
          reason
        },
        isRead: false
      });
    }
    res.json({
      message: "Registration rejected",
      registration: updated
    });
  } catch (error) {
    next(error);
  }
}
async function deleteRegistration(req, res, next) {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const regId = Array.isArray(req.params.regId) ? req.params.regId[0] : req.params.regId;
    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const registration = await storage.getEventRegistration(regId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    if (registration.postId !== eventId) {
      return res.status(400).json({ message: "Registration does not belong to this event" });
    }
    if (!(registration.status === "approved" || registration.status === "confirmed")) {
      return res.status(400).json({ message: "Only approved or confirmed registrations can be removed" });
    }
    await storage.deleteEventRegistration(regId);
    await storage.logAudit({
      action: "DELETE_EVENT_REGISTRATION",
      resource: "EVENT",
      userId: req.user.id,
      userName: req.user.username || req.user.name,
      details: {
        eventId,
        registrationId: regId,
        removedUserId: registration.userId
      }
    });
    const removedUser = await storage.getUser(registration.userId);
    if (removedUser) {
      await db.insert(notifications).values({
        userId: registration.userId,
        type: "event_registration_removed",
        title: "Registration Removed",
        message: `Your registration for ${event.eventName} has been removed by the organiser.`,
        metadata: {
          eventId,
          registrationId: regId,
          eventName: event.eventName
        },
        isRead: false
      });
    }
    res.json({
      message: "Registration removed",
      registrationId: regId
    });
  } catch (error) {
    next(error);
  }
}
async function getEventMatchScore(req, res, next) {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const userId = req.user.id;
    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.eventType !== "intra-college") {
      return res.status(400).json({
        message: "Match score only available for intra-college events"
      });
    }
    const student = await storage.getUser(userId);
    if (!student) {
      return res.status(401).json({ message: "User not found" });
    }
    const matchResult = computeMatchScore(
      student.skills || [],
      student.interests || [],
      event.requiredSkills || [],
      event.requiredInterests || []
    );
    res.json({
      score: matchResult.score,
      isEligible: matchResult.isEligible,
      skillMatch: matchResult.skillMatchPercentage,
      interestMatch: matchResult.interestMatchPercentage,
      matchedSkills: matchResult.matchedSkills,
      matchedInterests: matchResult.matchedInterests,
      missingSkills: matchResult.missingSkills,
      missingInterests: matchResult.missingInterests
    });
  } catch (error) {
    next(error);
  }
}

// lib/routes.ts
import { z as z2 } from "zod";

// lib/ratelimit.ts
init_logger();
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
var isConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
var redis = isConfigured ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
}) : null;
function rateLimit(opts) {
  if (!redis) {
    return (req, res, next) => next();
  }
  const windowStr = `${Math.ceil(opts.windowMs / 1e3)}s`;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(opts.max, windowStr),
    analytics: false
  });
  return async (req, res, next) => {
    try {
      const key = opts.keyGenerator ? opts.keyGenerator(req) : req.ip || "unknown-ip";
      const { success, limit, remaining, reset } = await limiter.limit(key);
      if (opts.standardHeaders) {
        res.setHeader("RateLimit-Limit", limit);
        res.setHeader("RateLimit-Remaining", remaining);
        res.setHeader("RateLimit-Reset", reset);
      }
      if (!success) {
        res.status(429).json(opts.message);
        return;
      }
      next();
    } catch (error) {
      logger.error("Rate limiting error (failing open)", error);
      next();
    }
  };
}

// lib/middleware/auth.ts
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user.isBanned && !req.user.isAdmin) {
    return res.status(403).json({ message: "You have been banned and cannot perform this action", code: "USER_BANNED" });
  }
  next();
}
var requireVerifiedAuth = requireAuth;
function getSuperAdminEmails() {
  return (process.env.SUPER_ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}
function isSuperAdminEmail(email) {
  if (!email) return false;
  const superAdminEmails = getSuperAdminEmails();
  return superAdminEmails.length > 0 && superAdminEmails.includes(email.toLowerCase());
}
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user.isBanned && !req.user.isAdmin) {
    return res.status(403).json({ message: "You have been banned and cannot perform this action", code: "USER_BANNED" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access only" });
  }
  next();
}
function requireOrganiser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user.isBanned && !req.user.isAdmin) {
    return res.status(403).json({ message: "You have been banned and cannot perform this action", code: "USER_BANNED" });
  }
  if (!req.user.isOrganiser && !req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Organiser access only" });
  }
  next();
}
function optionalAuth(_req, _res, next) {
  next();
}

// lib/routes.ts
init_cloudinary();
init_db();
import multer from "multer";
import path from "path";

// lib/auth.ts
import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from "crypto";
init_logger();

// lib/middleware.ts
import session2 from "express-session";

// lib/session.ts
init_db();
init_schema_sqlite();
import { Store } from "express-session";
import { eq as eq4, lt as lt2 } from "drizzle-orm";
console.log("session starts-----");
async function withTimeout(promise, ms, label) {
  console.log("session starts inside withTimeout-----");
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  console.log("inside withTimeout before try");
  try {
    console.log("inside withTimeout try");
    return await Promise.race([promise, timeout]);
  } finally {
    console.log("inside withTimeout finally");
    clearTimeout(timer);
  }
}
var TursoSessionStore = class extends Store {
  cache = /* @__PURE__ */ new Map();
  async get(sid, cb) {
    console.log("inside get-----------------");
    try {
      console.log("inside try");
      const cached = this.cache.get(sid);
      if (cached && cached.expire > Date.now()) {
        console.log("inside cache hit");
        return cb(null, cached.sess);
      }
      console.log("before await withTimeout get");
      const [row] = await withTimeout(
        db.select().from(session).where(eq4(session.sid, sid)),
        2e3,
        "TursoSessionStore.get"
      );
      console.log("after await withTimeout get");
      if (!row || row.expire.getTime() < Date.now()) return cb(null, void 0);
      this.cache.set(sid, { sess: row.sess, expire: Date.now() + 15e3 });
      console.log("after cache set");
      cb(null, row.sess);
    } catch (err) {
      console.error("TursoSessionStore.get error:", err);
      cb(null, void 0);
    }
  }
  async set(sid, sess, cb) {
    console.log("inside set-----------------");
    try {
      this.cache.delete(sid);
      const expire = new Date(sess.cookie?.expires ?? Date.now() + 3 * 24 * 60 * 60 * 1e3);
      console.log("before await withTimeout set");
      await withTimeout(
        db.insert(session).values({ sid, sess, expire }).onConflictDoUpdate({ target: session.sid, set: { sess, expire } }),
        2e3,
        "TursoSessionStore.set"
      );
      console.log("after await withTimeout set");
      cb?.();
    } catch (err) {
      console.error("TursoSessionStore.set error:", err);
      cb?.(err);
    }
  }
  async destroy(sid, cb) {
    try {
      this.cache.delete(sid);
      console.log("before await withTimeout destroy");
      await withTimeout(
        db.delete(session).where(eq4(session.sid, sid)),
        2e3,
        "TursoSessionStore.destroy"
      );
      console.log("after await withTimeout destroy");
      cb?.();
    } catch (err) {
      console.error("TursoSessionStore.destroy error:", err);
      cb?.(err);
    }
  }
  async touch(sid, sess, cb) {
    try {
      console.log("inside touch-----------------");
      const expire = new Date(sess.cookie?.expires ?? Date.now() + 3 * 24 * 60 * 60 * 1e3);
      this.cache.set(sid, { sess, expire: Date.now() + 15e3 });
      const msUntilExpire = expire.getTime() - Date.now();
      const sixHoursMs = 6 * 60 * 60 * 1e3;
      if (msUntilExpire > sixHoursMs) {
        return cb?.();
      }
      console.log("before await withTimeout touch");
      await withTimeout(
        db.update(session).set({ expire }).where(eq4(session.sid, sid)),
        2e3,
        "TursoSessionStore.touch"
      );
      console.log("after await withTimeout touch");
      cb?.();
    } catch (err) {
      console.error("TursoSessionStore.touch error:", err);
      cb?.(err);
    }
  }
  /** Called by the daily cron job, NOT by setInterval. */
  async prune() {
    const now = /* @__PURE__ */ new Date();
    await db.delete(session).where(lt2(session.expire, now));
  }
};
var sessionStore = new TursoSessionStore();

// lib/middleware.ts
import { doubleCsrf } from "csrf-csrf";
import cookieParser from "cookie-parser";
var isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
var sessionMiddleware = session2({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 3 * 24 * 60 * 60 * 1e3,
    // 3 days
    sameSite: "lax"
  }
});
var {
  generateToken: _generateCsrfToken,
  doubleCsrfProtection: _doubleCsrfProtection
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "dev-csrf-secret-change-in-prod",
  cookieName: "x-csrf-token",
  cookieOptions: {
    sameSite: "lax",
    path: "/",
    secure: isProduction,
    httpOnly: false
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: (req) => req.headers["x-csrf-token"],
  getSessionIdentifier: (req) => req.sessionID || "anonymous"
});
var generateCsrfToken = _generateCsrfToken;
var allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://findateammate.online",
  "https://findateammate.info",
  ...isProduction ? [] : ["http://localhost:5000", "http://localhost:5173", "http://localhost:3000"]
].filter(Boolean);
function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-csrf-token, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      resolve();
    });
  });
}
async function loadUser(req) {
  if (req.user) return;
  const userId = req.session?.userId || req.session?.passport?.user;
  if (!userId) return;
  try {
    const userPromise = storage.getUser(userId);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("loadUser Turso Query Timed Out")), 3e3));
    const user = await Promise.race([userPromise, timeoutPromise]);
    if (user) {
      const { password, ...safeUser } = user;
      req.user = safeUser;
      storage.updateLastActive(user.id).catch(() => {
      });
    }
  } catch {
  }
}
async function bootstrap(req, res) {
  if (!res.cookie) {
    res.cookie = (name, val, opts) => {
      const str = `${name}=${val}; Path=/` + (opts?.httpOnly ? "; HttpOnly" : "");
      res.setHeader("Set-Cookie", str);
    };
  }
  try {
    if (setCorsHeaders(req, res)) return false;
    console.log("Cookieparser----");
    await runMiddleware(req, res, cookieParser());
    console.log("sessionMiddleware-----");
    await runMiddleware(req, res, sessionMiddleware);
    await loadUser(req);
    const isInternal = req.url?.startsWith("/api/internal");
    const isAnalytics = req.url?.startsWith("/api/analytics");
    const hasPartyKitSecret = !!req.headers["x-partykit-secret"];
    console.log("before doubleCsrfProtection");
    if (req.url && req.url.startsWith("/api") && !isInternal && !isAnalytics && !hasPartyKitSecret) {
      await runMiddleware(req, res, _doubleCsrfProtection);
      console.log("inside doubleCsrfProtection");
    }
    console.log("after doubleCsrfProtection");
    return true;
  } catch (error) {
    if (error.code === "EBADCSRFTOKEN") {
      res.status(403).json({ message: "Invalid CSRF Token" });
    } else {
      console.error("Middleware error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
    return false;
  }
}

// lib/auth.ts
var authApp = express();
authApp.use(sessionMiddleware);
authApp.use(passport.initialize());
authApp.use(passport.session());
var callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL,
  scope: ["profile", "email"],
  state: true
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0].value;
    if (!email) return done(new Error("No email found in Google profile"));
    let user = await storage.getUserByGoogleId(profile.id);
    if (user) return done(null, user);
    user = await storage.getUserByEmail(email);
    if (user) {
      user = await storage.updateUser(user.id, {
        googleId: profile.id,
        authProvider: "google",
        avatar: profile.photos?.[0].value || user.avatar
      });
      return done(null, user);
    }
    try {
      user = await storage.createOAuthUser({
        name: profile.displayName,
        email,
        username: `user_${crypto.randomBytes(4).toString("hex")}`,
        googleId: profile.id,
        avatar: profile.photos?.[0].value,
        authProvider: "google",
        skills: [],
        bio: "",
        portfolio: "",
        github: "",
        department: "OTHER",
        city: "",
        university: "",
        privacy: { showEmail: false, showPortfolio: false, showUniversity: false, showCity: false }
      });
      try {
        const { sendWelcomeEmail: sendWelcomeEmail2 } = await Promise.resolve().then(() => (init_mail(), mail_exports));
        await sendWelcomeEmail2(user.email, user.name || user.username || "there");
      } catch (mailError) {
        logger.error("Failed to send welcome email on registration", mailError);
      }
    } catch (insertError) {
      user = await storage.getUserByGoogleId(profile.id) || await storage.getUserByEmail(email);
      if (!user) return done(insertError);
    }
    return done(null, { ...user, isNewUser: true });
  } catch (err) {
    return done(err);
  }
}));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user || null);
  } catch (err) {
    done(null, null);
  }
});
authApp.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authApp.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=oauth_failed" }),
  async (req, res) => {
    const userBeforeRegen = req.user;
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      req.login(userBeforeRegen, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    const frontendUrl = process.env.FRONTEND_URL || "";
    const hasSkills = Array.isArray(userBeforeRegen?.skills) && userBeforeRegen.skills.length > 0;
    const hasCity = Boolean((userBeforeRegen?.city || "").trim());
    const hasUniversity = Boolean((userBeforeRegen?.university || "").trim());
    const normalizedDepartment = String(userBeforeRegen?.department || "").trim().toUpperCase();
    const hasDepartment = normalizedDepartment.length > 0 && normalizedDepartment !== "OTHER";
    const isNewUser = userBeforeRegen?.isNewUser || !(hasSkills && hasCity && hasUniversity && hasDepartment);
    if (isNewUser) {
      return res.redirect(`${frontendUrl}/onboarding`);
    }
    res.redirect(`${frontendUrl}/`);
  }
);

// lib/routes/auth-local.ts
init_db();
init_schema_sqlite();
init_logger();
import { Router } from "express";
import { eq as eq5 } from "drizzle-orm";
import crypto2 from "crypto";
import { promisify } from "util";
var authLocalRouter = Router();
var scryptAsync = promisify(crypto2.scrypt);
async function withTimeout2(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedKey = await scryptAsync(password, salt, 64);
  return key === derivedKey.toString("hex");
}
async function hashPassword(password) {
  const salt = crypto2.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}
authLocalRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const existingUsers = await withTimeout2(
      db.select().from(users).where(eq5(users.email, email)).limit(1),
      5e3,
      "Turso DB Login Query"
    );
    const user = existingUsers[0];
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    req.session.userId = user.id;
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    const { password: _, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (error) {
    logger.error("Login error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
authLocalRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }
    const existingUser = await withTimeout2(
      db.select().from(users).where(eq5(users.email, email)).limit(1),
      5e3,
      "Turso DB Signup Check"
    );
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const hashedPassword = await hashPassword(password);
    const username = `user_${crypto2.randomBytes(4).toString("hex")}`;
    const insertData = {
      email,
      name,
      username,
      password: hashedPassword,
      authProvider: "local",
      skills: [],
      bio: "",
      portfolio: "",
      github: "",
      department: "OTHER",
      city: "",
      university: "",
      privacy: { showEmail: false, showPortfolio: false, showUniversity: false, showCity: false }
    };
    const [newUser] = await withTimeout2(
      db.insert(users).values(insertData).returning(),
      5e3,
      "Turso DB Signup Insert"
    );
    res.status(201).json(newUser);
  } catch (error) {
    logger.error("Registration error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// lib/routes/internal.ts
import { Router as Router2 } from "express";

// lib/audit-scheduler.ts
init_db();
init_schema_sqlite();
init_logger();
init_mail();
import { and as and4, gte, lt as lt3 } from "drizzle-orm";
var mailProvider2 = new NodemailerProvider();
async function exportAuditLogsToCSV(startDate, endDate) {
  const logs = await db.select().from(auditLogs).where(
    and4(
      gte(auditLogs.timestamp, startDate),
      lt3(auditLogs.timestamp, endDate)
    )
  ).orderBy(auditLogs.timestamp);
  const headers = "ID,Timestamp,Action,Resource,User ID,Username,Details";
  const rows = logs.map((log) => {
    const action = `"${log.action.replace(/"/g, '""')}"`;
    const resource = `"${log.resource.replace(/"/g, '""')}"`;
    const details = log.details ? `"${JSON.stringify(log.details).replace(/"/g, '""')}"` : '""';
    return `${log.id},${log.timestamp},${action},${resource},${log.userId || ""},${log.userName || ""},${details}`;
  });
  return [headers, ...rows].join("\n");
}
async function cleanupOldAuditLogs() {
  const thirtyDaysAgo = /* @__PURE__ */ new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const deleted = await db.delete(auditLogs).where(lt3(auditLogs.timestamp, thirtyDaysAgo)).returning({ id: auditLogs.id });
  logger.log(`[Audit Cleanup] Deleted ${deleted.length} audit logs older than 30 days`);
  return deleted.length;
}
async function runWeeklyAuditExport() {
  try {
    logger.log("[Audit Export] Starting weekly audit export job");
    const endDate = /* @__PURE__ */ new Date();
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - 7);
    const weekLabel = `${startDate.toLocaleDateString("en-IN")} to ${endDate.toLocaleDateString("en-IN")}`;
    const csvContent = await exportAuditLogsToCSV(startDate, endDate);
    const logCount = csvContent.split("\n").length - 1;
    const ADMIN_REPORT_EMAIL = "findateammate.ahilight@gmail.com";
    await mailProvider2.send({
      to: ADMIN_REPORT_EMAIL,
      subject: `\u{1F4CA} Weekly Audit Report: ${weekLabel}`,
      text: `Weekly Audit Trail Report

Period: ${weekLabel}
Total Audit Entries: ${logCount}

Please find the attached CSV file with all audit trail entries for this week.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">\u{1F4CA} Weekly Audit Trail Report</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Report Period:</strong> ${weekLabel}</p>
            <p><strong>Total Audit Entries:</strong> ${logCount}</p>
            <p><strong>Generated:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          </div>
          <p>Please find the attached CSV file with all audit trail entries for this week.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            This is an automated weekly report from FindATeammate Audit System.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `audit-logs-${startDate.toISOString().split("T")[0]}-to-${endDate.toISOString().split("T")[0]}.csv`,
          content: csvContent,
          contentType: "text/csv"
        }
      ]
    });
    logger.log(`[Audit Export] Successfully exported ${logCount} audit logs for week: ${weekLabel}`);
    const deletedCount = await cleanupOldAuditLogs();
    logger.log(`[Audit Export] Cleanup completed: ${deletedCount} old logs removed`);
  } catch (error) {
    logger.error("[Audit Export] Weekly export job failed", error);
    throw error;
  }
}

// lib/cleanup-helpers.ts
init_db();
init_schema_sqlite();
init_logger();
import { lt as lt4, and as and5, inArray as inArray4, isNull as isNull2, lte, isNotNull as isNotNull2, sql as sql5 } from "drizzle-orm";
async function cleanupOldContent() {
  const now = /* @__PURE__ */ new Date();
  try {
    const chatCutoff = new Date(now.getTime() - 36 * 60 * 60 * 1e3);
    const deletedMessages = await db.delete(messages).where(lt4(messages.timestamp, chatCutoff)).returning({ id: messages.id });
    const teammateCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1e3);
    const oldTeammatePosts = await db.select({ id: posts.id, eventImage: posts.eventImage }).from(posts).where(
      and5(
        isNull2(posts.eventName),
        lt4(posts.createdAt, teammateCutoff)
      )
    );
    const oldEventPosts = await db.select({ id: posts.id, eventImage: posts.eventImage }).from(posts).where(
      and5(
        isNotNull2(posts.eventName),
        isNotNull2(posts.eventDate),
        lte(posts.eventDate, sql5`unixepoch()`)
      )
    );
    const oldEventPostsNoDate = await db.select({ id: posts.id, eventImage: posts.eventImage }).from(posts).where(
      and5(
        isNotNull2(posts.eventName),
        isNull2(posts.eventDate),
        lt4(posts.createdAt, teammateCutoff)
      )
    );
    const postsToDelete = [...oldTeammatePosts, ...oldEventPosts, ...oldEventPostsNoDate];
    if (postsToDelete.length > 0) {
      const postIds = postsToDelete.map((p) => p.id);
      await db.delete(posts).where(inArray4(posts.id, postIds));
      const { deleteFromCloudinary: deleteFromCloudinary2 } = await Promise.resolve().then(() => (init_cloudinary(), cloudinary_exports));
      for (const post of postsToDelete) {
        if (post.eventImage?.startsWith("https://res.cloudinary.com/")) {
          deleteFromCloudinary2(post.eventImage).catch(
            (err) => logger.error(`[Cleanup] Failed to delete Cloudinary asset for post ${post.id}`, err)
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
      timestamp: now.toISOString()
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
    return { messages: 0, chats: 0, posts: 0, timestamp: now.toISOString() };
  }
}
async function cleanupObservabilityLogs() {
  const now = /* @__PURE__ */ new Date();
  console.log(`[Weekly Cleanup] Starting observability logs cleanup at ${now.toISOString()}`);
  try {
    const analyticsCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    const deletedAnalytics = await db.delete(analytics).where(lt4(analytics.timestamp, analyticsCutoff)).returning({ id: analytics.id });
    const auditLogsCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1e3);
    const deletedAuditLogs = await db.delete(auditLogs).where(lt4(auditLogs.timestamp, auditLogsCutoff)).returning({ id: auditLogs.id });
    const interactionsCutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1e3);
    const deletedInteractions = await db.delete(postInteractions).where(lt4(postInteractions.createdAt, interactionsCutoff)).returning({ id: postInteractions.id });
    const searchesCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    const deletedSearches = await db.delete(userSearches).where(lt4(userSearches.createdAt, searchesCutoff)).returning({ id: userSearches.id });
    const summary = {
      analytics: deletedAnalytics.length,
      auditLogs: deletedAuditLogs.length,
      postInteractions: deletedInteractions.length,
      userSearches: deletedSearches.length,
      timestamp: now.toISOString()
    };
    console.log(
      `[Weekly Cleanup] \u2705 Deleted: ${summary.analytics} analytics, ${summary.auditLogs} audit logs, ${summary.postInteractions} post interactions, ${summary.userSearches} user searches`
    );
    return summary;
  } catch (error) {
    logger.error("[Weekly Cleanup] Failed to clean observability logs", error);
    return {
      analytics: 0,
      auditLogs: 0,
      postInteractions: 0,
      userSearches: 0,
      timestamp: now.toISOString()
    };
  }
}

// lib/routes/internal.ts
init_logger();
var internalRouter = Router2();
internalRouter.get("/run-audit-export", async (req, res) => {
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
  } catch (err) {
    logger.error("[audit-export-route] failed:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
internalRouter.use("/daily-cleanup", async (req, res) => {
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
  const jobs = [];
  try {
    await runWeeklyAuditExport();
    jobs.push({ name: "audit", status: "success" });
  } catch (err) {
    logger.error("Audit export failed", err);
    jobs.push({ name: "audit", status: "error", error: err.message });
  }
  try {
    await sessionStore.prune();
    jobs.push({ name: "session-prune", status: "success" });
  } catch (err) {
    logger.error("Session pruning failed", err);
    jobs.push({ name: "session-prune", status: "error", error: err.message });
  }
  try {
    await cleanupOldContent();
    await cleanupObservabilityLogs();
    jobs.push({ name: "cleanup", status: "success" });
  } catch (err) {
    logger.error("Cleanup failed", err);
    jobs.push({ name: "cleanup", status: "error", error: err.message });
  }
  return res.status(200).json({ success: true, jobs });
});

// lib/routes/diagnostic.ts
init_db();
init_schema_sqlite();
import { Router as Router3 } from "express";
var diagnosticRouter = Router3();
diagnosticRouter.get("/test-waituntil", async (req, res) => {
  const start = Date.now();
  try {
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Turso query hard timeout (5s)")), 5e3)
    );
    const queryPromise = db.select().from(users).limit(1);
    await Promise.race([queryPromise, timeoutPromise]);
    const duration = Date.now() - start;
    res.status(200).json({
      success: true,
      message: `Turso connected successfully in ${duration}ms!`,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.TURSO_DATABASE_URL,
        dbUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 15) + "...",
        hasAuthToken: !!process.env.TURSO_AUTH_TOKEN
      }
    });
  } catch (error) {
    const duration = Date.now() - start;
    res.status(500).json({
      success: false,
      message: "Turso connection failed",
      error: error.message,
      stack: error.stack,
      durationMs: duration,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.TURSO_DATABASE_URL,
        dbUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 15) + "...",
        hasAuthToken: !!process.env.TURSO_AUTH_TOKEN
      }
    });
  }
});

// lib/routes/websockets.ts
init_db();
init_schema_sqlite();
import { Router as Router4 } from "express";
import jwt from "jsonwebtoken";
import { eq as eq6 } from "drizzle-orm";
var websocketsRouter = Router4();
var WS_JWT_SECRET = process.env.WS_JWT_SECRET;
var WS_JWT_EXPIRES_IN = "8h";
websocketsRouter.get("/ws-token", requireAuth, (req, res) => {
  const user = req.user;
  if (user.isBanned) {
    return res.status(403).json({ error: "Account suspended" });
  }
  const token = jwt.sign(
    {
      userId: user.id,
      name: user.name,
      isBanned: user.isBanned ?? false
    },
    WS_JWT_SECRET,
    { expiresIn: WS_JWT_EXPIRES_IN }
  );
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({ token });
});
websocketsRouter.get("/chats/:id/check-participant", async (req, res) => {
  const secret = req.headers["x-partykit-secret"];
  if (secret !== process.env.PARTYKIT_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const userId = req.headers["x-user-id"];
  const chatId = req.params.id;
  if (!userId || !chatId) {
    return res.status(400).json({ error: "Missing userId or chatId" });
  }
  const [chat] = await db.select().from(connectionRequests).where(eq6(connectionRequests.id, chatId));
  if (!chat) return res.status(404).json({ error: "Chat not found" });
  const isParticipant = chat.fromUserId === userId || chat.toUserId === userId;
  if (!isParticipant) return res.status(403).json({ error: "Not a participant" });
  return res.status(200).json({ ok: true });
});

// lib/routes/security.ts
import { Router as Router5 } from "express";
var securityRouter = Router5();
securityRouter.get("/csrf-token", (req, res) => {
  console.log("csrf-token-----start");
  const token = generateCsrfToken(req, res, true);
  console.log("csrf-token-----end");
  res.status(200).json({ csrfToken: token });
});

// lib/routes.ts
init_schema_sqlite();

// lib/middleware/maintenance.ts
init_logger();
async function maintenanceMiddleware(req, res, next) {
  try {
    if (process.env.MAINTENANCE_MODE === "true") {
      if (req.user && req.user.isAdmin) {
        return next();
      }
      if (req.headers["x-maintenance-bypass"] === process.env.MAINTENANCE_SECRET) {
        return next();
      }
      return res.status(503).json({
        message: "System is in maintenance mode.",
        mode: "FULL",
        eta: "Unknown"
      });
    }
    const publicPaths = [
      "/api/status",
      "/api/auth/logout",
      "/api/maintenance"
      // Status check itself
    ];
    if (!req.path.startsWith("/api")) return next();
    if (publicPaths.includes(req.path)) return next();
    if (req.user && req.user.isAdmin) {
      return next();
    }
    if (process.env.MAINTENANCE_SECRET && req.headers["x-maintenance-bypass"] === process.env.MAINTENANCE_SECRET) {
      return next();
    }
    const withTimeout3 = (promise, ms, label = "Operation") => {
      let timer;
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      });
      return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
    };
    const setting = await withTimeout3(storage.getSystemSetting("maintenance_mode"), 1500, "maintenance_mode_fetch");
    if (!setting || !setting.value) {
      return next();
    }
    const { enabled, mode, message, eta } = setting.value;
    if (!enabled || mode === "OFF") {
      return next();
    }
    if (mode === "FULL") {
      logger.log(`Maintenance block (FULL): ${req.method} ${req.path} - User: ${req.user?.id || "anonymous"} - IP: ${req.ip}`);
      return res.status(503).json({
        message: message || "System is under maintenance.",
        mode: "FULL",
        eta
      });
    }
    if (mode === "PARTIAL") {
      if (req.method === "GET") {
        return next();
      }
      logger.log(`Maintenance block (PARTIAL): ${req.method} ${req.path} - User: ${req.user?.id || "anonymous"} - IP: ${req.ip}`);
      return res.status(503).json({
        message: message || "System is in read-only mode.",
        mode: "PARTIAL",
        eta
      });
    }
    next();
  } catch (error) {
    console.error("Maintenance middleware error:", error);
    next();
  }
}

// lib/routes.ts
import { sql as sql6, eq as eq7, and as and6, not as not2, isNull as isNull3, gt as gt3, inArray as inArray5, desc as desc3 } from "drizzle-orm";
var app = express2();
app.set("trust-proxy", 1);
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false, limit: "50mb" }));
var ipKeyGenerator = (ip) => ip;
var voteLimiter = rateLimit({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 10,
  // 10 votes per minute
  message: { message: "You've reached the voting limit (10 per minute). Please wait 60 seconds before voting again.", code: "RATE_LIMIT_EXCEEDED" }
  // Use default IP detection (works with trust proxy)
});
var uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 5,
  // 5 uploads per hour
  message: { message: "Upload limit reached (5 files per hour). You can upload more files in 1 hour.", code: "RATE_LIMIT_EXCEEDED" }
  // Use default IP detection (works with trust proxy)
});
var notificationLimiter = rateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 20,
  // 20 operations per minute
  message: { message: "Too many notification requests (limit: 20 per minute). Please wait a moment before trying again.", code: "RATE_LIMIT_EXCEEDED" }
  // Use default IP detection (works with trust proxy)
});
var messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 30,
  // 30 messages per minute per user
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: { message: "Slow down! You're sending messages too quickly (limit: 30 per minute). Take a breather and try again in a moment.", code: "RATE_LIMIT_EXCEEDED" },
  standardHeaders: true,
  legacyHeaders: false
});
var trackSearchSchema = z2.object({
  query: z2.string().max(300).optional().default(""),
  filters: z2.record(z2.string(), z2.unknown()).optional().default({}),
  resultsCount: z2.number().int().min(0).max(1e4).optional().default(0),
  clickedPostIds: z2.array(z2.string().min(1).max(64)).max(200).optional().default([])
});
async function requireOnboarding(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized", code: "UNAUTHORIZED" });
  }
  if (req.user.isBanned && !req.user.isAdmin) {
    return res.status(403).json({ message: "You have been banned and cannot perform this action", code: "USER_BANNED" });
  }
  if (req.user.isAdmin) {
    return next();
  }
  const skills = req.user.skills ?? [];
  const city = req.user.city ?? "";
  const university = req.user.university ?? "";
  const department = req.user.department ?? "";
  const normalizedDepartment = String(department).trim().toUpperCase();
  const hasCompletedOnboarding = skills.length > 0 && city.trim().length > 0 && university.trim().length > 0 && normalizedDepartment.length > 0 && normalizedDepartment !== "OTHER";
  if (!hasCompletedOnboarding) {
    return res.status(403).json({
      message: "Please complete your profile setup first",
      code: "ONBOARDING_REQUIRED"
    });
  }
  next();
}
function registerRoutes() {
  app.use(maintenanceMiddleware);
  app.get("/", (_req, res) => {
    res.status(200).json({ status: "healthy", message: "FindATeammate API is running" });
  });
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/api/diagnose-db", requireAuth, requireAdmin, async (req, res) => {
    const diagnostics = {
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        HAS_DB_URL: !!process.env.TURSO_DATABASE_URL,
        DB_URL_PROTOCOL: process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL.startsWith("libsql://") ? "libsql:" : process.env.TURSO_DATABASE_URL.startsWith("https://") ? "https:" : "unknown" : null,
        HAS_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
        AUTH_TOKEN_LEN: process.env.TURSO_AUTH_TOKEN?.length
      }
    };
    try {
      const dbUrl2 = process.env.TURSO_DATABASE_URL;
      if (!dbUrl2) {
        throw new Error("TURSO_DATABASE_URL is missing");
      }
      const httpsUrl = dbUrl2.replace(/^libsql:\/\//, "https://");
      diagnostics.httpsUrl = httpsUrl;
      const { createClient: createClient2 } = await import("@libsql/client");
      const client = createClient2({
        url: httpsUrl,
        authToken: process.env.TURSO_AUTH_TOKEN
      });
      const queryPromise = client.execute("SELECT 1 as val;");
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Database query timed out after 3 seconds")), 3e3)
      );
      const result = await Promise.race([queryPromise, timeoutPromise]);
      diagnostics.querySuccess = true;
      diagnostics.queryResult = result.rows;
    } catch (error) {
      diagnostics.querySuccess = false;
      diagnostics.error = error.message;
      diagnostics.stack = error.stack;
    }
    res.status(200).json(diagnostics);
  });
  app.use("/api/auth", authApp);
  app.use("/api/auth", authLocalRouter);
  app.use("/api/internal", internalRouter);
  app.use("/api/internal", diagnosticRouter);
  app.use("/api", websocketsRouter);
  app.use("/api", securityRouter);
  app.post("/api/auth/mock", async (req, res, next) => {
    if (process.env.NODE_ENV === "production" && !process.env.ENABLE_MOCK_AUTH) {
      return res.status(404).json({ message: "Not found" });
    }
    try {
      const mockUser = await storage.createOAuthUser({
        name: "E2E Test User",
        email: `e2e_${Date.now()}@test.com`,
        username: `e2e_user_${Date.now()}`,
        googleId: `mock_google_${Date.now()}`,
        authProvider: "google",
        bio: "",
        portfolio: "",
        github: "",
        department: "CS",
        city: "Test City",
        university: "Test University",
        skills: ["TypeScript"]
      });
      req.session.userId = mockUser.id;
      req.session.save((err) => {
        if (err) return next(err);
        res.json(mockUser);
      });
    } catch (err) {
      next(err);
    }
  });
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        logger.error("Session destruction failed during logout", err);
      }
      const isProduction2 = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
      res.clearCookie("connect.sid", {
        path: "/",
        sameSite: "lax",
        secure: isProduction2,
        httpOnly: true
      });
      res.json({ message: "Logged out successfully" });
    });
  });
  app.get("/api/me", async (req, res) => {
    if (req.user) {
      return res.json(req.user);
    }
    if (req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        const { password, ...safeUser } = user;
        return res.json(safeUser);
      }
    }
    res.json(null);
  });
  app.post("/api/auth/onboarding", requireAuth, async (req, res, next) => {
    try {
      const { username, department, skills, bio, portfolio, github, linkedin, city, university } = req.body;
      if (!username || !Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({ message: "Username and at least one skill are required" });
      }
      if (!city || typeof city !== "string" || city.trim().length === 0) {
        return res.status(400).json({ message: "City/location is required" });
      }
      if (!university || typeof university !== "string" || university.trim().length === 0) {
        return res.status(400).json({ message: "University/college is required" });
      }
      if (!department || typeof department !== "string" || department.trim().length === 0) {
        return res.status(400).json({ message: "Department is required" });
      }
      const VALID_UNIVERSITIES = ["SAIRAM INSTITUTE OF TECHNOLOGY", "SAIRAM ENGINEERING COLLEGE"];
      if (university.trim() === "OTHER") {
        return res.status(400).json({ message: "Please select a valid university or enter a custom one" });
      }
      if (!VALID_UNIVERSITIES.includes(university.trim()) && university.trim().length === 0) {
        return res.status(400).json({ message: "Please select a valid university or enter a custom one" });
      }
      if (university.trim().length > 200) {
        return res.status(400).json({ message: "University name cannot exceed 200 characters" });
      }
      const normalizedDepartment = department.trim().toUpperCase();
      if (!DEPARTMENTS.includes(normalizedDepartment) || normalizedDepartment === "OTHER") {
        return res.status(400).json({ message: "Please select a valid department" });
      }
      if (req.user.authProvider !== "google" && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Only Google OAuth users can use onboarding." });
      }
      if (req.user.skills && req.user.skills.length > 0 && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: You have already completed onboarding." });
      }
      const [existingUser] = await db.select().from(users).where(eq7(users.username, String(username))).limit(1);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({ message: "Username already taken" });
      }
      const sanitizeString = (str) => {
        return String(str).replace(/<[^>]*>/g, "").trim();
      };
      const isValidUrl = (url) => {
        if (!url) return true;
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };
      const isGithubUrl = (url) => {
        if (!url) return true;
        try {
          const urlObj = new URL(url);
          return urlObj.hostname.includes("github.com");
        } catch {
          return false;
        }
      };
      const isLinkedInUrl = (url) => {
        if (!url) return true;
        try {
          const urlObj = new URL(url);
          return urlObj.hostname.includes("linkedin.com");
        } catch {
          return false;
        }
      };
      if (portfolio && !isValidUrl(portfolio)) {
        return res.status(400).json({ message: "Portfolio must be a valid URL" });
      }
      if (github && !isGithubUrl(github)) {
        return res.status(400).json({ message: "GitHub URL must be from github.com" });
      }
      if (linkedin && !isLinkedInUrl(linkedin)) {
        return res.status(400).json({ message: "LinkedIn URL must be from linkedin.com" });
      }
      const updated = await storage.updateUser(req.user.id, {
        username,
        skills: Array.isArray(skills) ? skills : [],
        bio: bio || "",
        portfolio: portfolio ? sanitizeString(portfolio) : "",
        github: github ? sanitizeString(github) : "",
        linkedin: linkedin ? sanitizeString(linkedin) : "",
        city: sanitizeString(city),
        university: sanitizeString(university),
        department: normalizedDepartment
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/auth/check-username", async (req, res, next) => {
    try {
      const username = req.query.username;
      if (typeof username !== "string") return res.status(400).json({ message: "Invalid username" });
      const [existingUser] = await db.select().from(users).where(eq7(users.username, username)).limit(1);
      res.json({ available: !existingUser });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/status", (_req, res) => {
    res.json({ status: "ok", timestamp: /* @__PURE__ */ new Date() });
  });
  app.get("/api/maintenance", async (_req, res, next) => {
    try {
      const setting = await storage.getSystemSetting("maintenance_mode");
      res.json(setting?.value || { enabled: false, mode: "OFF" });
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/maintenance", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const { enabled, mode, message, eta } = req.body;
      if (!["OFF", "PARTIAL", "FULL"].includes(mode)) {
        return res.status(400).json({ message: "Invalid mode. Must be OFF, PARTIAL, or FULL" });
      }
      const value = {
        enabled: mode !== "OFF",
        mode,
        message: message || "System is under maintenance.",
        eta
      };
      const setting = await storage.setSystemSetting("maintenance_mode", value, req.user.id);
      await storage.logAudit({
        action: "UPDATE_MAINTENANCE",
        resource: "SYSTEM",
        userId: req.user.id,
        userName: req.user.username || req.user.name,
        details: { enabled, mode, message, eta }
      });
      await emitMaintenance(value);
      res.json(setting.value);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/users/:id", optionalAuth, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const safeUser = selectUserSchema.parse(user);
      const isOwner = req.user && req.user.id === userId;
      const isAdmin = req.user && req.user.isAdmin;
      if (!isOwner && !isAdmin) {
        if (!user.privacy.showEmail) safeUser.email = "HIDDEN";
        if (!user.privacy.showPortfolio) safeUser.portfolio = "";
        if (!user.privacy.showUniversity) safeUser.university = null;
        if (!user.privacy.showCity) safeUser.city = null;
      }
      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  });
  app.patch("/api/users/:id", requireAuth, async (req, res, next) => {
    try {
      if (req.user.isBanned && !req.user.isAdmin) {
        return res.status(403).json({ message: "You have been banned and cannot update your profile", code: "USER_BANNED" });
      }
      if (req.params.id !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { id, createdAt, emailVerifiedAt, isVerified, isAdmin, googleId, authProvider, password, ...safeBody } = req.body;
      if (safeBody.skills && Array.isArray(safeBody.skills)) {
        const { filterValidSkills } = (init_constants(), __toCommonJS(constants_exports));
        safeBody.skills = filterValidSkills(safeBody.skills);
      }
      if (safeBody.interests && Array.isArray(safeBody.interests)) {
        const { filterValidInterests } = (init_constants(), __toCommonJS(constants_exports));
        safeBody.interests = filterValidInterests(safeBody.interests);
      }
      const patchUserSchema = insertUserSchema.partial();
      const parsed = patchUserSchema.safeParse(safeBody);
      if (!parsed.success) return res.status(400).json(parsed.error);
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.updateUser(userId, parsed.data);
      const safeUser = selectUserSchema.parse(user);
      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/users/:id/tour-complete", requireAuth, async (req, res, next) => {
    try {
      if (req.params.id !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.updateUser(userId, { tourCompleted: true });
      const safeUser = selectUserSchema.parse(user);
      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    // 5MB limit for event posters/files
    fileFilter: (_req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === "application/pdf";
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error("Only images and PDFs are allowed"));
    }
  });
  const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    // 2MB limit for profile pictures
    fileFilter: (_req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error("Profile pictures must be image files only (JPEG, PNG, GIF, WebP)"));
    }
  });
  app.post("/api/upload", requireAuth, uploadLimiter, upload.single("file"), async (req, res, next) => {
    try {
      if (req.user.isBanned && !req.user.isAdmin) {
        logger.warn(`Upload blocked: banned user ${req.user.id} attempted file upload`);
        return res.status(403).json({ message: "You have been banned and cannot upload files", code: "USER_BANNED" });
      }
      if (!req.file) {
        logger.warn(`Upload failed: no file provided by user ${req.user.id}`);
        return res.status(400).json({ message: "No file uploaded" });
      }
      logger.log(`File upload initiated: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)}KB) by user ${req.user.id}`);
      const hex = req.file.buffer.slice(0, 4).toString("hex").toUpperCase();
      const isValid = hex.startsWith("FFD8FF") || // JPEG
      hex.startsWith("89504E47") || // PNG
      hex.startsWith("47494638") || // GIF
      hex.startsWith("52494646") || // WEBP (RIFF container)
      hex.startsWith("25504446");
      if (!isValid) {
        logger.warn(`Security Block: file ${req.file.originalname} has invalid signature ${hex} (user: ${req.user.id})`);
        return res.status(400).json({ message: "Invalid file content (signature mismatch)" });
      }
      const { url } = await uploadToCloudinary(
        req.file.buffer,
        "findateammate/events",
        `file-${req.user.id}`
      );
      logger.log(`File uploaded successfully: ${url} (user: ${req.user.id})`);
      res.json({ url });
    } catch (error) {
      logger.error(`File upload failed for user ${req.user.id}`, error);
      next(error);
    }
  });
  app.post("/api/users/:id/avatar", requireAuth, uploadLimiter, avatarUpload.single("avatar"), async (req, res, next) => {
    try {
      if (req.user.isBanned && !req.user.isAdmin) {
        logger.warn(`Avatar upload blocked: banned user ${req.user.id} attempted upload`);
        return res.status(403).json({ message: "You have been banned and cannot upload an avatar", code: "USER_BANNED" });
      }
      if (req.params.id !== req.user.id && !req.user.isAdmin) {
        logger.warn(`Avatar upload forbidden: user ${req.user.id} tried to upload for user ${req.params.id}`);
        return res.status(403).json({ message: "Forbidden: You can only upload your own avatar.", code: "FORBIDDEN" });
      }
      if (!req.file) {
        logger.warn(`Avatar upload failed: no file provided by user ${req.user.id}`);
        return res.status(400).json({ message: "No file uploaded" });
      }
      logger.log(`Avatar upload initiated: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)}KB) by user ${req.user.id}`);
      if (req.file.size > 2 * 1024 * 1024) {
        logger.warn(`Avatar upload rejected: file too large (${(req.file.size / 1024 / 1024).toFixed(2)}MB) by user ${req.user.id}`);
        return res.status(413).json({ message: "Profile picture must be under 2MB", code: "FILE_TOO_LARGE" });
      }
      const hex = req.file.buffer.slice(0, 4).toString("hex").toUpperCase();
      const isValid = hex.startsWith("FFD8FF") || // JPEG
      hex.startsWith("89504E47") || // PNG
      hex.startsWith("47494638") || // GIF
      hex.startsWith("52494646");
      if (!isValid) {
        logger.warn(`Avatar security block: invalid signature ${hex} from user ${req.user.id}`);
        return res.status(400).json({ message: "Invalid file content (signature mismatch - avatars must be images)" });
      }
      const currentUser = await storage.getUser(req.user.id);
      if (currentUser?.avatar?.startsWith("https://res.cloudinary.com/")) {
        logger.log(`Deleting old avatar: ${currentUser.avatar}`);
        waitUntil2(
          deleteFromCloudinary(currentUser.avatar).catch(
            (err) => logger.error("Failed to delete old Cloudinary avatar", err)
          )
        );
      }
      const { url } = await uploadToCloudinary(
        req.file.buffer,
        "findateammate/avatars",
        `avatar-${req.user.id}`
      );
      const user = await storage.updateUser(req.user.id, { avatar: url });
      const safeUser = selectUserSchema.parse(user);
      logger.log(`Avatar uploaded successfully: ${url} (user: ${req.user.id})`);
      res.json(safeUser);
    } catch (error) {
      logger.error(`Avatar upload failed for user ${req.user.id}`, error);
      next(error);
    }
  });
  app.get("/api/posts", requireAuth, async (req, res, next) => {
    try {
      const limitParam = parseInt(req.query.limit);
      const limit = Math.min(isNaN(limitParam) ? 20 : limitParam, 100);
      let cursor;
      if (req.query.cursor && typeof req.query.cursor === "string") {
        const parsed = new Date(req.query.cursor);
        if (!isNaN(parsed.getTime())) cursor = parsed;
      }
      const result = await storage.getPosts(cursor, limit, req.user?.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/posts/:id", requireAuth, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/posts/teammate", requireAuth, requireOnboarding, async (req, res, next) => {
    try {
      if (req.body.eventName || req.body.eventDate) {
        return res.status(400).json({
          message: "Use POST /api/posts/event for events",
          code: "WRONG_ENDPOINT"
        });
      }
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      const parsed = insertPostSchema.omit({
        eventName: true,
        eventWebsite: true,
        eventImage: true,
        eventDetails: true,
        eventUpvotes: true,
        specialRequirements: true
      }).safeParse(req.body);
      if (parsed.success && req.body.skillsWanted) {
        for (const skill of req.body.skillsWanted) {
          if (skill.name && !SKILLS.includes(skill.name)) {
            return res.status(400).json({ message: `Invalid skill: ${skill.name}. Please select from the predefined skill list.` });
          }
        }
      }
      if (parsed.success && req.body.skillsOffered) {
        for (const skill of req.body.skillsOffered) {
          if (skill.name && !SKILLS.includes(skill.name)) {
            return res.status(400).json({ message: `Invalid skill: ${skill.name}. Please select from the predefined skill list.` });
          }
        }
      }
      if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", details: parsed.error, code: "VALIDATION_ERROR" });
      }
      if (!user.isAdmin) {
        const twentyFourHoursAgo = new Date((/* @__PURE__ */ new Date()).getTime() - 24 * 60 * 60 * 1e3);
        const recentCount = await db.select({ count: sql6`count(*)` }).from(posts).where(
          and6(
            eq7(posts.userId, req.user.id),
            sql6`${posts.createdAt} > ${twentyFourHoursAgo}`,
            sql6`${posts.eventName} IS NULL`
          )
        );
        if (Number(recentCount[0]?.count || 0) >= 1) {
          return res.status(429).json({ message: "You've already created a teammate post in the last 24 hours. To prevent spam, you can only create 1 teammate post per day. Try again tomorrow!" });
        }
      }
      const postData = Object.fromEntries(
        Object.entries({
          ...parsed.data,
          userId: req.user.id,
          userName: req.user.name,
          userSkill: req.user.skills?.[0] || "Unspecified"
          // First skill from skills array
        }).filter(([, value]) => value !== void 0)
      );
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/posts/event", requireAuth, requireOnboarding, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      const parsed = insertPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", details: parsed.error, code: "VALIDATION_ERROR" });
      }
      if (!parsed.data.eventName) {
        return res.status(400).json({ message: "Event name is required for events" });
      }
      if (!parsed.data.eventDate) {
        return res.status(400).json({ message: "Event date is required for events" });
      }
      if (parsed.data.requiredSkills && Array.isArray(parsed.data.requiredSkills)) {
        for (const skill of parsed.data.requiredSkills) {
          if (skill && !SKILLS.includes(skill)) {
            return res.status(400).json({ message: `Invalid skill: ${skill}. Please select from the predefined skill list.` });
          }
        }
      }
      if (parsed.data.requiredInterests && Array.isArray(parsed.data.requiredInterests)) {
        for (const interest of parsed.data.requiredInterests) {
          if (interest && !SKILLS.includes(interest)) {
            return res.status(400).json({ message: `Invalid interest: ${interest}. Please select from the predefined interest list.` });
          }
        }
      }
      if (parsed.data.eventType === "intra-college" && parsed.data.hostCollege) {
        if (!COLLEGES.includes(parsed.data.hostCollege)) {
          return res.status(400).json({ message: `Invalid college: ${parsed.data.hostCollege}. Please select from the predefined college list.` });
        }
      }
      const normalizedAllowedDepartments = Array.isArray(parsed.data.allowedDepartments) ? parsed.data.allowedDepartments.filter((dept) => typeof dept === "string").map((dept) => dept.trim()).filter((dept) => dept.length > 0) : null;
      parsed.data.allowedDepartments = normalizedAllowedDepartments;
      parsed.data.requiredSkills = Array.isArray(parsed.data.requiredSkills) ? parsed.data.requiredSkills : [];
      parsed.data.requiredInterests = Array.isArray(parsed.data.requiredInterests) ? parsed.data.requiredInterests : [];
      if (parsed.data.eventType === "intra-college") {
        parsed.data.isEventOrganiser = typeof parsed.data.isEventOrganiser === "boolean" ? parsed.data.isEventOrganiser : false;
        if (parsed.data.isEventOrganiser) {
          parsed.data.crossDeptRequiresApproval = typeof parsed.data.crossDeptRequiresApproval === "boolean" ? parsed.data.crossDeptRequiresApproval : true;
        } else {
          parsed.data.crossDeptRequiresApproval = false;
        }
      } else {
        parsed.data.isEventOrganiser = false;
        parsed.data.crossDeptRequiresApproval = false;
      }
      parsed.data.specialRequirements = typeof parsed.data.specialRequirements === "string" ? parsed.data.specialRequirements.trim().slice(0, 250) : null;
      if (!(parsed.data.eventType === "intra-college" && parsed.data.isEventOrganiser)) {
        parsed.data.specialRequirements = null;
      }
      if (parsed.data.eventType === "intra-college" && parsed.data.allowedDepartments) {
        if (!Array.isArray(parsed.data.allowedDepartments)) {
          return res.status(400).json({ message: "allowedDepartments must be an array" });
        }
        if (parsed.data.allowedDepartments.length < 1) {
          return res.status(400).json({ message: "At least 1 department must be selected when using specific departments" });
        }
        if (parsed.data.allowedDepartments.length > 10) {
          return res.status(400).json({ message: "Maximum 10 departments can be selected" });
        }
        for (const dept of parsed.data.allowedDepartments) {
          if (!DEPARTMENTS.includes(dept)) {
            return res.status(400).json({ message: `Invalid department: ${dept}` });
          }
        }
      } else if (parsed.data.eventType !== "intra-college") {
        parsed.data.allowedDepartments = null;
      }
      const eventDate = new Date(parsed.data.eventDate);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: "Invalid event date format" });
      }
      if (eventDate.getTime() <= (/* @__PURE__ */ new Date()).getTime()) {
        return res.status(400).json({ message: "Event date must be in the future" });
      }
      if (!user.isAdmin) {
        const twentyFourHoursAgo = new Date((/* @__PURE__ */ new Date()).getTime() - 24 * 60 * 60 * 1e3);
        const recentCount = await db.select({ count: sql6`count(*)` }).from(posts).where(
          and6(
            eq7(posts.userId, req.user.id),
            gt3(posts.createdAt, twentyFourHoursAgo),
            not2(isNull3(posts.eventName))
          )
        );
        if (Number(recentCount[0]?.count || 0) >= 10) {
          return res.status(429).json({ message: "You've reached the event creation limit (10 events per day). This helps us maintain quality. Try again in 24 hours!" });
        }
      }
      const postData = Object.fromEntries(
        Object.entries({
          ...parsed.data,
          userId: req.user.id,
          userName: req.user.name,
          userSkill: req.user.skills?.[0] || "Unspecified",
          eventUpvotes: 0
        }).filter(([, value]) => value !== void 0)
      );
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      next(error);
    }
  });
  app.patch("/api/posts/:id", requireAuth, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ message: "Post not found", code: "NOT_FOUND" });
      if (req.user.isBanned && !req.user.isAdmin) {
        return res.status(403).json({ message: "You have been banned and cannot modify posts", code: "USER_BANNED" });
      }
      if (post.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden", code: "FORBIDDEN" });
      }
      const patchPostSchema = insertPostSchema.partial();
      const parsed = patchPostSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);
      if (Object.prototype.hasOwnProperty.call(parsed.data, "allowedDepartments")) {
        const rawAllowedDepartments = parsed.data.allowedDepartments;
        parsed.data.allowedDepartments = Array.isArray(rawAllowedDepartments) ? rawAllowedDepartments.filter((dept) => typeof dept === "string").map((dept) => dept.trim()).filter((dept) => dept.length > 0) : null;
      }
      const effectiveEventType = parsed.data.eventType ?? post.eventType;
      if (effectiveEventType === "intra-college" && parsed.data.allowedDepartments) {
        if (!Array.isArray(parsed.data.allowedDepartments)) {
          return res.status(400).json({ message: "allowedDepartments must be an array" });
        }
        if (parsed.data.allowedDepartments.length < 1) {
          return res.status(400).json({ message: "At least 1 department must be selected when using specific departments" });
        }
        if (parsed.data.allowedDepartments.length > 10) {
          return res.status(400).json({ message: "Maximum 10 departments can be selected" });
        }
        for (const dept of parsed.data.allowedDepartments) {
          if (!DEPARTMENTS.includes(dept)) {
            return res.status(400).json({ message: `Invalid department: ${dept}` });
          }
        }
      } else if (effectiveEventType !== "intra-college") {
        parsed.data.allowedDepartments = null;
      }
      const effectiveHostCollege = parsed.data.hostCollege ?? post.hostCollege;
      if (effectiveEventType === "intra-college" && effectiveHostCollege) {
        if (!COLLEGES.includes(effectiveHostCollege)) {
          return res.status(400).json({ message: `Invalid college: ${effectiveHostCollege}. Please select from the predefined college list.` });
        }
      }
      if (Object.prototype.hasOwnProperty.call(parsed.data, "specialRequirements")) {
        const rawSpecialRequirements = parsed.data.specialRequirements;
        parsed.data.specialRequirements = typeof rawSpecialRequirements === "string" ? rawSpecialRequirements.trim().slice(0, 250) : null;
      }
      const effectiveIsEventOrganiser = typeof parsed.data.isEventOrganiser === "boolean" ? parsed.data.isEventOrganiser : Boolean(post.isEventOrganiser);
      if (!(effectiveEventType === "intra-college" && effectiveIsEventOrganiser)) {
        parsed.data.specialRequirements = null;
      }
      if (effectiveEventType === "intra-college" && effectiveIsEventOrganiser) {
        if (!Object.prototype.hasOwnProperty.call(parsed.data, "crossDeptRequiresApproval")) {
          parsed.data.crossDeptRequiresApproval = post.crossDeptRequiresApproval ?? true;
        }
      } else {
        parsed.data.crossDeptRequiresApproval = false;
      }
      const updated = await storage.updatePost(postId, parsed.data);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });
  app.delete("/api/posts/:id", requireAuth, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ message: "Post not found", code: "NOT_FOUND" });
      if (req.user.isBanned && !req.user.isAdmin) {
        return res.status(403).json({ message: "You have been banned and cannot delete posts", code: "USER_BANNED" });
      }
      if (post.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden", code: "FORBIDDEN" });
      }
      await storage.deletePost(postId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/posts/:id/upvote", requireAuth, requireOnboarding, voteLimiter, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ message: "Post not found", code: "NOT_FOUND" });
      if (!post.eventName || !post.eventDate) {
        return res.status(400).json({ message: "Cannot vote on teammate posts, only events", code: "INVALID_POST_TYPE" });
      }
      await storage.upvoteEvent(postId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/posts/:id/downvote", requireAuth, requireOnboarding, voteLimiter, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await storage.getPost(postId);
      if (!post) return res.status(404).json({ message: "Post not found", code: "NOT_FOUND" });
      if (!post.eventName || !post.eventDate) {
        return res.status(400).json({ message: "Cannot vote on teammate posts, only events", code: "INVALID_POST_TYPE" });
      }
      await storage.downvoteEvent(postId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  const registrationLimiter = rateLimit({
    windowMs: 60 * 1e3,
    // 1 minute
    max: 20,
    // 20 registrations per minute
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
    message: { message: "Too many registration attempts. Please try again later.", code: "RATE_LIMIT_EXCEEDED" }
  });
  app.post("/api/events/:eventId/register", requireAuth, registrationLimiter, async (req, res, next) => {
    try {
      if (req.user.isBanned && !req.user.isAdmin) {
        return res.status(403).json({ message: "You have been banned and cannot register for events", code: "USER_BANNED" });
      }
      return registerForEvent(req, res, next);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/events/:eventId/registrations", requireAuth, getEventRegistrations);
  app.get("/api/events/:eventId/match-score", requireVerifiedAuth, getEventMatchScore);
  app.patch("/api/events/:eventId/registrations/:regId/approve", requireVerifiedAuth, approveRegistration);
  app.patch("/api/events/:eventId/registrations/:regId/reject", requireVerifiedAuth, rejectRegistration);
  app.delete("/api/events/:eventId/registrations/:regId", requireVerifiedAuth, deleteRegistration);
  app.get("/api/organiser/events", requireAuth, requireOrganiser, async (req, res, next) => {
    try {
      const organiserEvents = await storage.getPostsByUser(req.user.id);
      const events = organiserEvents.filter((e) => e.eventName && e.eventType === "intra-college");
      res.json(events);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/organiser/dashboard/:eventId", requireAuth, requireOrganiser, async (req, res, next) => {
    try {
      const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
      const event = await storage.getPost(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: You are not the organiser of this event" });
      }
      const registrations = await storage.getEventRegistrations(eventId);
      const userIds = [...new Set(registrations.map((registration) => registration.userId))];
      const registrationUsers = await Promise.all(userIds.map((id) => storage.getUser(id)));
      const userMap = new Map(registrationUsers.filter(Boolean).map((registrationUser) => [registrationUser.id, registrationUser]));
      const enrichedRegistrations = registrations.map((registration) => {
        const registrationUser = userMap.get(registration.userId);
        return {
          ...registration,
          user: registrationUser ? {
            id: registrationUser.id,
            name: registrationUser.name,
            email: registrationUser.email,
            department: registrationUser.department,
            skills: registrationUser.skills || [],
            interests: registrationUser.interests || [],
            avatar: registrationUser.avatar,
            university: registrationUser.university,
            city: registrationUser.city
          } : null
        };
      });
      const now = Date.now();
      const interestInteractions = await db.select({
        userId: postInteractions.userId,
        interactionType: postInteractions.interactionType,
        createdAt: postInteractions.createdAt,
        name: users.name,
        email: users.email,
        department: users.department,
        avatar: users.avatar
      }).from(postInteractions).innerJoin(users, eq7(postInteractions.userId, users.id)).where(
        and6(
          eq7(postInteractions.postId, eventId),
          inArray5(postInteractions.interactionType, ["interested", "not_interested"])
        )
      ).orderBy(desc3(postInteractions.createdAt));
      const latestSignalByUser = /* @__PURE__ */ new Map();
      for (const signal of interestInteractions) {
        if (!latestSignalByUser.has(signal.userId)) {
          latestSignalByUser.set(signal.userId, {
            userId: signal.userId,
            interactionType: signal.interactionType,
            createdAt: signal.createdAt,
            name: signal.name,
            email: signal.email,
            department: signal.department,
            avatar: signal.avatar
          });
        }
      }
      const interestSignals = Array.from(latestSignalByUser.values());
      const interestedUsers = interestSignals.filter((signal) => signal.interactionType === "interested").map((signal) => ({
        userId: signal.userId,
        name: signal.name,
        email: signal.email,
        department: signal.department,
        avatar: signal.avatar,
        createdAt: signal.createdAt
      }));
      const notInterestedUsers = interestSignals.filter((signal) => signal.interactionType === "not_interested").map((signal) => ({
        userId: signal.userId,
        name: signal.name,
        email: signal.email,
        department: signal.department,
        avatar: signal.avatar,
        createdAt: signal.createdAt
      }));
      const approvedCount = registrations.filter((registration) => registration.status === "approved" || registration.status === "confirmed").length;
      const pendingCount = registrations.filter((registration) => registration.status === "pending").length;
      const rejectedCount = registrations.filter((registration) => registration.status === "rejected").length;
      const crossDeptCount = registrations.filter((registration) => registration.registrationType === "cross_department").length;
      const scoredRegistrations = registrations.filter((registration) => registration.matchScore !== null);
      const scoreValues = scoredRegistrations.map((registration) => Number(registration.matchScore));
      const departmentBreakdown = Object.entries(
        enrichedRegistrations.reduce((accumulator, registration) => {
          const department = registration.user?.department || "Unknown";
          accumulator[department] = (accumulator[department] || 0) + 1;
          return accumulator;
        }, {})
      ).sort((left, right) => right[1] - left[1]).map(([label, count]) => ({ label, count }));
      const collegeBreakdown = Object.entries(
        enrichedRegistrations.reduce((accumulator, registration) => {
          const college = registration.user?.university || "Unknown";
          accumulator[college] = (accumulator[college] || 0) + 1;
          return accumulator;
        }, {})
      ).sort((left, right) => right[1] - left[1]).map(([label, count]) => ({ label, count }));
      const topSkills = Object.entries(
        enrichedRegistrations.reduce((accumulator, registration) => {
          for (const skill of registration.user?.skills || []) {
            accumulator[skill] = (accumulator[skill] || 0) + 1;
          }
          return accumulator;
        }, {})
      ).sort((left, right) => right[1] - left[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
      const registrationsByDay = Object.entries(
        registrations.reduce((accumulator, registration) => {
          const createdAt = new Date(registration.createdAt);
          const dayKey = Number.isNaN(createdAt.getTime()) ? "Unknown" : createdAt.toISOString().slice(0, 10);
          accumulator[dayKey] = (accumulator[dayKey] || 0) + 1;
          return accumulator;
        }, {})
      ).sort((left, right) => left[0].localeCompare(right[0])).map(([label, count]) => ({ label, count }));
      const stats = {
        total: registrations.length,
        pending: pendingCount,
        approved: registrations.filter((r) => r.status === "approved").length,
        rejected: rejectedCount,
        confirmed: registrations.filter((r) => r.status === "confirmed").length,
        crossDept: crossDeptCount,
        department: registrations.filter((r) => r.registrationType === "department").length
      };
      const analytics2 = {
        approvalRate: registrations.length > 0 ? Math.round(approvedCount / registrations.length * 100) : 0,
        rejectionRate: registrations.length > 0 ? Math.round(rejectedCount / registrations.length * 100) : 0,
        pendingRate: registrations.length > 0 ? Math.round(pendingCount / registrations.length * 100) : 0,
        crossDeptRate: registrations.length > 0 ? Math.round(crossDeptCount / registrations.length * 100) : 0,
        pendingOlderThan48h: registrations.filter((registration) => {
          if (registration.status !== "pending") return false;
          const createdAt = new Date(registration.createdAt).getTime();
          return !Number.isNaN(createdAt) && now - createdAt > 48 * 60 * 60 * 1e3;
        }).length,
        averageMatchScore: scoreValues.length > 0 ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length) : 0,
        highMatchPending: registrations.filter((registration) => registration.status === "pending" && registration.matchScore !== null && Number(registration.matchScore) >= 75).length,
        scoreBuckets: {
          strong: scoreValues.filter((score) => score >= 80).length,
          medium: scoreValues.filter((score) => score >= 60 && score < 80).length,
          low: scoreValues.filter((score) => score < 60).length
        },
        topDepartments: departmentBreakdown.slice(0, 5),
        topColleges: collegeBreakdown.slice(0, 5),
        topSkills,
        registrationsByDay,
        uniqueApplicants: userIds.length,
        interestSignals: {
          interestedCount: interestedUsers.length,
          notInterestedCount: notInterestedUsers.length,
          interestedUsers,
          notInterestedUsers
        }
      };
      res.json({ event, registrations: enrichedRegistrations, stats, analytics: analytics2 });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/organisers", requireAdmin, async (req, res, next) => {
    try {
      const pageParam = parseInt(req.query.page);
      const limitParam = parseInt(req.query.limit);
      const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
      const limit = Math.min(isNaN(limitParam) ? 10 : limitParam, 100);
      const offset = (page - 1) * limit;
      const allUsers = await storage.getUsers(1e4);
      const organisers = allUsers.filter((u) => u.isOrganiser);
      const total = organisers.length;
      const paginatedOrganisers = organisers.slice(offset, offset + limit);
      res.json({
        organisers: paginatedOrganisers.map((u) => {
          const { password, ...safe } = u;
          return safe;
        }),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/organisers/:userId/dashboard/:eventId", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
      const organiser = await storage.getUser(userId);
      if (!organiser) {
        return res.status(404).json({ message: "Organiser not found" });
      }
      if (!organiser.isOrganiser) {
        return res.status(400).json({ message: "User is not an organiser" });
      }
      const event = await storage.getPost(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.userId !== userId) {
        return res.status(403).json({ message: "Event does not belong to this organiser" });
      }
      if (event.eventType !== "intra-college") {
        return res.status(403).json({ message: "Only intra-college events are accessible via organiser dashboard" });
      }
      const registrations = await storage.getEventRegistrations(eventId);
      const userIds = [...new Set(registrations.map((r) => r.userId))];
      const users2 = await Promise.all(userIds.map((id) => storage.getUser(id)));
      const userMap = Object.fromEntries(users2.map((u) => [u?.id, u]));
      const enrichedRegistrations = registrations.map((reg) => {
        const user = userMap[reg.userId];
        return {
          ...reg,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            skills: user.skills || [],
            interests: user.interests || [],
            avatar: user.avatar,
            university: user.university,
            city: user.city
          } : null,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "Unknown",
          userSkill: user?.skills?.[0] || "Unknown"
        };
      });
      const now = Date.now();
      const approvedCount = registrations.filter((registration) => registration.status === "approved" || registration.status === "confirmed").length;
      const pendingCount = registrations.filter((registration) => registration.status === "pending").length;
      const rejectedCount = registrations.filter((registration) => registration.status === "rejected").length;
      const crossDeptCount = registrations.filter((registration) => registration.registrationType === "cross_department").length;
      const scoreValues = registrations.filter((registration) => registration.matchScore !== null).map((registration) => Number(registration.matchScore));
      const departmentBreakdown = Object.entries(
        enrichedRegistrations.reduce((accumulator, registration) => {
          const department = registration.user?.department || "Unknown";
          accumulator[department] = (accumulator[department] || 0) + 1;
          return accumulator;
        }, {})
      ).sort((left, right) => right[1] - left[1]).map(([label, count]) => ({ label, count }));
      const collegeBreakdown = Object.entries(
        enrichedRegistrations.reduce((accumulator, registration) => {
          const college = registration.user?.university || "Unknown";
          accumulator[college] = (accumulator[college] || 0) + 1;
          return accumulator;
        }, {})
      ).sort((left, right) => right[1] - left[1]).map(([label, count]) => ({ label, count }));
      const topSkills = Object.entries(
        enrichedRegistrations.reduce((accumulator, registration) => {
          for (const skill of registration.user?.skills || []) {
            accumulator[skill] = (accumulator[skill] || 0) + 1;
          }
          return accumulator;
        }, {})
      ).sort((left, right) => right[1] - left[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
      const registrationsByDay = Object.entries(
        registrations.reduce((accumulator, registration) => {
          const createdAt = new Date(registration.createdAt);
          const dayKey = Number.isNaN(createdAt.getTime()) ? "Unknown" : createdAt.toISOString().slice(0, 10);
          accumulator[dayKey] = (accumulator[dayKey] || 0) + 1;
          return accumulator;
        }, {})
      ).sort((left, right) => left[0].localeCompare(right[0])).map(([label, count]) => ({ label, count }));
      const stats = {
        total: registrations.length,
        pending: pendingCount,
        approved: registrations.filter((r) => r.status === "approved").length,
        rejected: rejectedCount,
        confirmed: registrations.filter((r) => r.status === "confirmed").length,
        crossDept: crossDeptCount,
        department: registrations.filter((r) => r.registrationType === "department").length
      };
      const analytics2 = {
        approvalRate: registrations.length > 0 ? Math.round(approvedCount / registrations.length * 100) : 0,
        rejectionRate: registrations.length > 0 ? Math.round(rejectedCount / registrations.length * 100) : 0,
        pendingRate: registrations.length > 0 ? Math.round(pendingCount / registrations.length * 100) : 0,
        crossDeptRate: registrations.length > 0 ? Math.round(crossDeptCount / registrations.length * 100) : 0,
        pendingOlderThan48h: registrations.filter((registration) => {
          if (registration.status !== "pending") return false;
          const createdAt = new Date(registration.createdAt).getTime();
          return !Number.isNaN(createdAt) && now - createdAt > 48 * 60 * 60 * 1e3;
        }).length,
        averageMatchScore: scoreValues.length > 0 ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length) : 0,
        highMatchPending: registrations.filter((registration) => registration.status === "pending" && registration.matchScore !== null && Number(registration.matchScore) >= 75).length,
        scoreBuckets: {
          strong: scoreValues.filter((score) => score >= 80).length,
          medium: scoreValues.filter((score) => score >= 60 && score < 80).length,
          low: scoreValues.filter((score) => score < 60).length
        },
        topDepartments: departmentBreakdown.slice(0, 5),
        topColleges: collegeBreakdown.slice(0, 5),
        topSkills,
        registrationsByDay,
        uniqueApplicants: userIds.length
      };
      res.json({ organiser, event, registrations: enrichedRegistrations, stats, analytics: analytics2 });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/organisers/:userId/events", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const organiser = await storage.getUser(userId);
      if (!organiser) {
        return res.status(404).json({ message: "Organiser not found" });
      }
      if (!organiser.isOrganiser) {
        return res.status(400).json({ message: "User is not an organiser" });
      }
      const allEvents = await storage.getPostsByUser(userId);
      const events = allEvents.filter((e) => e.eventName && e.eventType === "intra-college");
      const eventIds = events.map((e) => e.id);
      const allRegistrations = await Promise.all(eventIds.map((id) => storage.getEventRegistrations(id)));
      const registrationCountMap = /* @__PURE__ */ new Map();
      allRegistrations.forEach((regs, idx) => {
        registrationCountMap.set(eventIds[idx], regs.length);
      });
      const enrichedEvents = events.map((event) => ({
        ...event,
        eventRegistrationCount: registrationCountMap.get(event.id) || 0
      }));
      res.json(enrichedEvents);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/requests", requireVerifiedAuth, async (req, res, next) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getConnectionRequests(userId);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/requests", requireVerifiedAuth, requireOnboarding, async (req, res, next) => {
    try {
      const parsed = insertConnectionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", details: parsed.error, code: "VALIDATION_ERROR" });
      }
      if (parsed.data.fromUserId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden", code: "FORBIDDEN" });
      }
      if (parsed.data.fromUserId === parsed.data.toUserId) {
        return res.status(400).json({ message: "You cannot send a connection request to yourself" });
      }
      const fromUser = await storage.getUser(parsed.data.fromUserId);
      if (!fromUser) return res.status(404).json({ message: "Sender user not found", code: "NOT_FOUND" });
      const toUser = await storage.getUser(parsed.data.toUserId);
      if (!toUser) return res.status(404).json({ message: "Recipient user not found", code: "NOT_FOUND" });
      const existing = await storage.getExistingRequest(parsed.data.fromUserId, parsed.data.toUserId, parsed.data.postId);
      if (existing && existing.status === "pending") {
        return res.status(409).json({ message: "You already have a pending request for this post", code: "CONFLICT" });
      }
      const request = await storage.createConnectionRequest({
        ...parsed.data,
        toUserName: toUser.name
      });
      await storage.createNotification({
        userId: parsed.data.toUserId,
        type: "connection_request",
        title: "New Connection Request",
        message: `${req.user.name} wants to connect with you regarding "${parsed.data.postTitle}"`,
        link: "/requests",
        metadata: { senderId: req.user.id, requestId: request.id },
        isRead: false
      });
      await emitNotification(parsed.data.toUserId, { requestId: request.id, fromUserName: req.user.name });
      res.json(request);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/requests/:id/accept", requireVerifiedAuth, requireOnboarding, async (req, res, next) => {
    try {
      const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const request = await storage.getConnectionRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      if (request.toUserId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Only the receiver can accept request", code: "FORBIDDEN" });
      }
      await storage.updateConnectionRequestStatus(requestId, "accepted");
      const { boostPreferencesFromConnection: boostPreferencesFromConnection2 } = await Promise.resolve().then(() => (init_recommendations(), recommendations_exports));
      waitUntil2(
        boostPreferencesFromConnection2(request.fromUserId, request.postId, true).catch(
          (err) => logger.error("Failed to boost preferences from connection", { error: err })
        )
      );
      await storage.createNotification({
        userId: request.fromUserId,
        type: "request_accepted",
        title: "Request Accepted!",
        message: `${req.user.name} accepted your request for "${request.postTitle}"`,
        link: `/chat/${requestId}`,
        metadata: { senderId: req.user.id, requestId: request.id },
        isRead: false
      });
      await emitChatUpdated([request.fromUserId, request.toUserId], requestId);
      await emitNotification(request.fromUserId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/requests/:id/reject", requireVerifiedAuth, requireOnboarding, async (req, res, next) => {
    try {
      const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const request = await storage.getConnectionRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      if (request.toUserId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Only the receiver can reject request", code: "FORBIDDEN" });
      }
      await storage.updateConnectionRequestStatus(requestId, "rejected");
      const { boostPreferencesFromConnection: boostPreferencesFromConnection2 } = await Promise.resolve().then(() => (init_recommendations(), recommendations_exports));
      waitUntil2(
        boostPreferencesFromConnection2(request.fromUserId, request.postId, false).catch(
          (err) => logger.error("Failed to apply feedback from rejection", { error: err })
        )
      );
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.delete("/api/requests/:id", requireVerifiedAuth, async (req, res, next) => {
    try {
      const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const request = await storage.getConnectionRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      if (request.fromUserId !== req.user.id && request.toUserId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden", code: "FORBIDDEN" });
      }
      await storage.deleteConnectionRequest(requestId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/notifications", requireAuth, async (req, res, next) => {
    try {
      const notifications2 = await storage.getNotifications(req.user.id);
      res.json(notifications2);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/notifications/read-all", requireAuth, async (req, res, next) => {
    try {
      await storage.markAllNotificationsRead(req.user.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/notifications/:id/read", requireAuth, async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await storage.markNotificationsRead(req.user.id, [id]);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.delete("/api/notifications/all", requireAuth, notificationLimiter, async (req, res, next) => {
    try {
      await storage.deleteAllNotifications(req.user.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.delete("/api/notifications/:id", requireAuth, notificationLimiter, async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await storage.deleteNotifications(req.user.id, [id]);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/chats", requireVerifiedAuth, async (req, res, next) => {
    try {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      if (userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: You can only view your own chats", code: "FORBIDDEN" });
      }
      const chats = await storage.getChats(userId);
      res.json(chats);
    } catch (error) {
      logger.error("Error fetching chats", error);
      next(error);
    }
  });
  app.get("/api/chats/:chatId/messages", requireVerifiedAuth, async (req, res, next) => {
    try {
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
      const isParticipant = await storage.isUserInChat(chatId, req.user.id);
      if (!isParticipant && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: You are not a participant in this chat", code: "FORBIDDEN" });
      }
      let before;
      if (req.query.before && typeof req.query.before === "string") {
        const parsed = new Date(req.query.before);
        if (!isNaN(parsed.getTime())) before = parsed;
      }
      const messages2 = await storage.getMessages(chatId, req.user.id, before);
      res.json(messages2);
    } catch (error) {
      logger.error("Error fetching messages", error);
      next(error);
    }
  });
  app.post("/api/chats/:chatId/messages", requireVerifiedAuth, requireOnboarding, messageLimiter, async (req, res, next) => {
    try {
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
      const isParticipant = await storage.isUserInChat(chatId, req.user.id);
      if (!isParticipant && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: You are not a participant in this chat", code: "FORBIDDEN" });
      }
      const parsed = insertMessageSchema.safeParse({
        ...req.body,
        chatId,
        senderId: req.user.id
      });
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }
      const message = await storage.createMessage(parsed.data);
      const sender = await storage.getUser(req.user.id);
      const enrichedMessage = {
        ...message,
        senderName: sender?.name || "Unknown"
      };
      await emitMessage(chatId, enrichedMessage);
      res.json(message);
    } catch (error) {
      logger.error("Error sending message", error);
      next(error);
    }
  });
  app.post("/api/chats/:chatId/clear", requireVerifiedAuth, async (req, res, next) => {
    try {
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
      const isParticipant = await storage.isUserInChat(chatId, req.user.id);
      if (!isParticipant && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: You are not a participant in this chat", code: "FORBIDDEN" });
      }
      await storage.clearChatHistory(chatId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/dashboard", requireAuth, async (req, res, next) => {
    try {
      const [unreadCount, { items: posts2, nextCursor }] = await Promise.all([
        storage.getUnreadNotificationsCount(req.user.id),
        storage.getPosts(void 0, 20)
      ]);
      res.json({
        user: req.user,
        unreadCount,
        feed: { items: posts2, nextCursor }
      });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/users", requireAdmin, async (_req, res, next) => {
    try {
      const users2 = await storage.getUsers(1e3);
      const safeUsers = users2.map((u) => {
        const { password, email, googleId, ...rest } = u;
        const maskedEmail = email.replace(/(^.{2}).*(@.*$)/, "$1***$2");
        return { ...rest, email: maskedEmail };
      });
      res.json(safeUsers);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/users/:id", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, googleId, ...fullUser } = user;
      res.json(fullUser);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/admin/promote/:id", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { isAdmin } = req.body;
      if (req.user?.id === userId && isAdmin === false) {
        return res.status(400).json({ message: "You cannot demote yourself from admin." });
      }
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (isSuperAdminEmail(user.email) && isAdmin === false) {
        return res.status(403).json({ message: "Forbidden: Super admin cannot be demoted" });
      }
      const updated = await storage.promoteUser(userId, isAdmin);
      await storage.logAudit({
        action: isAdmin ? "PROMOTE_ADMIN" : "DEMOTE_ADMIN",
        resource: "USER",
        userId: req.user.id,
        userName: req.user.username || req.user.name,
        details: { targetUserId: userId, targetUserName: user.name }
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/admin/promote-organiser/:id", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { isOrganiser } = req.body;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const updated = await storage.promoteOrganiser(userId, isOrganiser);
      await storage.logAudit({
        action: isOrganiser ? "PROMOTE_ORGANISER" : "DEMOTE_ORGANISER",
        resource: "USER",
        userId: req.user.id,
        userName: req.user.username || req.user.name,
        details: { targetUserId: userId, targetUserName: user.name }
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (isSuperAdminEmail(user.email)) {
        return res.status(403).json({ message: "Forbidden: Super admin cannot be deleted" });
      }
      if (req.user?.id === userId) {
        return res.status(400).json({ message: "You cannot delete yourself." });
      }
      await storage.deleteUser(userId);
      await storage.logAudit({
        action: "DELETE_USER",
        resource: "USER",
        userId: req.user.id,
        userName: req.user.username || req.user.name,
        details: { targetUserId: userId, targetUserName: user.name }
      });
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/admin/users/:id/ban", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { reason } = req.body;
      if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
        return res.status(400).json({ message: "Ban reason is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (isSuperAdminEmail(user.email)) {
        return res.status(403).json({ message: "Forbidden: Super admin cannot be banned" });
      }
      if (user.isAdmin && !isSuperAdminEmail(req.user?.email || "")) {
        return res.status(403).json({ message: "Forbidden: Only super admin can ban admins" });
      }
      await storage.banUser(userId, reason.trim());
      await storage.logAudit({
        action: "BAN_USER",
        resource: "USER",
        userId: req.user.id,
        userName: req.user.username || req.user.name,
        details: { targetUserId: userId, targetUserEmail: user.email, reason: reason.trim() }
      });
      res.json({ message: "User banned successfully" });
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/admin/users/:id/unban", requireAdmin, async (req, res, next) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (!user.isBanned) {
        return res.status(400).json({ message: "User is not banned" });
      }
      await storage.unbanUser(userId);
      await storage.logAudit({
        action: "UNBAN_USER",
        resource: "USER",
        userId: req.user.id,
        userName: req.user.username || req.user.name,
        details: { targetUserId: userId, targetUserEmail: user.email }
      });
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      next(error);
    }
  });
  app.delete("/api/admin/posts/:id", requireAdmin, async (req, res, next) => {
    try {
      const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await storage.getPost(postId);
      await storage.adminDeletePost(postId);
      if (post) {
        await storage.logAudit({
          action: "DELETE_POST",
          resource: "POST",
          userId: req.user.id,
          userName: req.user.username || req.user.name,
          details: { postId, postTitle: post.title, postAuthorId: post.userId }
        });
      }
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/stats", requireAdmin, async (_req, res, next) => {
    try {
      const userCountResult = await db.all(sql6`SELECT COUNT(*) as count FROM ${users}`);
      const postCountResult = await db.all(sql6`SELECT COUNT(*) as count FROM ${posts}`);
      const eventCountResult = await db.all(sql6`SELECT COUNT(*) as count FROM ${posts} WHERE ${posts.eventName} IS NOT NULL`);
      const reportCountResult = await db.all(sql6`SELECT COUNT(*) as count FROM reports`);
      const pendingReportCountResult = await db.all(sql6`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`);
      const postsByDateResult = await db.all(sql6`
        SELECT DATE(${posts.createdAt}) as date, COUNT(*) as count
        FROM ${posts}
        GROUP BY DATE(${posts.createdAt})
        ORDER BY date DESC
        LIMIT 30
      `);
      const postsByDate = {};
      postsByDateResult.forEach((row) => {
        postsByDate[row.date] = Number(row.count);
      });
      const stats = {
        totalUsers: Number(userCountResult[0].count),
        totalPosts: Number(postCountResult[0].count),
        totalEvents: Number(eventCountResult[0].count),
        totalReports: Number(reportCountResult[0].count),
        pendingReports: Number(pendingReportCountResult[0].count),
        postsByDate,
        skills: await db.all(sql6`
          SELECT json_each.value as name, COUNT(*) as count
          FROM ${users}, json_each(skills)
          WHERE skills IS NOT NULL AND json_array_length(skills) > 0
          GROUP BY json_each.value
          ORDER BY count DESC
          LIMIT 10
        `).then((res2) => {
          const skillsMap = {};
          res2.forEach((row) => {
            if (row.name) skillsMap[row.name] = Number(row.count);
          });
          return skillsMap;
        }).catch(() => {
          return {};
        })
      };
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/export/user-skills", requireAdmin, async (_req, res, next) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        department: users.department,
        skills: users.skills,
        interests: users.interests
      }).from(users).where(sql6`${users.skills} IS NOT NULL OR ${users.interests} IS NOT NULL`);
      const csvRows = [
        ["User ID", "Username", "Email", "Department", "Skills", "Interests"]
      ];
      for (const user of allUsers) {
        csvRows.push([
          user.id,
          user.username,
          user.email,
          user.department || "",
          Array.isArray(user.skills) ? user.skills.join("; ") : "",
          Array.isArray(user.interests) ? user.interests.join("; ") : ""
        ]);
      }
      const csv = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="user-skills-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/analytics", optionalAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(204).end();
      }
      const { insertAnalyticsSchema: insertAnalyticsSchema2 } = await Promise.resolve().then(() => (init_schema_sqlite(), schema_sqlite_exports));
      const data = { ...req.body, timestamp: /* @__PURE__ */ new Date() };
      const parsed = insertAnalyticsSchema2.safeParse(data);
      if (!parsed.success) return res.status(400).json(parsed.error);
      const event = {
        ...parsed.data,
        userId: req.user.id,
        metadata: {
          ...parsed.data.metadata,
          userAgent: req.headers["user-agent"],
          ip: req.ip
        }
      };
      waitUntil2(
        storage.logEvent(event).catch((error) => {
          console.error("Analytics logging failed:", error);
        })
      );
      res.sendStatus(200);
    } catch (error) {
      console.error("Analytics parsing failed:", error);
      res.sendStatus(200);
    }
  });
  app.post("/api/interactions", requireAuth, async (req, res) => {
    try {
      const { postId, interactionType, durationSeconds, metadata } = req.body;
      if (!postId || !interactionType) {
        return res.status(400).json({ message: "postId and interactionType are required" });
      }
      const validTypes = ["view", "click", "skip", "connection_request", "interested", "not_interested"];
      if (!validTypes.includes(interactionType)) {
        return res.status(400).json({ message: "Invalid interactionType" });
      }
      await storage.trackPostInteraction(
        req.user.id,
        postId,
        interactionType,
        durationSeconds,
        metadata
      );
      res.sendStatus(204);
    } catch (error) {
      console.error("Failed to track interaction:", error);
      res.sendStatus(200);
    }
  });
  app.post("/api/searches", requireAuth, async (req, res) => {
    try {
      const parsed = trackSearchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", details: parsed.error, code: "VALIDATION_ERROR" });
      }
      const { query, filters, resultsCount, clickedPostIds } = parsed.data;
      await storage.trackUserSearch(
        req.user.id,
        query,
        filters,
        resultsCount,
        clickedPostIds
      );
      res.sendStatus(204);
    } catch (error) {
      console.error("Failed to track search:", error);
      res.sendStatus(200);
    }
  });
  app.get("/api/recommendations", requireAuth, async (req, res, next) => {
    try {
      const limitParam = parseInt(req.query.limit);
      const limit = Math.min(isNaN(limitParam) ? 20 : limitParam, 50);
      const { getRecommendationBucket: getRecommendationBucket2 } = await Promise.resolve().then(() => (init_recommendations(), recommendations_exports));
      const recommendedIds = await storage.getRecommendedPostIds(req.user.id, limit);
      const bucket = getRecommendationBucket2(req.user.id);
      res.json({ postIds: recommendedIds, bucket });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/recommendations/posts", requireAuth, async (req, res, next) => {
    try {
      const limitParam = parseInt(req.query.limit);
      const limit = Math.min(isNaN(limitParam) ? 12 : limitParam, 30);
      const { getRecommendationBucket: getRecommendationBucket2 } = await Promise.resolve().then(() => (init_recommendations(), recommendations_exports));
      const recommendedIds = await storage.getRecommendedPostIds(req.user.id, limit * 2);
      const bucket = getRecommendationBucket2(req.user.id);
      if (recommendedIds.length === 0) {
        return res.json({ posts: [], bucket });
      }
      const rows = await db.select().from(posts).where(
        and6(
          inArray5(posts.id, recommendedIds),
          isNull3(posts.eventName)
        )
      );
      const byId = new Map(rows.map((post) => [post.id, post]));
      const ordered = recommendedIds.map((id) => byId.get(id)).filter((post) => Boolean(post)).slice(0, limit);
      res.json({ posts: ordered, bucket });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/search/suggestions", requireAuth, async (req, res, next) => {
    try {
      const limitParam = parseInt(req.query.limit);
      const limit = Math.min(isNaN(limitParam) ? 5 : limitParam, 10);
      const suggestions = await storage.getSearchSuggestions(req.user.id, limit);
      res.json({ suggestions });
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/observability/audit", requireAdmin, async (req, res) => {
    try {
      const { insertAuditLogSchema: insertAuditLogSchema2 } = await Promise.resolve().then(() => (init_schema_sqlite(), schema_sqlite_exports));
      const parsed = insertAuditLogSchema2.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }
      await storage.logAudit({
        ...parsed.data,
        userId: req.user?.id || null,
        userName: req.user?.username || req.user?.name || "System"
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to log audit event:", error);
      res.status(500).end();
    }
  });
  app.get("/api/admin/observability/audit", requireAdmin, async (req, res, next) => {
    try {
      const limitParam = req.query.limit;
      const limit = Math.min(
        limitParam && !isNaN(Number(limitParam)) ? Number(limitParam) : 100,
        500
      );
      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      let startDate;
      let endDate;
      if (startDateParam && typeof startDateParam === "string") {
        const parsed = new Date(startDateParam);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
      if (endDateParam && typeof endDateParam === "string") {
        const parsed = new Date(endDateParam);
        if (!isNaN(parsed.getTime())) endDate = parsed;
      }
      const logs = await storage.getAuditLogs(limit, startDate, endDate);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/observability/audit/export", requireAdmin, async (req, res, next) => {
    try {
      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      let startDate;
      let endDate;
      if (startDateParam && typeof startDateParam === "string") {
        const parsed = new Date(startDateParam);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
      if (endDateParam && typeof endDateParam === "string") {
        const parsed = new Date(endDateParam);
        if (!isNaN(parsed.getTime())) endDate = parsed;
      }
      const logs = await storage.getAuditLogs(1e4, startDate, endDate);
      const csv = [
        "ID,Timestamp,Action,Resource,User ID,Username,Details",
        ...logs.map((l) => {
          const action = `"${l.action.replace(/"/g, '""')}"`;
          const resource = `"${l.resource.replace(/"/g, '""')}"`;
          const details = l.details ? `"${JSON.stringify(l.details).replace(/"/g, '""')}"` : '""';
          return `${l.id},${l.timestamp},${action},${resource},${l.userId || ""},${l.userName || ""},${details}`;
        })
      ].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=audit-logs-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/audit/download", requireAdmin, async (req, res, next) => {
    try {
      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      let startDate;
      let endDate;
      if (startDateParam && typeof startDateParam === "string") {
        const parsed = new Date(startDateParam);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
      if (endDateParam && typeof endDateParam === "string") {
        const parsed = new Date(endDateParam);
        if (!isNaN(parsed.getTime())) endDate = parsed;
      }
      const end = endDate || /* @__PURE__ */ new Date();
      const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1e3);
      const logs = await storage.getAuditLogs(1e4, start, end);
      const csv = [
        "ID,Timestamp,Action,Resource,User ID,Username,Details",
        ...logs.map((l) => {
          const action = `"${l.action.replace(/"/g, '""')}"`;
          const resource = `"${l.resource.replace(/"/g, '""')}"`;
          const details = l.details ? `"${JSON.stringify(l.details).replace(/"/g, '""')}"` : '""';
          return `${l.id},${l.timestamp},${action},${resource},${l.userId || ""},${l.userName || ""},${details}`;
        })
      ].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=audit-logs-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });
  app.delete("/api/admin/observability/audit", requireAdmin, async (_req, res, next) => {
    try {
      await storage.clearAuditLogs();
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/contact", optionalAuth, async (req, res, next) => {
    try {
      const contactSchema = z2.object({
        firstName: z2.string().trim().min(1).max(50),
        lastName: z2.string().trim().min(1).max(50),
        email: z2.string().trim().email().max(255),
        subject: z2.enum(["General Inquiry", "Technical Support", "Partnership", "Feedback"]),
        message: z2.string().trim().min(10).max(2e3)
      });
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }
      const { firstName, lastName, email, subject, message } = parsed.data;
      const senderName = `${firstName} ${lastName}`.trim();
      const type = subject === "Feedback" ? "feedback" : subject === "Technical Support" ? "bug" : "support";
      const report = await storage.createReport({
        reporterId: req.user?.id ?? null,
        reporterEmail: email,
        type,
        subject,
        pageSection: "Contact Page",
        description: [
          `Sender: ${senderName}`,
          `Email: ${email}`,
          "",
          message
        ].join("\n")
      });
      try {
        const { mailProvider: mailProvider3 } = await Promise.resolve().then(() => (init_mail(), mail_exports));
        await mailProvider3.send({
          to: process.env.SMTP_USER || "FindATeammate@findateammate.online",
          subject: `\u{1F4E9} Contact Message: ${subject}`,
          text: `Contact message from ${senderName} <${email}>

Subject: ${subject}

${message}`,
          html: `
            <h2>New Contact Message</h2>
            <p><strong>Name:</strong> ${senderName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap;">${message}</div>
            <br/>
            <a href="${process.env.FRONTEND_URL}/admin">View in Dashboard</a>
          `
        });
      } catch (emailErr) {
        logger.error("Failed to send contact email", emailErr);
      }
      res.status(201).json({ success: true, reportId: report.id });
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/reports", requireAuth, async (req, res, next) => {
    try {
      const { insertReportSchema: insertReportSchema2 } = await Promise.resolve().then(() => (init_schema_sqlite(), schema_sqlite_exports));
      const parsed = insertReportSchema2.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }
      const reporter = await storage.getUser(req.user.id);
      if (!reporter) {
        return res.status(404).json({ message: "User not found" });
      }
      const report = await storage.createReport({
        ...parsed.data,
        reporterId: req.user.id,
        reporterEmail: req.user.email
      });
      try {
        const { mailProvider: mailProvider3 } = await Promise.resolve().then(() => (init_mail(), mail_exports));
        const username = req.user.username || req.user.name;
        const target = parsed.data.pageSection || "General";
        await mailProvider3.send({
          to: process.env.SMTP_USER || "FindATeammate@findateammate.online",
          subject: `\u{1F6A8} New Report: ${parsed.data.type} - ${parsed.data.subject}`,
          text: `New Report from ${req.user.name} (@${username})

Type: ${parsed.data.type}
Context: ${target}
Description: ${parsed.data.description}

Check Admin Dashboard for details.`,
          html: `
            <h2>New User Report</h2>
            <p><strong>Reporter:</strong> ${req.user.name} (@${username})</p>
            <p><strong>Type:</strong> ${parsed.data.type}</p>
            <p><strong>Subject:</strong> ${parsed.data.subject}</p>
            <p><strong>Context:</strong> ${target}</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2;">
              <strong>Description:</strong><br/>
              ${parsed.data.description}
            </div>
            <br/>
            <a href="${process.env.FRONTEND_URL}/admin">View in Dashboard</a>
          `
        });
      } catch (err) {
        logger.error("Failed to send admin report email", err);
      }
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/reports", requireAdmin, async (req, res, next) => {
    try {
      const { status, type, search } = req.query;
      const reports2 = await storage.getReports(status, type, search);
      res.json(reports2);
    } catch (error) {
      next(error);
    }
  });
  app.patch("/api/admin/reports/:id", requireAdmin, async (req, res, next) => {
    try {
      const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, adminNotes } = req.body;
      if (!["pending", "resolved", "dismissed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const report = await storage.updateReportStatus(reportId, status, req.user.id, adminNotes);
      await storage.logAudit({
        action: "UPDATE_REPORT",
        resource: "REPORT",
        userId: req.user.id,
        userName: req.user.username || req.user.name,
        details: { reportId, status, adminNotes }
      });
      const { sendResolutionEmail: sendResolutionEmail2 } = await Promise.resolve().then(() => (init_mail(), mail_exports));
      try {
        if (report && status === "resolved" && report.reporterEmail) {
          await sendResolutionEmail2(report.reporterEmail, Number(report.id), adminNotes || "No specific notes provided.");
        }
      } catch (emailErr) {
        logger.error("Failed to send resolution email", emailErr);
      }
      res.json(report);
    } catch (error) {
      next(error);
    }
  });
  app.delete("/api/admin/reports", requireAdmin, async (req, res, next) => {
    try {
      const { ids, all } = req.query;
      if (all === "true") {
        await storage.deleteAllReports();
      } else if (ids && typeof ids === "string") {
        const idList2 = ids.split(",").filter(Boolean);
        await storage.deleteReports(idList2);
      } else {
        return res.status(400).json({ message: "Missing 'all=true' or 'ids' query parameter" });
      }
      const idList = ids && typeof ids === "string" ? ids.split(",").filter(Boolean) : [];
      await storage.logAudit({
        action: "DELETE_REPORTS",
        resource: "REPORT",
        userId: req.user.id,
        userName: req.user.username || req.user.name,
        details: { all, count: all ? "ALL" : idList.length }
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/feedback", requireAuth, async (req, res, next) => {
    try {
      const { insertFeedbackSchema: insertFeedbackSchema2 } = await Promise.resolve().then(() => (init_schema_sqlite(), schema_sqlite_exports));
      const payload = { ...req.body, comment: req.body.feedback };
      const parsed = insertFeedbackSchema2.safeParse(payload);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }
      const { mailProvider: mailProvider3 } = await Promise.resolve().then(() => (init_mail(), mail_exports));
      const username = req.user.username || req.user.name;
      const category = req.body.category || "General";
      try {
        await mailProvider3.send({
          to: process.env.SMTP_USER || "FindATeammate@findateammate.online",
          subject: `\u{1F4A1} New Feedback: ${category}`,
          text: `Feedback from ${req.user.name} (@${username})

"${req.body.feedback}"`,
          html: `
            <h2>New User Feedback</h2>
            <p><strong>User:</strong> ${req.user.name} (@${username})</p>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
              "${req.body.feedback}"
            </div>
          `
        });
      } catch (emailErr) {
        logger.error("Failed to send feedback email", emailErr);
      }
      const feedbackEntry = await storage.createFeedback({
        ...parsed.data,
        userId: req.user.id
      });
      res.status(201).json(feedbackEntry);
    } catch (error) {
      next(error);
    }
  });
  app.delete("/api/users/me", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user.id;
      await storage.deleteUser(userId);
      req.session.destroy((err) => {
        if (err) {
          logger.error("Session destroy failed after account deletion", err);
        }
        const isProduction2 = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
        res.clearCookie("connect.sid", {
          path: "/",
          sameSite: isProduction2 ? "none" : "lax",
          secure: isProduction2,
          httpOnly: true
        });
        res.json({ success: true, message: "Account deleted successfully" });
      });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/feedback", requireAdmin, async (req, res, next) => {
    try {
      const limitParam = req.query.limit ? Number(req.query.limit) : 50;
      const limit = isNaN(limitParam) ? 50 : Math.min(limitParam, 500);
      const feedback2 = await storage.getFeedback(limit);
      res.json(feedback2);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/analytics", requireAdmin, async (req, res, next) => {
    try {
      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      let startDate;
      let endDate;
      if (startDateParam && typeof startDateParam === "string") {
        const parsed = new Date(startDateParam);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
      if (endDateParam && typeof endDateParam === "string") {
        const parsed = new Date(endDateParam);
        if (!isNaN(parsed.getTime())) endDate = parsed;
      }
      const whereConditions = [];
      if (startDate) whereConditions.push(sql6`${analytics.timestamp} >= ${startDate}`);
      if (endDate) whereConditions.push(sql6`${analytics.timestamp} <= ${endDate}`);
      let featureUsageResult;
      if (whereConditions.length > 0) {
        featureUsageResult = await db.all(sql6`
          SELECT event as feature, COUNT(*) as usage 
          FROM ${analytics}
          WHERE ${whereConditions.reduce((a, b) => sql6`${a} AND ${b}`)}
          GROUP BY event
          ORDER BY usage DESC
        `);
      } else {
        featureUsageResult = await db.all(sql6`
          SELECT event as feature, COUNT(*) as usage 
          FROM ${analytics}
          GROUP BY event
          ORDER BY usage DESC
        `);
      }
      const featureUsage = featureUsageResult.map((row) => ({
        feature: row.feature,
        usage: Number(row.usage)
      }));
      const userGrowthResult = await db.all(sql6`
        SELECT strftime('%Y-%m-%d', ${users.createdAt}, 'unixepoch') as date, COUNT(*) as count 
        FROM ${users} 
        WHERE ${users.createdAt} > unixepoch() - 30 * 86400
        GROUP BY strftime('%Y-%m-%d', ${users.createdAt}, 'unixepoch') 
        ORDER BY date ASC
      `);
      const dauResult = await db.all(sql6`
        SELECT COUNT(DISTINCT ${analytics.userId}) as count 
        FROM ${analytics} 
        WHERE ${analytics.timestamp} > unixepoch() - 86400
      `);
      const mauResult = await db.all(sql6`
        SELECT COUNT(DISTINCT ${analytics.userId}) as count 
        FROM ${analytics} 
        WHERE ${analytics.timestamp} > unixepoch() - 30 * 86400
      `);
      let avgSessionDuration = 0;
      try {
        const sessionResult = await db.all(sql6`
          WITH UserSessions AS (
              SELECT 
                  ${analytics.userId}, 
                  date(${analytics.timestamp}, 'unixepoch') as day,
                  (MAX(${analytics.timestamp}) - MIN(${analytics.timestamp})) / 60.0 as duration_minutes
              FROM ${analytics}
              WHERE ${analytics.timestamp} > unixepoch() - 7 * 86400
              AND ${analytics.userId} IS NOT NULL
              GROUP BY ${analytics.userId}, date(${analytics.timestamp}, 'unixepoch')
              HAVING COUNT(*) > 1
          )
          SELECT COALESCE(ROUND(AVG(duration_minutes), 1), 0) as avg_duration FROM UserSessions
        `);
        avgSessionDuration = Number(sessionResult[0]?.avg_duration || 0);
      } catch {
        avgSessionDuration = 0;
      }
      let retention7Day = 0;
      try {
        const retentionResult = await db.all(sql6`
          WITH LastWeekUsers AS (
              SELECT DISTINCT ${analytics.userId} as uid
              FROM ${analytics}
              WHERE ${analytics.timestamp} BETWEEN unixepoch() - 14 * 86400 AND unixepoch() - 7 * 86400
              AND ${analytics.userId} IS NOT NULL
          ),
          ThisWeekUsers AS (
              SELECT DISTINCT ${analytics.userId} as uid
              FROM ${analytics}
              WHERE ${analytics.timestamp} > unixepoch() - 7 * 86400
              AND ${analytics.userId} IS NOT NULL
          )
          SELECT 
              CASE 
                  WHEN (SELECT COUNT(*) FROM LastWeekUsers) = 0 THEN 0
                  ELSE ROUND(
                      CAST((SELECT COUNT(*) FROM LastWeekUsers JOIN ThisWeekUsers ON LastWeekUsers.uid = ThisWeekUsers.uid) AS REAL) / 
                      CAST((SELECT COUNT(*) FROM LastWeekUsers) AS REAL) * 100, 
                  1)
              END as retention
        `);
        retention7Day = Number(retentionResult[0]?.retention || 0);
      } catch {
        retention7Day = 0;
      }
      const analyticsData = {
        userGrowth: userGrowthResult.map((row) => ({
          date: row.date,
          count: Number(row.count)
        })),
        engagementMetrics: {
          dau: Number(dauResult[0].count),
          mau: Number(mauResult[0].count),
          avgSessionDuration,
          retention7Day
        },
        featureUsage,
        userFeedback: await storage.getFeedback(10)
      };
      res.json(analyticsData);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/personalization/metrics", requireAdmin, async (req, res, next) => {
    try {
      const daysParam = req.query.days ? Number(req.query.days) : 30;
      const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 1), 365) : 30;
      const metrics = await storage.getPersonalizationMetrics(days);
      res.json({ days, ...metrics });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/analytics/export", requireAdmin, async (req, res, next) => {
    try {
      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      let startDate;
      let endDate;
      if (startDateParam && typeof startDateParam === "string") {
        const parsed = new Date(startDateParam);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
      if (endDateParam && typeof endDateParam === "string") {
        const parsed = new Date(endDateParam);
        if (!isNaN(parsed.getTime())) endDate = parsed;
      }
      const events = await storage.getAnalytics(startDate, endDate, 1e4);
      const csv = [
        "ID,Timestamp,Event,Page,User ID,Metadata",
        ...events.map((e) => {
          const meta = e.metadata ? `"${JSON.stringify(e.metadata).replace(/"/g, '""')}"` : '""';
          return `${e.id},${e.timestamp},"${e.event}","${e.page}",${e.userId || ""},${meta}`;
        })
      ].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=analytics-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/export/users", requireAdmin, async (_req, res, next) => {
    try {
      const users2 = await storage.getUsers(5e3);
      const csv = [
        "ID,Name,Username,Email,Skill,CreatedAt,IsAdmin",
        ...users2.map((u) => {
          const maskedEmail = u.email.replace(/(^.{2}).*(@.*$)/, "$1***$2");
          return `${u.id},"${u.name.replace(/"/g, '""')}","${u.username.replace(/"/g, '""')}",${maskedEmail},"${((u.skills || [])[0] || "").replace(/"/g, '""')}",${u.createdAt},${u.isAdmin}`;
        })
      ].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=users-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/export/training-data", requireAdmin, async (_req, res, next) => {
    try {
      const { items: posts2 } = await storage.getPosts(void 0, 5e3);
      const trainingData = posts2.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        skillsOffered: p.skillsOffered,
        skillsWanted: p.skillsWanted,
        upvotes: p.eventUpvotes,
        createdAt: p.createdAt
      }));
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=training-data-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`);
      res.json(trainingData);
    } catch (error) {
      next(error);
    }
  });
  app.get("/health", async (_req, res) => {
    try {
      await db.all(sql6`SELECT 1`);
      res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString(), db: "connected" });
    } catch (error) {
      logger.error("Health check failed", error);
      res.status(503).json({ status: "error", message: "Database connection failed" });
    }
  });
  app.get("/api/docs", async (_req, res, next) => {
    try {
      const fs = (await import("fs")).default;
      const path2 = (await import("path")).default;
      const docsPath = path2.join(process.cwd(), "docs", "api.md");
      if (fs.existsSync(docsPath)) {
        res.setHeader("Content-Type", "text/markdown");
        res.send(fs.readFileSync(docsPath, "utf8"));
      } else {
        res.status(404).json({ message: "Docs not found" });
      }
    } catch (error) {
      next(error);
    }
  });
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "API route not found" });
  });
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      logger.warn(`Multer error: ${err.code} on ${req.path} by user ${req.user?.id || "anonymous"}`);
      if (err.code === "LIMIT_FILE_SIZE") {
        const isAvatarUpload = req.path.includes("/avatar");
        const limit = isAvatarUpload ? "2MB" : "5MB";
        return res.status(413).json({
          message: `File too large. Maximum size is ${limit}`,
          code: "FILE_TOO_LARGE"
        });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          message: "Unexpected file field",
          code: "INVALID_FILE_FIELD"
        });
      }
      return res.status(400).json({
        message: err.message || "File upload error",
        code: "UPLOAD_ERROR"
      });
    }
    next(err);
  });
  app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    logger.error(`Unhandled error on ${req.path}`, err);
    res.status(status).json({ message });
  });
}

// api/_entry.ts
registerRoutes();
var handler = serverless(app, { binary: [] });
async function entry_default(req, res) {
  if (req.url && req.url.includes("/api/internal/test-waituntil")) {
    return handler(req, res);
  }
  if (!await bootstrap(req, res)) return;
  return handler(req, res);
}
export {
  entry_default as default
};
