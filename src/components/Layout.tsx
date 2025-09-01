'use client';

import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Users, 
  BookOpen, 
  AlertTriangle,
  FileText,
  Calendar,
  Bell
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut, isAdmin, isStaff } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'staff', 'student'] },
    { name: 'Students', href: '/students', icon: Users, roles: ['admin', 'staff'] },
    { name: 'Activities', href: '/activities', icon: BookOpen, roles: ['admin', 'staff'] },
    { name: 'Participation', href: '/participation', icon: Calendar, roles: ['admin', 'staff'] },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle, roles: ['admin', 'staff'] },
    { name: 'Reports', href: '/reports', icon: FileText, roles: ['admin'] },
    { name: 'My Progress', href: '/progress', icon: Bell, roles: ['student'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex flex-col w-full h-full max-w-xs bg-white">
          <div className="absolute top-0 right-0 p-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          <SidebarContent 
            navigation={filteredNavigation} 
            pathname={pathname} 
            user={user} 
            onSignOut={handleSignOut} 
          />
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
          <SidebarContent 
            navigation={filteredNavigation} 
            pathname={pathname} 
            user={user} 
            onSignOut={handleSignOut} 
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-islamic-emerald lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">
                Markaz An-noor
              </h1>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <span className="text-sm text-gray-700">
                Welcome, {user?.name}
              </span>
              <div className="ml-3 px-3 py-1 bg-islamic-emerald/10 text-islamic-emerald rounded-full text-xs font-medium">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ 
  navigation, 
  pathname, 
  user, 
  onSignOut 
}: { 
  navigation: any[], 
  pathname: string, 
  user: any, 
  onSignOut: () => void 
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4 py-6">
        <div className="flex items-center">
          <div className="bg-islamic-emerald rounded-lg p-2 mr-3">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Markaz An-noor</h2>
            <p className="text-sm text-gray-500">Student System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 pb-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                isActive
                  ? 'bg-islamic-emerald text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
            >
              <item.icon
                className={`${
                  isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                } mr-3 flex-shrink-0 h-5 w-5`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User menu */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="bg-gray-200 rounded-full p-2">
              <User className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="ml-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}