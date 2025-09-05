'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getRedirectPath, canAccessRoute } from '@/lib/auth-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Login from '@/components/Login';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (loading) return;

    // If user is not authenticated, stay on current page (Login will be shown)
    if (!user) {
      setIsRedirecting(false);
      return;
    }

    // Check if user needs to be redirected
    const redirectPath = getRedirectPath(pathname, user.role);
    if (redirectPath) {
      setIsRedirecting(true);
      router.push(redirectPath);
      return;
    }

    // Check if user has access to current route
    if (!canAccessRoute(pathname, user.role)) {
      // Redirect to user's default route if they don't have access
      const defaultRoute = getRedirectPath('/', user.role);
      if (defaultRoute) {
        setIsRedirecting(true);
        router.push(defaultRoute);
      }
    } else {
      setIsRedirecting(false);
    }
  }, [user, loading, pathname, router]);

  // Show initial loading only
  if (loading && !user) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!user) {
    return <Login />;
  }

  // If user doesn't have access to current route, show loading while redirect happens
  if (!canAccessRoute(pathname, user.role) || isRedirecting) {
    return <LoadingSpinner fullScreen text="Redirecting..." />;
  }

  return <>{children}</>;
}