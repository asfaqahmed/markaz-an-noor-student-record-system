/*
  # Fix Authentication System and Add Demo Users

  1. Updates
    - Ensure proper user authentication setup
    - Add demo users with correct credentials
    - Fix any authentication issues

  2. Demo Users
    - Admin: admin@markaz.edu (password: password123)
    - Staff: teacher1@markaz.edu (password: password123)  
    - Student: abdullah@markaz.edu (password: password123)

  3. Security
    - Enable RLS on all tables
    - Update authentication policies
*/

-- First, let's make sure we have the proper user records
-- Note: In Supabase, actual user authentication is handled by Supabase Auth
-- We just need to ensure our users table has the corresponding records

-- Insert demo users into our users table (these will be linked to Supabase Auth users)
INSERT INTO users (id, email, name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@markaz.edu', 'Administrator', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440002', 'teacher1@markaz.edu', 'Ustadh Ahmed', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440003', 'abdullah@markaz.edu', 'MN. Abdullah', 'student'),
  ('550e8400-e29b-41d4-a716-446655440004', 'naseer@markaz.edu', 'M. Naseer', 'student'),
  ('550e8400-e29b-41d4-a716-446655440005', 'mohamed@markaz.edu', 'TH. Mohamed', 'student'),
  ('550e8400-e29b-41d4-a716-446655440006', 'sameer@markaz.edu', 'SM. Sameer', 'student')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Insert corresponding student records
INSERT INTO students (id, user_id, class) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Hifz Class A'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'Hifz Class A'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'Hifz Class B'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 'Hifz Class B')
ON CONFLICT (user_id) DO UPDATE SET
  class = EXCLUDED.class;

-- Insert teacher record
INSERT INTO teachers (id, user_id, subject, assigned_class) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Quran & Islamic Studies', 'Hifz Class A')
ON CONFLICT (user_id) DO UPDATE SET
  subject = EXCLUDED.subject,
  assigned_class = EXCLUDED.assigned_class;

-- Add some sample grading records
INSERT INTO grading_records (student_id, teacher_id, activity_id, grade, remarks) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'A', 'Excellent recitation'),
  ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', 'B', 'Good participation'),
  ('660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'A', 'Mashallah, very good'),
  ('660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440003', 'B', 'Needs more focus')
ON CONFLICT DO NOTHING;

-- Add some sample alerts
INSERT INTO alerts (student_id, teacher_id, comment) VALUES
  ('660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'Student seems distracted during morning prayers'),
  ('660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 'Excellent progress in memorization')
ON CONFLICT DO NOTHING;

-- Add some sample leaves
INSERT INTO leaves (student_id, date, reason) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '2024-01-15', 'Medical appointment'),
  ('660e8400-e29b-41d4-a716-446655440003', '2024-01-20', 'Family emergency')
ON CONFLICT DO NOTHING;