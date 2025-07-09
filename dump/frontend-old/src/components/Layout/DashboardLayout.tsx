/**
 * Main dashboard layout component
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiService } from '../../services/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  description: string;
}

const navigation: NavigationItem[] = [
  {
    name: 'Upload',
    href: '/upload',
    icon: '📁',
    description: 'Upload CSV files for analysis'
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: '📊',
    description: 'Data profiling and analysis'
  },
  {
    name: 'Train',
    href: '/train',
    icon: '🤖',
    description: 'Train machine learning models'
  },
  {
    name: 'Predict',
    href: '/predict',
    icon: '🔮',
    description: 'Make predictions with trained models'
  },
  {
    name: 'Models',
    href: '/models',
    icon: '📚',
    description: 'View and manage trained models'
  }
];

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter();
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      await apiService.healthCheck();
      setIsHealthy(true);
    } catch (error) {
      setIsHealthy(false);
      console.error('API health check failed:', error);
    }
  };

  const isCurrentPath = (href: string) => {
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <Link href="/" className="flex items-center ml-4 md:ml-0">
                <div className="text-2xl mr-3">🧠</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Othor AI</h1>
                  <p className="text-xs text-gray-500">Mini AI Analyst as a Service</p>
                </div>
              </Link>
            </div>

            {/* API Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isHealthy === null ? 'bg-yellow-400' : 
                  isHealthy ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {isHealthy === null ? 'Checking...' : 
                   isHealthy ? 'API Connected' : 'API Offline'}
                </span>
              </div>
              
              <button
                onClick={checkApiHealth}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out`}>
          
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}
          
          <div className="flex flex-col h-full pt-16 md:pt-0">
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isCurrentPath(item.href)
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <div>Version 1.0.0</div>
                <div>Built with Next.js & FastAPI</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page title */}
            {title && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              </div>
            )}

            {/* API Error Banner */}
            {isHealthy === false && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      API Connection Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Unable to connect to the backend API. Please ensure the server is running on port 8002.
                      </p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={checkApiHealth}
                        className="bg-red-100 px-3 py-1 rounded-md text-sm text-red-800 hover:bg-red-200"
                      >
                        Retry Connection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Page content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
