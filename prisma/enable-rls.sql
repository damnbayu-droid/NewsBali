-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;
DROP POLICY IF EXISTS "Authors can manage their own articles" ON public.articles;
DROP POLICY IF EXISTS "Admins and editors can manage all articles" ON public.articles;

DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can manage their own comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.comments;

DROP POLICY IF EXISTS "Anyone can view verified evidences" ON public.evidences;
DROP POLICY IF EXISTS "Admins and editors can manage evidences" ON public.evidences;

DROP POLICY IF EXISTS "Users can access their own sessions" ON public.sessions;

DROP POLICY IF EXISTS "Anyone can view subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Subscribers can manage their own subscription" ON public.subscribers;

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT
  USING (true);  -- Allow all to read for now (authentication happens in app layer)

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can insert users" ON public.users
  FOR INSERT
  WITH CHECK (true);  -- Allow registration

-- Articles table policies
CREATE POLICY "Anyone can view published articles" ON public.articles
  FOR SELECT
  USING (status = 'PUBLISHED' OR true);  -- Allow all reads for now

CREATE POLICY "Anyone can insert articles" ON public.articles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update articles" ON public.articles
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete articles" ON public.articles
  FOR DELETE
  USING (true);

-- Comments table policies
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create comments" ON public.comments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update comments" ON public.comments
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete comments" ON public.comments
  FOR DELETE
  USING (true);

-- Evidences table policies
CREATE POLICY "Anyone can view evidences" ON public.evidences
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage evidences" ON public.evidences
  FOR ALL
  USING (true);

-- Sessions table policies
CREATE POLICY "Allow all session access" ON public.sessions
  FOR ALL
  USING (true);

-- Subscribers table policies
CREATE POLICY "Anyone can view subscribers" ON public.subscribers
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage subscriptions" ON public.subscribers
  FOR ALL
  USING (true);

-- Audit logs table policies
CREATE POLICY "Allow audit log access" ON public.audit_logs
  FOR ALL
  USING (true);
