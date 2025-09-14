import React, { useState, useEffect } from 'react';
import { FolderOpenIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useTheme } from '../contexts/ThemeContext';
import { settingsAPI, fileAPI } from '../utils/api';

interface SetupScreenProps {
  onComplete: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const { theme, setTheme } = useTheme();
  const [contentPath, setContentPath] = useState('');
  const [defaultContentPath, setDefaultContentPath] = useState('');
  const [useDefaultLocation, setUseDefaultLocation] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDefaultPath();
  }, []);

  const loadDefaultPath = async () => {
    try {
      const defaultPath = await settingsAPI.getDefaultContentPath();
      setDefaultContentPath(defaultPath);
    } catch (error) {
      console.error('Failed to load default content path:', error);
    }
  };

  const handleSelectDirectory = async () => {
    try {
      const dir = await fileAPI.selectDirectory();
      if (dir) {
        setContentPath(dir);
        setError('');
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
      setError('Failed to select directory. Please try again.');
    }
  };

  const handleToggleDefault = (isDefault: boolean) => {
    setUseDefaultLocation(isDefault);
    if (isDefault) {
      setContentPath('');
    }
    setError('');
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await settingsAPI.save({
        contentPath: useDefaultLocation ? defaultContentPath : contentPath,
        theme,
        autoSave: autoSave.toString(),
        initialized: 'true',
      });
      onComplete();
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Welcome to CodeX
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Let&apos;s get you set up in just a moment
        </p>

        {/* Theme Selection */}
        <fieldset className="mb-6">
          <legend className="block text-sm font-medium mb-3">
            Choose your theme
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-3 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <SunIcon className="w-6 h-6 mx-auto mb-1" />
              <span className="text-sm">Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <MoonIcon className="w-6 h-6 mx-auto mb-1" />
              <span className="text-sm">Dark</span>
            </button>
          </div>
        </fieldset>

        {/* Auto-save Setting */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex-1">
              <label
                htmlFor="setup-auto-save-toggle"
                className="block text-sm font-medium mb-1"
              >
                Enable Auto-save
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically save content changes every 30 seconds
              </p>
            </div>
            <button
              id="setup-auto-save-toggle"
              onClick={() => setAutoSave(!autoSave)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                autoSave ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Content Directory Selection */}
        <fieldset className="mb-8">
          <legend className="block text-sm font-medium mb-3">
            Where should we store your content files?
          </legend>

          <div className="space-y-4">
            {/* Default Location Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex-1">
                <label
                  htmlFor="setup-default-location-toggle"
                  className="block text-sm font-medium mb-1"
                >
                  Use Default Location
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {defaultContentPath || 'Loading default path...'}
                </p>
              </div>
              <button
                id="setup-default-location-toggle"
                onClick={() => handleToggleDefault(!useDefaultLocation)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  useDefaultLocation
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    useDefaultLocation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Custom Directory Input */}
            {!useDefaultLocation && (
              <div>
                <label
                  htmlFor="setup-custom-directory-input"
                  className="block text-sm font-medium mb-2"
                >
                  Custom Directory
                </label>
                <div className="flex gap-2">
                  <input
                    id="setup-custom-directory-input"
                    type="text"
                    value={contentPath}
                    onChange={e => setContentPath(e.target.value)}
                    className="input flex-1"
                    placeholder="Enter directory path or browse..."
                  />
                  <button
                    onClick={handleSelectDirectory}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <FolderOpenIcon className="w-4 h-4" />
                    Browse
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Choose where your Codex content files will be stored
                </p>
              </div>
            )}
          </div>
        </fieldset>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <button
          onClick={handleComplete}
          disabled={isLoading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Setting up...' : 'Get Started'}
        </button>
      </div>
    </div>
  );
};
