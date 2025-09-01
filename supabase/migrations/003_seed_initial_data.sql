-- Insert activities for the Islamic daily schedule (A01-A10)
INSERT INTO activities (code, description, start_time, end_time) VALUES
  ('A01', 'Morning Prayer (Fajr) - 4:30 AM', '04:30:00', '05:00:00'),
  ('A02', 'Quran Recitation - 5:00 AM', '05:00:00', '06:00:00'),
  ('A03', 'Breakfast - 6:30 AM', '06:30:00', '07:30:00'),
  ('A04', 'Academic Classes - 8:00 AM', '08:00:00', '12:00:00'),
  ('A05', 'Lunch & Break - 12:00 PM', '12:00:00', '15:00:00'),
  ('A06', 'Afternoon Classes - 3:00 PM', '15:00:00', '17:00:00'),
  ('A07', 'Play Time - 5:00 PM', '17:00:00', '18:00:00'),
  ('A08', 'Evening Prayer (Maghrib) - 6:00 PM', '18:00:00', '18:30:00'),
  ('A09', 'Homework Review - 7:00 PM', '19:00:00', '21:00:00'),
  ('A10', 'Night Prayer & Sleep (Isha) - 9:00 PM', '21:00:00', '22:30:00')
ON CONFLICT (code) DO NOTHING;

-- Insert demo users
INSERT INTO users (name, email, role) VALUES
  ('Ahmed Imfas', 'ahmedimfas@gmail.com', 'admin'),
  ('Teacher Ali', 'teacher1@markaz.edu', 'staff'),
  ('Teacher Fatima', 'teacher2@markaz.edu', 'staff'),
  ('MN. Abdullah', 'abdullah@markaz.edu', 'student'),
  ('M. Naseer', 'naseer@markaz.edu', 'student'),
  ('TH. Mohamed', 'mohamed@markaz.edu', 'student'),
  ('SM. Sameer', 'sameer@markaz.edu', 'student')
ON CONFLICT (email) DO NOTHING;

-- Insert teachers
INSERT INTO teachers (user_id, assigned_class)
SELECT u.id, 'Grade 10'
FROM users u
WHERE u.email IN ('teacher1@markaz.edu', 'teacher2@markaz.edu')
ON CONFLICT DO NOTHING;

-- Insert students
INSERT INTO students (user_id, class, joined_at) VALUES
  ((SELECT id FROM users WHERE email = 'abdullah@markaz.edu'), 'Grade 10', '2023-09-01'),
  ((SELECT id FROM users WHERE email = 'naseer@markaz.edu'), 'Grade 10', '2023-09-01'),
  ((SELECT id FROM users WHERE email = 'mohamed@markaz.edu'), 'Grade 10', '2023-09-01'),
  ((SELECT id FROM users WHERE email = 'sameer@markaz.edu'), 'Grade 10', '2023-09-01')
ON CONFLICT DO NOTHING;

-- Insert sample participation records (last 7 days)
-- MN. Abdullah - Excellent performance (mostly A grades)
INSERT INTO participation_records (student_id, teacher_id, activity_id, date, grade, remarks) 
SELECT 
  s.id as student_id,
  t.id as teacher_id,
  a.id as activity_id,
  CURRENT_DATE - generate_series(0, 6) as date,
  CASE 
    WHEN random() < 0.8 THEN 'A'
    WHEN random() < 0.9 THEN 'B'
    ELSE 'C'
  END as grade,
  CASE 
    WHEN random() < 0.2 THEN 'Excellent participation'
    WHEN random() < 0.4 THEN 'Very good'
    ELSE NULL
  END as remarks
FROM students s
CROSS JOIN teachers t
CROSS JOIN activities a
WHERE s.user_id = (SELECT id FROM users WHERE email = 'abdullah@markaz.edu')
  AND t.user_id = (SELECT id FROM users WHERE email = 'teacher1@markaz.edu')
ON CONFLICT (student_id, activity_id, date) DO NOTHING;

-- M. Naseer - Low performance with concerns
INSERT INTO participation_records (student_id, teacher_id, activity_id, date, grade, remarks) 
SELECT 
  s.id as student_id,
  t.id as teacher_id,
  a.id as activity_id,
  CURRENT_DATE - generate_series(0, 6) as date,
  CASE 
    WHEN random() < 0.3 THEN 'D'
    WHEN random() < 0.6 THEN 'C'
    WHEN random() < 0.8 THEN 'B'
    ELSE 'A'
  END as grade,
  CASE 
    WHEN random() < 0.3 THEN 'Seemed drowsy'
    WHEN random() < 0.5 THEN 'Late arrival'
    WHEN random() < 0.7 THEN 'Distracted'
    ELSE NULL
  END as remarks
FROM students s
CROSS JOIN teachers t
CROSS JOIN activities a
WHERE s.user_id = (SELECT id FROM users WHERE email = 'naseer@markaz.edu')
  AND t.user_id = (SELECT id FROM users WHERE email = 'teacher1@markaz.edu')
ON CONFLICT (student_id, activity_id, date) DO NOTHING;

-- TH. Mohamed - Normal performance
INSERT INTO participation_records (student_id, teacher_id, activity_id, date, grade, remarks) 
SELECT 
  s.id as student_id,
  t.id as teacher_id,
  a.id as activity_id,
  CURRENT_DATE - generate_series(0, 6) as date,
  CASE 
    WHEN random() < 0.4 THEN 'B'
    WHEN random() < 0.7 THEN 'A'
    WHEN random() < 0.9 THEN 'C'
    ELSE 'D'
  END as grade,
  CASE 
    WHEN random() < 0.2 THEN 'Good effort'
    ELSE NULL
  END as remarks
FROM students s
CROSS JOIN teachers t
CROSS JOIN activities a
WHERE s.user_id = (SELECT id FROM users WHERE email = 'mohamed@markaz.edu')
  AND t.user_id = (SELECT id FROM users WHERE email = 'teacher2@markaz.edu')
ON CONFLICT (student_id, activity_id, date) DO NOTHING;

-- SM. Sameer - Average performance
INSERT INTO participation_records (student_id, teacher_id, activity_id, date, grade, remarks) 
SELECT 
  s.id as student_id,
  t.id as teacher_id,
  a.id as activity_id,
  CURRENT_DATE - generate_series(0, 6) as date,
  CASE 
    WHEN random() < 0.5 THEN 'B'
    WHEN random() < 0.7 THEN 'C'
    WHEN random() < 0.9 THEN 'A'
    ELSE 'D'
  END as grade,
  NULL as remarks
FROM students s
CROSS JOIN teachers t
CROSS JOIN activities a
WHERE s.user_id = (SELECT id FROM users WHERE email = 'sameer@markaz.edu')
  AND t.user_id = (SELECT id FROM users WHERE email = 'teacher2@markaz.edu')
ON CONFLICT (student_id, activity_id, date) DO NOTHING;

-- Insert sample alerts
INSERT INTO alerts (student_id, teacher_id, comment, priority, status) VALUES
  (
    (SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE email = 'naseer@markaz.edu')),
    (SELECT id FROM teachers WHERE user_id = (SELECT id FROM users WHERE email = 'teacher1@markaz.edu')),
    'Possibility of drug use - student appears drowsy and unfocused frequently',
    'urgent',
    'open'
  ),
  (
    (SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE email = 'sameer@markaz.edu')),
    (SELECT id FROM teachers WHERE user_id = (SELECT id FROM users WHERE email = 'teacher2@markaz.edu')),
    'Behavioral issues during prayer time',
    'medium',
    'open'
  ),
  (
    (SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE email = 'mohamed@markaz.edu')),
    (SELECT id FROM teachers WHERE user_id = (SELECT id FROM users WHERE email = 'teacher1@markaz.edu')),
    'Requested additional support for academic subjects',
    'low',
    'reviewing'
  )
ON CONFLICT DO NOTHING;

-- Insert sample leaves
INSERT INTO leaves (student_id, date, reason) VALUES
  (
    (SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE email = 'abdullah@markaz.edu')),
    CURRENT_DATE - INTERVAL '2 days',
    'Family visit'
  ),
  (
    (SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE email = 'naseer@markaz.edu')),
    CURRENT_DATE - INTERVAL '1 day',
    'Not feeling well'
  ),
  (
    (SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE email = 'mohamed@markaz.edu')),
    CURRENT_DATE - INTERVAL '3 days',
    'Medical appointment'
  )
ON CONFLICT DO NOTHING;