/*
  # Seed initial data

  1. Activities
    - A01 to A10 with descriptions and time slots

  2. Sample Users
    - Admin user
    - Staff users
    - Student users

  3. Sample Data
    - Students and teachers
    - Some sample grading records
*/

-- Insert activities
INSERT INTO activities (code, description, time_slot) VALUES
  ('A01', 'Morning Prayer', '4:30 AM'),
  ('A02', 'Quran Recitation', '5:00 AM - 6:00 AM'),
  ('A03', 'Breakfast', '6:30 AM - 7:30 AM'),
  ('A04', 'Islamic Studies', '8:00 AM - 10:00 AM'),
  ('A05', 'Arabic Language', '10:30 AM - 12:00 PM'),
  ('A06', 'Lunch & Rest', '12:00 PM - 2:00 PM'),
  ('A07', 'Afternoon Studies', '2:00 PM - 4:00 PM'),
  ('A08', 'Physical Exercise', '4:30 PM - 5:30 PM'),
  ('A09', 'Evening Prayer', '6:00 PM'),
  ('A10', 'Night Prayer & Sleep', '9:00 PM - 10:30 PM');

-- Note: In a real application, you would insert users through the authentication system
-- This is just for demonstration purposes

-- Sample admin user (this would normally be created through Supabase Auth)
DO $$
DECLARE
    admin_user_id uuid := gen_random_uuid();
    staff_user_id_1 uuid := gen_random_uuid();
    staff_user_id_2 uuid := gen_random_uuid();
    student_user_id_1 uuid := gen_random_uuid();
    student_user_id_2 uuid := gen_random_uuid();
    student_user_id_3 uuid := gen_random_uuid();
    student_user_id_4 uuid := gen_random_uuid();
BEGIN
    -- Insert sample users (normally handled by Supabase Auth)
    INSERT INTO users (id, email, name, role) VALUES
        (admin_user_id, 'admin@markaz.edu', 'Administrator', 'admin'),
        (staff_user_id_1, 'teacher1@markaz.edu', 'Ustadh Ahmad', 'staff'),
        (staff_user_id_2, 'teacher2@markaz.edu', 'Ustadh Hassan', 'staff'),
        (student_user_id_1, 'abdullah@markaz.edu', 'MN. Abdullah', 'student'),
        (student_user_id_2, 'naseer@markaz.edu', 'M. Naseer', 'student'),
        (student_user_id_3, 'mohamed@markaz.edu', 'TH. Mohamed', 'student'),
        (student_user_id_4, 'sameer@markaz.edu', 'SM. Sameer', 'student');

    -- Insert teachers
    INSERT INTO teachers (user_id, subject, assigned_class) VALUES
        (staff_user_id_1, 'Islamic Studies', 'Class A'),
        (staff_user_id_2, 'Arabic Language', 'Class A');

    -- Insert students
    INSERT INTO students (user_id, class) VALUES
        (student_user_id_1, 'Class A'),
        (student_user_id_2, 'Class A'),
        (student_user_id_3, 'Class A'),
        (student_user_id_4, 'Class A');
END $$;