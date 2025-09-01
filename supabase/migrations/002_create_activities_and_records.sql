-- Create activities table for the Islamic daily schedule (A01-A10)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create participation_records table (renamed from grading_records)
CREATE TABLE IF NOT EXISTS participation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D')),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, activity_id, date)
);

-- Create leaves table for absence tracking
CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table for urgent student concerns
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id)
);

-- Enable RLS on all new tables
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE participation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities (public read access)
CREATE POLICY "Everyone can view activities" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage activities" ON activities
  FOR ALL USING (is_admin());

-- RLS Policies for participation_records
CREATE POLICY "Students can view own participation records" ON participation_records
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = get_current_user_id())
    OR is_staff()
  );

CREATE POLICY "Staff can manage participation records" ON participation_records
  FOR ALL USING (is_staff());

-- RLS Policies for leaves
CREATE POLICY "Students can view own leaves" ON leaves
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = get_current_user_id())
    OR is_staff()
  );

CREATE POLICY "Staff can manage leaves" ON leaves
  FOR ALL USING (is_staff());

-- RLS Policies for alerts
CREATE POLICY "Staff can view relevant alerts" ON alerts
  FOR SELECT USING (is_staff());

CREATE POLICY "Staff can create alerts" ON alerts
  FOR INSERT WITH CHECK (is_staff());

CREATE POLICY "Admins can manage all alerts" ON alerts
  FOR ALL USING (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_participation_records_student_date ON participation_records(student_id, date);
CREATE INDEX idx_participation_records_date ON participation_records(date);
CREATE INDEX idx_leaves_student_date ON leaves(student_id, date);
CREATE INDEX idx_alerts_student_status ON alerts(student_id, status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);