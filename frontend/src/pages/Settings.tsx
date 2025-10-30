import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  FolderOpenIcon,
  SunIcon,
  MoonIcon,
  CheckIcon,
  GithubLogoIcon,
  EyeIcon,
  EyeSlashIcon,
  CloudArrowUpIcon,
  PlugIcon,
  PlugsConnectedIcon,
} from '@phosphor-icons/react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { settingsAPI, fileAPI, githubAPI, GitHubStatus } from '../utils/api';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [contentPath, setContentPath] = useState('');
  const [defaultContentPath, setDefaultContentPath] = useState('');
  const [useDefaultLocation, setUseDefaultLocation] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  // GitHub integration state
  const [githubRepoURL, setGithubRepoURL] = useState('');
  const [githubPAT, setGithubPAT] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [showPAT, setShowPAT] = useState(false);
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Ref to track timeouts for cleanup
  const saveMessageTimeoutRef = useRef<number | null>(null);

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

      const defaultPath = await settingsAPI.getDefaultContentPath();
      setDefaultContentPath(defaultPath);

      const settings = await settingsAPI.getAll();

      if (settings.contentPath) {
        setContentPath(settings.contentPath);
        setUseDefaultLocation(false);
      }

      // Set auto-save setting
      const autoSaveValue = settings.autoSave === 'true';
      setAutoSave(autoSaveValue);

      // Load GitHub settings
      if (settings.githubRepoURL) {
        setGithubRepoURL(settings.githubRepoURL);
      }
      if (settings.githubPAT) {
        setGithubPAT(settings.githubPAT);
      }
      if (settings.githubBranch) {
        setGithubBranch(settings.githubBranch);
      }

      // Load GitHub status
      try {
        const status = await githubAPI.getStatus();
        setGithubStatus(status);
      } catch (error) {
        console.error('Failed to load GitHub status:', error);
      }
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
        autoSaveSettings({ contentPath: dir });
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
      toast.error('Failed to select directory. Please try again.');
    }
  };

  const handleToggleDefault = (isDefault: boolean) => {
    setUseDefaultLocation(isDefault);
    if (isDefault) {
      setContentPath('');
      autoSaveSettings({ contentPath: defaultContentPath });
    }
  };

  const autoSaveSettings = async (settingsToSave: {
    [key: string]: string;
  }) => {
    try {
      setSaveMessage('');
      await settingsAPI.save(settingsToSave);

      setSaveMessage('Settings saved successfully!');

      // Clear success message after 2 seconds
      if (saveMessageTimeoutRef.current) {
        clearTimeout(saveMessageTimeoutRef.current);
      }
      saveMessageTimeoutRef.current = setTimeout(() => {
        setSaveMessage('');
        saveMessageTimeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings. Please try again.');
    }
  };

  const handleAutoSaveToggle = () => {
    const newValue = !autoSave;
    setAutoSave(newValue);
    autoSaveSettings({ autoSave: newValue.toString() });
  };

  const handleContentPathChange = (newPath: string) => {
    setContentPath(newPath);
    // Only auto-save if we have a valid path and not using default
    if (!useDefaultLocation && newPath.trim()) {
      autoSaveSettings({ contentPath: newPath.trim() });
    }
  };

  const handleTestConnection = async () => {
    if (!githubRepoURL || !githubPAT) {
      toast.error('Please enter both repository URL and Personal Access Token');
      return;
    }

    setIsTestingConnection(true);
    try {
      await githubAPI.testConnection(githubPAT, githubRepoURL);
      toast.success('Connection successful! You can now initialize backup.');
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Connection failed. Please check your credentials and try again.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleInitializeGitHub = async () => {
    if (!githubRepoURL || !githubPAT) {
      toast.error('Please enter both repository URL and Personal Access Token');
      return;
    }

    setIsInitializing(true);
    try {
      await githubAPI.initialize(githubPAT, githubRepoURL, githubBranch);
      toast.success('GitHub backup initialized successfully!');

      await loadSettings();
    } catch (error) {
      console.error('GitHub initialization failed:', error);
      toast.error(`Failed to initialize GitHub backup: ${error}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!window.confirm('Are you sure you want to disconnect GitHub integration? Your local files will not be affected.')) {
      return;
    }

    try {
      await githubAPI.disconnect();
      setGithubRepoURL('');
      setGithubPAT('');
      setGithubBranch('main');
      setGithubStatus(null);
      toast.success('GitHub integration disconnected');
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error);
      toast.error('Failed to disconnect GitHub integration');
    }
  };

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
        <div
          className="mb-8 p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
        >
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
              style={
                theme === 'light'
                  ? {
                      borderColor: 'var(--color-accent)',
                      backgroundColor: 'var(--color-accent-subtle)',
                    }
                  : {}
              }
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
              style={
                theme === 'dark'
                  ? {
                      borderColor: 'var(--color-accent)',
                      backgroundColor: 'var(--color-accent-subtle)',
                    }
                  : {}
              }
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
        <div
          className="mb-8 p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-xl font-semibold mb-4">Editor</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configure your editing experience
          </p>

          <div className="space-y-4">
            {/* Auto-save Toggle */}
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: 'var(--color-hover)' }}
            >
              <div className="flex-1">
                <label
                  htmlFor="auto-save-toggle"
                  className="block text-sm font-medium mb-1"
                >
                  Enable Auto-save
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically save content changes every 30 seconds while
                  editing
                </p>
              </div>
              <button
                id="auto-save-toggle"
                onClick={handleAutoSaveToggle}
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

            {/* Word Wrap Toggle - Temporarily disabled */}
            {/* 
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--color-hover)' }}>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Enable Word Wrap
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Wrap long lines in the editor (like VS Code). When disabled, shows horizontal scrollbar.
                </p>
              </div>
              <button
                onClick={() => setWordWrap(!wordWrap)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  wordWrap ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    wordWrap ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            */}
          </div>
        </div>

        {/* Content Directory */}
        <div
          className="mb-8 p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-xl font-semibold mb-4">Content Storage</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Choose where your markdown files are stored
          </p>

          <div className="space-y-4">
            {/* Default Location Toggle */}
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: 'var(--color-hover)' }}
            >
              <div className="flex-1">
                <label
                  htmlFor="default-location-toggle"
                  className="block text-sm font-medium mb-1"
                >
                  Use Default Location
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {defaultContentPath || 'Loading default path...'}
                </p>
              </div>
              <button
                id="default-location-toggle"
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
            <div>
              <label
                htmlFor="content-directory-input"
                className="block text-sm font-medium mb-2"
              >
                Content Directory
              </label>
              <div className="flex gap-2">
                <input
                  id="content-directory-input"
                  type="text"
                  value={useDefaultLocation ? '' : contentPath}
                  onChange={e => handleContentPathChange(e.target.value)}
                  disabled={useDefaultLocation}
                  className="input flex-1 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: useDefaultLocation
                      ? 'var(--color-hover)'
                      : undefined,
                  }}
                  placeholder={
                    useDefaultLocation
                      ? `Using default location (${defaultContentPath})`
                      : 'Enter custom directory path...'
                  }
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
                  : 'This is where all your Codex content files will be stored'}
              </p>
            </div>
          </div>
        </div>

        {/* GitHub Integration Section */}
        <div
          className="mb-8 p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <GithubLogoIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold">GitHub Integration</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Backup your codexes to a GitHub repository
          </p>

          {githubStatus?.initialized ? (
            <div className="space-y-4">
              {/* Connection Status */}
              <div
                className="p-4 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: 'var(--color-accent-subtle)' }}
              >
                <PlugsConnectedIcon className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Connected to GitHub</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {githubStatus.remoteURL}
                  </p>
                  {githubStatus.lastSyncTime && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Last synced: {new Date(githubStatus.lastSyncTime).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Disconnect Button */}
              <button
                onClick={handleDisconnectGitHub}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <PlugIcon className="w-4 h-4" />
                Disconnect GitHub
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use the backup button in the Library to sync your changes to GitHub
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Repository URL */}
              <div>
                <label htmlFor="github-repo-url" className="block text-sm font-medium mb-2">
                  Repository URL
                </label>
                <input
                  id="github-repo-url"
                  type="text"
                  value={githubRepoURL}
                  onChange={e => setGithubRepoURL(e.target.value)}
                  className="input w-full"
                  placeholder="username/repository-name"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Format: username/repository-name (e.g., johndoe/my-codex-backup)
                </p>
              </div>

              {/* Personal Access Token */}
              <div>
                <label htmlFor="github-pat" className="block text-sm font-medium mb-2">
                  Personal Access Token
                </label>
                <div className="relative">
                  <input
                    id="github-pat"
                    type={showPAT ? 'text' : 'password'}
                    value={githubPAT}
                    onChange={e => setGithubPAT(e.target.value)}
                    className="input w-full pr-10"
                    placeholder="ghp_xxxxxxxxxxxx"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPAT(!showPAT)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover-bg rounded"
                  >
                    {showPAT ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <a
                    href="https://github.com/settings/personal-access-tokens/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Create a fine-grained token
                  </a>{' '}
                  with Contents: Read and Write permission
                </p>
              </div>

              {/* Branch Name */}
              <div>
                <label htmlFor="github-branch" className="block text-sm font-medium mb-2">
                  Branch Name
                </label>
                <input
                  id="github-branch"
                  type="text"
                  value={githubBranch}
                  onChange={e => setGithubBranch(e.target.value)}
                  className="input w-full"
                  placeholder="main"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Default: main
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || !githubRepoURL || !githubPAT}
                  className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleInitializeGitHub}
                  disabled={isInitializing || !githubRepoURL || !githubPAT}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInitializing ? (
                    'Initializing...'
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-4 h-4" />
                      Initialize Backup
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> If the repository doesn&apos;t exist, it will be created automatically.
                  Your local files are the source of truth and will overwrite any remote changes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* About Section */}
        <div
          className="mb-8 p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-xl font-semibold mb-4">About CodeX</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Version:
              </span>{' '}
              1.0.0
            </p>
            <p>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Built with:
              </span>{' '}
              Wails, Go, React, TypeScript
            </p>
            <p className="pt-2">
              CodeX is a cross-platform desktop application for creating and
              organizing structured collections of notes.
            </p>
          </div>
        </div>

        {/* Status Messages */}
        <div className="text-center">
          {saveMessage && (
            <p
              className={`text-sm ${
                saveMessage.includes('success')
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {saveMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
