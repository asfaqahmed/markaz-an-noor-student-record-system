import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { 
  BookOpen, 
  Calendar, 
  AlertTriangle, 
  TrendingUp,
  Award,
  Clock
} from 'lucide-react';

interface GradingRecord {
  id: string;
  date: string;
  grade: 'A' | 'B' | 'C' | 'D';
  remarks: string | null;
  activities: {
    code: string;
    description: string;
    time_slot: string;
  };
  teachers: {
    users: {
      name: string;
    };
  };
}

interface Alert {
  id: string;
  comment: string;
  created_at: string;
  teachers: {
    users: {
      name: string;
    };
  };
}

interface StudentStats {
  totalGrades: number;
  totalLeaves: number;
  averageGrade: string;
  gradeDistribution: Record<string, number>;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [gradingRecords, setGradingRecords] = useState<GradingRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    totalGrades: 0,
    totalLeaves: 0,
    averageGrade: 'N/A',
    gradeDistribution: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchStudentData();
    }
  }, [user?.id]);

  const fetchStudentData = async () => {
    try {
      // Get student ID
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!student) return;

      // Fetch grading records
      const { data: grades } = await supabase
        .from('grading_records')
        .select(`
          id,
          date,
          grade,
          remarks,
          activities(code, description, time_slot),
          teachers(users(name))
        `)
        .eq('student_id', student.id)
        .order('date', { ascending: false });

      // Fetch alerts
      const { data: alertsData } = await supabase
        .from('alerts')
        .select(`
          id,
          comment,
          created_at,
          teachers(users(name))
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      // Fetch leaves count
      const { count: leavesCount } = await supabase
        .from('leaves')
        .select('*', { count: 'exact' })
        .eq('student_id', student.id);

      if (grades) {
        setGradingRecords(grades);
        
        // Calculate stats
        const gradeDistribution: Record<string, number> = {};
        let gradeSum = 0;
        
        grades.forEach(record => {
          gradeDistribution[record.grade] = (gradeDistribution[record.grade] || 0) + 1;
          gradeSum += { A: 4, B: 3, C: 2, D: 1 }[record.grade];
        });

        const averageGrade = grades.length > 0 
          ? (gradeSum / grades.length).toFixed(1) 
          : 'N/A';

        setStats({
          totalGrades: grades.length,
          totalLeaves: leavesCount || 0,
          averageGrade,
          gradeDistribution
        });
      }

      if (alertsData) {
        setAlerts(alertsData);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50';
      case 'B': return 'text-blue-600 bg-blue-50';
      case 'C': return 'text-yellow-600 bg-yellow-50';
      case 'D': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Grades</p>
              <p className="text-3xl font-bold text-green-900">{stats.totalGrades}</p>
            </div>
            <Award className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Average Grade</p>
              <p className="text-3xl font-bold text-blue-900">{stats.averageGrade}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Total Leaves</p>
              <p className="text-3xl font-bold text-orange-900">{stats.totalLeaves}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Alerts</p>
              <p className="text-3xl font-bold text-purple-900">{alerts.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h2>
        <div className="grid grid-cols-4 gap-4">
          {['A', 'B', 'C', 'D'].map(grade => (
            <div key={grade} className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${getGradeColor(grade)}`}>
                {grade}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {stats.gradeDistribution[grade] || 0} grades
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Grades */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Grades</h2>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {gradingRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No grades recorded yet</p>
            ) : (
              gradingRecords.slice(0, 10).map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {record.activities.code} - {record.activities.description}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {record.activities.time_slot}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Teacher: {record.teachers.users.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(record.date), 'MMMM d, yyyy')}
                      </p>
                      {record.remarks && (
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                          {record.remarks}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(record.grade)}`}>
                      {record.grade}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No alerts</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <p className="text-sm text-red-800 mb-2">{alert.comment}</p>
                  <div className="flex justify-between text-xs text-red-600">
                    <span>From: {alert.teachers.users.name}</span>
                    <span>{format(new Date(alert.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;