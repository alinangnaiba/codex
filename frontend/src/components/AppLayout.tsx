import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GearIcon } from '@phosphor-icons/react';
import { Breadcrumb } from './Breadcrumb';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import iconImage from '../assets/images/icon.png';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { codexTitle, sectionTitle } = useBreadcrumb();

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Top navigation bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <img src={iconImage} alt="CodeX" className="w-6 h-6" />
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">CodeX</span>
            </div>
            <Breadcrumb codexTitle={codexTitle} sectionTitle={sectionTitle} />
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
            title="Settings"
          >
            <GearIcon size={20} weight="regular" className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};
