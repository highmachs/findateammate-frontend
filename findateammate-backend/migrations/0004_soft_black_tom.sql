ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;

-- Enable RLS
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connection_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- 1. Users
-- Everyone can read users (Public Profile)
CREATE POLICY "users_read_policy" ON "users" FOR SELECT USING (true);

-- Users can update their own profile, or Admins can update any profile
-- Note: 'app.current_user_id' is a custom session variable we will set in the application
CREATE POLICY "users_update_policy" ON "users" FOR UPDATE USING (
  id = current_setting('app.current_user_id', true)::text 
  OR 
  (SELECT is_admin FROM users WHERE id = current_setting('app.current_user_id', true)::text LIMIT 1)
);

-- 2. Posts
-- Everyone can read posts
CREATE POLICY "posts_read_policy" ON "posts" FOR SELECT USING (true);

-- Users can insert posts (Auth required check implicit in route, but RLS can enforce user_id match)
CREATE POLICY "posts_insert_policy" ON "posts" FOR INSERT WITH CHECK (
  user_id = current_setting('app.current_user_id', true)::text
);

-- Users can update/delete their own posts OR Admin
CREATE POLICY "posts_modify_policy" ON "posts" FOR ALL USING (
  user_id = current_setting('app.current_user_id', true)::text
  OR 
  (SELECT is_admin FROM users WHERE id = current_setting('app.current_user_id', true)::text LIMIT 1)
);

-- 3. Connection Requests
-- Users can see requests they sent OR received
CREATE POLICY "requests_read_policy" ON "connection_requests" FOR SELECT USING (
  from_user_id = current_setting('app.current_user_id', true)::text
  OR
  to_user_id = current_setting('app.current_user_id', true)::text
  OR 
  (SELECT is_admin FROM users WHERE id = current_setting('app.current_user_id', true)::text LIMIT 1)
);

-- Users can insert requests as 'from_user_id'
CREATE POLICY "requests_insert_policy" ON "connection_requests" FOR INSERT WITH CHECK (
  from_user_id = current_setting('app.current_user_id', true)::text
);

-- Users can update (accept/reject) requests involved in
CREATE POLICY "requests_update_policy" ON "connection_requests" FOR UPDATE USING (
  from_user_id = current_setting('app.current_user_id', true)::text
  OR
  to_user_id = current_setting('app.current_user_id', true)::text
  OR 
  (SELECT is_admin FROM users WHERE id = current_setting('app.current_user_id', true)::text LIMIT 1)
);

-- 4. Messages
-- Users can see messages involved in
CREATE POLICY "messages_read_policy" ON "messages" FOR SELECT USING (
  sender_id = current_setting('app.current_user_id', true)::text
  OR
  EXISTS (
    SELECT 1 FROM connection_requests 
    WHERE id = messages.chat_id 
    AND (from_user_id = current_setting('app.current_user_id', true)::text OR to_user_id = current_setting('app.current_user_id', true)::text)
  )
  OR 
  (SELECT is_admin FROM users WHERE id = current_setting('app.current_user_id', true)::text LIMIT 1)
);

CREATE POLICY "messages_insert_policy" ON "messages" FOR INSERT WITH CHECK (
  sender_id = current_setting('app.current_user_id', true)::text
);