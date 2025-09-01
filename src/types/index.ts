export type UserRole = 'admin' | 'staff' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  class: string;
  joined_at: string;
  created_at: string;
  user?: User;
}

export interface Teacher {
  id: string;
  user_id: string;
  assigned_class: string;
  created_at: string;
  user?: User;
}

export interface Activity {
  id: string;
  code: string;
  description: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface ParticipationRecord {
  id: string;
  student_id: string;
  teacher_id: string;
  activity_id: string;
  date: string;
  grade: 'A' | 'B' | 'C' | 'D';
  remarks?: string;
  created_at: string;
  student?: Student;
  teacher?: Teacher;
  activity?: Activity;
}

export interface Leave {
  id: string;
  student_id: string;
  date: string;
  reason?: string;
  created_at: string;
  student?: Student;
}

export interface Alert {
  id: string;
  student_id: string;
  teacher_id: string;
  comment: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'reviewing' | 'resolved';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  student?: Student;
  teacher?: Teacher;
}

export interface GradeDistribution {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface StudentStats {
  totalRecords: number;
  gradeDistribution: GradeDistribution;
  totalLeaves: number;
  totalAlerts: number;
  averageGrade: string;
}