'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download,
  Calendar,
  Users,
  BookOpen,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Filter,
  Clock
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { exportToCSV, exportToPDF, prepareParticipationDataForExport, prepareAlertsDataForExport, prepareLeavesDataForExport } from '@/utils/export';

interface ReportData {
  participationRecords: any[];
  alerts: any[];
  leaves: any[];
  students: any[];
  activities: any[];
}

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({
    participationRecords: [],
    alerts: [],
    leaves: [],
    students: [],
    activities: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedClass, setSelectedClass] = useState('');
  const [reportType, setReportType] = useState('participation');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const now = new Date();
      let dateFrom: string;
      
      switch (selectedPeriod) {
        case 'day':
          dateFrom = format(now, 'yyyy-MM-dd');
          break;
        case 'week':
          dateFrom = format(subWeeks(now, 1), 'yyyy-MM-dd');
          break;
        case 'month':
          dateFrom = format(subMonths(now, 1), 'yyyy-MM-dd');
          break;
        case 'quarter':
          dateFrom = format(subMonths(now, 3), 'yyyy-MM-dd');
          break;
        case 'year':
          dateFrom = format(subMonths(now, 12), 'yyyy-MM-dd');
          break;
        default:
          dateFrom = format(subWeeks(now, 1), 'yyyy-MM-dd');
      }

      // Fetch all data in parallel
      const [
        participationResult,
        alertsResult,
        leavesResult,
        studentsResult,
        activitiesResult
      ] = await Promise.all([
        db.getParticipationRecords({ dateFrom, dateTo: format(now, 'yyyy-MM-dd') }),
        db.getAlerts(),
        db.getLeaves(),
        db.getStudents(),
        db.getActivities()
      ]);

      setReportData({
        participationRecords: participationResult.data || [],
        alerts: alertsResult.data || [],
        leaves: leavesResult.data?.filter(leave => new Date(leave.date) >= new Date(dateFrom)) || [],
        students: studentsResult.data || [],
        activities: activitiesResult.data || []
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type: 'csv' | 'pdf') => {
    try {
      let data: any[] = [];
      let filename = '';
      let title = '';

      switch (reportType) {
        case 'participation':
          data = prepareParticipationDataForExport(reportData.participationRecords);
          filename = 'participation_report';
          title = 'Participation Records Report';
          break;
        case 'alerts':
          data = prepareAlertsDataForExport(reportData.alerts);
          filename = 'alerts_report';
          title = 'Student Alerts Report';
          break;
        case 'leaves':
          data = prepareLeavesDataForExport(reportData.leaves);
          filename = 'leaves_report';
          title = 'Student Leaves Report';
          break;
        default:
          alert('Please select a valid report type.');
          return;
      }

      if (data.length === 0) {
        alert('No data available for the selected report.');
        return;
      }

      if (type === 'csv') {
        exportToCSV(data, filename);
      } else {
        exportToPDF(data, title, filename);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  const getFilteredData = () => {
    let data = reportData.participationRecords;
    
    if (selectedClass) {
      data = data.filter(record => record.student?.class === selectedClass);
    }
    
    return data;
  };

  const calculateStats = () => {
    const filteredRecords = getFilteredData();
    const uniqueStudents = [...new Set(filteredRecords.map(r => r.student_id))];
    const uniqueActivities = [...new Set(filteredRecords.map(r => r.activity_id))];
    
    const gradeDistribution = {
      A: filteredRecords.filter(r => r.grade === 'A').length,
      B: filteredRecords.filter(r => r.grade === 'B').length,
      C: filteredRecords.filter(r => r.grade === 'C').length,
      D: filteredRecords.filter(r => r.grade === 'D').length,
    };

    const attendanceRate = filteredRecords.length > 0 
      ? Math.round(((gradeDistribution.A + gradeDistribution.B + gradeDistribution.C) / filteredRecords.length) * 100)
      : 0;

    const averageGrade = filteredRecords.length > 0
      ? (gradeDistribution.A * 4 + gradeDistribution.B * 3 + gradeDistribution.C * 2 + gradeDistribution.D * 1) / filteredRecords.length
      : 0;

    return {
      totalRecords: filteredRecords.length,
      uniqueStudents: uniqueStudents.length,
      uniqueActivities: uniqueActivities.length,
      gradeDistribution,
      attendanceRate,
      averageGrade: averageGrade.toFixed(2)
    };
  };

  const uniqueClasses = [...new Set(reportData.students.map(s => s.class))].sort();
  const stats = calculateStats();

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access reports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive reports and analyze student data</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleGenerateReport('csv')}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleGenerateReport('pdf')}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="form-select"
            >
              <option value="participation">Participation Records</option>
              <option value="alerts">Student Alerts</option>
              <option value="leaves">Leave Records</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-select"
            >
              <option value="day">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Filter</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="form-select"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
            </div>
            <FileText className="h-8 w-8 text-islamic-emerald" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueStudents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Grade</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageGrade}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution Analysis</h2>
        <div className="space-y-4">
          {Object.entries(stats.gradeDistribution).map(([grade, count]) => {
            const percentage = stats.totalRecords > 0 ? Math.round((count / stats.totalRecords) * 100) : 0;
            const getGradeColor = (g: string) => {
              switch (g) {
                case 'A': return 'bg-green-500';
                case 'B': return 'bg-blue-500';
                case 'C': return 'bg-yellow-500';
                case 'D': return 'bg-red-500';
                default: return 'bg-gray-500';
              }
            };
            
            return (
              <div key={grade} className="flex items-center space-x-3">
                <div className="w-16">
                  <span className="text-sm font-medium text-gray-700">Grade {grade}</span>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${getGradeColor(grade)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Coverage</h2>
          <div className="space-y-3">
            {reportData.activities.slice(0, 5).map((activity) => {
              const activityRecords = reportData.participationRecords.filter(r => r.activity_id === activity.id);
              const coverage = reportData.students.length > 0 
                ? Math.round((activityRecords.length / reportData.students.length) * 100)
                : 0;
              
              return (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{activity.code}</p>
                    <p className="text-xs text-gray-500">{activity.description.split(' - ')[0]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{activityRecords.length} records</p>
                    <p className="text-xs text-gray-500">{coverage}% coverage</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Open Alerts</span>
              </div>
              <span className="text-sm font-bold text-red-600">
                {reportData.alerts.filter(a => a.status === 'open').length}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Under Review</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">
                {reportData.alerts.filter(a => a.status === 'reviewing').length}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Resolved</span>
              </div>
              <span className="text-sm font-bold text-green-600">
                {reportData.alerts.filter(a => a.status === 'resolved').length}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Leave Requests</span>
              </div>
              <span className="text-sm font-bold text-blue-600">
                {reportData.leaves.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Participation Records</h3>
            <p className="text-sm text-gray-600 mb-3">
              Export detailed participation data with grades and timestamps.
            </p>
            <div className="space-x-2">
              <button 
                onClick={() => { setReportType('participation'); handleGenerateReport('csv'); }}
                className="btn-secondary text-xs"
              >
                CSV
              </button>
              <button 
                onClick={() => { setReportType('participation'); handleGenerateReport('pdf'); }}
                className="btn-secondary text-xs"
              >
                PDF
              </button>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Student Alerts</h3>
            <p className="text-sm text-gray-600 mb-3">
              Export all student alerts with priority levels and status.
            </p>
            <div className="space-x-2">
              <button 
                onClick={() => { setReportType('alerts'); handleGenerateReport('csv'); }}
                className="btn-secondary text-xs"
              >
                CSV
              </button>
              <button 
                onClick={() => { setReportType('alerts'); handleGenerateReport('pdf'); }}
                className="btn-secondary text-xs"
              >
                PDF
              </button>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Leave Records</h3>
            <p className="text-sm text-gray-600 mb-3">
              Export student leave records with dates and reasons.
            </p>
            <div className="space-x-2">
              <button 
                onClick={() => { setReportType('leaves'); handleGenerateReport('csv'); }}
                className="btn-secondary text-xs"
              >
                CSV
              </button>
              <button 
                onClick={() => { setReportType('leaves'); handleGenerateReport('pdf'); }}
                className="btn-secondary text-xs"
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}