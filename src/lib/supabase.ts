import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'staff' | 'student';
          created_at: string;
        };
      };
      students: {
        Row: {
          id: string;
          user_id: string;
          class: string;
          joined_at: string;
        };
      };
      teachers: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          assigned_class: string;
        };
      };
      activities: {
        Row: {
          id: string;
          code: string;
          description: string;
          time_slot: string | null;
        };
      };
      grading_records: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          activity_id: string;
          date: string;
          grade: 'A' | 'B' | 'C' | 'D';
          remarks: string | null;
          created_at: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          comment: string;
          created_at: string;
          is_resolved: boolean;
        };
      };
      leaves: {
        Row: {
          id: string;
          student_id: string;
          date: string;
          reason: string;
          created_at: string;
        };
      };
    };
  };
};