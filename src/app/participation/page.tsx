'use client';

import { useState, useEffect, useCallback } from 'react';
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
  BarChart3,
  Trash2,
  Save,
  X,
  Edit,
  Plus
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
  const { isAdmin, isStaff, user } = useAuth();
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
  const [teachers, setTeachers] = useState<any[]>([]);
  
  // Modal and form state
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ParticipationRecord | null>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    teacher_id: '',
    activity_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    grade: 'A' as 'A' | 'B' | 'C' | 'D',
    remarks: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = useCallback(async () => {
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
  }, [dateFrom, dateTo]);

  const fetchTeachers = useCallback(async () => {
    try {
      const result = await db.getTeachers();
      if (result.data) {
        setTeachers(result.data);
        
        // If user is staff, set their teacher_id as default
        if (isStaff && user && result.data.length > 0) {
          const currentTeacher = result.data.find(t => t.user_id === user.id);
          if (currentTeacher) {
            setFormData(prev => ({ ...prev, teacher_id: currentTeacher.id }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  }, [isStaff, user]);

  const openModal = (record?: ParticipationRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        student_id: record.student_id,
        teacher_id: record.teacher_id,
        activity_id: record.activity_id,
        date: format(new Date(record.date), 'yyyy-MM-dd'),
        grade: record.grade,
        remarks: record.remarks || ''
      });
    } else {
      setEditingRecord(null);
      setFormData({
        student_id: '',
        teacher_id: isStaff && user && teachers.length > 0 ? 
          (teachers.find(t => t.user_id === user.id)?.id || '') : '',
        activity_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        grade: 'A',
        remarks: ''
      });
    }
    setShowModal(true);
    setMessage(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRecord(null);
    setFormData({
      student_id: '',
      teacher_id: isStaff && user && teachers.length > 0 ? 
        (teachers.find(t => t.user_id === user.id)?.id || '') : '',
      activity_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      grade: 'A',
      remarks: ''
    });
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.teacher_id || !formData.activity_id || !formData.date) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      if (editingRecord) {
        const result = await db.updateParticipationRecord(editingRecord.id, formData);
        if (result.error) {
          throw new Error(result.error.message);
        }
        setMessage({ type: 'success', text: 'Participation record updated successfully!' });
      } else {
        const result = await db.createParticipationRecord(formData);
        if (result.error) {
          throw new Error(result.error.message);
        }
        setMessage({ type: 'success', text: 'Participation record created successfully!' });
      }

      // Refresh data
      await fetchData();
      
      // Close modal after a brief delay
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (error: any) {
      console.error('Error saving participation record:', error);
      setMessage({ type: 'error', text: error.message || 'Error saving record. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to delete the participation record for ${studentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await db.deleteParticipationRecord(id);
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Refresh data
      await fetchData();
      alert('Participation record deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting participation record:', error);
      alert(error.message || 'Error deleting record. Please try again.');
    }
  };

  const filterRecords = useCallback(() => {
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
  }, [records, selectedClass, selectedGrade, selectedActivity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    filterRecords();
  }, [filterRecords]);

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

  const uniqueClasses = Array.from(new Set(students.map(s => s.class))).sort();
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
        <div className="flex items-center space-x-3">
          {(isAdmin || isStaff) && (
            <button
              onClick={() => openModal()}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Record</span>
            </button>
          )}
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
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
                  {(isAdmin || isStaff) && <th className="text-right">Actions</th>}
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
                      {(isAdmin || isStaff) && (
                        <td className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openModal(record)}
                              className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                              title="Edit record"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id, record.student.user?.name || 'Unknown Student')}
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
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
                {Array.from(new Set(filteredRecords.map(r => r.student_id))).length}
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
                {Array.from(new Set(filteredRecords.map(r => r.activity_id))).length}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRecord ? 'Edit Participation Record' : 'Add New Participation Record'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user?.name} - {student.class}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    className="form-select"
                    required
                    disabled={isStaff && !isAdmin}
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.user?.name}
                      </option>
                    ))}
                  </select>
                  {isStaff && !isAdmin && (
                    <p className="text-xs text-gray-500 mt-1">
                      Staff members can only create records for themselves
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.activity_id}
                    onChange={(e) => setFormData({ ...formData, activity_id: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="">Select an activity</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.code} - {activity.description.split(' - ')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                    className="form-select"
                    required
                  >
                    <option value="A">A - Did properly</option>
                    <option value="B">B - Attended</option>
                    <option value="C">C - Late</option>
                    <option value="D">D - Unattended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="form-textarea"
                    rows={3}
                    placeholder="Optional remarks or notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                  disabled={submitting}
                >
                  <Save className="h-4 w-4" />
                  <span>{submitting ? 'Saving...' : (editingRecord ? 'Update' : 'Create')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </Layout>
    </RouteGuard>
  );
}