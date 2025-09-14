// API service wrapper for Wails backend functions
import * as App from '../../wailsjs/go/main/App';

export interface Codex {
  id: number;
  title: string;
  description: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: number;
  codexId: number;
  title: string;
  filePath: string;
  isComplete: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CodexWithSections {
  id: number;
  title: string;
  description: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
}

export interface CodexProgress {
  codexId: number;
  totalSections: number;
  completedSections: number;
  progressPercent: number;
}

export interface Settings {
  [key: string]: string;
}

// Codex API
export const codexAPI = {
  getAll: () => App.GetAllCodexes(),
  search: (query: string) => App.SearchCodexes(query),
  create: (title: string, description: string) =>
    App.CreateCodex(title, description),
  update: (id: number, title: string, description: string) =>
    App.UpdateCodex(id, title, description),
  delete: (id: number) => App.DeleteCodex(id),
  pin: (id: number, isPinned: boolean) => App.PinCodex(id, isPinned),
  getWithSections: (id: number) => App.GetCodexWithSections(id),
  getProgress: (id: number) => App.GetCodexProgress(id),
};

// Section API
export const sectionAPI = {
  create: (codexId: number, title: string) => App.CreateSection(codexId, title),
  update: (id: number, title: string, content: string) =>
    App.UpdateSection(id, title, content),
  getContent: (sectionId: number) => App.GetSectionContent(sectionId),
  delete: (id: number) => App.DeleteSection(id),
  setComplete: (id: number, isComplete: boolean) =>
    App.SetSectionComplete(id, isComplete),
  getByCodex: (codexId: number) => App.GetSectionsByCodex(codexId),
};

// Settings API
export const settingsAPI = {
  getAll: () => App.GetSettings(),
  save: (settings: Settings) => App.SaveSettings(settings),
  get: (key: string) => App.GetSetting(key),
  set: (key: string, value: string) => App.SetSetting(key, value),
  checkInitialized: () => App.CheckInitialized(),
  getDefaultContentPath: () => App.GetDefaultContentPath(),
};

// File operations
export const fileAPI = {
  selectDirectory: () => App.SelectDirectory(),
  selectMarkdownFile: () => App.SelectMarkdownFile(),
  importMarkdown: (filePath: string) => App.ImportMarkdownFile(filePath),
};
