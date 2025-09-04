'use client';

import { UserRole } from '@/types';

// Role-based route mapping
export const ROLE_ROUTES = {
  admin: '/admin',
  staff: '/students', // Staff typically manages students
  student: '/progress' // Students view their progress
} as const;

// Route permissions
export const ROUTE_PERMISSIONS = {
  '/': ['admin', 'staff', 'student'], // Home page accessible to all authenticated users
  '/admin': ['admin'],
  '/students': ['admin', 'staff'],
  '/activities': ['admin', 'staff'],
  '/participation': ['admin', 'staff'],
  '/alerts': ['admin', 'staff'],
  '/reports': ['admin'],
  '/progress': ['student']
} as const;

export function getDefaultRouteForRole(role: UserRole): string {
  return ROLE_ROUTES[role] || '/';
}

export function canAccessRoute(route: string, userRole: UserRole | undefined): boolean {
  if (!userRole) return false;
  
  const permissions = ROUTE_PERMISSIONS[route as keyof typeof ROUTE_PERMISSIONS];
  if (!permissions) return false;
  
  return permissions.includes(userRole);
}

export function getRedirectPath(currentPath: string, userRole: UserRole | undefined): string | null {
  if (!userRole) return '/';
  
  // If user is trying to access home page, redirect to their default route
  if (currentPath === '/') {
    return getDefaultRouteForRole(userRole);
  }
  
  // If user doesn't have access to current route, redirect to their default route
  if (!canAccessRoute(currentPath, userRole)) {
    return getDefaultRouteForRole(userRole);
  }
  
  return null;
}