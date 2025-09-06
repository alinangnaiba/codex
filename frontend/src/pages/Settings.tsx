import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, FloppyDiskIcon, FolderOpenIcon, SunIcon, MoonIcon, CheckIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { settingsAPI, fileAPI } from '../utils/api';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [contentPath, setContentPath] = useState('');
  const [originalContentPath, setOriginalContentPath] = useState('');
  const [defaultContentPath, setDefaultContentPath] = useState('');
  const [useDefaultLocation, setUseDefaultLocation] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [originalAutoSave, setOriginalAutoSave] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Ref to track timeouts for cleanup
  const saveMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSettings();
    
    // Cleanup timeout on unmount
    return () => {
      if (saveMessageTimeoutRef.current) {
        clearTimeout(saveMessageTimeoutRef.current);
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Get default content path from backend
      const defaultPath = await settingsAPI.getDefaultContentPath();
      setDefaultContentPath(defaultPath);
      
      // Get current settings
      const settings = await settingsAPI.getAll();
      
      if (settings.contentPath && settings.contentPath !== defaultPath) {
        setContentPath(settings.contentPath);
        setOriginalContentPath(settings.contentPath);
        setUseDefaultLocation(false);
      } else {
        setUseDefaultLocation(true);
        setOriginalContentPath(defaultPath);
      }
      
      // Set auto-save setting
      const autoSaveValue = settings.autoSave === 'true';
      setAutoSave(autoSaveValue);
      setOriginalAutoSave(autoSaveValue);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDirectory = async () => {
    try {
      const dir = await fileAPI.selectDirectory();
      if (dir) {
        setContentPath(dir);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
      alert('Failed to select directory. Please try again.');
    }
  };

  const handleToggleDefault = (isDefault: boolean) => {
    setUseDefaultLocation(isDefault);
    if (isDefault) {
      setContentPath('');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage('');

      const settings: { [key: string]: string } = {
        theme: theme,
        contentPath: useDefaultLocation ? defaultContentPath : contentPath,
        autoSave: autoSave.toString(),
      };

      await settingsAPI.save(settings);
      setOriginalContentPath(useDefaultLocation ? defaultContentPath : contentPath);
      setOriginalAutoSave(autoSave);
      setSaveMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds with proper cleanup
      if (saveMessageTimeoutRef.current) {
        clearTimeout(saveMessageTimeoutRef.current);
      }
      saveMessageTimeoutRef.current = setTimeout(() => {
        setSaveMessage('');
        saveMessageTimeoutRef.current = null;
      }, 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = (useDefaultLocation ? defaultContentPath : contentPath) !== originalContentPath || autoSave !== originalAutoSave;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 p-2 rounded-lg hover-bg inline-flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Library
          </button>
          
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your CodeX preferences
          </p>
        </div>

        {/* Theme Selection */}
        <div className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Choose your preferred color theme
          </p>
          
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-lg border-2 transition-all duration-150 flex flex-col items-center gap-2 ${
                theme === 'light'
                  ? 'border-current'
                  : 'border-gray-300/50 dark:border-gray-600/50 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              style={theme === 'light' ? { borderColor: 'var(--color-accent)', backgroundColor: 'var(--color-accent-subtle)' } : {}}
            >
              <SunIcon className="w-5 h-5" />
              <span className="font-medium">Light</span>
              {theme === 'light' && (
                <CheckIcon className="w-5 h-5 text-blue-500" />
              )}
            </button>
            
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-lg border-2 transition-all duration-150 flex flex-col items-center gap-2 ${
                theme === 'dark'
                  ? 'border-current'
                  : 'border-gray-300/50 dark:border-gray-600/50 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              style={theme === 'dark' ? { borderColor: 'var(--color-accent)', backgroundColor: 'var(--color-accent-subtle)' } : {}}
            >
              <MoonIcon className="w-5 h-5" />
              <span className="font-medium">Dark</span>
              {theme === 'dark' && (
                <CheckIcon className="w-5 h-5 text-blue-500" />
              )}
            </button>
          </div>
        </div>

        {/* Editor Settings */}
        <div className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4">Editor</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configure your editing experience
          </p>
          
          {/* Auto-save Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--color-hover)' }}>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Enable Auto-save
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically save content changes every 30 seconds while editing
              </p>
            </div>
            <button
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

        {/* Content Directory */}
        <div className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4">Content Storage</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Choose where your markdown files are stored
          </p>
          
          <div className="space-y-4">
            {/* Default Location Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--color-hover)' }}>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Use Default Location
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {defaultContentPath || 'Loading default path...'}
                </p>
              </div>
              <button
                onClick={() => handleToggleDefault(!useDefaultLocation)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  useDefaultLocation ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
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
            <div>
              <label className="block text-sm font-medium mb-2">
                Content Directory
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={useDefaultLocation ? '' : contentPath}
                  onChange={(e) => setContentPath(e.target.value)}
                  disabled={useDefaultLocation}
                  className="input flex-1 disabled:cursor-not-allowed"
                  style={{ backgroundColor: useDefaultLocation ? 'var(--color-hover)' : undefined }}
                  placeholder={useDefaultLocation ? `Using default location (${defaultContentPath})` : 'Enter custom directory path...'}
                />
                <button
                  onClick={handleSelectDirectory}
                  disabled={useDefaultLocation}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FolderOpenIcon className="w-4 h-4" />
                  Browse
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {useDefaultLocation 
                  ? 'Files will be stored in the default location in your home directory'
                  : 'This is where all your Codex content files will be stored'
                }
              </p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4">About CodeX</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <span className="font-medium text-gray-900 dark:text-gray-100">Version:</span> 1.0.0
            </p>
            <p>
              <span className="font-medium text-gray-900 dark:text-gray-100">Built with:</span> Wails, Go, React, TypeScript
            </p>
            <p className="pt-2">
              CodeX is a cross-platform desktop application for creating and organizing structured collections of notes.
            </p>
          </div>
        </div>

        {/* Save Button and Messages */}
        <div className="flex items-center justify-between">
          <div>
            {saveMessage && (
              <p className={`text-sm ${
                saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
              }`}>
                {saveMessage}
              </p>
            )}
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              <>
                <FloppyDiskIcon size={16} weight="regular" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
