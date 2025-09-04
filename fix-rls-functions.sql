-- Fix RLS functions to handle null auth.email() values

CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN user_email IS NULL THEN NULL
      ELSE (SELECT role FROM users WHERE email = user_email)
    END;
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COALESCE(get_user_role(auth.email()) = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COALESCE(get_user_role(auth.email()) IN ('admin', 'staff'), false);
$$;

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN auth.email() IS NULL THEN NULL
      ELSE (SELECT id FROM users WHERE email = auth.email())
    END;
$$;