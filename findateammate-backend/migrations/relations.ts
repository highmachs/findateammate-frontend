import { relations } from "drizzle-orm/relations";
import { posts, eventVotes, users, reports, systemSettings, feedback, eventRegistrations, postInteractions, userSearches, userPreferences, notifications, connectionRequests, messages } from "./schema";

export const eventVotesRelations = relations(eventVotes, ({one}) => ({
	post: one(posts, {
		fields: [eventVotes.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [eventVotes.userId],
		references: [users.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	eventVotes: many(eventVotes),
	reports: many(reports),
	eventRegistrations: many(eventRegistrations),
	postInteractions: many(postInteractions),
	user: one(users, {
		fields: [posts.userId],
		references: [users.id]
	}),
	connectionRequests: many(connectionRequests),
}));

export const usersRelations = relations(users, ({many}) => ({
	eventVotes: many(eventVotes),
	reports_reporterId: many(reports, {
		relationName: "reports_reporterId_users_id"
	}),
	reports_reportedUserId: many(reports, {
		relationName: "reports_reportedUserId_users_id"
	}),
	reports_resolvedBy: many(reports, {
		relationName: "reports_resolvedBy_users_id"
	}),
	systemSettings: many(systemSettings),
	feedbacks: many(feedback),
	eventRegistrations: many(eventRegistrations),
	postInteractions: many(postInteractions),
	userSearches: many(userSearches),
	userPreferences: many(userPreferences),
	notifications: many(notifications),
	posts: many(posts),
	messages: many(messages),
	connectionRequests_fromUserId: many(connectionRequests, {
		relationName: "connectionRequests_fromUserId_users_id"
	}),
	connectionRequests_toUserId: many(connectionRequests, {
		relationName: "connectionRequests_toUserId_users_id"
	}),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	user_reporterId: one(users, {
		fields: [reports.reporterId],
		references: [users.id],
		relationName: "reports_reporterId_users_id"
	}),
	user_reportedUserId: one(users, {
		fields: [reports.reportedUserId],
		references: [users.id],
		relationName: "reports_reportedUserId_users_id"
	}),
	post: one(posts, {
		fields: [reports.reportedPostId],
		references: [posts.id]
	}),
	user_resolvedBy: one(users, {
		fields: [reports.resolvedBy],
		references: [users.id],
		relationName: "reports_resolvedBy_users_id"
	}),
}));

export const systemSettingsRelations = relations(systemSettings, ({one}) => ({
	user: one(users, {
		fields: [systemSettings.updatedBy],
		references: [users.id]
	}),
}));

export const feedbackRelations = relations(feedback, ({one}) => ({
	user: one(users, {
		fields: [feedback.userId],
		references: [users.id]
	}),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({one}) => ({
	post: one(posts, {
		fields: [eventRegistrations.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [eventRegistrations.userId],
		references: [users.id]
	}),
}));

export const postInteractionsRelations = relations(postInteractions, ({one}) => ({
	user: one(users, {
		fields: [postInteractions.userId],
		references: [users.id]
	}),
	post: one(posts, {
		fields: [postInteractions.postId],
		references: [posts.id]
	}),
}));

export const userSearchesRelations = relations(userSearches, ({one}) => ({
	user: one(users, {
		fields: [userSearches.userId],
		references: [users.id]
	}),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(users, {
		fields: [userPreferences.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	connectionRequest: one(connectionRequests, {
		fields: [messages.chatId],
		references: [connectionRequests.id]
	}),
	user: one(users, {
		fields: [messages.senderId],
		references: [users.id]
	}),
}));

export const connectionRequestsRelations = relations(connectionRequests, ({one, many}) => ({
	messages: many(messages),
	post: one(posts, {
		fields: [connectionRequests.postId],
		references: [posts.id]
	}),
	user_fromUserId: one(users, {
		fields: [connectionRequests.fromUserId],
		references: [users.id],
		relationName: "connectionRequests_fromUserId_users_id"
	}),
	user_toUserId: one(users, {
		fields: [connectionRequests.toUserId],
		references: [users.id],
		relationName: "connectionRequests_toUserId_users_id"
	}),
}));