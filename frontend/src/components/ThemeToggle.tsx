import React from 'react';
import { Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover-bg"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <Moon size={20} weight="regular" className="text-gray-600 dark:text-gray-400" />
      ) : (
        <Sun size={20} weight="regular" className="text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );
};
