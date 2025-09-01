'use client';

import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import Layout from '@/components/Layout';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import StaffDashboard from '@/components/dashboards/StaffDashboard';
import StudentDashboard from '@/components/dashboards/StudentDashboard';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const getDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'staff':
        return <StaffDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return <div>Invalid user role</div>;
    }
  };

  return (
    <Layout>
      {getDashboard()}
    </Layout>
  );
}