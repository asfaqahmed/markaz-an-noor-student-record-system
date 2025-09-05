'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar,
  Award,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  BookOpen,
  BarChart3
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import Layout from '@/components/Layout';
import RouteGuard from '@/components/RouteGuard';

interface StudentProgress {
  student: any;
  stats: any;
  recentRecords: any[];
  alerts: any[];
  leaves: any[];
  activities: any[];
  weeklyProgress: any[];
  monthlyProgress: any[];
}

export default function ProgressPage() {
  const { user, isStudent } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    if (isStudent) {
      fetchStudentProgress();
    } else {
      setLoading(false);
    }
  }, [user, isStudent]);

  const fetchStudentProgress = async () => {
    try {
      if (!user) return;

      // Get student profile
      const { data: studentData } = await db.getStudentByUserId(user.id);
      if (!studentData) return;

      // Get all necessary data
      const [
        statsResult,
        recordsResult,
        alertsResult,
        leavesResult,
        activitiesResult
      ] = await Promise.all([
        db.getStudentStats(studentData.id),
        db.getParticipationRecords({ studentId: studentData.id }),
        db.getAlerts({ studentId: studentData.id }),
        db.getLeaves(studentData.id),
        db.getActivities()
      ]);

      // Calculate weekly progress
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayRecords = recordsResult.data?.filter(r => 
          format(new Date(r.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ) || [];
        
        weeklyData.push({
          date: format(date, 'MMM dd'),
          records: dayRecords.length,
          grades: {
            A: dayRecords.filter(r => r.grade === 'A').length,
            B: dayRecords.filter(r => r.grade === 'B').length,
            C: dayRecords.filter(r => r.grade === 'C').length,
            D: dayRecords.filter(r => r.grade === 'D').length,
          }
        });
      }

      // Calculate monthly progress
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = subDays(new Date(), i * 7);
        const weekStart = startOfWeek(date);
        const weekEnd = endOfWeek(date);
        
        const weekRecords = recordsResult.data?.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate >= weekStart && recordDate <= weekEnd;
        }) || [];
        
        monthlyData.push({
          week: `Week ${Math.ceil((new Date().getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`,
          records: weekRecords.length,
          averageGrade: weekRecords.length > 0 
            ? (weekRecords.filter(r => r.grade === 'A').length * 4 +
               weekRecords.filter(r => r.grade === 'B').length * 3 +
               weekRecords.filter(r => r.grade === 'C').length * 2 +
               weekRecords.filter(r => r.grade === 'D').length * 1) / weekRecords.length
            : 0
        });
      }

      setProgress({
        student: studentData,
        stats: statsResult,
        recentRecords: recordsResult.data?.slice(0, 10) || [],
        alerts: alertsResult.data || [],
        leaves: leavesResult.data || [],
        activities: activitiesResult.data || [],
        weeklyProgress: weeklyData,
        monthlyProgress: monthlyData
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
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
      case 'A':
      case 'B':
        return CheckCircle;
      case 'C':
        return Clock;
      case 'D':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getPerformanceLevel = (averageGrade: number) => {
    if (averageGrade >= 3.5) return { level: 'Excellent', color: 'text-green-600', icon: '🌟' };
    if (averageGrade >= 2.5) return { level: 'Good', color: 'text-blue-600', icon: '👍' };
    if (averageGrade >= 1.5) return { level: 'Fair', color: 'text-yellow-600', icon: '⚠️' };
    return { level: 'Needs Improvement', color: 'text-red-600', icon: '📈' };
  };

  if (!isStudent) {
    return (
      <RouteGuard>
        <Layout>
          <div className="p-6">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Access Only</h2>
              <p className="text-gray-600">This page is only accessible to students to view their personal progress.</p>
            </div>
          </div>
        </Layout>
      </RouteGuard>
    );
  }

  if (loading) {
    return (
      <RouteGuard>
        <Layout>
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
        </Layout>
      </RouteGuard>
    );
  }

  if (!progress) {
    return (
      <RouteGuard>
        <Layout>
          <div className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Progress Data</h2>
              <p className="text-gray-600">Unable to load your progress data. Please contact your administrator.</p>
            </div>
          </div>
        </Layout>
      </RouteGuard>
    );
  }

  const averageGrade = parseFloat(progress.stats.averageGrade) || 0;
  const performance = getPerformanceLevel(averageGrade);
  const totalRecords = progress.stats.totalRecords || 0;
  
  return (
    <RouteGuard>
      <Layout>
        <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Academic Progress</h1>
          <p className="text-gray-600">Personal dashboard for {progress.student.user?.name || 'Student'} - {progress.student.class}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-2 rounded-lg border ${performance.color.replace('text-', 'border-').replace('600', '200')} ${performance.color.replace('text-', 'bg-').replace('600', '50')}`}>
            <span className="text-sm font-medium">{performance.icon} {performance.level}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'grades', label: 'Grades', icon: Award },
          { id: 'attendance', label: 'Attendance', icon: Calendar },
          { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedView(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === tab.id 
                ? 'bg-white text-islamic-emerald shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Grade</p>
                  <p className="text-2xl font-bold text-islamic-emerald">{progress.stats.averageGrade}</p>
                </div>
                <Award className="h-8 w-8 text-islamic-emerald" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Activities</p>
                  <p className="text-2xl font-bold text-gray-900">{progress.stats.totalRecords}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Leave Days</p>
                  <p className="text-2xl font-bold text-gray-900">{progress.stats.totalLeaves}</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{progress.stats.totalAlerts}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Last 7 Days Progress</h2>
            <div className="space-y-3">
              {progress.weeklyProgress.map((day, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-16 text-sm font-medium text-gray-700">
                    {day.date}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">{day.records} activities</span>
                      <div className="flex space-x-1">
                        {Object.entries(day.grades).map(([grade, count]) => (
                          (count as number) > 0 && (
                            <span key={grade} className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(grade)}`}>
                              {grade}: {count as number}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-islamic-emerald h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((day.records / 10) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Grades Tab */}
      {selectedView === 'grades' && (
        <>
          {/* Grade Distribution */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h2>
            <div className="space-y-4">
              {Object.entries(progress.stats.gradeDistribution).map(([grade, count]) => {
                const percentage = totalRecords > 0 ? Math.round(((count as number) / totalRecords) * 100) : 0;
                const IconComponent = getGradeIcon(grade);
                
                return (
                  <div key={grade} className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getGradeColor(grade)}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          Grade {grade} - {grade === 'A' ? 'Did properly' : grade === 'B' ? 'Attended' : grade === 'C' ? 'Late' : 'Unattended'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {count as number} times ({percentage}%)
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

          {/* Recent Performance */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Activity</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {progress.recentRecords.slice(0, 10).map((record) => {
                    const IconComponent = getGradeIcon(record.grade);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="text-sm">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </td>
                        <td>
                          <div>
                            <div className="font-medium text-sm">{record.activity?.code}</div>
                            <div className="text-xs text-gray-500 truncate max-w-32">
                              {record.activity?.description?.split(' - ')[0]}
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Attendance Tab */}
      {selectedView === 'attendance' && (
        <>
          {/* Attendance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Present Days</p>
                  <p className="text-2xl font-bold text-green-900">
                    {progress.stats.gradeDistribution.A + progress.stats.gradeDistribution.B + progress.stats.gradeDistribution.C}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="card bg-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Absent Days</p>
                  <p className="text-2xl font-bold text-red-900">{progress.stats.gradeDistribution.D}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <div className="card bg-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Leave Days</p>
                  <p className="text-2xl font-bold text-blue-900">{progress.leaves.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Leave History */}
          {progress.leaves.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Leave History</h2>
              <div className="space-y-3">
                {progress.leaves.slice(0, 5).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{format(new Date(leave.date), 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-gray-500">{leave.reason || 'No reason provided'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      Reported: {format(new Date(leave.created_at), 'MMM dd')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Alerts Tab */}
      {selectedView === 'alerts' && (
        <div className="space-y-4">
          {progress.alerts.length > 0 ? (
            progress.alerts.map((alert) => (
              <div key={alert.id} className={`card border-l-4 ${
                alert.priority === 'urgent' ? 'border-l-red-500' :
                alert.priority === 'high' ? 'border-l-orange-500' :
                alert.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-gray-400" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        alert.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        alert.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {alert.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{alert.comment}</p>
                    <div className="text-xs text-gray-500">
                      Created: {format(new Date(alert.created_at), 'MMM dd, yyyy')} by {alert.teacher.user?.name || 'Unknown Teacher'}
                      {alert.resolved_at && (
                        <span className="ml-2 text-green-600">
                          • Resolved: {format(new Date(alert.resolved_at), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
              <p className="text-gray-500">You have no active alerts. Keep up the good work!</p>
            </div>
          )}
        </div>
      )}
        </div>
      </Layout>
    </RouteGuard>
  );
}