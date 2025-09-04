'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus,
  Eye,
  CheckCircle,
  Clock,
  Filter,
  User,
  Calendar,
  MessageSquare,
  Users,
  Download,
  Trash2,
  Save,
  X,
  Edit
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { exportToPDF, prepareAlertsDataForExport } from '@/utils/export';
import Layout from '@/components/Layout';
import RouteGuard from '@/components/RouteGuard';

interface Alert {
  id: string;
  student_id: string;
  teacher_id: string;
  comment: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'reviewing' | 'resolved';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
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
}

export default function AlertsPage() {
  const { isAdmin, isStaff, user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    teacher_id: '',
    comment: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, selectedStatus, selectedPriority, selectedClass]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsResult, studentsResult, teachersResult] = await Promise.all([
        db.getAlerts(),
        db.getStudents(),
        db.getTeachers()
      ]);

      if (alertsResult.data) setAlerts(alertsResult.data);
      if (studentsResult.data) setStudents(studentsResult.data);
      if (teachersResult.data) setTeachers(teachersResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Error loading data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;

    if (selectedStatus) {
      filtered = filtered.filter(alert => alert.status === selectedStatus);
    }

    if (selectedPriority) {
      filtered = filtered.filter(alert => alert.priority === selectedPriority);
    }

    if (selectedClass) {
      filtered = filtered.filter(alert => alert.student.class === selectedClass);
    }

    setFilteredAlerts(filtered);
  };

  const openModal = (alert?: Alert) => {
    if (alert) {
      setEditingAlert(alert);
      setFormData({
        student_id: alert.student_id,
        teacher_id: alert.teacher_id,
        comment: alert.comment,
        priority: alert.priority
      });
    } else {
      setEditingAlert(null);
      // For staff users, try to find their teacher ID
      let teacherId = '';
      if (user?.role === 'staff' && teachers.length > 0) {
        const userTeacher = teachers.find(t => t.user?.email === user.email);
        teacherId = userTeacher?.id || '';
      }
      setFormData({
        student_id: '',
        teacher_id: teacherId,
        comment: '',
        priority: 'medium'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAlert(null);
    setFormData({
      student_id: '',
      teacher_id: '',
      comment: '',
      priority: 'medium'
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.teacher_id || !formData.comment.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    try {
      if (editingAlert) {
        // For editing, update the alert fields
        await db.updateAlert(editingAlert.id, {
          student_id: formData.student_id,
          teacher_id: formData.teacher_id,
          comment: formData.comment,
          priority: formData.priority,
        });
        setSuccessMessage('Alert updated successfully!');
      } else {
        await db.createAlert(formData);
        setSuccessMessage('Alert created successfully!');
      }
      
      await fetchData();
      setTimeout(() => {
        closeModal();
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error saving alert:', error);
      setErrorMessage('Error saving alert. Please try again.');
    }
  };

  const handleDelete = async (id: string, studentName: string) => {
    if (!isAdmin) {
      setErrorMessage('Only administrators can delete alerts.');
      return;
    }

    if (confirm(`Are you sure you want to delete this alert for ${studentName}? This action cannot be undone.`)) {
      try {
        await db.deleteAlert(id);
        setSuccessMessage('Alert deleted successfully!');
        await fetchData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting alert:', error);
        setErrorMessage('Error deleting alert. Please try again.');
      }
    }
  };

  const handleUpdateStatus = async (alertId: string, status: 'open' | 'reviewing' | 'resolved') => {
    try {
      const updates: any = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user?.id;
      }

      await db.updateAlert(alertId, updates);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating alert:', error);
      alert('Error updating alert. Please try again.');
    }
  };

  const handleExport = async () => {
    if (filteredAlerts.length === 0) {
      alert('No alerts to export.');
      return;
    }

    try {
      const exportData = prepareAlertsDataForExport(filteredAlerts);
      exportToPDF(exportData, 'Student Alerts Report', 'student_alerts');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'reviewing': return 'text-yellow-600 bg-yellow-50';
      case 'open': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return CheckCircle;
      case 'reviewing': return Clock;
      case 'open': return AlertTriangle;
      default: return Clock;
    }
  };

  const uniqueClasses = Array.from(new Set(students.map(s => s.class))).sort();
  const statusStats = {
    open: filteredAlerts.filter(a => a.status === 'open').length,
    reviewing: filteredAlerts.filter(a => a.status === 'reviewing').length,
    resolved: filteredAlerts.filter(a => a.status === 'resolved').length,
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
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Alerts</h1>
          <p className="text-gray-600">Monitor and manage student behavioral concerns</p>
        </div>
        <div className="flex space-x-3">
          {(isAdmin || isStaff) && (
            <button
              onClick={() => openModal()}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Alert</span>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-select"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="form-select"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
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
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredAlerts.length}</span> alerts found
            </div>
          </div>
        </div>
      </div>

      {/* Status Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(statusStats).map(([status, count]) => {
          const IconComponent = getStatusIcon(status);
          return (
            <div key={status} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{status} Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className={`p-3 rounded-lg ${getStatusColor(status)}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const StatusIcon = getStatusIcon(alert.status);
            return (
              <div key={alert.id} className={`card border-l-4 hover:shadow-md transition-shadow ${
                alert.priority === 'urgent' ? 'border-l-red-500' :
                alert.priority === 'high' ? 'border-l-orange-500' :
                alert.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {alert.student.user?.name || 'Unknown Student'}
                        </h3>
                        <p className="text-sm text-gray-500">{alert.student.class}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(alert.priority)}`}>
                          {alert.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-gray-700">{alert.comment}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(alert.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>By: {alert.teacher.user?.name || 'Unknown Teacher'}</span>
                        </div>
                      </div>
                      {alert.resolved_at && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Resolved {format(new Date(alert.resolved_at), 'MMM dd')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {(isAdmin || isStaff) && (
                    <div className="flex items-center space-x-2 ml-4 flex-wrap">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {/* Edit button - for assigned teacher or admin */}
                      {(isAdmin || (isStaff && teachers.find(t => t.id === alert.teacher_id && t.user?.email === user?.email))) && (
                        <button
                          onClick={() => openModal(alert)}
                          className="p-2 text-blue-400 hover:text-blue-600 rounded"
                          title="Edit alert"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Delete button - admin only */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(alert.id, alert.student.user?.name || 'Unknown Student')}
                          className="p-2 text-red-400 hover:text-red-600 rounded"
                          title="Delete alert"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      
                      {alert.status === 'open' && (
                        <button
                          onClick={() => handleUpdateStatus(alert.id, 'reviewing')}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-md hover:bg-yellow-200 transition-colors"
                        >
                          Mark Reviewing
                        </button>
                      )}
                      
                      {alert.status === 'reviewing' && (
                        <button
                          onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                          className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-md hover:bg-green-200 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                      
                      {alert.status === 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(alert.id, 'open')}
                          className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 transition-colors"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="card text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-500">
              {selectedStatus || selectedPriority || selectedClass
                ? "No alerts match your current filter criteria."
                : "No alerts have been created yet."
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Urgent Alerts</p>
              <p className="text-2xl font-bold text-red-900">
                {filteredAlerts.filter(a => a.priority === 'urgent').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Students with Alerts</p>
              <p className="text-2xl font-bold text-blue-900">
                {Array.from(new Set(filteredAlerts.map(a => a.student_id))).length}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Resolution Rate</p>
              <p className="text-2xl font-bold text-green-900">
                {alerts.length > 0 ? Math.round((statusStats.resolved / alerts.length) * 100) : 0}%
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Avg. Response Time</p>
              <p className="text-2xl font-bold text-purple-900">2.5d</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

        {/* Alert Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingAlert ? 'Edit Alert' : 'Create New Alert'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Student Selection */}
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
                        {student.user?.name} ({student.class})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Teacher Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    className="form-select"
                    required
                    disabled={user?.role === 'staff'}
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.user?.name}
                      </option>
                    ))}
                  </select>
                  {user?.role === 'staff' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Your teacher account is pre-selected
                    </p>
                  )}
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                    className="form-select"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comment <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    rows={4}
                    className="form-textarea"
                    placeholder="Describe the behavioral concern or issue..."
                    required
                  />
                </div>

                {/* Success/Error Messages in Modal */}
                {successMessage && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                    {errorMessage}
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingAlert ? 'Update' : 'Create'} Alert</span>
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