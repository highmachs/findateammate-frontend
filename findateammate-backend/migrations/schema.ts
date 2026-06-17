import { pgTable, uniqueIndex, foreignKey, serial, text, integer, timestamp, index, jsonb, boolean, check, unique, pgPolicy, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const eventVotes = pgTable("event_votes", {
	id: serial().primaryKey().notNull(),
	postId: text("post_id").notNull(),
	userId: text("user_id").notNull(),
	voteType: integer("vote_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("unique_vote_idx").using("btree", table.postId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "event_votes_post_id_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "event_votes_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const reports = pgTable("reports", {
	id: text().primaryKey().notNull(),
	reporterId: text("reporter_id"),
	reporterEmail: text("reporter_email"),
	reportedUserId: text("reported_user_id"),
	reportedPostId: text("reported_post_id"),
	type: text().notNull(),
	description: text().notNull(),
	status: text().default('pending').notNull(),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	resolvedBy: text("resolved_by"),
	subject: text().notNull(),
	pageSection: text("page_section"),
}, (table) => [
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [users.id],
			name: "reports_reporter_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.reportedUserId],
			foreignColumns: [users.id],
			name: "reports_reported_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.reportedPostId],
			foreignColumns: [posts.id],
			name: "reports_reported_post_id_posts_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.resolvedBy],
			foreignColumns: [users.id],
			name: "reports_resolved_by_users_id_fk"
		}).onDelete("set null"),
]);

export const auditLogs = pgTable("audit_logs", {
	id: text().primaryKey().notNull(),
	userId: text("user_id"),
	userName: text("user_name"),
	action: text().notNull(),
	resource: text().notNull(),
	details: jsonb(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("audit_logs_action_idx").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("audit_logs_details_idx").using("gin", table.details.asc().nullsLast().op("jsonb_ops")),
	index("audit_logs_timestamp_idx").using("btree", table.timestamp.asc().nullsLast().op("timestamp_ops")),
	index("audit_logs_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const systemSettings = pgTable("system_settings", {
	key: text().primaryKey().notNull(),
	value: jsonb().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by"),
}, (table) => [
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "system_settings_updated_by_users_id_fk"
		}),
]);

export const feedback = pgTable("feedback", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id"),
	rating: integer().notNull(),
	comment: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("feedback_rating_idx").using("btree", table.rating.asc().nullsLast().op("int4_ops")),
	index("feedback_timestamp_idx").using("btree", table.timestamp.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "feedback_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const eventRegistrations = pgTable("event_registrations", {
	id: text().primaryKey().notNull(),
	postId: text("post_id").notNull(),
	userId: text("user_id").notNull(),
	registrationType: text("registration_type").notNull(),
	matchScore: integer("match_score"),
	status: text().default('pending').notNull(),
	rejectionReason: text("rejection_reason"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("event_registrations_post_id_idx").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	index("event_registrations_post_id_status_idx").using("btree", table.postId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("event_registrations_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("event_registrations_type_idx").using("btree", table.registrationType.asc().nullsLast().op("text_ops")),
	uniqueIndex("event_registrations_unique_idx").using("btree", table.postId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	index("event_registrations_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("event_registrations_user_id_status_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "event_registrations_post_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "event_registrations_user_id_fk"
		}).onDelete("cascade"),
]);

export const postInteractions = pgTable("post_interactions", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	postId: text("post_id").notNull(),
	interactionType: text("interaction_type").notNull(),
	durationSeconds: integer("duration_seconds"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("post_interactions_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("post_interactions_post_id_idx").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	index("post_interactions_type_idx").using("btree", table.interactionType.asc().nullsLast().op("text_ops")),
	index("post_interactions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "post_interactions_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_interactions_post_id_fk"
		}).onDelete("cascade"),
]);

export const userSearches = pgTable("user_searches", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	query: text().notNull(),
	filters: jsonb(),
	resultsCount: integer("results_count"),
	clickedPostIds: jsonb("clicked_post_ids"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_searches_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("user_searches_query_idx").using("btree", table.query.asc().nullsLast().op("text_ops")),
	index("user_searches_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_searches_user_id_fk"
		}).onDelete("cascade"),
]);

export const userPreferences = pgTable("user_preferences", {
	userId: text("user_id").primaryKey().notNull(),
	preferredSkills: jsonb("preferred_skills").default([]),
	preferredCities: jsonb("preferred_cities").default([]),
	preferredEventTypes: jsonb("preferred_event_types").default([]),
	interactionScore: jsonb("interaction_score").default({}),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_preferences_interaction_score_idx").using("gin", table.interactionScore.asc().nullsLast().op("jsonb_ops")),
	index("user_preferences_preferred_skills_idx").using("gin", table.preferredSkills.asc().nullsLast().op("jsonb_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_preferences_user_id_fk"
		}).onDelete("cascade"),
]);

export const analytics = pgTable("analytics", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id"),
	event: text().notNull(),
	page: text().notNull(),
	metadata: jsonb(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("analytics_metadata_idx").using("gin", table.metadata.asc().nullsLast().op("jsonb_ops")),
]);

export const notifications = pgTable("notifications", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	link: text(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	metadata: jsonb(),
}, (table) => [
	index("notifications_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("notifications_metadata_idx").using("gin", table.metadata.asc().nullsLast().op("jsonb_ops")),
	index("notifications_user_created_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("notifications_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const posts = pgTable("posts", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	skillsOffered: jsonb("skills_offered").notNull(),
	skillsWanted: jsonb("skills_wanted").notNull(),
	description: text().notNull(),
	availability: text().notNull(),
	city: text().notNull(),
	university: text(),
	eventName: text("event_name"),
	eventWebsite: text("event_website"),
	eventDetails: text("event_details"),
	eventUpvotes: integer("event_upvotes").default(0),
	userId: text("user_id").notNull(),
	userName: text("user_name").notNull(),
	userSkill: text("user_skill").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	eventImage: text("event_image"),
	eventDate: timestamp("event_date", { mode: 'string' }),
	allowedDepartments: jsonb("allowed_departments"),
	eventType: text("event_type"),
	crossDepartmentEnabled: boolean("cross_department_enabled").default(true).notNull(),
	requiredSkills: jsonb("required_skills").default([]),
	requiredInterests: jsonb("required_interests").default([]),
	maxCrossDeptParticipants: integer("max_cross_dept_participants"),
	crossDeptRequiresApproval: boolean("cross_dept_requires_approval").default(true).notNull(),
	isEventOrganiser: boolean("is_event_organiser").default(false).notNull(),
	hostCollege: text("host_college"),
	specialRequirements: text("special_requirements"),
}, (table) => [
	index("posts_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("posts_event_date_idx").using("btree", table.eventDate.asc().nullsLast().op("timestamp_ops")),
	index("posts_rate_limit_idx").using("btree", table.userId.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("posts_required_interests_idx").using("gin", table.requiredInterests.asc().nullsLast().op("jsonb_ops")),
	index("posts_required_skills_idx").using("gin", table.requiredSkills.asc().nullsLast().op("jsonb_ops")),
	index("posts_skills_offered_idx").using("gin", table.skillsOffered.asc().nullsLast().op("jsonb_ops")),
	index("posts_skills_wanted_idx").using("gin", table.skillsWanted.asc().nullsLast().op("jsonb_ops")),
	index("posts_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "posts_user_id_users_id_fk"
		}).onDelete("cascade"),
	check("posts_special_requirements_len_check", sql`(special_requirements IS NULL) OR (char_length(special_requirements) <= 250)`),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	username: text().notNull(),
	email: text().notNull(),
	bio: text().notNull(),
	portfolio: text().notNull(),
	github: text().notNull(),
	twitter: text(),
	linkedin: text(),
	university: text(),
	city: text(),
	privacy: jsonb().default({"showCity":false,"showEmail":false,"showPortfolio":false,"showUniversity":false}).notNull(),
	password: text(),
	avatar: text(),
	isAdmin: boolean("is_admin").default(false).notNull(),
	skillLevel: text("skill_level"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	googleId: text("google_id"),
	authProvider: text("auth_provider").default('local').notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }),
	department: text().default('General').notNull(),
	skills: jsonb().default([]).notNull(),
	interests: jsonb().default([]).notNull(),
	isBanned: boolean("is_banned").default(false).notNull(),
	banReason: text("ban_reason"),
	bannedAt: timestamp("banned_at", { mode: 'string' }),
	isOrganiser: boolean("is_organiser").default(false).notNull(),
	lastActive: timestamp("last_active", { mode: 'string' }),
	tourCompleted: boolean("tour_completed").default(false).notNull(),
}, (table) => [
	index("users_department_idx").using("btree", table.department.asc().nullsLast().op("text_ops")),
	index("users_is_banned_idx").using("btree", table.isBanned.asc().nullsLast().op("bool_ops")),
	index("users_is_organiser_idx").using("btree", table.isOrganiser.asc().nullsLast().op("bool_ops")),
	index("users_tour_completed_idx").using("btree", table.tourCompleted.asc().nullsLast().op("bool_ops")),
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
	unique("users_google_id_unique").on(table.googleId),
	pgPolicy("users_insert_policy", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
]);

export const session = pgTable("session", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
});

export const messages = pgTable("messages", {
	id: text().primaryKey().notNull(),
	chatId: text("chat_id").notNull(),
	senderId: text("sender_id").notNull(),
	text: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("messages_chat_idx").using("btree", table.chatId.asc().nullsLast().op("text_ops")),
	index("messages_chat_timestamp_idx").using("btree", table.chatId.asc().nullsLast().op("text_ops"), table.timestamp.asc().nullsLast().op("timestamp_ops")),
	index("messages_timestamp_idx").using("btree", table.timestamp.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [connectionRequests.id],
			name: "messages_chat_id_connection_requests_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const connectionRequests = pgTable("connection_requests", {
	id: text().primaryKey().notNull(),
	postId: text("post_id").notNull(),
	postTitle: text("post_title").notNull(),
	fromUserId: text("from_user_id").notNull(),
	fromUserName: text("from_user_name").notNull(),
	fromUserSkill: text("from_user_skill").notNull(),
	toUserId: text("to_user_id").notNull(),
	status: text().notNull(),
	message: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	toUserName: text("to_user_name"),
	fromUserLastCleared: timestamp("from_user_last_cleared", { mode: 'string' }),
	toUserLastCleared: timestamp("to_user_last_cleared", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("requests_from_user_idx").using("btree", table.fromUserId.asc().nullsLast().op("text_ops")),
	index("requests_post_idx").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	index("requests_to_user_idx").using("btree", table.toUserId.asc().nullsLast().op("text_ops")),
	uniqueIndex("requests_unique_idx").using("btree", table.fromUserId.asc().nullsLast().op("text_ops"), table.toUserId.asc().nullsLast().op("text_ops"), table.postId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "connection_requests_post_id_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fromUserId],
			foreignColumns: [users.id],
			name: "connection_requests_from_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toUserId],
			foreignColumns: [users.id],
			name: "connection_requests_to_user_id_users_id_fk"
		}).onDelete("cascade"),
]);
