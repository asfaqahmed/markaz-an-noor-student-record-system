import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import AdminDashboard from './components/dashboard/AdminDashboard';
import StaffDashboard from './components/dashboard/StaffDashboard';
import StudentDashboard from './components/dashboard/StudentDashboard';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const getDashboardComponent = () => {
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
      <Routes>
        <Route path="/" element={getDashboardComponent()} />
        <Route path="*" element={getDashboardComponent()} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;