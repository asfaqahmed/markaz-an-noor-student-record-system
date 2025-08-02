/*
  # Create users and authentication tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (enum: admin, staff, student)
      - `created_at` (timestamp)
    - `students`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `class` (text)
      - `joined_at` (timestamp)
    - `teachers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `subject` (text)
      - `assigned_class` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Create role enum
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'student');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  class text NOT NULL,
  joined_at timestamptz DEFAULT now()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  assigned_class text NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students policies
CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff and admins can read all students"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Teachers policies
CREATE POLICY "Teachers can read own data"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all teachers"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );