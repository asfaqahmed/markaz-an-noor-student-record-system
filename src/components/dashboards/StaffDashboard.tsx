'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  AlertTriangle, 
  Calendar,
  Plus,
  Save,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Student {
  id: string;
  user_id: string;
  class: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Activity {
  id: string;
  code: string;
  description: string;
  start_time: string;
  end_time: string;
}

interface ParticipationRecord {
  student_id: string;
  activity_id: string;
  grade: 'A' | 'B' | 'C' | 'D';
  remarks?: string;
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [teacher, setTeacher] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [participationRecords, setParticipationRecords] = useState<Record<string, ParticipationRecord>>({});
  const [newAlert, setNewAlert] = useState({ studentId: '', comment: '', priority: 'medium' });
  const [newLeave, setNewLeave] = useState({ studentId: '', reason: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('grading');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      if (!user) return;

      const [studentsResult, activitiesResult, teacherResult] = await Promise.all([
        db.getStudents(),
        db.getActivities(),
        db.getTeacherByUserId(user.id)
      ]);

      if (studentsResult.data) setStudents(studentsResult.data);
      if (activitiesResult.data) setActivities(activitiesResult.data);
      if (teacherResult.data) setTeacher(teacherResult.data);

      // Load existing records for selected date
      if (teacherResult.data) {
        const recordsResult = await db.getParticipationRecords({
          teacherId: teacherResult.data.id,
          dateFrom: selectedDate,
          dateTo: selectedDate
        });

        if (recordsResult.data) {
          const recordsMap: Record<string, ParticipationRecord> = {};
          recordsResult.data.forEach(record => {
            const key = `${record.student_id}-${record.activity_id}`;
            recordsMap[key] = {
              student_id: record.student_id,
              activity_id: record.activity_id,
              grade: record.grade,
              remarks: record.remarks || undefined
            };
          });
          setParticipationRecords(recordsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId: string, activityId: string, grade: 'A' | 'B' | 'C' | 'D') => {
    const key = `${studentId}-${activityId}`;
    setParticipationRecords(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        student_id: studentId,
        activity_id: activityId,
        grade
      }
    }));
  };

  const handleRemarksChange = (studentId: string, activityId: string, remarks: string) => {
    const key = `${studentId}-${activityId}`;
    setParticipationRecords(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        student_id: studentId,
        activity_id: activityId,
        grade: prev[key]?.grade || 'B',
        remarks
      }
    }));
  };

  const handleSaveGrades = async () => {
    if (!teacher) return;

    setSaving(true);
    try {
      const promises = Object.values(participationRecords).map(record => {
        if (record.grade) {
          return db.createParticipationRecord({
            student_id: record.student_id,
            teacher_id: teacher.id,
            activity_id: record.activity_id,
            date: selectedDate,
            grade: record.grade,
            remarks: record.remarks
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      alert('Participation records saved successfully!');
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Error saving records. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!teacher || !newAlert.studentId || !newAlert.comment) return;

    try {
      await db.createAlert({
        student_id: newAlert.studentId,
        teacher_id: teacher.id,
        comment: newAlert.comment,
        priority: newAlert.priority as 'low' | 'medium' | 'high' | 'urgent'
      });

      setNewAlert({ studentId: '', comment: '', priority: 'medium' });
      alert('Alert created successfully!');
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Error creating alert. Please try again.');
    }
  };

  const handleCreateLeave = async () => {
    if (!newLeave.studentId) return;

    try {
      await db.createLeave({
        student_id: newLeave.studentId,
        date: selectedDate,
        reason: newLeave.reason
      });

      setNewLeave({ studentId: '', reason: '' });
      alert('Leave record created successfully!');
    } catch (error) {
      console.error('Error creating leave:', error);
      alert('Error creating leave. Please try again.');
    }
  };

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

  const getGradeColor = (grade: 'A' | 'B' | 'C' | 'D') => {
    switch (grade) {
      case 'A': return 'bg-green-500 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'C': return 'bg-yellow-500 text-white';
      case 'D': return 'bg-red-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600">Daily participation tracking for {teacher?.assigned_class}</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {['grading', 'alerts', 'leaves'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-white text-islamic-emerald shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Grading Tab */}
      {activeTab === 'grading' && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Daily Participation Grading</h2>
            <button
              onClick={handleSaveGrades}
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Grades'}</span>
            </button>
          </div>

          {/* Grade Legend */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Grade System:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center text-xs font-bold">A</span>
                <span>Did properly</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded flex items-center justify-center text-xs font-bold">B</span>
                <span>Attended</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-yellow-500 text-white rounded flex items-center justify-center text-xs font-bold">C</span>
                <span>Late</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center text-xs font-bold">D</span>
                <span>Unattended</span>
              </div>
            </div>
          </div>

          {/* Grading Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  {activities.slice(0, 5).map((activity) => (
                    <th key={activity.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col items-center">
                        <span className="font-bold">{activity.code}</span>
                        <span className="text-xs font-normal normal-case text-gray-400 truncate max-w-20">
                          {activity.description.split(' - ')[0]}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.slice(0, 10).map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {student.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.class}
                          </div>
                        </div>
                      </div>
                    </td>
                    {activities.slice(0, 5).map((activity) => {
                      const key = `${student.id}-${activity.id}`;
                      const record = participationRecords[key];
                      return (
                        <td key={activity.id} className="px-3 py-4 text-center">
                          <div className="flex space-x-1 justify-center">
                            {(['A', 'B', 'C', 'D'] as const).map((grade) => (
                              <button
                                key={grade}
                                onClick={() => handleGradeChange(student.id, activity.id, grade)}
                                className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                                  record?.grade === grade
                                    ? getGradeColor(grade)
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                {grade}
                              </button>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="Optional remarks..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-islamic-emerald focus:border-islamic-emerald"
                        value={Object.values(participationRecords).find(r => r.student_id === student.id)?.remarks || ''}
                        onChange={(e) => {
                          const activityId = activities[0]?.id;
                          if (activityId) {
                            handleRemarksChange(student.id, activityId, e.target.value);
                          }
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Student Alert</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
              <select
                value={newAlert.studentId}
                onChange={(e) => setNewAlert({...newAlert, studentId: e.target.value})}
                className="form-select"
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.user.name} - {student.class}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={newAlert.priority}
                onChange={(e) => setNewAlert({...newAlert, priority: e.target.value})}
                className="form-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
              <textarea
                value={newAlert.comment}
                onChange={(e) => setNewAlert({...newAlert, comment: e.target.value})}
                placeholder="Describe the concern (e.g., 'Possibility of drug use', 'Behavioral issues during prayer')"
                className="form-input h-24 resize-none"
              />
            </div>
            <button
              onClick={handleCreateAlert}
              className="btn-primary flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Create Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* Leaves Tab */}
      {activeTab === 'leaves' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Record Student Leave</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
              <select
                value={newLeave.studentId}
                onChange={(e) => setNewLeave({...newLeave, studentId: e.target.value})}
                className="form-select"
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.user.name} - {student.class}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
              <input
                type="text"
                value={newLeave.reason}
                onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                placeholder="e.g., Not feeling well, Family visit, Medical appointment"
                className="form-input"
              />
            </div>
            <button
              onClick={handleCreateLeave}
              className="btn-primary flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Record Leave</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}