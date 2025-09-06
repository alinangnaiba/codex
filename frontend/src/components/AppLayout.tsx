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
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Top navigation bar */}
      <header className="border-b px-4 py-3" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <img src={iconImage} alt="CodeX" className="w-6 h-6" />
              <span className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>CodeX</span>
            </div>
            <Breadcrumb codexTitle={codexTitle} sectionTitle={sectionTitle} />
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-md hover-bg"
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
