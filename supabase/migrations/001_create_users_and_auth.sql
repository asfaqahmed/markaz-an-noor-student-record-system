-- Create users table with roles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class TEXT NOT NULL,
  joined_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teachers/staff table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_class TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Create functions for role checking (to avoid recursion)
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE email = user_email;
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT get_user_role(auth.email()) = 'admin';
$$;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT get_user_role(auth.email()) IN ('admin', 'staff');
$$;

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT id FROM users WHERE email = auth.email();
$$;

-- RLS Policies
-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (email = auth.email() OR is_admin());

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (is_admin());

-- Students table policies
CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (
    user_id = get_current_user_id() OR is_staff()
  );

CREATE POLICY "Staff can manage students" ON students
  FOR ALL USING (is_staff());

-- Teachers table policies
CREATE POLICY "Teachers can view own data" ON teachers
  FOR SELECT USING (
    user_id = get_current_user_id() OR is_admin()
  );

CREATE POLICY "Admins can manage teachers" ON teachers
  FOR ALL USING (is_admin());