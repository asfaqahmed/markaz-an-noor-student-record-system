import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database service functions
export const db = {
  // Users
  async getUsers() {
    return supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
  },

  async getUserByEmail(email: string) {
    return supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
  },

  async createUser(user: { name: string; email: string; role: string }) {
    return supabase
      .from('users')
      .insert(user)
      .select()
      .single();
  },

  // Students
  async getStudents() {
    return supabase
      .from('students')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false });
  },

  async getStudentByUserId(userId: string) {
    return supabase
      .from('students')
      .select(`
        *,
        user:users(*)
      `)
      .eq('user_id', userId)
      .single();
  },

  // Teachers
  async getTeachers() {
    return supabase
      .from('teachers')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false });
  },

  async getTeacherByUserId(userId: string) {
    return supabase
      .from('teachers')
      .select(`
        *,
        user:users(*)
      `)
      .eq('user_id', userId)
      .single();
  },

  // Activities
  async getActivities() {
    return supabase
      .from('activities')
      .select('*')
      .order('code');
  },

  // Participation Records
  async getParticipationRecords(filters?: {
    studentId?: string;
    teacherId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    let query = supabase
      .from('participation_records')
      .select(`
        *,
        student:students(*, user:users(*)),
        teacher:teachers(*, user:users(*)),
        activity:activities(*)
      `);

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters?.teacherId) {
      query = query.eq('teacher_id', filters.teacherId);
    }
    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('date', filters.dateTo);
    }

    return query.order('date', { ascending: false });
  },

  async createParticipationRecord(record: {
    student_id: string;
    teacher_id: string;
    activity_id: string;
    date: string;
    grade: 'A' | 'B' | 'C' | 'D';
    remarks?: string;
  }) {
    return supabase
      .from('participation_records')
      .insert(record)
      .select()
      .single();
  },

  async updateParticipationRecord(id: string, updates: {
    grade?: 'A' | 'B' | 'C' | 'D';
    remarks?: string;
  }) {
    return supabase
      .from('participation_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Leaves
  async getLeaves(studentId?: string) {
    let query = supabase
      .from('leaves')
      .select(`
        *,
        student:students(*, user:users(*))
      `);

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    return query.order('date', { ascending: false });
  },

  async createLeave(leave: {
    student_id: string;
    date: string;
    reason?: string;
  }) {
    return supabase
      .from('leaves')
      .insert(leave)
      .select()
      .single();
  },

  // Alerts
  async getAlerts(filters?: {
    studentId?: string;
    teacherId?: string;
    status?: string;
  }) {
    let query = supabase
      .from('alerts')
      .select(`
        *,
        student:students(*, user:users(*)),
        teacher:teachers(*, user:users(*))
      `);

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters?.teacherId) {
      query = query.eq('teacher_id', filters.teacherId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    return query.order('created_at', { ascending: false });
  },

  async createAlert(alert: {
    student_id: string;
    teacher_id: string;
    comment: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) {
    return supabase
      .from('alerts')
      .insert({
        ...alert,
        priority: alert.priority || 'medium'
      })
      .select()
      .single();
  },

  async updateAlert(id: string, updates: {
    status?: 'open' | 'reviewing' | 'resolved';
    resolved_by?: string;
    resolved_at?: string;
  }) {
    return supabase
      .from('alerts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Analytics
  async getStudentStats(studentId: string) {
    const [recordsResult, leavesResult, alertsResult] = await Promise.all([
      supabase
        .from('participation_records')
        .select('grade')
        .eq('student_id', studentId),
      supabase
        .from('leaves')
        .select('id')
        .eq('student_id', studentId),
      supabase
        .from('alerts')
        .select('id')
        .eq('student_id', studentId)
    ]);

    const records = recordsResult.data || [];
    const gradeDistribution = {
      A: records.filter(r => r.grade === 'A').length,
      B: records.filter(r => r.grade === 'B').length,
      C: records.filter(r => r.grade === 'C').length,
      D: records.filter(r => r.grade === 'D').length,
    };

    // Calculate average grade (A=4, B=3, C=2, D=1)
    const totalPoints = gradeDistribution.A * 4 + gradeDistribution.B * 3 + gradeDistribution.C * 2 + gradeDistribution.D * 1;
    const totalRecords = records.length;
    const averagePoints = totalRecords > 0 ? totalPoints / totalRecords : 0;
    const averageGrade = averagePoints >= 3.5 ? 'A' : averagePoints >= 2.5 ? 'B' : averagePoints >= 1.5 ? 'C' : 'D';

    return {
      totalRecords,
      gradeDistribution,
      totalLeaves: leavesResult.data?.length || 0,
      totalAlerts: alertsResult.data?.length || 0,
      averageGrade,
    };
  },

  async getOverallStats() {
    const [studentsResult, staffResult, alertsResult, leavesResult] = await Promise.all([
      supabase.from('students').select('id'),
      supabase.from('teachers').select('id'),
      supabase.from('alerts').select('id').eq('status', 'open'),
      supabase.from('leaves').select('id')
    ]);

    return {
      totalStudents: studentsResult.data?.length || 0,
      totalStaff: staffResult.data?.length || 0,
      openAlerts: alertsResult.data?.length || 0,
      totalLeaves: leavesResult.data?.length || 0,
    };
  }
};