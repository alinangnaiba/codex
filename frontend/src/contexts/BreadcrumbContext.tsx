import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BreadcrumbContextType {
  codexTitle: string;
  sectionTitle: string;
  setCodexTitle: (title: string) => void;
  setSectionTitle: (title: string) => void;
  resetBreadcrumbs: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

interface BreadcrumbProviderProps {
  children: ReactNode;
}

export const BreadcrumbProvider: React.FC<BreadcrumbProviderProps> = ({ children }) => {
  const [codexTitle, setCodexTitle] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');

  const resetBreadcrumbs = () => {
    setCodexTitle('');
    setSectionTitle('');
  };

  return (
    <BreadcrumbContext.Provider 
      value={{
        codexTitle,
        sectionTitle,
        setCodexTitle,
        setSectionTitle,
        resetBreadcrumbs
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumb = (): BreadcrumbContextType => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
};