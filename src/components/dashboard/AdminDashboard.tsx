import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  GraduationCap, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  Download
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalAlerts: number;
  totalLeaves: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalStaff: 0,
    totalAlerts: 0,
    totalLeaves: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [studentsResult, staffResult, alertsResult, leavesResult] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }),
        supabase.from('teachers').select('id', { count: 'exact' }),
        supabase.from('alerts').select('id', { count: 'exact' }).eq('is_resolved', false),
        supabase.from('leaves').select('id', { count: 'exact' })
      ]);

      setStats({
        totalStudents: studentsResult.count || 0,
        totalStaff: staffResult.count || 0,
        totalAlerts: alertsResult.count || 0,
        totalLeaves: leavesResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      // Fetch grading data for export
      const { data: gradingData, error } = await supabase
        .from('grading_records')
        .select(`
          date,
          grade,
          remarks,
          students!inner(class, users!inner(name)),
          activities!inner(code, description),
          teachers!inner(users!inner(name))
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      // Create CSV content
      const csvContent = [
        ['Date', 'Student', 'Class', 'Activity', 'Grade', 'Teacher', 'Remarks'].join(','),
        ...gradingData.map(record => [
          record.date,
          record.students.users.name,
          record.students.class,
          `${record.activities.code} - ${record.activities.description}`,
          record.grade,
          record.teachers.users.name,
          record.remarks || ''
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `markaz-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Staff',
      value: stats.totalStaff,
      icon: GraduationCap,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Alerts',
      value: stats.totalAlerts,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Total Leaves',
      value: stats.totalLeaves,
      icon: Calendar,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className={`${stat.bgColor} rounded-lg p-6 border border-gray-200`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/students"
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Users className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-700">Manage Students</span>
          </a>
          <a
            href="/reports"
            className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-700">View Reports</span>
          </a>
          <a
            href="/alerts"
            className="flex items-center gap-3 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-700">Review Alerts</span>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
        <div className="text-gray-600">
          <p className="mb-2">📊 System is operating normally</p>
          <p className="mb-2">👥 {stats.totalStudents} students enrolled across all classes</p>
          <p className="mb-2">👨‍🏫 {stats.totalStaff} staff members active</p>
          {stats.totalAlerts > 0 && (
            <p className="text-red-600 font-medium">⚠️ {stats.totalAlerts} alerts require attention</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;