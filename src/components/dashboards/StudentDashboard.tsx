'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  Target
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface StudentStats {
  totalRecords: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  totalLeaves: number;
  totalAlerts: number;
  averageGrade: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    fetchStudentData();
  }, [user, selectedPeriod]);

  const fetchStudentData = async () => {
    try {
      if (!user) return;

      // Get student profile
      const { data: studentData } = await db.getStudentByUserId(user.id);
      if (!studentData) return;
      setStudent(studentData);

      // Get activities for reference
      const { data: activitiesData } = await db.getActivities();
      if (activitiesData) setActivities(activitiesData);

      // Get date range based on selected period
      const now = new Date();
      let dateFrom: string;
      
      switch (selectedPeriod) {
        case 'week':
          dateFrom = format(startOfWeek(now), 'yyyy-MM-dd');
          break;
        case 'month':
          dateFrom = format(subDays(now, 30), 'yyyy-MM-dd');
          break;
        case 'all':
        default:
          dateFrom = format(subDays(now, 90), 'yyyy-MM-dd'); // Last 90 days
      }

      // Fetch all data in parallel
      const [recordsResult, alertsResult, leavesResult, statsResult] = await Promise.all([
        db.getParticipationRecords({ 
          studentId: studentData.id, 
          dateFrom,
          dateTo: format(now, 'yyyy-MM-dd')
        }),
        db.getAlerts({ studentId: studentData.id }),
        db.getLeaves(studentData.id),
        db.getStudentStats(studentData.id)
      ]);

      if (recordsResult.data) {
        setRecentRecords(recordsResult.data.slice(0, 10));
      }
      if (alertsResult.data) setAlerts(alertsResult.data);
      if (leavesResult.data) setLeaves(leavesResult.data);
      if (statsResult) setStats(statsResult);

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

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'A': return CheckCircle;
      case 'B': return CheckCircle;
      case 'C': return Clock;
      case 'D': return XCircle;
      default: return Clock;
    }
  };

  const getGradeDescription = (grade: string) => {
    switch (grade) {
      case 'A': return 'Did properly';
      case 'B': return 'Attended';
      case 'C': return 'Late';
      case 'D': return 'Unattended';
      default: return 'Unknown';
    }
  };

  const getAlertPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Student profile not found.</p>
        </div>
      </div>
    );
  }

  const totalParticipations = stats ? stats.totalRecords : 0;
  const gradePercentage = (grade: keyof typeof stats.gradeDistribution) => {
    if (!stats || totalParticipations === 0) return 0;
    return Math.round((stats.gradeDistribution[grade] / totalParticipations) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600">Personal dashboard for {student.user?.name || 'Student'} - {student.class}</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="form-select"
          >
            <option value="week">This Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Grade</p>
                <p className="text-2xl font-bold text-islamic-emerald">{stats.averageGrade}</p>
              </div>
              <Award className="h-8 w-8 text-islamic-emerald" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leaves</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeaves}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Grade Distribution */}
      {stats && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h2>
          <div className="space-y-4">
            {(['A', 'B', 'C', 'D'] as const).map((grade) => {
              const count = stats.gradeDistribution[grade];
              const percentage = gradePercentage(grade);
              const IconComponent = getGradeIcon(grade);
              
              return (
                <div key={grade} className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getGradeColor(grade)}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        Grade {grade} - {getGradeDescription(grade)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          grade === 'A' ? 'bg-green-500' :
                          grade === 'B' ? 'bg-blue-500' :
                          grade === 'C' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Participation Records */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Participation</h2>
        {recentRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity</th>
                  <th>Grade</th>
                  <th>Remarks</th>
                  <th>Teacher</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((record) => {
                  const IconComponent = getGradeIcon(record.grade);
                  return (
                    <tr key={record.id}>
                      <td className="text-sm">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                      <td>
                        <div>
                          <div className="font-medium text-sm">{record.activity?.code}</div>
                          <div className="text-xs text-gray-500 truncate max-w-32">
                            {record.activity?.description}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${getGradeColor(record.grade)}`}>
                          <IconComponent className="h-3 w-3" />
                          <span className="text-xs font-medium">{record.grade}</span>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600 max-w-32 truncate">
                        {record.remarks || '-'}
                      </td>
                      <td className="text-sm text-gray-600">
                        {record.teacher?.user?.name || 'Unknown'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No participation records found for the selected period.</p>
        )}
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notices</h2>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getAlertPriorityColor(alert.priority)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase">{alert.priority}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(alert.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm">{alert.comment}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      From: {alert.teacher?.user?.name || 'Unknown Teacher'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave History */}
      {leaves.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave History</h2>
          <div className="space-y-2">
            {leaves.slice(0, 5).map((leave) => (
              <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{format(new Date(leave.date), 'MMM dd, yyyy')}</p>
                    <p className="text-xs text-gray-500">{leave.reason || 'No reason provided'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Islamic Schedule Reference */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Islamic Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-islamic-emerald bg-islamic-emerald/10 px-2 py-1 rounded">
                  {activity.code}
                </span>
                <span className="text-sm">{activity.description.split(' - ')[0]}</span>
              </div>
              <span className="text-xs text-gray-500">
                {format(new Date(`2000-01-01 ${activity.start_time}`), 'h:mm a')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}