import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsAPI } from '../utils/api';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from settings on mount
  useEffect(() => {
    let isMounted = true; // Track component mount status

    const loadTheme = async () => {
      try {
        const savedTheme = await settingsAPI.get('theme');
        if (isMounted && (savedTheme === 'dark' || savedTheme === 'light')) {
          setThemeState(savedTheme);
          applyTheme(savedTheme);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load theme:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    loadTheme();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);

    // Save to settings (fire and forget to prevent memory leaks)
    settingsAPI.set('theme', newTheme).catch(error => {
      console.error('Failed to save theme:', error);
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
