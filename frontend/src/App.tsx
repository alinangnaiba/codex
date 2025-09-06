import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import { CodexLibrary } from './pages/Library';
import { CodexView } from './pages/CodexView';
import { SectionEditor } from './pages/SectionEditor';
import { SetupScreen } from './pages/SetupScreen';
import { Settings } from './pages/Settings';
import { AppLayout } from './components/AppLayout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { settingsAPI } from './utils/api';
import './style.css';

function App() {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    try {
      const initialized = await settingsAPI.checkInitialized();
      setIsInitialized(initialized);
    } catch (error) {
      console.error('Failed to check initialization:', error);
      setIsInitialized(false);
    }
  };

  const handleSetupComplete = () => {
    setIsInitialized(true);
  };

  if (isInitialized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <ThemeProvider>
        <BreadcrumbProvider>
          <SetupScreen onComplete={handleSetupComplete} />
        </BreadcrumbProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <BreadcrumbProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<CodexLibrary />} />
            <Route path="settings" element={<Settings />} />
            <Route path="codex/:id" element={<CodexView />} />
            <Route path="codex/:codexId/section/:sectionId/edit" element={<SectionEditor />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </BrowserRouter>
        <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-card)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'var(--color-card)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-danger)',
              secondary: 'var(--color-card)',
            },
          },
        }}
        />
      </BreadcrumbProvider>
    </ThemeProvider>
  );
}

export default App
