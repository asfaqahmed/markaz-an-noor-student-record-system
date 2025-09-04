'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Clock,
  Users,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import RouteGuard from '@/components/RouteGuard';

interface Activity {
  id: string;
  code: string;
  description: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export default function ActivitiesPage() {
  const { isAdmin } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, searchQuery]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await db.getActivities();
      
      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }
      
      if (data) {
        setActivities(data);
        setFilteredActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  };

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(`2000-01-01 ${timeString}`), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const getActivityIcon = (code: string) => {
    if (code.includes('Prayer') || code.includes('Fajr') || code.includes('Maghrib') || code.includes('Isha')) {
      return '🕌';
    }
    if (code.includes('Quran') || code.includes('Recitation')) {
      return '📖';
    }
    if (code.includes('Breakfast') || code.includes('Lunch')) {
      return '🍽️';
    }
    if (code.includes('Play') || code.includes('Break')) {
      return '⚽';
    }
    if (code.includes('Classes') || code.includes('Academic')) {
      return '📚';
    }
    if (code.includes('Homework') || code.includes('Review')) {
      return '✍️';
    }
    return '📅';
  };

  const getTimeCategory = (startTime: string) => {
    const hour = parseInt(startTime.split(':')[0]);
    if (hour >= 4 && hour < 8) return 'Early Morning';
    if (hour >= 8 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
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
          <h1 className="text-3xl font-bold text-gray-900">Islamic Daily Activities</h1>
          <p className="text-gray-600">Manage structured Islamic education activities</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Activity</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities by code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            {filteredActivities.length} activities
          </div>
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Islamic Schedule</h2>
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-islamic-emerald/10 rounded-full flex items-center justify-center text-lg">
                  {getActivityIcon(activity.description)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-islamic-emerald bg-islamic-emerald/10 px-2 py-1 rounded text-sm">
                    {activity.code}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    {getTimeCategory(activity.start_time)}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">
                  {activity.description.split(' - ')[0]}
                </h3>
                {activity.description.includes(' - ') && (
                  <p className="text-sm text-gray-600">
                    {activity.description.split(' - ')[1]}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(activity.start_time)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Duration: {(() => {
                    const start = new Date(`2000-01-01 ${activity.start_time}`);
                    const end = new Date(`2000-01-01 ${activity.end_time}`);
                    const diff = Math.abs(end.getTime() - start.getTime());
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                  })()}
                </div>
              </div>

              {isAdmin && (
                <div className="flex-shrink-0">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
          <p className="text-gray-500">
            {searchQuery 
              ? "Try adjusting your search criteria."
              : "No activities have been configured yet."
            }
          </p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Activities</p>
              <p className="text-2xl font-bold text-green-900">{activities.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Prayer Times</p>
              <p className="text-2xl font-bold text-blue-900">
                {activities.filter(a => 
                  a.description.toLowerCase().includes('prayer') || 
                  a.description.toLowerCase().includes('fajr') ||
                  a.description.toLowerCase().includes('maghrib') ||
                  a.description.toLowerCase().includes('isha')
                ).length}
              </p>
            </div>
            <span className="text-2xl">🕌</span>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Academic</p>
              <p className="text-2xl font-bold text-purple-900">
                {activities.filter(a => 
                  a.description.toLowerCase().includes('class') ||
                  a.description.toLowerCase().includes('academic') ||
                  a.description.toLowerCase().includes('homework')
                ).length}
              </p>
            </div>
            <span className="text-2xl">📚</span>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Daily Hours</p>
              <p className="text-2xl font-bold text-orange-900">
                {activities.reduce((total, activity) => {
                  const start = new Date(`2000-01-01 ${activity.start_time}`);
                  const end = new Date(`2000-01-01 ${activity.end_time}`);
                  const diff = Math.abs(end.getTime() - start.getTime());
                  return total + (diff / (1000 * 60 * 60));
                }, 0).toFixed(1)}h
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>
        </div>
      </Layout>
    </RouteGuard>
  );
}