/*
  # Create activities and grading system

  1. New Tables
    - `activities`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `description` (text)
      - `time_slot` (text)
    - `grading_records`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `teacher_id` (uuid, foreign key)
      - `activity_id` (uuid, foreign key)
      - `date` (date, default today)
      - `grade` (enum: A, B, C, D)
      - `remarks` (text, optional)
    - `alerts`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `teacher_id` (uuid, foreign key)
      - `comment` (text)
      - `created_at` (timestamp)
    - `leaves`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `date` (date)
      - `reason` (text)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create grade enum
CREATE TYPE grade_type AS ENUM ('A', 'B', 'C', 'D');

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text NOT NULL,
  time_slot text
);

-- Create grading_records table
CREATE TABLE IF NOT EXISTS grading_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  grade grade_type NOT NULL,
  remarks text,
  created_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_resolved boolean DEFAULT false
);

-- Create leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- Activities policies (readable by all authenticated users)
CREATE POLICY "All authenticated users can read activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (true);

-- Grading records policies
CREATE POLICY "Students can read own grading records"
  ON grading_records
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff and admins can read all grading records"
  ON grading_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can insert grading records"
  ON grading_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'staff'
    )
  );

-- Alerts policies
CREATE POLICY "Students can read own alerts"
  ON alerts
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff and admins can read all alerts"
  ON alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can insert alerts"
  ON alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'staff'
    )
  );

-- Leaves policies
CREATE POLICY "Students can read own leaves"
  ON leaves
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff and admins can read all leaves"
  ON leaves
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can insert leaves"
  ON leaves
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'staff'
    )
  );