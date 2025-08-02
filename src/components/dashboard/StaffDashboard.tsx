import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, Users, AlertTriangle, Calendar } from 'lucide-react';

interface Student {
  id: string;
  class: string;
  users: {
    name: string;
  };
}

interface Activity {
  id: string;
  code: string;
  description: string;
  time_slot: string;
}

const StaffDashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [grade, setGrade] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [remarks, setRemarks] = useState('');
  const [alertComment, setAlertComment] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsResult, activitiesResult] = await Promise.all([
        supabase
          .from('students')
          .select('id, class, users!inner(name)')
          .order('users.name'),
        supabase
          .from('activities')
          .select('*')
          .order('code')
      ]);

      if (studentsResult.data) setStudents(studentsResult.data);
      if (activitiesResult.data) setActivities(activitiesResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const submitGrading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedActivity) return;

    setLoading(true);
    try {
      // Get current user's teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      const { error } = await supabase
        .from('grading_records')
        .insert({
          student_id: selectedStudent,
          teacher_id: teacher.id,
          activity_id: selectedActivity,
          grade,
          remarks: remarks || null
        });

      if (error) throw error;

      // Reset form
      setSelectedStudent('');
      setSelectedActivity('');
      setGrade('A');
      setRemarks('');
      
      alert('Grading record added successfully!');
    } catch (error) {
      console.error('Error submitting grading:', error);
      alert('Error submitting grading record');
    } finally {
      setLoading(false);
    }
  };

  const submitAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !alertComment) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!teacher) throw new Error('Teacher not found');

      const { error } = await supabase
        .from('alerts')
        .insert({
          student_id: selectedStudent,
          teacher_id: teacher.id,
          comment: alertComment
        });

      if (error) throw error;

      setAlertComment('');
      setSelectedStudent('');
      alert('Alert submitted successfully!');
    } catch (error) {
      console.error('Error submitting alert:', error);
      alert('Error submitting alert');
    } finally {
      setLoading(false);
    }
  };

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !leaveReason) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('leaves')
        .insert({
          student_id: selectedStudent,
          reason: leaveReason,
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      setLeaveReason('');
      setSelectedStudent('');
      alert('Leave record added successfully!');
    } catch (error) {
      console.error('Error submitting leave:', error);
      alert('Error submitting leave record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grading Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Add Grading Record</h2>
          </div>

          <form onSubmit={submitGrading} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.users.name} - {student.class}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity
              </label>
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select an activity</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.code} - {activity.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as 'A' | 'B' | 'C' | 'D')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="A">A - Excellent</option>
                <option value="B">B - Good</option>
                <option value="C">C - Satisfactory</option>
                <option value="D">D - Needs Improvement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Additional comments..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Grading'}
            </button>
          </form>
        </div>

        {/* Alert Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Submit Alert</h2>
          </div>

          <form onSubmit={submitAlert} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.users.name} - {student.class}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Comment
              </label>
              <textarea
                value={alertComment}
                onChange={(e) => setAlertComment(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                placeholder="Describe the issue or concern..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Alert'}
            </button>
          </form>
        </div>

        {/* Leave Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-6 w-6 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Record Leave</h2>
          </div>

          <form onSubmit={submitLeave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.users.name} - {student.class}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Leave
              </label>
              <textarea
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
                placeholder="Reason for leave..."
                required
              />
            </div>

            <p className="text-sm text-gray-600">
              Leave date will be set to today: {new Date().toLocaleDateString()}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Recording...' : 'Record Leave'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;