import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Settings as SettingsIcon } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { codexTitle, sectionTitle } = useBreadcrumb();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black">
      {/* Top navigation bar */}
      <header className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">CodeX</span>
            </div>
            <Breadcrumb codexTitle={codexTitle} sectionTitle={sectionTitle} />
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-2.5 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 hover:scale-105 hover:rotate-45 group"
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};
