'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Filter,
  Download,
  BarChart3
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { exportToCSV, prepareParticipationDataForExport } from '@/utils/export';
import Layout from '@/components/Layout';
import RouteGuard from '@/components/RouteGuard';

interface ParticipationRecord {
  id: string;
  student_id: string;
  teacher_id: string;
  activity_id: string;
  date: string;
  grade: 'A' | 'B' | 'C' | 'D';
  remarks?: string;
  created_at: string;
  student: {
    id: string;
    class: string;
    user: {
      name: string;
      email: string;
    };
  };
  teacher: {
    id: string;
    user: {
      name: string;
    };
  };
  activity: {
    id: string;
    code: string;
    description: string;
  };
}

export default function ParticipationPage() {
  const { isAdmin, isStaff } = useAuth();
  const [records, setRecords] = useState<ParticipationRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ParticipationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    filterRecords();
  }, [records, selectedClass, selectedGrade, selectedActivity]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsResult, studentsResult, activitiesResult] = await Promise.all([
        db.getParticipationRecords({ dateFrom, dateTo }),
        db.getStudents(),
        db.getActivities()
      ]);

      if (recordsResult.data) setRecords(recordsResult.data);
      if (studentsResult.data) setStudents(studentsResult.data);
      if (activitiesResult.data) setActivities(activitiesResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    if (selectedClass) {
      filtered = filtered.filter(record => record.student.class === selectedClass);
    }

    if (selectedGrade) {
      filtered = filtered.filter(record => record.grade === selectedGrade);
    }

    if (selectedActivity) {
      filtered = filtered.filter(record => record.activity_id === selectedActivity);
    }

    setFilteredRecords(filtered);
  };

  const handleExport = async () => {
    if (filteredRecords.length === 0) {
      alert('No records to export.');
      return;
    }

    try {
      const exportData = prepareParticipationDataForExport(filteredRecords);
      exportToCSV(exportData, 'participation_records');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
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

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50';
      case 'B': return 'text-blue-600 bg-blue-50';
      case 'C': return 'text-yellow-600 bg-yellow-50';
      case 'D': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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

  const uniqueClasses = [...new Set(students.map(s => s.class))].sort();
  const gradeStats = {
    A: filteredRecords.filter(r => r.grade === 'A').length,
    B: filteredRecords.filter(r => r.grade === 'B').length,
    C: filteredRecords.filter(r => r.grade === 'C').length,
    D: filteredRecords.filter(r => r.grade === 'D').length,
  };

  if (loading) {
    return (
      <RouteGuard>
        <Layout>
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Participation Records</h1>
          <p className="text-gray-600">View and analyze student participation data</p>
        </div>
        <button
          onClick={handleExport}
          className="btn-primary flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export Records</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="form-select"
            >
              <option value="">All Grades</option>
              <option value="A">A - Did properly</option>
              <option value="B">B - Attended</option>
              <option value="C">C - Late</option>
              <option value="D">D - Unattended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="form-select"
            >
              <option value="">All Activities</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.code} - {activity.description.split(' - ')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>{filteredRecords.length} records found</span>
          <div className="flex items-center space-x-4">
            <span>Date range: {format(new Date(dateFrom), 'MMM dd')} - {format(new Date(dateTo), 'MMM dd')}</span>
          </div>
        </div>
      </div>

      {/* Grade Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(gradeStats).map(([grade, count]) => {
          const IconComponent = getGradeIcon(grade);
          const percentage = filteredRecords.length > 0 ? Math.round((count / filteredRecords.length) * 100) : 0;
          return (
            <div key={grade} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Grade {grade}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">{percentage}%</p>
                </div>
                <div className={`p-3 rounded-lg ${getGradeColor(grade)}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Records Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Participation Records</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <BarChart3 className="h-4 w-4" />
            <span>Showing {filteredRecords.length} records</span>
          </div>
        </div>

        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Activity</th>
                  <th>Grade</th>
                  <th>Teacher</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => {
                  const IconComponent = getGradeIcon(record.grade);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="text-sm">
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0 h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-gray-600" />
                          </div>
                          <span className="font-medium text-sm">{record.student.user?.name || 'Unknown Student'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-gray-100 text-gray-800">
                          {record.student.class}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium text-sm">{record.activity.code}</div>
                          <div className="text-xs text-gray-500 truncate max-w-32">
                            {record.activity.description.split(' - ')[0]}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${getGradeColor(record.grade)}`}>
                          <IconComponent className="h-3 w-3" />
                          <span className="text-xs font-medium">{record.grade}</span>
                          <span className="text-xs">({getGradeDescription(record.grade)})</span>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">
                        {record.teacher.user?.name || 'Unknown Teacher'}
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
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-500">
              No participation records match your current filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-islamic-emerald/5 border border-islamic-emerald/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-islamic-emerald">Total Records</p>
              <p className="text-2xl font-bold text-islamic-emerald">{filteredRecords.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-islamic-emerald" />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Unique Students</p>
              <p className="text-2xl font-bold text-blue-900">
                {[...new Set(filteredRecords.map(r => r.student_id))].length}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Activities Covered</p>
              <p className="text-2xl font-bold text-green-900">
                {[...new Set(filteredRecords.map(r => r.activity_id))].length}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>
        </div>
      </Layout>
    </RouteGuard>
  );
}