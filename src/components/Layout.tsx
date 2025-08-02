import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Menu, 
  X, 
  BookOpen, 
  Users, 
  ClipboardList, 
  AlertTriangle,
  Calendar,
  BarChart3
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = React.useMemo(() => {
    const baseItems = [
      { name: 'Dashboard', icon: BarChart3, href: '/' },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { name: 'Students', icon: Users, href: '/students' },
        { name: 'Staff', icon: Users, href: '/staff' },
        { name: 'Reports', icon: ClipboardList, href: '/reports' },
        { name: 'Alerts', icon: AlertTriangle, href: '/alerts' },
      ];
    }

    if (user?.role === 'staff') {
      return [
        ...baseItems,
        { name: 'Grading', icon: BookOpen, href: '/grading' },
        { name: 'Attendance', icon: Calendar, href: '/attendance' },
        { name: 'Alerts', icon: AlertTriangle, href: '/alerts' },
      ];
    }

    return baseItems;
  }, [user?.role]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 bg-emerald-700">
            <h1 className="text-lg font-semibold text-white">Markaz An-noor</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-emerald-200 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white shadow-lg">
          <div className="flex h-16 shrink-0 items-center px-6 bg-emerald-700">
            <h1 className="text-lg font-semibold text-white">Markaz An-noor</h1>
          </div>
          <nav className="flex flex-1 flex-col px-6">
            <ul className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Welcome, {user?.name}
              </h2>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="text-sm text-gray-500 capitalize">
                {user?.role}
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-x-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;