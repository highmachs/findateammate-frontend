# Database Schema

Generated: 2026-03-04 (Latest)

## Google OAuth Onboarding Flow

When users register with Google account, they're asked to complete their profile with:
- **Username** (required, unique, alphanumeric+underscore only)
- **Primary Skill** (required, e.g. "Full Stack Developer")
- **Bio** (optional, max 250 chars)
- **Portfolio URL** (optional, any domain)
- **GitHub URL** (optional, github.com only)
- **LinkedIn URL** (optional, linkedin.com only)
- **City/Location** (required, max 100 chars, sanitized)
- **University/College** (required, max 150 chars, sanitized)

All URLs are validated & converted to HTTPS. All text fields are HTML-stripped.

## User Management Features

### Ban System
- **is_banned** (boolean): User account status
- **ban_reason** (text): Reason displayed to banned user
- **banned_at** (timestamp): When ban was applied
- Banned users are blocked from all protected routes and redirected to `/banned` page

### Roles & Permissions
- **is_admin** (boolean): Full system access including user management
- **is_organiser** (boolean): Can create events and manage event registrations
- **department** (text): User's department (default: "General")

### Cross-Department Features
Posts and events can specify:
- **allowed_departments** (jsonb[]): Which departments can participate
- **cross_department_enabled** (boolean): Allow users from other departments
- **required_skills** (jsonb[]): Required skills for participation
- **required_interests** (jsonb[]): Required interests for participation
- **max_cross_dept_participants** (integer): Max cross-department registrations
- **cross_dept_requires_approval** (boolean): Cross-dept users need approval

### Activity Tracking
- **last_active** (timestamp): Last authenticated request timestamp

## Tables
analytics
audit_logs
connection_requests
error_logs
event_votes
feedback
messages
notifications
password_resets
posts
reports
session
system_settings
users


## Columns
Format: table_name|column_name|data_type|is_nullable|column_default
analytics|id|integer|NO|nextval('analytics_id_seq'::regclass)
analytics|user_id|text|YES|
analytics|event|text|NO|
analytics|page|text|NO|
analytics|metadata|jsonb|YES|
analytics|timestamp|timestamp without time zone|NO|now()
audit_logs|id|text|NO|
audit_logs|user_id|text|YES|
audit_logs|user_name|text|YES|
audit_logs|action|text|NO|
audit_logs|resource|text|NO|
audit_logs|details|jsonb|YES|
audit_logs|timestamp|timestamp without time zone|NO|now()
connection_requests|id|text|NO|
connection_requests|post_id|text|NO|
connection_requests|post_title|text|NO|
connection_requests|from_user_id|text|NO|
connection_requests|from_user_name|text|NO|
connection_requests|from_user_skill|text|NO|
connection_requests|to_user_id|text|NO|
connection_requests|status|text|NO|
connection_requests|message|text|YES|
connection_requests|created_at|timestamp without time zone|NO|now()
connection_requests|to_user_name|text|YES|
connection_requests|from_user_last_cleared|timestamp without time zone|YES|
connection_requests|to_user_last_cleared|timestamp without time zone|YES|
connection_requests|updated_at|timestamp without time zone|NO|now()
error_logs|id|text|NO|
error_logs|user_id|text|YES|
error_logs|username|text|YES|
error_logs|message|text|NO|
error_logs|stack|text|YES|
error_logs|source|text|NO|
error_logs|metadata|jsonb|YES|
error_logs|timestamp|timestamp without time zone|NO|now()
event_votes|id|integer|NO|nextval('event_votes_id_seq'::regclass)
event_votes|post_id|text|NO|
event_votes|user_id|text|NO|
event_votes|vote_type|integer|NO|
event_votes|created_at|timestamp without time zone|NO|now()
feedback|id|integer|NO|nextval('feedback_id_seq'::regclass)
feedback|user_id|text|YES|
feedback|rating|integer|NO|
feedback|comment|text|NO|
feedback|timestamp|timestamp without time zone|NO|now()
messages|id|text|NO|
messages|chat_id|text|NO|
messages|sender_id|text|NO|
messages|text|text|NO|
messages|timestamp|timestamp without time zone|NO|now()
notifications|id|text|NO|
notifications|user_id|text|NO|
notifications|type|text|NO|
notifications|title|text|NO|
notifications|message|text|NO|
notifications|link|text|YES|
notifications|is_read|boolean|NO|false
notifications|created_at|timestamp without time zone|NO|now()
notifications|metadata|jsonb|YES|
password_resets|id|text|NO|
password_resets|user_id|text|NO|
password_resets|token|text|NO|
password_resets|expires_at|timestamp without time zone|NO|
password_resets|used|boolean|NO|false
password_resets|created_at|timestamp without time zone|NO|now()
posts|id|text|NO|
posts|title|text|NO|
posts|skills_offered|jsonb|NO|
posts|skills_wanted|jsonb|NO|
posts|description|text|NO|
posts|availability|text|NO|
posts|city|text|NO|
posts|university|text|YES|
posts|event_name|text|YES|
posts|event_website|text|YES|
posts|event_details|text|YES|
posts|event_upvotes|integer|YES|0
posts|user_id|text|NO|
posts|user_name|text|NO|
posts|user_skill|text|NO|
posts|created_at|timestamp without time zone|NO|now()
posts|event_image|text|YES|
posts|event_date|timestamp without time zone|YES|
posts|allowed_departments|jsonb|YES|
posts|event_type|text|YES|
posts|cross_department_enabled|boolean|NO|true
posts|required_skills|jsonb|YES|'[]'::jsonb
posts|required_interests|jsonb|YES|'[]'::jsonb
posts|max_cross_dept_participants|integer|YES|
posts|cross_dept_requires_approval|boolean|NO|true
reports|id|text|NO|
reports|reporter_id|text|YES|
reports|reporter_email|text|YES|
reports|reported_user_id|text|YES|
reports|reported_post_id|text|YES|
reports|type|text|NO|
reports|description|text|NO|
reports|status|text|NO|'pending'::text
reports|admin_notes|text|YES|
reports|created_at|timestamp without time zone|NO|now()
reports|resolved_at|timestamp without time zone|YES|
reports|resolved_by|text|YES|
reports|subject|text|NO|
reports|page_section|text|YES|
session|sid|character varying|NO|
session|sess|jsonb|NO|
session|expire|timestamp without time zone|NO|
system_settings|key|text|NO|
system_settings|value|jsonb|NO|
system_settings|updated_at|timestamp without time zone|NO|now()
system_settings|updated_by|text|YES|
users|id|text|NO|
users|name|text|NO|
users|username|text|NO|
users|email|text|NO|
users|skill|text|NO|
users|bio|text|NO|
users|portfolio|text|NO|
users|github|text|NO|
users|twitter|text|YES|
users|linkedin|text|YES|
users|university|text|YES|
users|city|text|YES|
users|privacy|jsonb|NO|
users|password|text|YES|
users|avatar|text|YES|
users|is_admin|boolean|NO|false
users|skill_level|text|YES|
users|created_at|timestamp without time zone|NO|now()
users|google_id|text|YES|
users|auth_provider|text|NO|'local'::text
users|is_verified|boolean|NO|false
users|email_verified_at|timestamp without time zone|YES|
users|verification_token|text|YES|
users|department|text|NO|'General'::text
users|skills|jsonb|NO|'[]'::jsonb
users|interests|jsonb|NO|'[]'::jsonb
users|is_banned|boolean|NO|false
users|ban_reason|text|YES|
users|banned_at|timestamp without time zone|YES|
users|is_organiser|boolean|NO|false
users|last_active|timestamp without time zone|YES|


## Primary Keys
Format: table_name|column_name|constraint_name
analytics|id|analytics_pkey
audit_logs|id|audit_logs_pkey
connection_requests|id|connection_requests_pkey
error_logs|id|error_logs_pkey
event_votes|id|event_votes_pkey
feedback|id|feedback_pkey
messages|id|messages_pkey
notifications|id|notifications_pkey
password_resets|id|password_resets_pkey
posts|id|posts_pkey
reports|id|reports_pkey
session|sid|session_pkey
system_settings|key|system_settings_pkey
users|id|users_pkey


## Unique Constraints
Format: table_name|column_name|constraint_name
password_resets|token|password_resets_token_unique
users|email|users_email_unique
users|username|users_username_unique
users|google_id|users_google_id_unique


## Foreign Keys
Format: table_name|column_name|referenced_table|referenced_column|constraint_name
connection_requests|post_id|posts|id|connection_requests_post_id_posts_id_fk
connection_requests|from_user_id|users|id|connection_requests_from_user_id_users_id_fk
connection_requests|to_user_id|users|id|connection_requests_to_user_id_users_id_fk
event_votes|user_id|users|id|event_votes_user_id_users_id_fk
event_votes|post_id|posts|id|event_votes_post_id_posts_id_fk
feedback|user_id|users|id|feedback_user_id_users_id_fk
messages|chat_id|connection_requests|id|messages_chat_id_connection_requests_id_fk
messages|sender_id|users|id|messages_sender_id_users_id_fk
notifications|user_id|users|id|notifications_user_id_users_id_fk
password_resets|user_id|users|id|password_resets_user_id_users_id_fk
posts|user_id|users|id|posts_user_id_users_id_fk
reports|reported_post_id|posts|id|reports_reported_post_id_posts_id_fk
reports|resolved_by|users|id|reports_resolved_by_users_id_fk
reports|reported_user_id|users|id|reports_reported_user_id_users_id_fk
reports|reporter_id|users|id|reports_reporter_id_users_id_fk
system_settings|updated_by|users|id|system_settings_updated_by_users_id_fk


## Indexes
Format: table_name|index_name|index_def
analytics|analytics_metadata_idx|CREATE INDEX analytics_metadata_idx ON public.analytics USING gin (metadata)
analytics|analytics_pkey|CREATE UNIQUE INDEX analytics_pkey ON public.analytics USING btree (id)
audit_logs|audit_logs_action_idx|CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action)
audit_logs|audit_logs_details_idx|CREATE INDEX audit_logs_details_idx ON public.audit_logs USING gin (details)
audit_logs|audit_logs_pkey|CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id)
audit_logs|audit_logs_timestamp_idx|CREATE INDEX audit_logs_timestamp_idx ON public.audit_logs USING btree ("timestamp")
audit_logs|audit_logs_user_id_idx|CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id)
connection_requests|connection_requests_pkey|CREATE UNIQUE INDEX connection_requests_pkey ON public.connection_requests USING btree (id)
connection_requests|requests_from_user_idx|CREATE INDEX requests_from_user_idx ON public.connection_requests USING btree (from_user_id)
connection_requests|requests_post_idx|CREATE INDEX requests_post_idx ON public.connection_requests USING btree (post_id)
connection_requests|requests_to_user_idx|CREATE INDEX requests_to_user_idx ON public.connection_requests USING btree (to_user_id)
connection_requests|requests_unique_idx|CREATE UNIQUE INDEX requests_unique_idx ON public.connection_requests USING btree (from_user_id, to_user_id, post_id)
error_logs|error_logs_pkey|CREATE UNIQUE INDEX error_logs_pkey ON public.error_logs USING btree (id)
error_logs|error_logs_source_idx|CREATE INDEX error_logs_source_idx ON public.error_logs USING btree (source)
error_logs|error_logs_timestamp_idx|CREATE INDEX error_logs_timestamp_idx ON public.error_logs USING btree ("timestamp")
event_votes|event_votes_pkey|CREATE UNIQUE INDEX event_votes_pkey ON public.event_votes USING btree (id)
event_votes|unique_vote_idx|CREATE UNIQUE INDEX unique_vote_idx ON public.event_votes USING btree (post_id, user_id)
feedback|feedback_pkey|CREATE UNIQUE INDEX feedback_pkey ON public.feedback USING btree (id)
feedback|feedback_rating_idx|CREATE INDEX feedback_rating_idx ON public.feedback USING btree (rating)
feedback|feedback_timestamp_idx|CREATE INDEX feedback_timestamp_idx ON public.feedback USING btree ("timestamp")
messages|messages_chat_idx|CREATE INDEX messages_chat_idx ON public.messages USING btree (chat_id)
messages|messages_chat_timestamp_idx|CREATE INDEX messages_chat_timestamp_idx ON public.messages USING btree (chat_id, "timestamp")
messages|messages_pkey|CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id)
messages|messages_timestamp_idx|CREATE INDEX messages_timestamp_idx ON public.messages USING btree ("timestamp")
notifications|notifications_created_at_idx|CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at)
notifications|notifications_metadata_idx|CREATE INDEX notifications_metadata_idx ON public.notifications USING gin (metadata)
notifications|notifications_pkey|CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)
notifications|notifications_user_created_idx|CREATE INDEX notifications_user_created_idx ON public.notifications USING btree (user_id, created_at)
notifications|notifications_user_id_idx|CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id)
password_resets|password_resets_pkey|CREATE UNIQUE INDEX password_resets_pkey ON public.password_resets USING btree (id)
password_resets|password_resets_token_idx|CREATE INDEX password_resets_token_idx ON public.password_resets USING btree (token)
password_resets|password_resets_token_unique|CREATE UNIQUE INDEX password_resets_token_unique ON public.password_resets USING btree (token)
posts|posts_created_at_idx|CREATE INDEX posts_created_at_idx ON public.posts USING btree (created_at)
posts|posts_event_date_idx|CREATE INDEX posts_event_date_idx ON public.posts USING btree (event_date)
posts|posts_pkey|CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id)
posts|posts_rate_limit_idx|CREATE INDEX posts_rate_limit_idx ON public.posts USING btree (user_id, created_at)
posts|posts_required_interests_idx|CREATE INDEX posts_required_interests_idx ON public.posts USING gin (required_interests)
posts|posts_required_skills_idx|CREATE INDEX posts_required_skills_idx ON public.posts USING gin (required_skills)
posts|posts_skills_offered_idx|CREATE INDEX posts_skills_offered_idx ON public.posts USING gin (skills_offered)
posts|posts_skills_wanted_idx|CREATE INDEX posts_skills_wanted_idx ON public.posts USING gin (skills_wanted)
posts|posts_user_id_idx|CREATE INDEX posts_user_id_idx ON public.posts USING btree (user_id)
reports|reports_pkey|CREATE UNIQUE INDEX reports_pkey ON public.reports USING btree (id)
session|session_pkey|CREATE UNIQUE INDEX session_pkey ON public.session USING btree (sid)
system_settings|system_settings_pkey|CREATE UNIQUE INDEX system_settings_pkey ON public.system_settings USING btree (key)
users|users_department_idx|CREATE INDEX users_department_idx ON public.users USING btree (department)
users|users_email_unique|CREATE UNIQUE INDEX users_email_unique ON public.users USING btree (email)
users|users_google_id_unique|CREATE UNIQUE INDEX users_google_id_unique ON public.users USING btree (google_id)
users|users_is_banned_idx|CREATE INDEX users_is_banned_idx ON public.users USING btree (is_banned)
users|users_is_organiser_idx|CREATE INDEX users_is_organiser_idx ON public.users USING btree (is_organiser)
users|users_pkey|CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)
users|users_username_unique|CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username)


## Check Constraints
Format: table_name|constraint_name|definition


## Sequences
Format: schema.sequence_name|data_type|start_value|min_value|max_value|increment|cycle_option
public.analytics_id_seq|integer|1|1|2147483647|1|NO
public.event_votes_id_seq|integer|1|1|2147483647|1|NO
public.feedback_id_seq|integer|1|1|2147483647|1|NO
