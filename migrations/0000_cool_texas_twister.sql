CREATE TABLE `analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`event` text NOT NULL,
	`page` text NOT NULL,
	`metadata` text,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`user_name` text,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`details` text,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_logs_timestamp_idx` ON `audit_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_id_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE TABLE `connection_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`post_title` text NOT NULL,
	`from_user_id` text NOT NULL,
	`from_user_name` text NOT NULL,
	`from_user_skill` text NOT NULL,
	`to_user_id` text NOT NULL,
	`to_user_name` text,
	`status` text NOT NULL,
	`message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`from_user_last_cleared` integer,
	`to_user_last_cleared` integer,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `requests_from_user_idx` ON `connection_requests` (`from_user_id`);--> statement-breakpoint
CREATE INDEX `requests_to_user_idx` ON `connection_requests` (`to_user_id`);--> statement-breakpoint
CREATE INDEX `requests_post_idx` ON `connection_requests` (`post_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `requests_unique_idx` ON `connection_requests` (`from_user_id`,`to_user_id`,`post_id`);--> statement-breakpoint
CREATE TABLE `event_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`registration_type` text NOT NULL,
	`match_score` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`rejection_reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `event_registrations_post_id_idx` ON `event_registrations` (`post_id`);--> statement-breakpoint
CREATE INDEX `event_registrations_user_id_idx` ON `event_registrations` (`user_id`);--> statement-breakpoint
CREATE INDEX `event_registrations_status_idx` ON `event_registrations` (`status`);--> statement-breakpoint
CREATE INDEX `event_registrations_type_idx` ON `event_registrations` (`registration_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `event_registrations_unique_idx` ON `event_registrations` (`post_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `event_registrations_post_id_status_idx` ON `event_registrations` (`post_id`,`status`);--> statement-breakpoint
CREATE INDEX `event_registrations_user_id_status_idx` ON `event_registrations` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `event_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`vote_type` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_vote_idx` ON `event_votes` (`post_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `feedback_timestamp_idx` ON `feedback` (`timestamp`);--> statement-breakpoint
CREATE INDEX `feedback_rating_idx` ON `feedback` (`rating`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`text` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `connection_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_chat_idx` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `messages_timestamp_idx` ON `messages` (`timestamp`);--> statement-breakpoint
CREATE INDEX `messages_chat_timestamp_idx` ON `messages` (`chat_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`link` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`metadata` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_id_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_created_at_idx` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_user_created_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `post_interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`post_id` text NOT NULL,
	`interaction_type` text NOT NULL,
	`duration_seconds` integer,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `post_interactions_user_id_idx` ON `post_interactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `post_interactions_post_id_idx` ON `post_interactions` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_interactions_type_idx` ON `post_interactions` (`interaction_type`);--> statement-breakpoint
CREATE INDEX `post_interactions_created_at_idx` ON `post_interactions` (`created_at`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`skills_offered` text NOT NULL,
	`skills_wanted` text NOT NULL,
	`description` text NOT NULL,
	`availability` text NOT NULL,
	`city` text NOT NULL,
	`university` text,
	`event_name` text,
	`event_type` text,
	`host_college` text,
	`event_website` text,
	`event_image` text,
	`event_details` text,
	`event_date` integer,
	`event_upvotes` integer DEFAULT 0,
	`is_event_organiser` integer DEFAULT false NOT NULL,
	`allowed_departments` text,
	`required_skills` text DEFAULT '[]',
	`required_interests` text DEFAULT '[]',
	`special_requirements` text,
	`max_cross_dept_participants` integer,
	`cross_dept_requires_approval` integer DEFAULT true NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`user_skill` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_user_id_idx` ON `posts` (`user_id`);--> statement-breakpoint
CREATE INDEX `posts_created_at_idx` ON `posts` (`created_at`);--> statement-breakpoint
CREATE INDEX `posts_event_date_idx` ON `posts` (`event_date`);--> statement-breakpoint
CREATE INDEX `posts_rate_limit_idx` ON `posts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text,
	`reporter_email` text,
	`reported_user_id` text,
	`reported_post_id` text,
	`type` text NOT NULL,
	`subject` text NOT NULL,
	`page_section` text,
	`description` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`resolved_at` integer,
	`resolved_by` text,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reported_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reported_post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`preferred_skills` text DEFAULT '[]',
	`preferred_cities` text DEFAULT '[]',
	`preferred_event_types` text DEFAULT '[]',
	`interaction_score` text DEFAULT '{}',
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_searches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`query` text NOT NULL,
	`filters` text,
	`results_count` integer,
	`clicked_post_ids` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_searches_user_id_idx` ON `user_searches` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_searches_created_at_idx` ON `user_searches` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_searches_query_idx` ON `user_searches` (`query`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`bio` text NOT NULL,
	`portfolio` text NOT NULL,
	`github` text NOT NULL,
	`twitter` text,
	`linkedin` text,
	`university` text,
	`city` text,
	`department` text DEFAULT 'OTHER' NOT NULL,
	`skills` text DEFAULT '[]' NOT NULL,
	`interests` text DEFAULT '[]' NOT NULL,
	`privacy` text DEFAULT '{"showEmail":false,"showPortfolio":false,"showUniversity":false,"showCity":false}' NOT NULL,
	`password` text,
	`avatar` text,
	`google_id` text,
	`auth_provider` text DEFAULT 'local' NOT NULL,
	`skill_level` text,
	`is_admin` integer DEFAULT false NOT NULL,
	`is_organiser` integer DEFAULT false NOT NULL,
	`is_verified` integer DEFAULT false NOT NULL,
	`email_verified_at` integer,
	`is_banned` integer DEFAULT false NOT NULL,
	`ban_reason` text,
	`banned_at` integer,
	`tour_completed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_active` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);