'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Award,
  Clock,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabase';
import Layout from '@/components/Layout';
import RouteGuard from '@/components/RouteGuard';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalActivities: number;
  openAlerts: number;
  todayParticipation: number;
  weeklyParticipation: number;
  topPerformingClass: string;
  averageGrade: string;
  recentAlerts: any[];
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
}

export default function DashboardPage() {
  const { user, isAdmin, isStaff } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalActivities: 0,
    openAlerts: 0,
    todayParticipation: 0,
    weeklyParticipation: 0,
    topPerformingClass: '',
    averageGrade: 'N/A',
    recentAlerts: [],
    gradeDistribution: { A: 0, B: 0, C: 0, D: 0 }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch all required data
      const [
        studentsResult,
        teachersResult,
        activitiesResult,
        alertsResult,
        participationResult,
        weeklyParticipationResult
      ] = await Promise.all([
        db.getStudents(),
        db.getTeachers(),
        db.getActivities(),
        db.getAlerts({ status: 'open' }),
        db.getParticipationRecords({ dateFrom: today, dateTo: today }),
        db.getParticipationRecords({ dateFrom: weekAgo, dateTo: today })
      ]);

      const students = studentsResult.data || [];
      const teachers = teachersResult.data || [];
      const activities = activitiesResult.data || [];
      const alerts = alertsResult.data || [];
      const todayRecords = participationResult.data || [];
      const weeklyRecords = weeklyParticipationResult.data || [];

      // Calculate grade distribution
      const gradeDistribution = {
        A: weeklyRecords.filter(r => r.grade === 'A').length,
        B: weeklyRecords.filter(r => r.grade === 'B').length,
        C: weeklyRecords.filter(r => r.grade === 'C').length,
        D: weeklyRecords.filter(r => r.grade === 'D').length
      };

      // Calculate average grade
      const totalPoints = gradeDistribution.A * 4 + gradeDistribution.B * 3 + gradeDistribution.C * 2 + gradeDistribution.D * 1;
      const totalGrades = Object.values(gradeDistribution).reduce((a, b) => a + b, 0);
      const avgPoints = totalGrades > 0 ? totalPoints / totalGrades : 0;
      const averageGrade = avgPoints >= 3.5 ? 'A' : avgPoints >= 2.5 ? 'B' : avgPoints >= 1.5 ? 'C' : 'D';

      // Find top performing class
      const classGrades = students.reduce((acc, student) => {
        if (!acc[student.class]) acc[student.class] = [];
        const studentRecords = weeklyRecords.filter(r => r.student_id === student.id);
        studentRecords.forEach(record => acc[student.class].push(record.grade));
        return acc;
      }, {} as Record<string, string[]>);

      let topClass = '';
      let bestAverage = 0;
      Object.entries(classGrades).forEach(([className, grades]) => {
        const gradeArray = grades as string[];
        if (gradeArray.length > 0) {
          const classPoints = gradeArray.reduce((sum, grade) => {
            return sum + (grade === 'A' ? 4 : grade === 'B' ? 3 : grade === 'C' ? 2 : 1);
          }, 0);
          const classAverage = classPoints / gradeArray.length;
          if (classAverage > bestAverage) {
            bestAverage = classAverage;
            topClass = className;
          }
        }
      });

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalActivities: activities.length,
        openAlerts: alerts.length,
        todayParticipation: todayRecords.length,
        weeklyParticipation: weeklyRecords.length,
        topPerformingClass: topClass || 'N/A',
        averageGrade: totalGrades > 0 ? averageGrade : 'N/A',
        recentAlerts: alerts.slice(0, 5),
        gradeDistribution
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RouteGuard>
        <Layout>
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </Layout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <Layout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Overview of Markaz An-noor Student System</p>
            </div>
            <div className="text-sm text-gray-500">
              Welcome back, {user?.name}
            </div>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Students</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Teachers</p>
                  <p className="text-3xl font-bold text-green-900">{stats.totalTeachers}</p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Activities</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.totalActivities}</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Open Alerts</p>
                  <p className="text-3xl font-bold text-red-900">{stats.openAlerts}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Today&apos;s Participation</h3>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-islamic-emerald">{stats.todayParticipation}</div>
              <p className="text-sm text-gray-500 mt-1">Records logged today</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Weekly Average</h3>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-islamic-emerald">{stats.averageGrade}</div>
              <p className="text-sm text-gray-500 mt-1">Overall grade this week</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Top Class</h3>
                <Target className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-islamic-emerald">{stats.topPerformingClass}</div>
              <p className="text-sm text-gray-500 mt-1">Best performing this week</p>
            </div>
          </div>

          {/* Grade Distribution and Recent Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Grade Distribution (This Week)</h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {Object.entries(stats.gradeDistribution).map(([grade, count]) => {
                  const total = Object.values(stats.gradeDistribution).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  const color = grade === 'A' ? 'bg-green-500' : grade === 'B' ? 'bg-blue-500' : grade === 'C' ? 'bg-yellow-500' : 'bg-red-500';
                  
                  return (
                    <div key={grade} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span className="text-sm font-medium">Grade {grade}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{count}</span>
                        <span className="text-sm text-gray-400">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
                <AlertTriangle className="h-5 w-5 text-gray-400" />
              </div>
              {stats.recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        alert.priority === 'urgent' ? 'bg-red-500' :
                        alert.priority === 'high' ? 'bg-orange-500' :
                        alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{alert.student?.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{alert.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No recent alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => window.location.href = '/students'}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <span className="text-sm font-medium">Manage Students</span>
              </button>
              <button 
                onClick={() => window.location.href = '/activities'}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <span className="text-sm font-medium">Activities</span>
              </button>
              <button 
                onClick={() => window.location.href = '/alerts'}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <span className="text-sm font-medium">View Alerts</span>
              </button>
              <button 
                onClick={() => window.location.href = '/participation'}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <Calendar className="h-6 w-6 mx-auto mb-2 text-islamic-emerald" />
                <span className="text-sm font-medium">Participation</span>
              </button>
              {isAdmin && (
                <>
                  <button 
                    onClick={() => window.location.href = '/reports'}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    <BarChart3 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <span className="text-sm font-medium">Generate Reports</span>
                  </button>
                  <button 
                    onClick={() => window.location.href = '/admin'}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    <Target className="h-6 w-6 mx-auto mb-2 text-red-600" />
                    <span className="text-sm font-medium">Admin Management</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </RouteGuard>
  );
}