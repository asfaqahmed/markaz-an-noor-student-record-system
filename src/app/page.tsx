'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRouteForRole } from '@/lib/auth-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Login from '@/components/Login';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (user) {
      // Redirect authenticated users to their role-specific default route
      const defaultRoute = getDefaultRouteForRole(user.role);
      router.push(defaultRoute);
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!user) {
    return <Login />;
  }

  // Show loading while redirect happens
  return <LoadingSpinner fullScreen text="Redirecting to your dashboard..." />;
}