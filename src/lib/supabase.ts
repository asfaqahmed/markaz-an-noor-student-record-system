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
    if (!email) {
      return { data: null, error: { message: 'Email is required' } };
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user by email:', error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  async getUserById(id: string) {
    return supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
  },

  async createUser(user: { id?: string; name: string; email: string; role: string }) {
    return supabase
      .from('users')
      .insert(user)
      .select()
      .single();
  },

  async updateUser(id: string, updates: { name?: string; email?: string; role?: string }) {
    return supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  async deleteUser(id: string) {
    return supabase
      .from('users')
      .delete()
      .eq('id', id);
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

  async getStudentById(id: string) {
    return supabase
      .from('students')
      .select(`
        *,
        user:users(*)
      `)
      .eq('id', id)
      .single();
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

  async createStudent(student: { user_id: string; class: string; joined_at?: string }) {
    return supabase
      .from('students')
      .insert({
        ...student,
        joined_at: student.joined_at || new Date().toISOString().split('T')[0]
      })
      .select(`
        *,
        user:users(*)
      `)
      .single();
  },

  async updateStudent(id: string, updates: { class?: string; joined_at?: string }) {
    return supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        user:users(*)
      `)
      .single();
  },

  async deleteStudent(id: string) {
    return supabase
      .from('students')
      .delete()
      .eq('id', id);
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

  async getTeacherById(id: string) {
    return supabase
      .from('teachers')
      .select(`
        *,
        user:users(*)
      `)
      .eq('id', id)
      .single();
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

  async createTeacher(teacher: { user_id: string; assigned_class: string }) {
    return supabase
      .from('teachers')
      .insert(teacher)
      .select(`
        *,
        user:users(*)
      `)
      .single();
  },

  async updateTeacher(id: string, updates: { assigned_class?: string }) {
    return supabase
      .from('teachers')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        user:users(*)
      `)
      .single();
  },

  async deleteTeacher(id: string) {
    return supabase
      .from('teachers')
      .delete()
      .eq('id', id);
  },

  // Activities
  async getActivities() {
    return supabase
      .from('activities')
      .select('*')
      .order('code');
  },

  async getActivityById(id: string) {
    return supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();
  },

  async createActivity(activity: { code: string; description: string; start_time: string; end_time: string }) {
    return supabase
      .from('activities')
      .insert(activity)
      .select()
      .single();
  },

  async updateActivity(id: string, updates: { code?: string; description?: string; start_time?: string; end_time?: string }) {
    return supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  async deleteActivity(id: string) {
    return supabase
      .from('activities')
      .delete()
      .eq('id', id);
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
    student_id?: string;
    teacher_id?: string;
    activity_id?: string;
    date?: string;
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

  async deleteParticipationRecord(id: string) {
    return supabase
      .from('participation_records')
      .delete()
      .eq('id', id);
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
    student_id?: string;
    teacher_id?: string;
    comment?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
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

  async deleteAlert(id: string) {
    return supabase
      .from('alerts')
      .delete()
      .eq('id', id);
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
  },

  // Report Configurations (using localStorage for now)
  // In a real implementation, these would be stored in database tables
  async saveReportConfig(config: any) {
    try {
      const existingConfigs = localStorage.getItem('reportConfigs');
      let configs = existingConfigs ? JSON.parse(existingConfigs) : [];
      
      if (config.id) {
        // Update existing config
        configs = configs.map((c: any) => c.id === config.id ? config : c);
      } else {
        // Add new config
        config.id = Date.now().toString();
        config.createdAt = new Date().toISOString();
        configs.push(config);
      }
      
      localStorage.setItem('reportConfigs', JSON.stringify(configs));
      return { data: config, error: null };
    } catch (error) {
      console.error('Error saving report config:', error);
      return { data: null, error };
    }
  },

  async getReportConfigs() {
    try {
      const configs = localStorage.getItem('reportConfigs');
      return { data: configs ? JSON.parse(configs) : [], error: null };
    } catch (error) {
      console.error('Error getting report configs:', error);
      return { data: [], error };
    }
  },

  async deleteReportConfig(id: string) {
    try {
      const existingConfigs = localStorage.getItem('reportConfigs');
      if (existingConfigs) {
        const configs = JSON.parse(existingConfigs);
        const updatedConfigs = configs.filter((c: any) => c.id !== id);
        localStorage.setItem('reportConfigs', JSON.stringify(updatedConfigs));
      }
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting report config:', error);
      return { data: false, error };
    }
  },

  // Enhanced analytics functions for reports
  async getParticipationAnalytics(filters?: {
    dateFrom?: string;
    dateTo?: string;
    class?: string;
    studentId?: string;
  }) {
    let query = supabase
      .from('participation_records')
      .select(`
        *,
        student:students(*, user:users(*)),
        teacher:teachers(*, user:users(*)),
        activity:activities(*)
      `);

    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('date', filters.dateTo);
    }
    if (filters?.class) {
      // This would need to be joined properly - for now we'll filter client-side
    }
    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    const result = await query.order('date', { ascending: false });
    
    if (result.data && filters?.class) {
      result.data = result.data.filter(record => record.student?.class === filters.class);
    }
    
    return result;
  },

  async getAlertAnalytics(filters?: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    priority?: string;
    class?: string;
  }) {
    let query = supabase
      .from('alerts')
      .select(`
        *,
        student:students(*, user:users(*)),
        teacher:teachers(*, user:users(*))
      `);

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    const result = await query.order('created_at', { ascending: false });
    
    if (result.data && filters?.class) {
      result.data = result.data.filter(alert => alert.student?.class === filters.class);
    }
    
    return result;
  },

  async getTeacherAnalytics(filters?: {
    dateFrom?: string;
    dateTo?: string;
    teacherId?: string;
  }) {
    const [teachersResult, recordsResult, alertsResult] = await Promise.all([
      this.getTeachers(),
      this.getParticipationRecords({
        teacherId: filters?.teacherId,
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo
      }),
      this.getAlerts({
        teacherId: filters?.teacherId
      })
    ]);

    return {
      teachers: teachersResult.data || [],
      participationRecords: recordsResult.data || [],
      alerts: alertsResult.data || []
    };
  },

  async getClassAnalytics(filters?: {
    dateFrom?: string;
    dateTo?: string;
    class?: string;
  }) {
    const [studentsResult, recordsResult, alertsResult, leavesResult] = await Promise.all([
      this.getStudents(),
      this.getParticipationRecords({
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo
      }),
      this.getAlerts(),
      this.getLeaves()
    ]);

    let students = studentsResult.data || [];
    let participationRecords = recordsResult.data || [];
    let alerts = alertsResult.data || [];
    let leaves = leavesResult.data || [];

    // Filter by class if specified
    if (filters?.class) {
      students = students.filter(s => s.class === filters.class);
      const studentIds = students.map(s => s.id);
      participationRecords = participationRecords.filter(r => studentIds.includes(r.student_id));
      alerts = alerts.filter(a => studentIds.includes(a.student_id));
      leaves = leaves.filter(l => studentIds.includes(l.student_id));
    }

    // Filter leaves by date range
    if (filters?.dateFrom) {
      leaves = leaves.filter(l => new Date(l.date) >= new Date(filters.dateFrom!));
    }
    if (filters?.dateTo) {
      leaves = leaves.filter(l => new Date(l.date) <= new Date(filters.dateTo!));
    }

    return {
      students,
      participationRecords,
      alerts,
      leaves
    };
  }
};