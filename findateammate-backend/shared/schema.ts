import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";
import { COLLEGES } from "./constants";

// Users table
export const users = pgTable("users", {
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
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  privacy: jsonb("privacy").$type<{
    showEmail: boolean;
    showPortfolio: boolean;
    showUniversity: boolean;
    showCity: boolean;
  }>().notNull().default({ showEmail: false, showPortfolio: false, showUniversity: false, showCity: false }),
  password: text("password"), // Nullable for OAuth-only users
  avatar: text("avatar"), // Base64 or URL
  googleId: text("google_id").unique(),
  authProvider: text("auth_provider").default("local").notNull(),
  skillLevel: text("skill_level"), // Beginner, Intermediate, Expert
  isAdmin: boolean("is_admin").default(false).notNull(),
  isOrganiser: boolean("is_organiser").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  emailVerifiedAt: timestamp("email_verified_at"),
  isBanned: boolean("is_banned").default(false).notNull(),
  banReason: text("ban_reason"), // Reason for ban, displayed on banned page
  bannedAt: timestamp("banned_at"), // When user was banned
  tourCompleted: boolean("tour_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActive: timestamp("last_active"), // Last time user made an authenticated request
});

// Posts table
export const posts = pgTable("posts", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  title: text("title").notNull(),
  skillsOffered: jsonb("skills_offered").$type<{ name: string; level: string }[]>().notNull(),
  skillsWanted: jsonb("skills_wanted").$type<{ name: string; level: string }[]>().notNull(),
  description: text("description").notNull(),
  availability: text("availability").notNull(),
  city: text("city").notNull(),
  university: text("university"),
  eventName: text("event_name"),
  eventType: text("event_type"), // 'intra-college' | 'outside-college' - null for teammate posts
  hostCollege: text("host_college"), // For intra-college events: which college is hosting
  eventWebsite: text("event_website"),
  eventImage: text("event_image"),
  eventDetails: text("event_details"),
  eventDate: timestamp("event_date"), // When the event happens - events auto-delete after this date
  eventUpvotes: integer("event_upvotes").default(0),
  // Cross-department event participation fields (only for intra-college events)
  isEventOrganiser: boolean("is_event_organiser").notNull().default(false), // For intra-college: is user the event organiser/host?
  allowedDepartments: jsonb("allowed_departments").$type<string[]>(), // null = all departments, array = specific departments (1-6)
  requiredSkills: jsonb("required_skills").$type<string[]>().default([]),
  requiredInterests: jsonb("required_interests").$type<string[]>().default([]),
  specialRequirements: text("special_requirements"), // Optional organiser-entered requirements (max 250 chars)
  maxCrossDeptParticipants: integer("max_cross_dept_participants"),
  crossDeptRequiresApproval: boolean("cross_dept_requires_approval").notNull().default(true),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userName: text("user_name").notNull(),
  userSkill: text("user_skill").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("posts_user_id_idx").on(table.userId),
    createdAtIdx: index("posts_created_at_idx").on(table.createdAt),
    eventDateIdx: index("posts_event_date_idx").on(table.eventDate),
    // Optimization for rate limiting queries (where userId = ? AND createdAt > ?)
    rateLimitIdx: index("posts_rate_limit_idx").on(table.userId, table.createdAt),
    // GIN Indexes for fast JSONB search (Skills)
    skillsOfferedIdx: index("posts_skills_offered_idx").using("gin", table.skillsOffered),
    skillsWantedIdx: index("posts_skills_wanted_idx").using("gin", table.skillsWanted),
    requiredSkillsIdx: index("posts_required_skills_idx").using("gin", table.requiredSkills),
    requiredInterestsIdx: index("posts_required_interests_idx").using("gin", table.requiredInterests),
  };
});

// Connection Requests table
export const connectionRequests = pgTable("connection_requests", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  postTitle: text("post_title").notNull(),
  fromUserId: text("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fromUserName: text("from_user_name").notNull(),
  fromUserSkill: text("from_user_skill").notNull(),
  toUserId: text("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserName: text("to_user_name"), // Added for data consistency
  status: text("status").notNull(), // pending, accepted, rejected
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  fromUserLastCleared: timestamp("from_user_last_cleared"),
  toUserLastCleared: timestamp("to_user_last_cleared"),
}, (table) => {
  return {
    fromUserIdx: index("requests_from_user_idx").on(table.fromUserId),
    toUserIdx: index("requests_to_user_idx").on(table.toUserId),
    postIdx: index("requests_post_idx").on(table.postId),
    // Prevent duplicate requests: A user can only send one request per post to a specific user
    uniqueRequestIdx: uniqueIndex("requests_unique_idx").on(table.fromUserId, table.toUserId, table.postId),
  };
});

// Event Registrations table - for cross-department event participation
export const eventRegistrations = pgTable("event_registrations", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  registrationType: text("registration_type").notNull(), // 'department' | 'cross_department'
  matchScore: integer("match_score"), // 0-100, null for department registrations
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected' | 'confirmed'
  rejectionReason: text("rejection_reason"), // Reason if status is rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
    userIdStatusIdx: index("event_registrations_user_id_status_idx").on(table.userId, table.status),
  };
});

// Messages table
export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  chatId: text("chat_id").notNull().references(() => connectionRequests.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => {
  return {
    chatIdx: index("messages_chat_idx").on(table.chatId),
    timestampIdx: index("messages_timestamp_idx").on(table.timestamp),
    // Optimization: Composite index for faster pagination
    messagesChatTimestampIdx: index("messages_chat_timestamp_idx").on(table.chatId, table.timestamp),
  };
});

// Chats table


// Notifications table
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), 
  type: text("type").notNull(), // 'connection_request', 'message', 'alert', 'system'
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"), // URL to redirect to
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata"), // Extra data
}, (table) => {
  return {
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
    // Optimization: Composite index for faster retrieval
    notificationsUserCreatedIdx: index("notifications_user_created_idx").on(table.userId, table.createdAt),
    // GIN index for metadata queries (e.g. senderId)
    metadataIdx: index("notifications_metadata_idx").using("gin", table.metadata),
  };
});

// Session table for connect-pg-simple
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// Insert Schemas
// Utility for URL validation and hardening
const getURLSchema = (fieldName: string, isNullable: boolean = false) => {
  const base = z.string().trim().optional();
  const refined = (isNullable ? base.nullable() : base)
    .transform(v => v || (isNullable ? null : ""))
    .refine(v => !v || !v.toLowerCase().startsWith("javascript:"), `Invalid ${fieldName} URL`)
    .transform(v => v && typeof v === 'string' && v.startsWith("http://") ? v.replace("http://", "https://") : v)
    .transform(v => v && typeof v === 'string' && !v.startsWith("http") && !v.startsWith("/") ? `https://${v}` : v);
  return refined;
};

// Insert Schemas
export const insertUserSchema = createInsertSchema(users, {
  name: z.string().trim().min(1, "Name is required").max(100).transform(v => v.replace(/[<>]/g, "")),
  username: z.string().trim().min(1, "Username is required").max(50).transform(v => v.replace(/[<>]/g, "")),
  email: z.string().trim().email("Invalid email address").transform(v => v.toLowerCase()),
  bio: z.string().trim().max(250, "Bio cannot exceed 250 characters").optional().or(z.literal("")).transform(v => v ? v.replace(/[<>]/g, "") : ""),
  portfolio: getURLSchema("portfolio") as z.ZodType<string>,
  github: getURLSchema("github") as z.ZodType<string>,

  // Nullable fields in DB
  twitter: getURLSchema("Twitter", true),
  linkedin: getURLSchema("LinkedIn", true),
  university: z.string().trim().min(1, "University is required").max(200, "University name cannot exceed 200 characters")
    .refine((val) => val !== "OTHER", "Please select a valid university or enter a custom one")
    .transform(v => v.replace(/<[^>]*>/g, "").trim()),
  city: z.string().trim().optional().nullable().transform(v => v ? (v.length > 100 ? v.substring(0, 100) : v) : v),
  avatar: z.string().trim().optional().nullable(),
  skillLevel: z.enum(["Beginner", "Intermediate", "Expert"]).optional().nullable(),
  
  // Department and skills fields
  department: z.enum([
    "OTHER",
    "CYBER", "CSE", "CCE", "ECE", "CIVIL", "EEE", "MECHANICAL", "MECH AND AUTO",
    "EIE", "EICE", "IT", "AIDS", "AIML", "IOT", "MBA", "MECHATRONICS"
  ]).optional().default("OTHER"),
  skills: z.array(z.string().trim()).optional().default([]).transform((skills) => {
    // Import filterValidSkills from constants at runtime to validate against whitelist
    return skills;
  }),
  interests: z.array(z.string().trim()).optional().default([]).transform((interests) => {
    // Import filterValidInterests from constants at runtime to validate against whitelist
    return interests;
  }),

  privacy: z.object({
    showEmail: z.boolean(),
    showPortfolio: z.boolean(),
    showUniversity: z.boolean(),
    showCity: z.boolean(),
  }),
  password: z.string().min(8, "Password must be at least 8 characters").optional().nullable(),
  authProvider: z.string().default("local"),
}).omit({ 
  id: true, 
  createdAt: true, 
  isAdmin: true,
  isOrganiser: true,
  googleId: true,
  isVerified: true,
  emailVerifiedAt: true
});

// Select schema that excludes sensitive fields from API responses
export const selectUserSchema = createSelectSchema(users).omit({
  password: true,
});

export const insertPostSchema = createInsertSchema(posts, {
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(300).transform(v => v.replace(/[<>]/g, "")),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(500).transform(v => v.replace(/[<>]/g, "")),
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
  eventDate: z.union([z.string(), z.date()]).nullable().optional().transform(val => {
    if (!val) return null;
    if (val instanceof Date) return val;
    return new Date(val);
  }),
  
  // Cross-department event fields
  requiredSkills: z.array(z.string().trim()).optional().default([]),
  requiredInterests: z.array(z.string().trim()).optional().default([]),
  specialRequirements: z.string().trim().max(250, "Special requirements cannot exceed 250 characters").optional().nullable(),
  maxCrossDeptParticipants: z.number().int().min(1).optional().nullable(),
  crossDeptRequiresApproval: z.boolean().optional().default(true),
});

export const insertConnectionRequestSchema = createInsertSchema(connectionRequests, {
  postTitle: z.string().trim().transform(v => v.replace(/[<>]/g, "")),
  fromUserName: z.string().trim().transform(v => v.replace(/[<>]/g, "")),
  fromUserSkill: z.string().trim().transform(v => v.replace(/[<>]/g, "")),
  message: z.string().trim().optional().transform(v => v ? v.replace(/[<>]/g, "") : v),
  status: z.enum(["pending", "accepted", "rejected"]).default("pending"),
});

// Event Registrations insert schema
export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations, {
  registrationType: z.enum(["department", "cross_department"]),
  matchScore: z.number().int().min(0).max(100).optional().nullable(),
  status: z.enum(["pending", "approved", "rejected", "confirmed"]).default("pending"),
  rejectionReason: z.string().trim().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages, {
  text: z.string().trim().min(1, "Message cannot be empty").max(1000).transform(v => v.replace(/[<>]/g, "")),
});

// System Settings (Key-Value Store for Feature Flags/Maintenance)
export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(), // e.g., 'maintenance_mode'
  value: jsonb("value").notNull(), // e.g., { enabled: true, mode: 'FULL', message: '...' }
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: text("updated_by").references(() => users.id),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;



// Analytics table
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // Optional
  event: text("event").notNull(),
  page: text("page").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => {
  return {
    metadataIdx: index("analytics_metadata_idx").using("gin", table.metadata),
  };
});

// Event Votes table to prevent spam
export const eventVotes = pgTable("event_votes", {
  id: serial("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  voteType: integer("vote_type").notNull(), // 1 for upvote, -1 for downvote
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    uniqueVoteIdx: uniqueIndex("unique_vote_idx").on(table.postId, table.userId),
  };
});

// Post interactions table for behavioral tracking
export const postInteractions = pgTable("post_interactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  interactionType: text("interaction_type").notNull(), // 'view', 'click', 'skip', 'connection_request'
  durationSeconds: integer("duration_seconds"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("post_interactions_user_id_idx").on(table.userId),
    postIdIdx: index("post_interactions_post_id_idx").on(table.postId),
    typeIdx: index("post_interactions_type_idx").on(table.interactionType),
    createdAtIdx: index("post_interactions_created_at_idx").on(table.createdAt),
  };
});

// User searches table for pattern learning
export const userSearches = pgTable("user_searches", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  filters: jsonb("filters").$type<Record<string, any>>(),
  resultsCount: integer("results_count"),
  clickedPostIds: jsonb("clicked_post_ids").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("user_searches_user_id_idx").on(table.userId),
    createdAtIdx: index("user_searches_created_at_idx").on(table.createdAt),
    queryIdx: index("user_searches_query_idx").on(table.query),
  };
});

// User preferences (learned from behavior)
export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  preferredSkills: jsonb("preferred_skills").$type<string[]>().default([]),
  preferredCities: jsonb("preferred_cities").$type<string[]>().default([]),
  preferredEventTypes: jsonb("preferred_event_types").$type<string[]>().default([]),
  interactionScore: jsonb("interaction_score").$type<Record<string, number>>().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    preferredSkillsIdx: index("user_preferences_preferred_skills_idx").using("gin", table.preferredSkills),
    interactionScoreIdx: index("user_preferences_interaction_score_idx").using("gin", table.interactionScore),
  };
});

// Audit Logs table (New)
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id"), // Can be null for system actions
  userName: text("user_name"),
  action: text("action").notNull(), // 'LOGIN', 'DELETE_POST', 'UPDATE_SETTINGS', etc.
  resource: text("resource").notNull(), // 'USER', 'POST', 'SYSTEM'
  details: jsonb("details"), // Detailed payload
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => {
  return {
    timestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
    // GIN index for searching within details
    detailsIdx: index("audit_logs_details_idx").using("gin", table.details),
  };
});

// Feedback table (New)
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => {
  return {
    timestampIdx: index("feedback_timestamp_idx").on(table.timestamp),
    ratingIdx: index("feedback_rating_idx").on(table.rating),
  };
});

// Insert Schemas
export const insertAnalyticsSchema = createInsertSchema(analytics, {
  event: z.string().trim().min(1).max(100),
  page: z.string().trim().min(1).max(200),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs, {
  action: z.string().trim().min(1),
  resource: z.string().trim().min(1),
  details: z.record(z.string(), z.any()).optional(),
});

export const insertFeedbackSchema = createInsertSchema(feedback, {
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(1000),
});

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;
export type PostInteraction = typeof postInteractions.$inferSelect;
export type InsertPostInteraction = typeof postInteractions.$inferInsert;
export type UserSearch = typeof userSearches.$inferSelect;
export type InsertUserSearch = typeof userSearches.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export type ConnectionRequest = typeof connectionRequests.$inferSelect;
export type InsertConnectionRequest = typeof connectionRequests.$inferInsert;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = typeof eventRegistrations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Reports table
export const reports = pgTable("reports", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  reporterId: text("reporter_id").references(() => users.id, { onDelete: "set null" }),
  reporterEmail: text("reporter_email"),
  reportedUserId: text("reported_user_id").references(() => users.id, { onDelete: "set null" }),
  reportedPostId: text("reported_post_id").references(() => posts.id, { onDelete: "set null" }),
  type: text("type").notNull(), // feedback, bug, support
  subject: text("subject").notNull(),
  pageSection: text("page_section"), // Where it happened
  description: text("description").notNull(),
  status: text("status").default("pending").notNull(), // pending, resolved, dismissed
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by").references(() => users.id, { onDelete: "set null" }),
});

export const insertReportSchema = createInsertSchema(reports, {
  type: z.enum(["feedback", "bug", "support"]),
  subject: z.string().trim().min(3, "Subject is too short").max(100),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(500, "Description cannot exceed 500 characters"),
  pageSection: z.string().trim().max(100).optional().nullable(),
  reporterEmail: z.string().email().optional().or(z.literal("")),
  status: z.enum(["pending", "resolved", "dismissed"]).default("pending"),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

export interface ChatWithDetails {
  id: string;
  partnerName: string;
  partnerId: string;
  partnerAvatar?: string | null;
  lastMessage: string | null;
  timestamp: string | Date | null;
  unreadCount?: number;
}
