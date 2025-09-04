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
  Download
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { exportToPDF, prepareAlertsDataForExport } from '@/utils/export';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, selectedStatus, selectedPriority, selectedClass]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsResult, studentsResult] = await Promise.all([
        db.getAlerts(),
        db.getStudents()
      ]);

      if (alertsResult.data) setAlerts(alertsResult.data);
      if (studentsResult.data) setStudents(studentsResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
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

  const uniqueClasses = [...new Set(students.map(s => s.class))].sort();
  const statusStats = {
    open: filteredAlerts.filter(a => a.status === 'open').length,
    reviewing: filteredAlerts.filter(a => a.status === 'reviewing').length,
    resolved: filteredAlerts.filter(a => a.status === 'resolved').length,
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Alerts</h1>
          <p className="text-gray-600">Monitor and manage student behavioral concerns</p>
        </div>
        <div className="flex space-x-3">
          {(isAdmin || isStaff) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Alert</span>
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
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
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
                {[...new Set(filteredAlerts.map(a => a.student_id))].length}
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
    </div>
  );
}