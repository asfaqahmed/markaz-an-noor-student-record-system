'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Calendar,
  AlertTriangle,
  User,
  Mail,
  GraduationCap,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import RouteGuard from '@/components/RouteGuard';

interface Student {
  id: string;
  user_id: string;
  class: string;
  joined_at: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function StudentsPage() {
  const { isAdmin, isStaff, user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    class: '',
    joined_at: new Date().toISOString().split('T')[0]
  });
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [participationRecords, setParticipationRecords] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [alertForm, setAlertForm] = useState({
    comment: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  useEffect(() => {
    fetchStudents();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, selectedClass]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await db.getStudents();
      
      if (error) {
        console.error('Error fetching students:', error);
        return;
      }
      
      if (data) {
        setStudents(data);
        setFilteredStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await db.getUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTeachersAndActivities = async () => {
    try {
      const [teachersResult, activitiesResult] = await Promise.all([
        db.getTeachers(),
        db.getActivities()
      ]);
      setTeachers(teachersResult.data || []);
      setActivities(activitiesResult.data || []);
    } catch (error) {
      console.error('Error fetching teachers and activities:', error);
    }
  };

  const handleViewRecords = async (student: Student) => {
    setSelectedStudent(student);
    try {
      const { data } = await db.getParticipationRecords({ studentId: student.id });
      setParticipationRecords(data || []);
      setShowRecordsModal(true);
    } catch (error) {
      console.error('Error fetching participation records:', error);
      alert('Error fetching student records');
    }
  };

  const handleAddAlert = (student: Student) => {
    setSelectedStudent(student);
    setAlertForm({ comment: '', priority: 'medium' });
    if (teachers.length === 0) {
      fetchTeachersAndActivities();
    }
    setShowAlertModal(true);
  };

  const submitAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      let teacherId = '';
      
      // Find current user's teacher record
      const currentTeacher = teachers.find(t => t.user_id === user?.id);
      if (currentTeacher) {
        teacherId = currentTeacher.id;
      } else {
        alert('Error: Could not find teacher record');
        return;
      }

      const result = await db.createAlert({
        student_id: selectedStudent.id,
        teacher_id: teacherId,
        comment: alertForm.comment,
        priority: alertForm.priority
      });

      if (result?.error) {
        throw result.error;
      }

      setShowAlertModal(false);
      setSelectedStudent(null);
      setAlertForm({ comment: '', priority: 'medium' });
      alert('Alert created successfully!');
    } catch (error: any) {
      console.error('Error creating alert:', error);
      alert(`Error creating alert: ${error.message || 'Something went wrong'}`);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.class.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedClass) {
      filtered = filtered.filter(student => student.class === selectedClass);
    }

    setFilteredStudents(filtered);
  };

  const openModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        user_id: student.user_id,
        class: student.class,
        joined_at: student.joined_at.split('T')[0]
      });
    } else {
      setEditingStudent(null);
      setFormData({
        user_id: '',
        class: '',
        joined_at: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let result;
      
      if (editingStudent) {
        result = await db.updateStudent(editingStudent.id, {
          class: formData.class,
          joined_at: formData.joined_at
        });
      } else {
        result = await db.createStudent(formData);
      }

      if (result?.error) {
        throw result.error;
      }

      closeModal();
      fetchStudents();
      alert(`Student ${editingStudent ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
      console.error('Error saving student:', error);
      alert(`Error ${editingStudent ? 'updating' : 'creating'} student: ${error.message || 'Something went wrong'}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await db.deleteStudent(id);
      if (result?.error) {
        throw result.error;
      }
      fetchStudents();
      alert('Student deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting student:', error);
      alert(`Error deleting student: ${error.message || 'Something went wrong'}`);
    }
  };

  const uniqueClasses = [...new Set(students.map(s => s.class))].sort();

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
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">Manage student profiles and information</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="form-select pl-10"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {filteredStudents.length} of {students.length} students
          </div>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-islamic-emerald/10 rounded-full p-3">
                  <User className="h-6 w-6 text-islamic-emerald" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {student.user?.name || 'Unknown Student'}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {student.user?.email || 'No email'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <GraduationCap className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{student.class}</span>
                  </div>
                </div>
              </div>
              {(isAdmin || isStaff) && (
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => openModal(student)}
                    className="p-1 text-blue-400 hover:text-blue-600 rounded"
                    title="Edit Student"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(student.id, student.user?.name || 'Student')}
                      className="p-1 text-red-400 hover:text-red-600 rounded"
                      title="Delete Student"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Joined: {format(new Date(student.joined_at), 'MMM dd, yyyy')}</span>
                <span>ID: {student.id.slice(0, 8)}...</span>
              </div>
            </div>
            
            {(isAdmin || isStaff) && (
              <div className="mt-3 flex space-x-2">
                <button 
                  onClick={() => handleViewRecords(student)}
                  className="flex-1 bg-blue-50 text-blue-600 text-xs py-2 rounded-md hover:bg-blue-100 transition-colors"
                >
                  View Records
                </button>
                <button 
                  onClick={() => handleAddAlert(student)}
                  className="flex-1 bg-orange-50 text-orange-600 text-xs py-2 rounded-md hover:bg-orange-100 transition-colors"
                >
                  Add Alert
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500">
            {searchQuery || selectedClass 
              ? "Try adjusting your search or filter criteria."
              : "No students have been added to the system yet."
            }
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{students.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Classes</p>
              <p className="text-2xl font-bold text-green-900">{uniqueClasses.length}</p>
            </div>
            <GraduationCap className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">This Month</p>
              <p className="text-2xl font-bold text-yellow-900">
                {students.filter(s => 
                  new Date(s.created_at).getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Recent</p>
              <p className="text-2xl font-bold text-red-900">
                {students.filter(s => 
                  new Date().getTime() - new Date(s.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
                ).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

        {/* Add/Edit Student Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User
                    </label>
                    <select
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      className="form-select"
                      required
                      disabled={!!editingStudent}
                    >
                      <option value="">Select a user</option>
                      {users.filter(u => u.role === 'student').map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class
                    </label>
                    <input
                      type="text"
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      className="form-input"
                      required
                      placeholder="e.g., Grade 5A, Hifz-1"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Joined Date
                    </label>
                    <input
                      type="date"
                      value={formData.joined_at}
                      onChange={(e) => setFormData({ ...formData, joined_at: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Records Modal */}
        {showRecordsModal && selectedStudent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-5/6 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Participation Records - {selectedStudent.user?.name}
                  </h3>
                  <button
                    onClick={() => setShowRecordsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {participationRecords.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participationRecords.map((record) => (
                          <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(record.date), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.activity?.code || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record.grade === 'A' ? 'bg-green-100 text-green-800' :
                                record.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                record.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {record.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.teacher?.user?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {record.remarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No participation records found for this student.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Alert Modal */}
        {showAlertModal && selectedStudent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Add Alert - {selectedStudent.user?.name}
                  </h3>
                  <button
                    onClick={() => setShowAlertModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={submitAlert}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={alertForm.priority}
                      onChange={(e) => setAlertForm({ ...alertForm, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                      className="form-select"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment
                    </label>
                    <textarea
                      value={alertForm.comment}
                      onChange={(e) => setAlertForm({ ...alertForm, comment: e.target.value })}
                      className="form-input"
                      rows={4}
                      required
                      placeholder="Describe the issue or concern..."
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAlertModal(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Create Alert
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        </div>
      </Layout>
    </RouteGuard>
  );
}