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
  GraduationCap
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
  const { isAdmin, isStaff } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchStudents();
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
            onClick={() => setShowAddModal(true)}
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
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <Eye className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                      <Edit className="h-4 w-4" />
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
                <button className="flex-1 bg-blue-50 text-blue-600 text-xs py-2 rounded-md hover:bg-blue-100 transition-colors">
                  View Records
                </button>
                <button className="flex-1 bg-orange-50 text-orange-600 text-xs py-2 rounded-md hover:bg-orange-100 transition-colors">
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
        </div>
      </Layout>
    </RouteGuard>
  );
}