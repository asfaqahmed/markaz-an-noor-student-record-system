'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  AlertTriangle, 
  Calendar,
  Download,
  TrendingUp,
  FileText,
  Bell,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { exportToCSV, exportToPDF, prepareParticipationDataForExport, prepareAlertsDataForExport } from '@/utils/export';
import { format, subDays } from 'date-fns';

interface Stats {
  totalStudents: number;
  totalStaff: number;
  openAlerts: number;
  totalLeaves: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalStaff: 0,
    openAlerts: 0,
    totalLeaves: 0
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResult, alertsResult] = await Promise.all([
        db.getOverallStats(),
        db.getAlerts({ status: 'open' })
      ]);

      if (statsResult) {
        setStats(statsResult);
      }

      if (alertsResult.data) {
        setRecentAlerts(alertsResult.data.slice(0, 5)); // Show recent 5 alerts
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportParticipationRecords = async () => {
    try {
      const { data } = await db.getParticipationRecords({
        dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd') // Last 30 days
      });
      
      if (data && data.length > 0) {
        const exportData = prepareParticipationDataForExport(data);
        exportToCSV(exportData, 'participation_records');
      } else {
        alert('No participation records found for the selected period.');
      }
    } catch (error) {
      console.error('Error exporting participation records:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const handleExportAlerts = async () => {
    try {
      const { data } = await db.getAlerts();
      
      if (data && data.length > 0) {
        const exportData = prepareAlertsDataForExport(data);
        exportToPDF(exportData, 'Student Alerts Report', 'student_alerts');
      } else {
        alert('No alerts found.');
      }
    } catch (error) {
      console.error('Error exporting alerts:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+2 this week'
    },
    {
      name: 'Staff Members',
      value: stats.totalStaff,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: 'Active'
    },
    {
      name: 'Open Alerts',
      value: stats.openAlerts,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: 'Needs attention'
    },
    {
      name: 'Total Leaves',
      value: stats.totalLeaves,
      icon: Calendar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: 'This month'
    }
  ];

  const quickActions = [
    {
      name: 'Manage Students',
      description: 'Add, edit, or view student profiles',
      icon: Users,
      color: 'bg-blue-500',
      href: '/students'
    },
    {
      name: 'View Reports',
      description: 'Generate and export detailed reports',
      icon: FileText,
      color: 'bg-green-500',
      action: handleExportParticipationRecords
    },
    {
      name: 'Review Alerts',
      description: 'Address urgent student concerns',
      icon: Bell,
      color: 'bg-red-500',
      href: '/alerts'
    },
    {
      name: 'Export Data',
      description: 'Download participation and alert data',
      icon: Download,
      color: 'bg-purple-500',
      action: handleExportAlerts
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of Markaz An-noor Student System</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportParticipationRecords}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Records</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.name}
              onClick={action.action}
              className="text-left p-4 rounded-lg border border-gray-200 hover:border-islamic-emerald hover:shadow-md transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{action.name}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
            <span className="badge-danger">{recentAlerts.length} Open</span>
          </div>
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                  alert.priority === 'urgent' ? 'bg-red-500' :
                  alert.priority === 'high' ? 'bg-orange-500' :
                  alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {alert.student?.user?.name || 'Unknown Student'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{alert.comment}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{format(new Date(alert.created_at), 'MMM dd')}</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        alert.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        alert.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Islamic Daily Schedule</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>A01: Morning Prayer (Fajr)</span>
              <span className="text-gray-500">4:30 AM</span>
            </div>
            <div className="flex justify-between">
              <span>A02: Quran Recitation</span>
              <span className="text-gray-500">5:00 AM</span>
            </div>
            <div className="flex justify-between">
              <span>A03: Breakfast</span>
              <span className="text-gray-500">6:30 AM</span>
            </div>
            <div className="flex justify-between">
              <span>A04: Academic Classes</span>
              <span className="text-gray-500">8:00 AM</span>
            </div>
            <div className="flex justify-between">
              <span>A05: Lunch & Break</span>
              <span className="text-gray-500">12:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span>A06: Afternoon Classes</span>
              <span className="text-gray-500">3:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span>A07: Play Time</span>
              <span className="text-gray-500">5:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span>A08: Evening Prayer (Maghrib)</span>
              <span className="text-gray-500">6:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span>A09: Homework Review</span>
              <span className="text-gray-500">7:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span>A10: Night Prayer & Sleep (Isha)</span>
              <span className="text-gray-500">9:00 PM</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade System</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">A</div>
              <div>
                <p className="font-medium">Did the activity properly</p>
                <p className="text-sm text-gray-600">Excellent participation and engagement</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">B</div>
              <div>
                <p className="font-medium">Attended the activity</p>
                <p className="text-sm text-gray-600">Present but minimal engagement</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-sm font-medium">C</div>
              <div>
                <p className="font-medium">Late for the activity</p>
                <p className="text-sm text-gray-600">Arrived after scheduled time</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-sm font-medium">D</div>
              <div>
                <p className="font-medium">Unattended</p>
                <p className="text-sm text-gray-600">Did not participate in activity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}